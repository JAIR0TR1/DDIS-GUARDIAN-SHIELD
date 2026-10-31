import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { LockKeyhole } from 'lucide-react'
import type { Profile, Settings } from '@shared/models'
import { GlassCard } from '../components/ui/GlassCard'
import { Switch } from '../components/ui/Switch'
import { Kbd } from '../components/ui/Kbd'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/toastContext'

export interface SettingsScreenProps {
  settings: Settings
  profile: Profile
  demoMode: boolean
  variants: Variants
  onSaveSettings: (settings: Settings) => Promise<void>
  onSaveProfile: (profile: Profile) => Promise<void>
}

/** Ajustes. Más opciones llegan con la IA (clave cifrada) y las funciones P1. */
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
        <GlassCard title="Privacidad e IA" className="flex flex-col gap-3">
          <Badge color={demoMode ? '#FBBF24' : '#34D399'}>
            {demoMode ? 'Modo demo: sin internet' : 'Modo real'}
          </Badge>
          <p className="flex gap-2.5 text-sm leading-relaxed text-text-muted">
            <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-strong" />
            Las reglas locales revisan todo en tu computador. Solo los mensajes dudosos envían un
            fragmento a la IA de Google, con claves y números de tarjeta tapados.
          </p>
        </GlassCard>
      </motion.div>
    </>
  )
}
