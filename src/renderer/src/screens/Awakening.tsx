import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Bell, ScanText, ShieldCheck, Zap } from 'lucide-react'
import { profileSchema, type Profile } from '@shared/models'
import { transition } from '@design/motion'
import { Button } from '../components/ui/Button'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { Kbd } from '../components/ui/Kbd'
import { Switch } from '../components/ui/Switch'
import { useViewportHeight } from '../hooks/useViewportHeight'

export interface AwakeningProps {
  /** Perfil guardado. `null` en el primer arranque (onboarding). */
  profile: Profile | null
  version: string
  demoMode: boolean
  onEnter: (profile: Profile) => void
}

const STEPS = 3
/** Alto fijo del bloque de texto: así Nilo no se desplaza entre pasos. */
const TEXT_BLOCK_HEIGHT = 300
const RETURNING_DELAY_MS = 1100

/** Estado A «Despertar»: Nilo como núcleo, anillos de escaneo y un saludo. */
export function Awakening({
  profile,
  version,
  demoMode,
  onEnter
}: AwakeningProps): React.JSX.Element {
  const returning = profile?.onboardingDone === true
  const height = useViewportHeight()
  // La criatura se adapta a la altura libre: ventana − barra de título − HUD − bloque de texto.
  const heroSize = Math.round(
    Math.min(340, Math.max(150, height - 44 - 44 - TEXT_BLOCK_HEIGHT - 56))
  )

  return (
    <motion.div
      className="absolute inset-0 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: transition.base }}
      transition={transition.slow}
    >
      {/* Datos HUD de ambiente */}
      <div className="flex items-center justify-between px-6 pt-4 font-mono text-[12px]">
        <span className="hud-bracket flex items-center gap-2 uppercase tracking-[0.12em] text-accent">
          <span className="pulse-dot size-1.5 text-accent" aria-hidden />
          Sistema en reposo
        </span>
        <span className="text-text-muted">
          v{version} · {demoMode ? 'modo demo' : 'modo real'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-4">
        <div className="relative">
          <CreatureAvatar
            layoutId="nilo"
            size={heroSize}
            state="reposo"
            rings
            greet={returning ? 1 : 2.8}
            title="Nilo despierta"
          />
          <GreetingBubble text={returning ? '¡Hola de nuevo!' : '¡Hola!'} />
        </div>
        <div
          className="flex w-full flex-col items-center justify-start"
          style={{ height: TEXT_BLOCK_HEIGHT }}
        >
          {returning && profile ? (
            <Returning profile={profile} onEnter={onEnter} />
          ) : (
            <Onboarding onEnter={onEnter} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Globo de saludo que aparece junto a la mano levantada de Nilo y se va solo. */
function GreetingBubble({ text }: { text: string }): React.JSX.Element {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2600)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, transition: transition.base }}
          transition={{ ...transition.base, delay: 0.25 }}
          style={{ originX: 0, originY: 1 }}
          className="glass absolute -right-[14%] top-[6%] rounded-[16px] rounded-bl-[4px] px-4 py-2 font-display text-[17px] font-semibold text-text"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Arranques siguientes: saludo de ≤ 1.2 s, saltable con cualquier tecla, y entra directo. */
function Returning({
  profile,
  onEnter
}: {
  profile: Profile
  onEnter: (p: Profile) => void
}): React.JSX.Element {
  const entered = useRef(false)
  const enter = useCallback(() => {
    if (entered.current) return
    entered.current = true
    onEnter(profile)
  }, [onEnter, profile])

  useEffect(() => {
    const timer = window.setTimeout(enter, RETURNING_DELAY_MS)
    window.addEventListener('keydown', enter)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', enter)
    }
  }, [enter])

  return (
    <div className="text-center" role="status">
      <h1 className="font-display text-[28px] font-semibold tracking-tight text-text">
        Hola de nuevo, {profile.name}
      </h1>
      <p className="mt-1.5 text-[15px] text-text-muted">Despertando al Guardián…</p>
      <p className="mt-4 text-[13px] text-text-subtle">Presiona cualquier tecla para entrar ya</p>
    </div>
  )
}

const stepVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

/** Primer arranque: qué hace → privacidad → atajo y nombre. */
function Onboarding({ onEnter }: { onEnter: (p: Profile) => void }): React.JSX.Element {
  const [step, setStep] = useState(0)
  const [vigilante, setVigilante] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === STEPS - 1) inputRef.current?.focus()
  }, [step])

  const next = (): void => setStep((s) => Math.min(STEPS - 1, s + 1))
  const back = (): void => setStep((s) => Math.max(0, s - 1))

  const submit = (event: FormEvent): void => {
    event.preventDefault()
    const parsed = profileSchema.safeParse({
      name,
      createdAt: new Date().toISOString(),
      onboardingDone: true,
      vigilante
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Escribe cómo te llamas')
      inputRef.current?.focus()
      return
    }
    setError(null)
    setSaving(true)
    onEnter(parsed.data)
  }

  return (
    <div className="flex w-full max-w-[460px] flex-col items-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition.base}
          className="flex w-full flex-col items-center text-center"
        >
          {step === 0 && <StepWhat />}
          {step === 1 && <StepPrivacy vigilante={vigilante} onVigilante={setVigilante} />}
          {step === 2 && (
            <form onSubmit={submit} className="flex w-full flex-col items-center" noValidate>
              <h1 className="font-display text-[28px] font-semibold tracking-tight">
                Un atajo y ya casi
              </h1>
              <p className="mt-1.5 text-[15px] text-text-muted">
                Con <Kbd keys="Ctrl+Shift+G" className="mx-0.5 align-middle" /> me llamas desde
                cualquier programa.
              </p>
              <label htmlFor={inputId} className="sr-only">
                ¿Cómo te llamas?
              </label>
              <input
                ref={inputRef}
                id={inputId}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                maxLength={24}
                autoComplete="off"
                placeholder="¿Cómo te llamas?"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="mt-5 h-12 w-full rounded-[12px] border border-white/12 bg-white/6 px-4 text-[15px] text-text placeholder:text-text-subtle transition-[border-color,box-shadow,background-color] duration-[220ms] hover:border-white/20 focus:border-accent/60 focus:bg-white/8 aria-invalid:border-danger/60"
              />
              <p
                id={errorId}
                role="alert"
                className="mt-1.5 h-5 self-start text-[13px] text-danger-text"
              >
                {error}
              </p>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={saving}
                icon={<Zap aria-hidden className="size-4" />}
                className="mt-1"
              >
                Despertar al Guardián
              </Button>
              <p className="mt-3 flex items-center gap-2 text-[13px] text-text-subtle">
                <Kbd keys="Enter" /> para empezar
              </p>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navegación del onboarding */}
      <div className="mt-5 flex w-full items-center justify-between">
        <div className="w-24">
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={back}
              icon={<ArrowLeft aria-hidden className="size-4" />}
            >
              Atrás
            </Button>
          )}
        </div>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label={`Paso ${step + 1} de ${STEPS}`}
        >
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={
                i === step
                  ? 'h-1.5 w-6 rounded-full bg-accent shadow-[0_0_10px_rgb(34_211_238/0.7)] transition-[width] duration-[220ms]'
                  : 'h-1.5 w-1.5 rounded-full bg-white/20 transition-[width] duration-[220ms]'
              }
            />
          ))}
        </div>
        <div className="flex w-24 justify-end">
          {step < STEPS - 1 && (
            <Button
              variant="secondary"
              onClick={next}
              autoFocus
              icon={<ArrowRight aria-hidden className="size-4" />}
            >
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepWhat(): React.JSX.Element {
  const items = [
    { icon: ScanText, label: 'Pega un mensaje o link' },
    { icon: ShieldCheck, label: 'Te digo si es seguro' },
    { icon: Bell, label: 'Te aviso antes de que caigas' }
  ]
  return (
    <>
      <h1 className="font-display text-[28px] font-semibold tracking-tight">Hola, soy Nilo</h1>
      <p className="mt-1.5 max-w-[400px] text-[15px] text-text-muted">
        Vigilo tus mensajes y links para avisarte antes de que caigas.
      </p>
      <ul className="mt-5 grid w-full grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="glass flex flex-col items-center gap-2 rounded-[14px] px-2 py-3 text-[12.5px] leading-tight text-text-muted"
          >
            <Icon aria-hidden className="size-[18px] text-accent-strong" />
            {label}
          </li>
        ))}
      </ul>
    </>
  )
}

function StepPrivacy({
  vigilante,
  onVigilante
}: {
  vigilante: boolean
  onVigilante: (v: boolean) => void
}): React.JSX.Element {
  return (
    <>
      <h1 className="font-display text-[28px] font-semibold tracking-tight">
        Tu información, contigo
      </h1>
      <p className="mt-1.5 max-w-[420px] text-[15px] text-text-muted">
        Reviso casi todo en tu computador. Solo si un mensaje es dudoso, envío un fragmento a la IA
        de Google, con claves y números de tarjeta tapados.
      </p>
      <div className="glass mt-5 w-full rounded-[14px] p-4 text-left">
        <Switch
          checked={vigilante}
          onChange={onVigilante}
          label="Vigilar el portapapeles"
          description="Opcional. Te aviso si copias algo sospechoso. Puedes cambiarlo en Ajustes."
        />
      </div>
    </>
  )
}
