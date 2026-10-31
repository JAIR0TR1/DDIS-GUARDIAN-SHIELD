import { app, clipboard, globalShortcut, Notification } from 'electron'
import { decideClipboard } from '../domain/clipboardFilter'
import { normalizeShortcut } from '../domain/shortcut'
import { createClipboardWatcher } from './clipboard/watcher'
import type { AlertPayload, NavigateRequest, ShortcutChange, WatcherEvent } from '../shared/alert'
import type { AnalysisOutcome } from '../shared/analysis'
import { IPC } from '../shared/ipc'
import type { Profile } from '../shared/models'
import type { Verdict } from '../shared/threat'
import type { AnalysisService } from './analysis/service'
import type { AppData } from './storage/appData'
import { createTray, trayIconFor, type TrayController, type TrayState } from './tray'
import { hideAlert, showAlert } from './windows/alertWindow'
import { sendToMain, showMainWindow } from './windows/mainWindow'

/** Cuánto tiempo el icono de la bandeja recuerda un hallazgo antes de volver a «activo». */
const TRAY_MEMORY_MS = 90_000
/** El verde de «todo en orden» dura poco: es una confirmación, no una alarma. */
const SAFE_MEMORY_MS = 6_000

const trayByVerdict: Record<Verdict, TrayState> = {
  peligroso: 'amenaza',
  sospechoso: 'duda',
  seguro: 'segura'
}

export interface GuardianController {
  /** Prepara bandeja y atajo con los datos guardados. */
  init: () => Promise<void>
  /** ¿Al cerrar la ventana principal la app debe seguir en la bandeja? */
  shouldHideOnClose: () => boolean
  /** Avisa (una vez) que la app quedó en la bandeja y cómo cerrarla del todo. */
  notifyHiddenInTray: () => void
  /** Una segunda copia intentó abrirse: avisa que ya había una corriendo. */
  notifyAlreadyRunning: () => void
  onProfileSaved: (profile: Profile) => void
  setShortcut: (shortcut: string) => Promise<ShortcutChange>
  analyzeClipboard: () => Promise<void>
  openDetail: (entryId?: string) => void
  dismissAlert: () => void
  dispose: () => void
}

export interface ControllerDeps {
  data: AppData
  analysis: AnalysisService
  /** Se llama al activar o apagar el vigilante (la implementación llega en el siguiente paso). */
  onWatcherChange?: (enabled: boolean) => void
}

/**
 * Une las piezas «de fondo»: atajo global, ventana flotante de alerta, icono de bandeja y la
 * ventana principal. Vive en el proceso principal y nunca expone la clave ni el contenido.
 */
export function createGuardianController(deps: ControllerDeps): GuardianController {
  const { data, analysis } = deps
  let tray: TrayController | null = null
  let watcherOn = false
  let shortcutDisplay = 'Ctrl+Shift+G'
  let registeredAccelerator: string | null = null
  let decay: NodeJS.Timeout | null = null

  const baseState = (): TrayState => (watcherOn ? 'activo' : 'dormida')

  function setTray(state: TrayState, remember: boolean, memoryMs = TRAY_MEMORY_MS): void {
    tray?.setState(state)
    if (decay) clearTimeout(decay)
    // Un hallazgo se recuerda un rato; luego el icono vuelve a su estado normal.
    if (remember) decay = setTimeout(() => tray?.setState(baseState()), memoryMs)
  }

  function notifyDataChanged(): void {
    sendToMain(IPC.data.changed)
  }

  function register(accelerator: string): boolean {
    return globalShortcut.register(accelerator, () => void analyzeClipboard())
  }

  async function analyzeClipboard(): Promise<void> {
    const text = (await clipboard.readText()).trim()
    if (!text) {
      showAlert({ kind: 'empty' }, { focus: true })
      return
    }
    showAlert({ kind: 'scanning', passive: false }, { focus: true })
    try {
      const outcome = await analysis.run({ text, source: 'text' })
      showAlert(resultPayload(outcome, false), { focus: true })
      const verdict = outcome.entry.result.verdict
      setTray(trayByVerdict[verdict], true, verdict === 'seguro' ? SAFE_MEMORY_MS : TRAY_MEMORY_MS)
      notifyDataChanged()
    } catch (error) {
      console.error('[guardian] No pude analizar el portapapeles', error)
      showAlert(
        { kind: 'error', message: 'No pude revisar lo que copiaste. Inténtalo de nuevo.' },
        { focus: true }
      )
    }
  }

  function openDetail(entryId?: string): void {
    hideAlert()
    showMainWindow()
    const request: NavigateRequest = { section: 'historial', entryId }
    sendToMain(IPC.nav.go, request)
  }

  /**
   * Un texto nuevo en el portapapeles. Pasa por el filtro de privacidad (descarta contraseñas,
   * claves y tarjetas) y se revisa SOLO con reglas locales: el vigilante nunca envía nada a la IA.
   * Solo molesta si es sospechoso o peligroso.
   */
  async function handleCopiedText(text: string): Promise<void> {
    const decision = decideClipboard(text)
    if (!decision.analyze) {
      sendToMain(IPC.watcher.event, {
        kind: 'ignored',
        reason: decision.reason
      } satisfies WatcherEvent)
      return
    }
    const peek = await analysis.peek(text)
    if (peek.verdict === 'seguro') {
      sendToMain(IPC.watcher.event, { kind: 'safe' } satisfies WatcherEvent)
      // Todo bien: una confirmación breve y discreta (si el usuario no la apagó en Ajustes).
      // No se guarda en el historial ni suma XP, para que copiar mucho no llene nada.
      const settings = await data.getSettings()
      if (settings.notifySafe) {
        showAlert(
          { kind: 'safe', score: peek.score, message: peek.creatureMessage },
          { focus: false }
        )
        setTray('segura', true, SAFE_MEMORY_MS)
      }
      return
    }
    const outcome = await analysis.run({ text, source: 'text' }, { useAI: false })
    const { verdict, creatureMessage } = outcome.entry.result
    if (verdict !== 'seguro') {
      sendToMain(IPC.watcher.event, { kind: 'alert', verdict } satisfies WatcherEvent)
    }
    showAlert(resultPayload(outcome, true), { focus: false })
    notify(
      verdict === 'peligroso' ? '¡Cuidado! Posible estafa' : 'Ojo: mensaje dudoso',
      creatureMessage,
      outcome.entry.id
    )
    setTray(trayByVerdict[verdict], true)
    notifyDataChanged()
  }

  /** Cada ejecución avisa una sola vez que la app se quedó en la bandeja (y cómo cerrarla del todo). */
  let toldAboutTray = false
  function notifyHiddenInTray(): void {
    if (toldAboutTray || !Notification.isSupported()) return
    toldAboutTray = true
    new Notification({
      title: 'Escudo Guardián sigue vigilando',
      body: 'Está en la bandeja, junto al reloj. Para cerrarla del todo: clic derecho en su icono → Salir.',
      icon: trayIconFor('activo')
    }).show()
  }

  /** Notificación nativa de Windows. Al hacer clic abre el detalle. */
  function notify(title: string, body: string, entryId: string): void {
    if (!Notification.isSupported()) return
    const notification = new Notification({ title, body, icon: trayIconFor('activo') })
    notification.on('click', () => openDetail(entryId))
    notification.show()
  }

  const watcher = createClipboardWatcher({
    read: () => clipboard.readText(),
    onText: handleCopiedText
  })

  function applyWatcher(enabled: boolean): void {
    watcherOn = enabled
    if (enabled) void watcher.start()
    else watcher.stop()
    tray?.setWatcher(enabled, shortcutDisplay)
    setTray(baseState(), false)
    deps.onWatcherChange?.(enabled)
  }

  return {
    async init() {
      const [profile, settings] = await Promise.all([data.getProfile(), data.getSettings()])
      const parsed = normalizeShortcut(settings.shortcut)
      shortcutDisplay = parsed.ok ? parsed.display : 'Ctrl+Shift+G'
      const accelerator = parsed.ok ? parsed.accelerator : 'CommandOrControl+Shift+G'
      if (register(accelerator)) registeredAccelerator = accelerator
      else console.warn(`[guardian] El atajo ${shortcutDisplay} está ocupado por otra aplicación`)

      tray = createTray(
        {
          onOpen: () => showMainWindow(),
          onAnalyzeClipboard: () => void analyzeClipboard(),
          onToggleWatcher: (enabled) => void toggleWatcher(enabled),
          onQuit: () => app.quit()
        },
        shortcutDisplay
      )
      applyWatcher(profile?.vigilante === true)
    },

    shouldHideOnClose: () => watcherOn,
    notifyHiddenInTray,
    notifyAlreadyRunning() {
      if (!Notification.isSupported()) return
      new Notification({
        title: 'Escudo Guardián ya estaba abierta',
        body: 'Te traje la que ya corría. Si acabas de cambiar el código, ciérrala desde la bandeja (clic derecho → Salir) y ábrela de nuevo.',
        icon: trayIconFor('activo')
      }).show()
    },

    onProfileSaved(profile) {
      if (profile.vigilante !== watcherOn) applyWatcher(profile.vigilante)
    },

    async setShortcut(shortcut) {
      const parsed = normalizeShortcut(shortcut)
      if (!parsed.ok) return { ok: false, message: parsed.reason, shortcut: shortcutDisplay }
      if (registeredAccelerator === parsed.accelerator) {
        return { ok: true, message: 'Ese ya es tu atajo.', shortcut: shortcutDisplay }
      }
      const previous = registeredAccelerator
      if (previous) globalShortcut.unregister(previous)
      if (!register(parsed.accelerator)) {
        // Otra aplicación lo usa: se recupera el anterior para no quedar sin atajo.
        if (previous) register(previous)
        return {
          ok: false,
          message: `${parsed.display} ya lo usa otra aplicación. Prueba con otra combinación.`,
          shortcut: shortcutDisplay
        }
      }
      registeredAccelerator = parsed.accelerator
      shortcutDisplay = parsed.display
      const settings = await data.getSettings()
      await data.saveSettings({ ...settings, shortcut: parsed.display })
      tray?.setWatcher(watcherOn, shortcutDisplay)
      return { ok: true, message: `Listo: ahora es ${parsed.display}.`, shortcut: parsed.display }
    },

    analyzeClipboard,
    openDetail,
    dismissAlert: hideAlert,

    dispose() {
      if (decay) clearTimeout(decay)
      watcher.stop()
      globalShortcut.unregisterAll()
      tray?.destroy()
    }
  }

  async function toggleWatcher(enabled: boolean): Promise<void> {
    // Cambiar el vigilante desde la bandeja también se guarda en el perfil.
    const profile = await data.getProfile()
    if (profile) await data.saveProfile({ ...profile, vigilante: enabled })
    applyWatcher(enabled)
    notifyDataChanged()
  }
}

/** Convierte el resultado de un análisis en lo que muestra la ventana flotante. */
export function resultPayload(outcome: AnalysisOutcome, passive: boolean): AlertPayload {
  return {
    kind: 'result',
    entry: outcome.entry,
    xpGained: outcome.xpGained,
    passive,
    notice: outcome.notice
  }
}
