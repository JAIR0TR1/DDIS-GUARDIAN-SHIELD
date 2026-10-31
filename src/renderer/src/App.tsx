import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, useReducedMotion } from 'framer-motion'
import { ReducedMotionContext } from './lib/motionPref'
import { AlertTriangle } from 'lucide-react'
import type { AnalysisOutcome } from '@shared/analysis'
import type { Creature, Profile, Settings } from '@shared/models'
import type { HistoryEntry } from '@shared/history'
import { AmbientBackground, type Tone } from './components/AmbientBackground'
import { Titlebar } from './components/ui/Titlebar'
import { ToastProvider } from './components/ui/Toast'
import { useToast } from './components/ui/toastContext'
import { ScanBeam } from './components/ui/ScanBeam'
import { EmptyState } from './components/ui/EmptyState'
import { Button } from './components/ui/Button'
import { Awakening } from './screens/Awakening'
import { Session } from './screens/Session'
import { Gallery } from './screens/Gallery'
import { IconStage } from './screens/IconStage'
import { sampleHistory } from './lib/sampleHistory'

type Phase = 'boot' | 'awaken' | 'session'

interface Loaded {
  profile: Profile | null
  settings: Settings
  creature: Creature
  history: HistoryEntry[]
  demoMode: boolean
}

const VERSION = '0.1'
/** Cuánto dura el color de Nilo en el fondo tras un análisis. */
const TONE_MS = 9000

function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}

function Shell(): React.JSX.Element {
  const toast = useToast()
  const osReduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('boot')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [tone, setTone] = useState<Tone>('neutral')

  // Solo actualiza estado dentro de las promesas (nunca de forma síncrona dentro del efecto).
  const load = useCallback(() => {
    return Promise.all([
      window.guardian.data.getProfile(),
      window.guardian.data.getSettings(),
      window.guardian.data.getCreature(),
      window.guardian.data.getHistory(),
      window.guardian.config.get()
    ])
      .then(([profile, settings, creature, history, config]) => {
        const seeded =
          import.meta.env.DEV && window.location.hash === '#sample' ? sampleHistory : history
        setLoaded({ profile, settings, creature, history: seeded, demoMode: config.demoMode })
        setPhase('awaken')
      })
      .catch((error: unknown) => {
        console.error('No se pudieron cargar los datos', error)
        setLoadError('No pude leer tus datos guardados.')
      })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const retry = (): void => {
    setLoadError(null)
    void load()
  }

  // El color del fondo vuelve a la normalidad solo, unos segundos después del análisis.
  useEffect(() => {
    if (tone === 'neutral') return
    const timer = window.setTimeout(() => setTone('neutral'), TONE_MS)
    return () => window.clearTimeout(timer)
  }, [tone])

  // La preferencia «reducir movimiento» también se aplica a las animaciones CSS.
  const reduceMotion = loaded?.settings.reduceMotion ?? false
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  const enter = useCallback(async (profile: Profile): Promise<void> => {
    try {
      const saved = await window.guardian.data.saveProfile(profile)
      setLoaded((prev) => (prev ? { ...prev, profile: saved } : prev))
      setScanning(true)
      setPhase('session')
    } catch (error) {
      console.error('No se pudo guardar el perfil', error)
      setLoadError('No pude guardar tu perfil.')
    }
  }, [])

  const saveSettings = useCallback(async (settings: Settings): Promise<void> => {
    const saved = await window.guardian.data.saveSettings(settings)
    setLoaded((prev) => (prev ? { ...prev, settings: saved } : prev))
  }, [])

  const saveProfile = useCallback(async (profile: Profile): Promise<void> => {
    const saved = await window.guardian.data.saveProfile(profile)
    setLoaded((prev) => (prev ? { ...prev, profile: saved } : prev))
  }, [])

  const onAnalyzed = useCallback(
    (outcome: AnalysisOutcome): void => {
      setLoaded((prev) =>
        prev
          ? { ...prev, creature: outcome.creature, history: [outcome.entry, ...prev.history] }
          : prev
      )
      if (outcome.levelsGained > 0) {
        toast.show(
          `¡Subimos al nivel ${outcome.creature.level}! Cada estafa que paramos nos hace más fuertes.`,
          'success'
        )
      }
    },
    [toast]
  )

  const clearHistory = useCallback(async (): Promise<void> => {
    await window.guardian.data.clearHistory()
    setLoaded((prev) => (prev ? { ...prev, history: [] } : prev))
    toast.show('Historial borrado.', 'info')
  }, [toast])

  const galleryMode = import.meta.env.DEV && window.location.hash === '#gallery'
  const iconMode = import.meta.env.DEV && window.location.hash === '#icon'

  let body: React.JSX.Element
  if (iconMode) {
    body = <IconStage />
  } else if (galleryMode) {
    body = <Gallery />
  } else if (loadError) {
    body = (
      <div className="grid h-full place-items-center">
        <EmptyState
          tone="error"
          icon={<AlertTriangle aria-hidden className="size-5" />}
          title="Algo salió mal"
          description={loadError}
          action={<Button onClick={retry}>Reintentar</Button>}
        />
      </div>
    )
  } else {
    body = (
      <LayoutGroup>
        <AnimatePresence>
          {phase === 'awaken' && loaded && (
            <Awakening
              key="awaken"
              profile={loaded.profile}
              version={VERSION}
              demoMode={loaded.demoMode}
              onEnter={(p) => void enter(p)}
            />
          )}
          {phase === 'session' && loaded?.profile && (
            <Session
              key="session"
              profile={loaded.profile}
              creature={loaded.creature}
              settings={loaded.settings}
              history={loaded.history}
              demoMode={loaded.demoMode}
              onAnalyzed={onAnalyzed}
              onTone={setTone}
              onClearHistory={clearHistory}
              onSaveSettings={saveSettings}
              onSaveProfile={saveProfile}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    )
  }

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <ReducedMotionContext.Provider value={reduceMotion || osReduced === true}>
        <div className="relative flex h-full flex-col overflow-hidden">
          <AmbientBackground mode={phase === 'session' ? 'panels' : 'open'} tone={tone} />
          <Titlebar />
          <main className="relative min-h-0 flex-1 overflow-hidden">
            {body}
            {scanning && !reduceMotion && <ScanBeam onComplete={() => setScanning(false)} />}
          </main>
        </div>
      </ReducedMotionContext.Provider>
    </MotionConfig>
  )
}

export default App
