import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { NavigateRequest, WatcherEvent } from '@shared/alert'
import type { AnalysisOutcome } from '@shared/analysis'
import type { Creature, Profile, Settings } from '@shared/models'
import type { HistoryEntry } from '@shared/history'
import type { Verdict } from '@shared/threat'
import type { Account } from '@shared/auth'
import { xpToNext } from '@domain/xp'
import { pickPhrase } from '@domain/phrases'
import { fadeOnly, panelContainer, panelItemBlur, transition } from '@design/motion'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { WatcherChip } from '../components/ui/WatcherChip'
import { useT } from '../lib/i18n'
import type { MessageKey, Translate } from '@shared/i18n'
import { useToast } from '../components/ui/toastContext'
import { Sidebar, type Section } from '../components/ui/Sidebar'
import type { Tone } from '../components/AmbientBackground'
import type { CreatureState } from '../creature/creatureState'
import { Home } from './Home'
import { Analyzer } from './Analyzer'
import { History } from './History'
import { CreatureScreen } from './CreatureScreen'
import { SettingsScreen } from './SettingsScreen'
import { Arena } from './Arena'

export interface SessionProps {
  profile: Profile
  creature: Creature
  settings: Settings
  history: HistoryEntry[]
  demoMode: boolean
  /** Pedido de la alerta flotante o la bandeja: ir a una sección (y a una entrada del historial). */
  navRequest: (NavigateRequest & { nonce: number }) | null
  onAnalyzed: (outcome: AnalysisOutcome) => void
  onTone: (tone: Tone) => void
  onClearHistory: () => Promise<void>
  onSaveSettings: (settings: Settings) => Promise<void>
  onSaveProfile: (profile: Profile) => Promise<void>
  /** Cuenta en la nube (null si la app funciona solo en local). */
  account: Account | null
  onSignOut: () => Promise<void>
  /** La Arena dio experiencia: criatura actualizada. */
  onCreature: (creature: Creature) => void
}

function watcherNoteFor(event: WatcherEvent, t: Translate): string {
  switch (event.kind) {
    case 'ignored': {
      // El motivo llega del proceso principal en español; se traduce al idioma activo.
      const key = `watcher.reason.${event.reason}` as MessageKey
      return t('watcher.note.ignored', { reason: t(key) })
    }
    case 'safe':
      return t('watcher.note.safe')
    case 'alert':
      return event.verdict === 'peligroso' ? t('watcher.note.danger') : t('watcher.note.doubt')
  }
}

const moodByVerdict: Record<Verdict, CreatureState> = {
  peligroso: 'alerta',
  sospechoso: 'escaneando',
  seguro: 'feliz'
}

const toneByVerdict: Record<Verdict, Tone> = {
  peligroso: 'danger',
  sospechoso: 'warn',
  seguro: 'safe'
}

/** Estado B «Sesión activa»: barra lateral, cabecera con XP y paneles de vidrio. */
export function Session({
  profile,
  creature,
  settings,
  history,
  demoMode,
  navRequest,
  onAnalyzed,
  onTone,
  onClearHistory,
  onSaveSettings,
  onSaveProfile,
  account,
  onSignOut,
  onCreature
}: SessionProps): React.JSX.Element {
  const [section, setSection] = useState<Section>(navRequest?.section ?? 'inicio')
  // Un pedido nuevo (alerta flotante, bandeja) cambia de sección. Se ajusta durante el dibujado,
  // que es el patrón recomendado por React para reaccionar a un cambio de propiedades.
  const [seenNonce, setSeenNonce] = useState(navRequest?.nonce)
  if (navRequest && navRequest.nonce !== seenNonce) {
    setSeenNonce(navRequest.nonce)
    setSection(navRequest.section)
  }
  const [mood, setMood] = useState<CreatureState>('feliz')
  const [pasted, setPasted] = useState('')
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [savingWatcher, setSavingWatcher] = useState(false)
  const [watcherNote, setWatcherNote] = useState<string | null>(null)
  const toast = useToast()
  const t = useT()

  // El vigilante cuenta qué hizo con lo último copiado, para que nunca parezca que «no hace nada».
  useEffect(() => {
    let timer = 0
    const off = window.guardian.watcher.onEvent((event) => {
      window.clearTimeout(timer)
      setWatcherNote(watcherNoteFor(event, t))
      timer = window.setTimeout(() => setWatcherNote(null), 6000)
    })
    return () => {
      window.clearTimeout(timer)
      off()
    }
  }, [t])
  const osReduced = useReducedMotion()
  const reduced = osReduced === true || settings.reduceMotion
  const moodTimer = useRef<number>(0)

  const settleMood = (delay: number): void => {
    window.clearTimeout(moodTimer.current)
    moodTimer.current = window.setTimeout(() => setMood('reposo'), delay)
  }

  // Nilo reacciona feliz al entrar y luego vuelve al reposo.
  useEffect(() => {
    settleMood(2800)
    return () => window.clearTimeout(moodTimer.current)
  }, [])

  const greeting = useMemo(() => {
    // Las frases base de Nilo vienen en español en creature.json; en inglés se usan las traducidas.
    const phrases =
      settings.language === 'en'
        ? {
            bienvenida: [
              t('phrases.welcome.1', { name: profile.name }),
              t('phrases.welcome.2', { name: profile.name })
            ]
          }
        : creature.phrases
    return pickPhrase(phrases, 'bienvenida', profile.name)
  }, [creature.phrases, profile.name, settings.language, t])
  const needed = xpToNext(creature.level)
  const itemVariants = reduced ? fadeOnly : panelItemBlur

  const handleAnalyzing = (): void => {
    window.clearTimeout(moodTimer.current)
    setMood('escaneando')
    onTone('neutral')
  }

  const handleOutcome = (outcome: AnalysisOutcome): void => {
    const verdict = outcome.entry.result.verdict
    setMood(moodByVerdict[verdict])
    onTone(toneByVerdict[verdict])
    settleMood(6000)
    onAnalyzed(outcome)
  }

  const toggleWatcher = (): void => {
    const next = !profile.vigilante
    setSavingWatcher(true)
    onSaveProfile({ ...profile, vigilante: next })
      .then(() =>
        toast.show(
          next ? t('session.watcherOn') : t('session.watcherOff'),
          next ? 'success' : 'info'
        )
      )
      .catch((error: unknown) => {
        console.error('No se pudo cambiar el vigilante', error)
        toast.show(t('session.watcherFailed'), 'error')
      })
      .finally(() => setSavingWatcher(false))
  }

  const goAnalyzeImage = (file: File): void => {
    setDroppedFile(file)
    setSection('analizar')
  }

  const goAnalyze = (text: string): void => {
    setPasted(text)
    setSection('analizar')
  }

  return (
    <div className="absolute inset-0 flex">
      <motion.div
        className="flex"
        initial={reduced ? { opacity: 0 } : { x: -72, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ...transition.slow, delay: 0.1 }}
      >
        <Sidebar
          current={section}
          onSelect={(s) => {
            if (s !== 'analizar') {
              setPasted('')
              setDroppedFile(null)
            }
            setSection(s)
          }}
          creatureSlot={
            <CreatureAvatar
              layoutId="nilo"
              size={44}
              frame="badge"
              state={mood}
              title={t('session.avatar')}
            />
          }
        />
      </motion.div>

      <div className="flex min-w-0 flex-1 flex-col">
        <motion.header
          className="flex shrink-0 items-start justify-between gap-6 px-7 pb-3 pt-5"
          initial={{ opacity: 0, y: reduced ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.slow, delay: 0.35 }}
        >
          <div className="min-w-0">
            <h1 className="truncate font-display text-[26px] font-semibold leading-tight tracking-tight">
              {t('session.hello', { name: profile.name })}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
              <span className="pulse-dot text-safe" aria-hidden />
              {t('session.active')}
              <span className="text-text-subtle" aria-hidden>
                ·
              </span>
              <span className="hud-label !text-text-subtle">
                {demoMode ? t('mode.demo') : t('mode.real')}
              </span>
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <WatcherChip
                on={profile.vigilante}
                disabled={savingWatcher}
                onToggle={toggleWatcher}
              />
              {profile.vigilante && watcherNote && (
                <span role="status" className="text-[13px] text-text-muted">
                  {watcherNote}
                </span>
              )}
            </div>
          </div>
          <div className="w-52 shrink-0 pt-1">
            <p className="tabular mb-1.5 flex justify-between font-mono text-[12px] text-text-muted">
              <span>{t('session.level', { level: creature.level })}</span>
              <span>
                {creature.xp} / {needed} XP
              </span>
            </p>
            <ProgressBar value={creature.xp} max={needed} label={t('session.xp')} />
          </div>
        </motion.header>

        <main className="min-h-0 flex-1 overflow-y-auto px-7 pb-6" aria-live="polite">
          <motion.div
            key={section}
            className="mx-auto grid max-w-[980px] grid-cols-12 gap-4"
            variants={panelContainer}
            initial="hidden"
            animate="show"
          >
            {section === 'inicio' && (
              <Home
                greeting={greeting}
                mood={mood}
                variants={itemVariants}
                history={history}
                onGo={setSection}
                onPasteText={goAnalyze}
                onDropImage={goAnalyzeImage}
                shortcut={settings.shortcut}
              />
            )}
            {section === 'analizar' && (
              <Analyzer
                variants={itemVariants}
                initialText={pasted}
                initialFile={droppedFile}
                reduced={reduced}
                onAnalyzing={handleAnalyzing}
                onOutcome={handleOutcome}
              />
            )}
            {section === 'historial' && (
              <History
                key={navRequest?.nonce ?? 'history'}
                selectId={navRequest?.section === 'historial' ? navRequest.entryId : undefined}
                variants={itemVariants}
                history={history}
                onClear={onClearHistory}
                onGo={setSection}
              />
            )}
            {section === 'criatura' && (
              <CreatureScreen
                creature={creature}
                variants={itemVariants}
                mood={mood}
                reduced={reduced}
                onCreature={onCreature}
              />
            )}
            {section === 'arena' && (
              <Arena
                creature={creature}
                variants={itemVariants}
                reduced={reduced}
                onCreature={onCreature}
              />
            )}
            {section === 'ajustes' && (
              <SettingsScreen
                settings={settings}
                profile={profile}
                demoMode={demoMode}
                variants={itemVariants}
                onSaveSettings={onSaveSettings}
                onSaveProfile={onSaveProfile}
                account={account}
                onSignOut={onSignOut}
              />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
