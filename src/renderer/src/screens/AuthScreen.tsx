import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles, UserPlus } from 'lucide-react'
import type { AuthErrorCode } from '@shared/auth'
import { checkPassword, suggestPassword, type PasswordStrength } from '@domain/password'
import { cn } from '../lib/cn'
import type { Language, MessageKey } from '@shared/i18n'
import { transition } from '@design/motion'
import { Button } from '../components/ui/Button'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { Segmented } from '../components/ui/Segmented'
import { useT } from '../lib/i18n'

type Mode = 'signIn' | 'signUp'

export interface AuthScreenProps {
  language: Language
  onLanguage: (language: Language) => void
  /** Sesión iniciada: la app carga los datos de la cuenta. */
  onSignedIn: () => void
}

const inputClass =
  'h-11 w-full rounded-[12px] border border-white/12 bg-white/6 px-3.5 text-[15px] text-text placeholder:text-text-subtle transition-[border-color,background-color] duration-[220ms] hover:border-white/20 focus:border-accent/60 focus:bg-white/8 aria-invalid:border-danger/60'

/** Inicio de sesión y registro. La contraseña solo viaja al proceso principal, nunca se guarda. */
export function AuthScreen({
  language,
  onLanguage,
  onSignedIn
}: AuthScreenProps): React.JSX.Element {
  const t = useT()
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)
  const [busy, setBusy] = useState(false)
  const [suggested, setSuggested] = useState(false)
  const emailId = useId()
  const passwordId = useId()
  const confirmId = useId()
  const errorId = useId()
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  const switchMode = (next: Mode): void => {
    setMode(next)
    setError(null)
    setConfirm('')
    setSuggested(false)
  }

  /** Genera una contraseña fuerte, la escribe en ambos campos y la deja visible para copiarla. */
  const suggest = (): void => {
    const generated = suggestPassword()
    setPassword(generated)
    setConfirm(generated)
    setShowPassword(true)
    setSuggested(true)
    setError(null)
  }

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    if (mode === 'signUp' && checkPassword(password).strength === 'debil') {
      setError('auth.error.weakLocal')
      return
    }
    if (mode === 'signUp' && password !== confirm) {
      setError('auth.error.mismatch')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const credentials = { email, password }
      const result =
        mode === 'signIn'
          ? await window.guardian.auth.signIn(credentials)
          : await window.guardian.auth.signUp(credentials)
      if (result.ok) {
        setPassword('')
        setConfirm('')
        onSignedIn()
        return
      }
      setError(`auth.error.${result.code satisfies AuthErrorCode}`)
    } catch (cause) {
      console.error('Falló la autenticación', cause)
      setError('auth.error.unknown')
    } finally {
      setBusy(false)
    }
  }

  const signUp = mode === 'signUp'

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center gap-14 px-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: transition.base }}
      transition={transition.slow}
    >
      <div className="hidden w-[320px] flex-col items-center text-center md:flex">
        <CreatureAvatar size={230} state="reposo" rings greet={2.4} title="Nilo" />
        <h1 className="mt-4 font-display text-[30px] font-semibold tracking-tight">
          Escudo Guardián
        </h1>
        <p className="mt-1.5 text-[15px] text-text-muted">{t('auth.tagline')}</p>
        <p className="mt-5 flex items-center gap-2 text-[13px] text-text-subtle">
          <ShieldCheck aria-hidden className="size-4 text-safe" />
          {t('auth.privacy')}
        </p>
      </div>

      <div className="glass w-full max-w-[400px] rounded-[24px] p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">
            {signUp ? t('auth.signUp.title') : t('auth.signIn.title')}
          </h2>
          <div className="[&_p]:sr-only">
            <Segmented
              label={t('settings.language')}
              value={language}
              options={[
                { value: 'es', label: 'ES' },
                { value: 'en', label: 'EN' }
              ]}
              onChange={onLanguage}
            />
          </div>
        </div>

        <div
          role="tablist"
          aria-label={t('auth.modes')}
          className="mb-5 grid grid-cols-2 gap-1 rounded-[12px] border border-white/10 bg-white/5 p-1"
        >
          {(['signIn', 'signUp'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={
                mode === m
                  ? 'min-h-9 rounded-[9px] bg-accent/18 text-sm font-medium text-accent-strong shadow-[inset_0_0_0_1px_rgb(34_211_238/0.4)]'
                  : 'min-h-9 rounded-[9px] text-sm text-text-muted transition-colors duration-[220ms] hover:bg-white/8 hover:text-text'
              }
            >
              {m === 'signIn' ? t('auth.tab.signIn') : t('auth.tab.signUp')}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3.5" noValidate>
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-[13px] text-text-muted">
              {t('auth.email')}
            </label>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="mb-1.5 block text-[13px] text-text-muted">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete={signUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setSuggested(false)
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[10px] text-text-muted transition-colors duration-[220ms] hover:bg-white/8 hover:text-text"
              >
                {showPassword ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
              </button>
            </div>
            {signUp && (
              <>
                <PasswordMeter password={password} />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={suggest}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-medium text-accent-strong transition-colors duration-[220ms] hover:bg-accent/10"
                  >
                    <Sparkles aria-hidden className="size-4" />
                    {t('auth.suggest')}
                  </button>
                  {suggested && (
                    <p role="status" className="text-[12px] text-text-subtle">
                      {t('auth.suggested')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {signUp && (
            <div>
              <label htmlFor={confirmId} className="mb-1.5 block text-[13px] text-text-muted">
                {t('auth.confirm')}
              </label>
              <input
                id={confirmId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={error === 'auth.error.mismatch' ? true : undefined}
                className={inputClass}
              />
            </div>
          )}

          <p id={errorId} role="alert" className="min-h-5 text-[13px] text-danger-text">
            {error ? t(error) : ''}
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={busy}
            disabled={!email.trim() || !password}
            icon={
              signUp ? (
                <UserPlus aria-hidden className="size-4" />
              ) : (
                <LogIn aria-hidden className="size-4" />
              )
            }
          >
            {signUp ? t('auth.signUp.submit') : t('auth.signIn.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-text-muted">
          {signUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={() => switchMode(signUp ? 'signIn' : 'signUp')}
            className="font-medium text-accent-strong underline-offset-4 hover:underline"
          >
            {signUp ? t('auth.tab.signIn') : t('auth.tab.signUp')}
          </button>
        </p>
      </div>
    </motion.div>
  )
}

const meterColor: Record<PasswordStrength, string> = {
  debil: 'bg-danger',
  aceptable: 'bg-warn',
  fuerte: 'bg-safe'
}
const meterText: Record<PasswordStrength, string> = {
  debil: 'text-danger-text',
  aceptable: 'text-warn',
  fuerte: 'text-safe'
}

/** Medidor de fuerza: cuatro barras, la etiqueta (con color Y texto) y un consejo concreto. */
function PasswordMeter({ password }: { password: string }): React.JSX.Element {
  const t = useT()
  const check = checkPassword(password)
  const filled = password ? Math.max(1, check.score) : 0
  const hint = check.hints[0]
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-[220ms]',
              i < filled ? meterColor[check.strength] : 'bg-white/10'
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[12px] text-text-subtle">
        {password ? (
          <>
            <span className={cn('font-medium', meterText[check.strength])}>
              {t(`auth.strength.${check.strength}`)}
            </span>
            {hint && ` · ${t(`auth.hint.${hint}`)}`}
          </>
        ) : (
          t('auth.passwordHint')
        )}
      </p>
    </div>
  )
}
