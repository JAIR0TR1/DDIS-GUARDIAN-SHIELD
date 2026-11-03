import { useEffect, useId, useState, type FormEvent } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Cloud,
  KeyRound,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  PlugZap,
  RotateCw,
  Sun,
  Trash2
} from 'lucide-react'
import type { AppConfig } from '@shared/analysis'
import type { Account } from '@shared/auth'
import { shortcutFromKeyEvent } from '@domain/shortcut'
import type { Profile, Settings } from '@shared/models'
import { GlassCard } from '../components/ui/GlassCard'
import { Switch } from '../components/ui/Switch'
import { Segmented } from '../components/ui/Segmented'
import { Kbd } from '../components/ui/Kbd'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/toastContext'
import { useT } from '../lib/i18n'
import { localizeText } from '@shared/i18n/localize'

export interface SettingsScreenProps {
  settings: Settings
  profile: Profile
  demoMode: boolean
  variants: Variants
  onSaveSettings: (settings: Settings) => Promise<void>
  onSaveProfile: (profile: Profile) => Promise<void>
  /** Cuenta en la nube (null si la app funciona solo en local). */
  account: Account | null
  onSignOut: () => Promise<void>
}

/** Ajustes: apariencia, idioma, vigilante, atajo, cuenta y la clave de la IA (cifrada). */
export function SettingsScreen({
  settings,
  profile,
  demoMode,
  variants,
  onSaveSettings,
  onSaveProfile,
  account,
  onSignOut
}: SettingsScreenProps): React.JSX.Element {
  const toast = useToast()
  const t = useT()
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error('No se pudo guardar el ajuste', error)
      toast.show(t('settings.saveFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.div variants={variants} className="col-span-12 md:col-span-7">
        <GlassCard title={t('settings.general')} className="flex flex-col gap-5">
          <Segmented
            label={t('settings.appearance')}
            description={t('settings.appearance.hint')}
            value={settings.theme}
            disabled={busy}
            options={[
              {
                value: 'dark',
                label: t('settings.theme.dark'),
                icon: <Moon aria-hidden className="size-4" />
              },
              {
                value: 'light',
                label: t('settings.theme.light'),
                icon: <Sun aria-hidden className="size-4" />
              },
              {
                value: 'system',
                label: t('settings.theme.system'),
                icon: <Monitor aria-hidden className="size-4" />
              }
            ]}
            onChange={(theme) => run(() => onSaveSettings({ ...settings, theme }))}
          />
          <Segmented
            label={t('settings.language')}
            description={t('settings.language.hint')}
            value={settings.language}
            disabled={busy}
            options={[
              { value: 'es', label: t('settings.language.es') },
              { value: 'en', label: t('settings.language.en') }
            ]}
            onChange={(language) => run(() => onSaveSettings({ ...settings, language }))}
          />
          <Switch
            label={t('settings.reduceMotion')}
            description={t('settings.reduceMotion.hint')}
            checked={settings.reduceMotion}
            disabled={busy}
            onChange={(reduceMotion) => run(() => onSaveSettings({ ...settings, reduceMotion }))}
          />
          <Switch
            label={t('settings.watcher')}
            description={t('settings.watcher.hint')}
            checked={profile.vigilante}
            disabled={busy}
            onChange={(vigilante) => run(() => onSaveProfile({ ...profile, vigilante }))}
          />
          <Switch
            label={t('settings.notifySafe')}
            description={t('settings.notifySafe.hint')}
            checked={settings.notifySafe}
            disabled={busy || !profile.vigilante}
            onChange={(notifySafe) => run(() => onSaveSettings({ ...settings, notifySafe }))}
          />
          <ShortcutField
            shortcut={settings.shortcut}
            onChanged={(shortcut) => run(() => onSaveSettings({ ...settings, shortcut }))}
          />
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-5">
        <GlassCard title={t('settings.privacy')} className="flex flex-col gap-3">
          <p className="flex gap-2.5 text-sm leading-relaxed text-text-muted">
            <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-strong" />
            {t('settings.privacy.body')}
          </p>
        </GlassCard>
      </motion.div>

      {account && (
        <motion.div variants={variants} className="col-span-12">
          <GlassCard title={t('settings.account')} className="flex flex-wrap items-center gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/35 bg-accent/10 font-display text-base font-semibold uppercase text-accent-strong">
              {account.email.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-text-muted">{t('settings.account.signedAs')}</p>
              <p className="truncate text-sm font-medium text-text">{account.email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-subtle">
                <Cloud aria-hidden className="size-3.5 shrink-0" />
                {t('settings.account.sync')}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void run(onSignOut)}
              disabled={busy}
              icon={<LogOut aria-hidden className="size-4" />}
            >
              {t('settings.account.signOut')}
            </Button>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={variants} className="col-span-12">
        <AiKeyCard demoMode={demoMode} />
      </motion.div>
    </>
  )
}

/**
 * Atajo global editable: «Cambiar» → presionas la combinación → se valida y se registra en el
 * sistema. Esc cancela. Si otra aplicación ya usa esa combinación, se avisa y se conserva la anterior.
 */
function ShortcutField({
  shortcut,
  onChanged
}: {
  shortcut: string
  onChanged: (shortcut: string) => Promise<void>
}): React.JSX.Element {
  const toast = useToast()
  const t = useT()
  const [capturing, setCapturing] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!capturing) return
    const onKey = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setCapturing(false)
        setHint('')
        return
      }
      const combo = shortcutFromKeyEvent(event)
      if (combo === null) {
        setHint(t('settings.shortcut.invalid'))
        return
      }
      setCapturing(false)
      setHint('')
      void window.guardian.shortcut
        .set(combo)
        .then(async (result) => {
          toast.show(result.message, result.ok ? 'success' : 'error')
          if (result.ok) await onChanged(result.shortcut)
        })
        .catch((error: unknown) => {
          console.error('No se pudo cambiar el atajo', error)
          toast.show(t('settings.shortcut.failed'), 'error')
        })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [capturing, onChanged, toast, t])

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{t('settings.shortcut')}</p>
        <p className="text-[13px] text-text-muted" role="status">
          {capturing ? hint || t('settings.shortcut.press') : t('settings.shortcut.hint')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {capturing ? (
          <span className="rounded-[8px] border border-accent/50 bg-accent/10 px-2.5 py-1 text-[12px] text-accent-strong">
            {t('settings.shortcut.waiting')}
          </span>
        ) : (
          <Kbd keys={shortcut} />
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setHint('')
            setCapturing((c) => !c)
          }}
          aria-pressed={capturing}
        >
          {capturing ? t('settings.shortcut.cancel') : t('settings.shortcut.change')}
        </Button>
      </div>
    </div>
  )
}

function AiKeyCard({ demoMode }: { demoMode: boolean }): React.JSX.Element {
  const toast = useToast()
  const t = useT()
  const inputId = useId()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const refresh = (): void => {
    void window.guardian.config.get().then(setConfig)
  }
  useEffect(refresh, [])

  const save = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    if (!key.trim()) return
    setSaving(true)
    try {
      await window.guardian.ai.saveKey(key)
      setKey('') // la clave no se queda en pantalla ni en memoria del renderer
      refresh()
      toast.show(t('settings.ai.savedToast'), 'success')
    } catch (error) {
      console.error('No se pudo guardar la clave', error)
      toast.show(t('settings.ai.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const test = async (): Promise<void> => {
    setTesting(true)
    try {
      const result = await window.guardian.ai.test()
      toast.show(localizeText(result.message, t), result.ok ? 'success' : 'error')
    } catch (error) {
      console.error('Falló la prueba de conexión', error)
      toast.show(t('settings.ai.testFailed'), 'error')
    } finally {
      setTesting(false)
    }
  }

  const clear = async (): Promise<void> => {
    await window.guardian.ai.clearKey()
    refresh()
    toast.show(t('settings.ai.clearedToast'), 'info')
  }

  const needsRestart = config !== null && config.hasKey && demoMode

  return (
    <GlassCard title={t('settings.ai')} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={demoMode ? '#FBBF24' : '#34D399'}>
          {demoMode ? t('settings.ai.demo') : t('settings.ai.real')}
        </Badge>
        <Badge color={config?.hasKey ? '#34D399' : '#9CA3AF'}>
          {config?.hasKey ? t('settings.ai.keySaved') : t('settings.ai.noKey')}
        </Badge>
      </div>

      <form onSubmit={(e) => void save(e)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] text-text-muted">
            {t('settings.ai.keyLabel')}
          </label>
          <input
            id={inputId}
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={config?.hasKey ? t('settings.ai.keyReplace') : t('settings.ai.keyPaste')}
            className="h-11 w-full rounded-[12px] border border-white/12 bg-white/6 px-3.5 font-mono text-sm text-text placeholder:text-text-subtle transition-[border-color,background-color] duration-[220ms] hover:border-white/20 focus:border-accent/60 focus:bg-white/8"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={!key.trim()}
          icon={<KeyRound aria-hidden className="size-4" />}
        >
          {t('settings.ai.save')}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void test()}
          loading={testing}
          disabled={!config?.hasKey}
          icon={<PlugZap aria-hidden className="size-4" />}
        >
          {t('settings.ai.test')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => void clear()}
          disabled={!config?.hasKey}
          icon={<Trash2 aria-hidden className="size-4" />}
        >
          {t('settings.ai.clear')}
        </Button>
      </div>

      {needsRestart && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.06] px-3.5 py-3 text-sm text-text"
        >
          <p className="min-w-0 flex-1">
            {config?.packaged ? t('settings.ai.restartPackaged') : t('settings.ai.restartDev')}
          </p>
          {config?.packaged && (
            <Button
              variant="secondary"
              onClick={() => void window.guardian.app.relaunch()}
              icon={<RotateCw aria-hidden className="size-4" />}
            >
              {t('settings.ai.restartNow')}
            </Button>
          )}
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-text-muted">{t('settings.ai.note')}</p>
    </GlassCard>
  )
}
