import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, useReducedMotion } from 'framer-motion'
import { ReducedMotionContext } from './lib/motionPref'
import { AlertTriangle } from 'lucide-react'
import type { NavigateRequest } from '@shared/alert'
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
import { GestureStage } from './screens/GestureStage'
import { sampleHistory } from './lib/sampleHistory'
import { useTheme } from './lib/theme'
import { AuthScreen } from './screens/AuthScreen'
import type { Account } from '@shared/auth'
import { I18nContext } from './lib/i18n'
import { createTranslator, DEFAULT_LANGUAGE, type Language, type MessageKey } from '@shared/i18n'

type Phase = 'boot' | 'auth' | 'awaken' | 'session'

/** Pedido de navegación con un número único, para reaccionar aunque se repita la sección. */
type NavRequest = NavigateRequest & { nonce: number }

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
  const [account, setAccount] = useState<Account | null>(null)
  // Idioma elegido en la pantalla de cuentas, antes de tener ajustes de una cuenta.
  const [preLanguage, setPreLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const language = loaded?.settings.language ?? preLanguage
  const t = useMemo(() => createTranslator(language), [language])
  const [loadError, setLoadError] = useState<MessageKey | null>(null)
  const [scanning, setScanning] = useState(false)
  const [tone, setTone] = useState<Tone>('neutral')
  const [navRequest, setNavRequest] = useState<NavRequest | null>(null)

  // Solo actualiza estado dentro de las promesas (nunca de forma síncrona dentro del efecto).
  const load = useCallback((chosenLanguage?: Language) => {
    return window.guardian.auth
      .state()
      .then(async (auth) => {
        // Con cuentas en la nube, sin sesión iniciada se muestra el inicio de sesión.
        if (auth.cloud && !auth.account) {
          setLoaded(null)
          setAccount(null)
          setPhase('auth')
          return
        }
        setAccount(auth.account)
        const [profile, storedSettings, creature, history, config] = await Promise.all([
          window.guardian.data.getProfile(),
          window.guardian.data.getSettings(),
          window.guardian.data.getCreature(),
          window.guardian.data.getHistory(),
          window.guardian.config.get()
        ])
        // Cuenta nueva: conserva el idioma que se eligió en la pantalla de cuentas.
        const settings =
          !profile && chosenLanguage && storedSettings.language !== chosenLanguage
            ? await window.guardian.data.saveSettings({
                ...storedSettings,
                language: chosenLanguage
              })
            : storedSettings
        const seeded =
          import.meta.env.DEV && window.location.hash === '#sample' ? sampleHistory : history
        setLoaded({ profile, settings, creature, history: seeded, demoMode: config.demoMode })
        setPhase('awaken')
      })
      .catch((error: unknown) => {
        console.error('No se pudieron cargar los datos', error)
        setLoadError('app.error.load')
      })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Cosas que pasan en segundo plano: el atajo global, la alerta flotante y la bandeja.
  useEffect(() => {
    const offNav = window.guardian.nav.onGo((request) =>
      setNavRequest({ ...request, nonce: Date.now() })
    )
    const offData = window.guardian.data.onChanged(() => {
      void Promise.all([
        window.guardian.data.getProfile(),
        window.guardian.data.getCreature(),
        window.guardian.data.getHistory()
      ]).then(([profile, creature, history]) =>
        setLoaded((prev) => (prev ? { ...prev, profile, creature, history } : prev))
      )
    })
    return () => {
      offNav()
      offData()
    }
  }, [])

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
  useTheme(loaded?.settings.theme ?? 'dark')

  const enter = useCallback(async (profile: Profile): Promise<void> => {
    try {
      const saved = await window.guardian.data.saveProfile(profile)
      setLoaded((prev) => (prev ? { ...prev, profile: saved } : prev))
      setScanning(true)
      setPhase('session')
    } catch (error) {
      console.error('No se pudo guardar el perfil', error)
      setLoadError('app.error.profile')
    }
  }, [])

  const saveSettings = useCallback(async (settings: Settings): Promise<void> => {
    const saved = await window.guardian.data.saveSettings(settings)
    setLoaded((prev) => (prev ? { ...prev, settings: saved } : prev))
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    await window.guardian.auth.signOut()
    setLoaded(null)
    setAccount(null)
    setPhase('auth')
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
        toast.show(t('app.levelUp', { level: outcome.creature.level }), 'success')
      }
    },
    [toast, t]
  )

  const clearHistory = useCallback(async (): Promise<void> => {
    await window.guardian.data.clearHistory()
    setLoaded((prev) => (prev ? { ...prev, history: [] } : prev))
    toast.show(t('app.historyCleared'), 'info')
  }, [toast, t])

  const galleryMode = import.meta.env.DEV && window.location.hash === '#gallery'
  const iconMode = import.meta.env.DEV && window.location.hash === '#icon'
  const gesturesMode = import.meta.env.DEV && window.location.hash === '#gestos'

  let body: React.JSX.Element
  if (iconMode) {
    body = <IconStage />
  } else if (gesturesMode) {
    body = <GestureStage />
  } else if (galleryMode) {
    body = <Gallery />
  } else if (loadError) {
    body = (
      <div className="grid h-full place-items-center">
        <EmptyState
          tone="error"
          icon={<AlertTriangle aria-hidden className="size-5" />}
          title={t('app.error.title')}
          description={t(loadError)}
          action={<Button onClick={retry}>{t('app.retry')}</Button>}
        />
      </div>
    )
  } else {
    body = (
      <LayoutGroup>
        <AnimatePresence>
          {phase === 'auth' && (
            <AuthScreen
              key="auth"
              language={preLanguage}
              onLanguage={setPreLanguage}
              onSignedIn={() => void load(preLanguage)}
            />
          )}
          {phase === 'awaken' && loaded && (
            <Awakening
              key="awaken"
              profile={loaded.profile}
              version={VERSION}
              demoMode={loaded.demoMode}
              shortcut={loaded.settings.shortcut}
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
              navRequest={navRequest}
              onAnalyzed={onAnalyzed}
              onTone={setTone}
              onClearHistory={clearHistory}
              onSaveSettings={saveSettings}
              onSaveProfile={saveProfile}
              account={account}
              onSignOut={signOut}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    )
  }

  return (
    <I18nContext.Provider value={t}>
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
    </I18nContext.Provider>
  )
}

export default App
