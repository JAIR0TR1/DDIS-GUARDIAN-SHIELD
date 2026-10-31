import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { Creature, Profile, Settings } from '@shared/models'
import type { HistoryEntry } from '@shared/history'
import { AmbientBackground } from './components/AmbientBackground'
import { Titlebar } from './components/ui/Titlebar'
import { ToastProvider } from './components/ui/Toast'
import { ScanBeam } from './components/ui/ScanBeam'
import { EmptyState } from './components/ui/EmptyState'
import { Button } from './components/ui/Button'
import { Awakening } from './screens/Awakening'
import { Session } from './screens/Session'
import { Gallery } from './screens/Gallery'
import { sampleHistory } from './lib/sampleHistory'

type Phase = 'boot' | 'awaken' | 'session'

interface Loaded {
  profile: Profile | null
  settings: Settings
  creature: Creature
}

const VERSION = '0.1'
// Hasta la fase de IA, todo corre en modo demo (sin red ni clave).
const DEMO_MODE = true

function App(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('boot')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [history] = useState<HistoryEntry[]>(() =>
    import.meta.env.DEV && window.location.hash === '#sample' ? sampleHistory : []
  )

  // Solo actualiza estado dentro de las promesas (nunca de forma síncrona dentro del efecto).
  const load = useCallback(() => {
    return Promise.all([
      window.guardian.data.getProfile(),
      window.guardian.data.getSettings(),
      window.guardian.data.getCreature()
    ])
      .then(([profile, settings, creature]) => {
        setLoaded({ profile, settings, creature })
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

  const galleryMode = import.meta.env.DEV && window.location.hash === '#gallery'

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <ToastProvider>
        <div className="relative flex h-full flex-col overflow-hidden">
          <AmbientBackground mode={phase === 'session' ? 'panels' : 'open'} />
          <Titlebar />
          <main className="relative min-h-0 flex-1 overflow-hidden">
            {galleryMode ? (
              <Gallery />
            ) : loadError ? (
              <div className="grid h-full place-items-center">
                <EmptyState
                  tone="error"
                  icon={<AlertTriangle aria-hidden className="size-5" />}
                  title="Algo salió mal"
                  description={loadError}
                  action={<Button onClick={retry}>Reintentar</Button>}
                />
              </div>
            ) : (
              <LayoutGroup>
                <AnimatePresence>
                  {phase === 'awaken' && loaded && (
                    <Awakening
                      key="awaken"
                      profile={loaded.profile}
                      version={VERSION}
                      demoMode={DEMO_MODE}
                      onEnter={(p) => void enter(p)}
                    />
                  )}
                  {phase === 'session' && loaded?.profile && (
                    <Session
                      key="session"
                      profile={loaded.profile}
                      creature={loaded.creature}
                      settings={loaded.settings}
                      history={history}
                      demoMode={DEMO_MODE}
                      onSaveSettings={saveSettings}
                      onSaveProfile={saveProfile}
                    />
                  )}
                </AnimatePresence>
              </LayoutGroup>
            )}
            {scanning && !reduceMotion && <ScanBeam onComplete={() => setScanning(false)} />}
          </main>
        </div>
      </ToastProvider>
    </MotionConfig>
  )
}

export default App
