import { Menu, nativeImage, Tray, type NativeImage } from 'electron'
import icon from '../../build/icon.png?asset'
import type { Translate } from '../shared/i18n'

/** Estado que comunica el icono: cian activo, ámbar duda, rojo amenaza, gris apagado. */
export type TrayState = 'activo' | 'segura' | 'duda' | 'amenaza' | 'dormida'

const DOT_RGB: Record<TrayState, [number, number, number]> = {
  activo: [34, 211, 238],
  segura: [52, 211, 153],
  duda: [251, 191, 36],
  amenaza: [244, 63, 94],
  dormida: [107, 114, 128]
}

const SIZE = 32
const cache = new Map<TrayState, NativeImage>()

/** Icono de Nilo con un punto de color en la esquina inferior derecha. */
export function trayIconFor(state: TrayState): NativeImage {
  return iconFor(state)
}

function iconFor(state: TrayState): NativeImage {
  const hit = cache.get(state)
  if (hit) return hit
  const base = nativeImage
    .createFromPath(icon)
    .resize({ width: SIZE, height: SIZE, quality: 'best' })
  const bitmap = Buffer.from(base.toBitmap()) // BGRA
  const [r, g, b] = DOT_RGB[state]
  const cx = 24
  const cy = 24
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const i = (y * SIZE + x) * 4
      if (d <= 5.5) {
        bitmap[i] = b
        bitmap[i + 1] = g
        bitmap[i + 2] = r
        bitmap[i + 3] = 255
      } else if (d <= 7.5) {
        // Anillo oscuro: separa el punto del icono y lo hace visible sobre cualquier barra.
        bitmap[i] = 12
        bitmap[i + 1] = 8
        bitmap[i + 2] = 5
        bitmap[i + 3] = 255
      }
    }
  }
  const result = nativeImage.createFromBitmap(bitmap, { width: SIZE, height: SIZE })
  cache.set(state, result)
  return result
}

export interface TrayActions {
  onOpen: () => void
  onAnalyzeClipboard: () => void
  onToggleWatcher: (enabled: boolean) => void
  onQuit: () => void
}

export interface TrayController {
  setState: (state: TrayState) => void
  setWatcher: (enabled: boolean, shortcut: string) => void
  /** Cambia el idioma del menú y de la ayuda emergente. */
  setTranslator: (t: Translate) => void
  destroy: () => void
}

export function createTray(
  actions: TrayActions,
  initialShortcut: string,
  initialTranslator: Translate
): TrayController {
  const tray = new Tray(iconFor('dormida'))
  let watcher = false
  let shortcut = initialShortcut
  let t = initialTranslator
  let state: TrayState = 'dormida'

  const rebuild = (): void => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: t('tray.open'), click: actions.onOpen },
        { label: t('tray.analyze', { shortcut }), click: actions.onAnalyzeClipboard },
        { type: 'separator' },
        {
          label: t('tray.watch'),
          type: 'checkbox',
          checked: watcher,
          click: (item) => actions.onToggleWatcher(item.checked)
        },
        { type: 'separator' },
        { label: t('tray.quit'), click: actions.onQuit }
      ])
    )
  }
  rebuild()
  tray.setToolTip(t('tray.tip.dormida'))
  // Un clic abre la ventana principal.
  tray.on('click', actions.onOpen)

  return {
    setState(next) {
      state = next
      tray.setImage(iconFor(next))
      tray.setToolTip(t(`tray.tip.${next}`))
    },
    setTranslator(next) {
      t = next
      rebuild()
      tray.setToolTip(t(`tray.tip.${state}`))
    },
    setWatcher(enabled, newShortcut) {
      watcher = enabled
      shortcut = newShortcut
      rebuild()
    },
    destroy() {
      tray.destroy()
    }
  }
}
