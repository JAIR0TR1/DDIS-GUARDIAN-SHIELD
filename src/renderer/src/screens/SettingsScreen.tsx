import { useEffect, useId, useState, type FormEvent } from 'react'
import { motion, type Variants } from 'framer-motion'
import { KeyRound, LockKeyhole, PlugZap, RotateCw, Trash2 } from 'lucide-react'
import type { AppConfig } from '@shared/analysis'
import type { Profile, Settings } from '@shared/models'
import { GlassCard } from '../components/ui/GlassCard'
import { Switch } from '../components/ui/Switch'
import { Kbd } from '../components/ui/Kbd'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/toastContext'

export interface SettingsScreenProps {
  settings: Settings
  profile: Profile
  demoMode: boolean
  variants: Variants
  onSaveSettings: (settings: Settings) => Promise<void>
  onSaveProfile: (profile: Profile) => Promise<void>
}

/** Ajustes: movimiento, vigilante, atajo, y la clave de la IA (se guarda cifrada). */
export function SettingsScreen({
  settings,
  profile,
  demoMode,
  variants,
  onSaveSettings,
  onSaveProfile
}: SettingsScreenProps): React.JSX.Element {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error('No se pudo guardar el ajuste', error)
      toast.show('No pude guardar el cambio. Inténtalo de nuevo.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <motion.div variants={variants} className="col-span-12 md:col-span-7">
        <GlassCard title="General" className="flex flex-col gap-5">
          <Switch
            label="Reducir movimiento"
            description="Cambia las animaciones por fundidos simples."
            checked={settings.reduceMotion}
            disabled={busy}
            onChange={(reduceMotion) => run(() => onSaveSettings({ ...settings, reduceMotion }))}
          />
          <Switch
            label="Vigilar el portapapeles"
            description="Opcional. Te aviso si copias algo sospechoso."
            checked={profile.vigilante}
            disabled={busy}
            onChange={(vigilante) => run(() => onSaveProfile({ ...profile, vigilante }))}
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">Atajo global</p>
              <p className="text-[13px] text-text-muted">
                Para llamar a Nilo desde cualquier lugar.
              </p>
            </div>
            <Kbd keys={settings.shortcut} />
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-5">
        <GlassCard title="Privacidad" className="flex flex-col gap-3">
          <p className="flex gap-2.5 text-sm leading-relaxed text-text-muted">
            <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-strong" />
            Las reglas locales revisan todo en tu computador. Solo los mensajes dudosos envían un
            fragmento a la IA de Google, con claves, códigos y números de tarjeta tapados. Tu
            historial nunca sale de este equipo.
          </p>
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12">
        <AiKeyCard demoMode={demoMode} />
      </motion.div>
    </>
  )
}

function AiKeyCard({ demoMode }: { demoMode: boolean }): React.JSX.Element {
  const toast = useToast()
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
      toast.show('Clave guardada y cifrada en tu equipo.', 'success')
    } catch (error) {
      console.error('No se pudo guardar la clave', error)
      toast.show('No pude guardar esa clave. Revisa que sea completa y sin espacios.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const test = async (): Promise<void> => {
    setTesting(true)
    try {
      const result = await window.guardian.ai.test()
      toast.show(result.message, result.ok ? 'success' : 'error')
    } catch (error) {
      console.error('Falló la prueba de conexión', error)
      toast.show('No pude hacer la prueba. Inténtalo de nuevo.', 'error')
    } finally {
      setTesting(false)
    }
  }

  const clear = async (): Promise<void> => {
    await window.guardian.ai.clearKey()
    refresh()
    toast.show('Clave borrada de este equipo.', 'info')
  }

  const needsRestart = config !== null && config.hasKey && demoMode

  return (
    <GlassCard title="Inteligencia artificial (Gemini)" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={demoMode ? '#FBBF24' : '#34D399'}>
          {demoMode ? 'Modo demo: respuestas de ejemplo' : 'Modo real: Gemini'}
        </Badge>
        <Badge color={config?.hasKey ? '#34D399' : '#9CA3AF'}>
          {config?.hasKey ? 'Clave guardada' : 'Sin clave'}
        </Badge>
      </div>

      <form onSubmit={(e) => void save(e)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] text-text-muted">
            Clave de Google AI Studio
          </label>
          <input
            id={inputId}
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={config?.hasKey ? 'Pega otra para reemplazarla' : 'Pega aquí tu clave'}
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
          Guardar clave
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void test()}
          loading={testing}
          disabled={!config?.hasKey}
          icon={<PlugZap aria-hidden className="size-4" />}
        >
          Probar conexión
        </Button>
        <Button
          variant="ghost"
          onClick={() => void clear()}
          disabled={!config?.hasKey}
          icon={<Trash2 aria-hidden className="size-4" />}
        >
          Borrar clave
        </Button>
      </div>

      {needsRestart && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.06] px-3.5 py-3 text-sm text-text"
        >
          <p className="min-w-0 flex-1">
            {config?.packaged
              ? 'Reinicia la app para empezar a usar la IA real.'
              : 'Para usar la IA real en desarrollo, pon DEMO_MODE=false en tu archivo .env y reinicia.'}
          </p>
          {config?.packaged && (
            <Button
              variant="secondary"
              onClick={() => void window.guardian.app.relaunch()}
              icon={<RotateCw aria-hidden className="size-4" />}
            >
              Reiniciar ahora
            </Button>
          )}
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-text-muted">
        La clave se guarda cifrada con la protección de tu usuario de Windows y nunca vuelve a
        mostrarse. La consigues gratis en Google AI Studio (aistudio.google.com/apikey). Con el plan
        gratuito hay límites: si se agotan, uso las reglas locales.
      </p>
    </GlassCard>
  )
}
