import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { NavigateRequest, WatcherEvent } from '@shared/alert'
import type { AnalysisOutcome } from '@shared/analysis'
import type { Creature, Profile, Settings } from '@shared/models'
import type { HistoryEntry } from '@shared/history'
import type { Verdict } from '@shared/threat'
import { xpToNext } from '@domain/xp'
import { pickPhrase } from '@domain/phrases'
import { fadeOnly, panelContainer, panelItemBlur, transition } from '@design/motion'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { WatcherChip } from '../components/ui/WatcherChip'
import { useToast } from '../components/ui/toastContext'
import { Sidebar, type Section } from '../components/ui/Sidebar'
import type { Tone } from '../components/AmbientBackground'
import type { CreatureState } from '../creature/creatureState'
import { Home } from './Home'
import { Analyzer } from './Analyzer'
import { History } from './History'
import { CreatureScreen } from './CreatureScreen'
import { SettingsScreen } from './SettingsScreen'

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
}

function watcherNoteFor(event: WatcherEvent): string {
  switch (event.kind) {
    case 'ignored':
      return `Copiaste algo y lo salté (${event.reason}).`
    case 'safe':
      return 'Revisé lo último que copiaste: todo en orden.'
    case 'alert':
      return event.verdict === 'peligroso'
        ? 'Lo último que copiaste se ve peligroso.'
        : 'Lo último que copiaste tiene cosas raras.'
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
  onSaveProfile
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

  // El vigilante cuenta qué hizo con lo último copiado, para que nunca parezca que «no hace nada».
  useEffect(() => {
    let timer = 0
    const off = window.guardian.watcher.onEvent((event) => {
      window.clearTimeout(timer)
      setWatcherNote(watcherNoteFor(event))
      timer = window.setTimeout(() => setWatcherNote(null), 6000)
    })
    return () => {
      window.clearTimeout(timer)
      off()
    }
  }, [])
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

  const greeting = useMemo(
    () => pickPhrase(creature.phrases, 'bienvenida', profile.name),
    [creature.phrases, profile.name]
  )
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
          next
            ? 'Vigilante activo: reviso lo que copies, solo en tu equipo.'
            : 'Vigilante apagado. Ya no miro lo que copias.',
          next ? 'success' : 'info'
        )
      )
      .catch((error: unknown) => {
        console.error('No se pudo cambiar el vigilante', error)
        toast.show('No pude cambiar el vigilante. Inténtalo de nuevo.', 'error')
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
              title="Nilo, tu Guardián"
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
              Hola, {profile.name}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
              <span className="pulse-dot text-safe" aria-hidden />
              Guardián activo
              <span className="text-text-subtle" aria-hidden>
                ·
              </span>
              <span className="hud-label !text-text-subtle">
                {demoMode ? 'modo demo' : 'modo real'}
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
              <span>Nivel {creature.level}</span>
              <span>
                {creature.xp} / {needed} XP
              </span>
            </p>
            <ProgressBar value={creature.xp} max={needed} label="Experiencia del Guardián" />
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
              <CreatureScreen creature={creature} variants={itemVariants} mood={mood} />
            )}
            {section === 'ajustes' && (
              <SettingsScreen
                settings={settings}
                profile={profile}
                demoMode={demoMode}
                variants={itemVariants}
                onSaveSettings={onSaveSettings}
                onSaveProfile={onSaveProfile}
              />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
