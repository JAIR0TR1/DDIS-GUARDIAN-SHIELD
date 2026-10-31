import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Creature, Profile, Settings } from '@shared/models'
import type { HistoryEntry } from '@shared/history'
import { xpToNext } from '@domain/xp'
import { pickPhrase } from '@domain/phrases'
import { fadeOnly, panelContainer, panelItemBlur, transition } from '@design/motion'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Sidebar, type Section } from '../components/ui/Sidebar'
import { Home } from './Home'
import { CreatureScreen } from './CreatureScreen'
import { SettingsScreen } from './SettingsScreen'
import { ComingSoon } from './ComingSoon'
import type { CreatureState } from '../creature/creatureState'

export interface SessionProps {
  profile: Profile
  creature: Creature
  settings: Settings
  history: HistoryEntry[]
  demoMode: boolean
  onSaveSettings: (settings: Settings) => Promise<void>
  onSaveProfile: (profile: Profile) => Promise<void>
}

/** Estado B «Sesión activa»: barra lateral, cabecera con XP y paneles de vidrio. */
export function Session({
  profile,
  creature,
  settings,
  history,
  demoMode,
  onSaveSettings,
  onSaveProfile
}: SessionProps): React.JSX.Element {
  const [section, setSection] = useState<Section>('inicio')
  const [mood, setMood] = useState<CreatureState>('feliz')
  const osReduced = useReducedMotion()
  const reduced = osReduced === true || settings.reduceMotion

  // Nilo reacciona feliz al entrar y luego vuelve al reposo.
  useEffect(() => {
    const timer = window.setTimeout(() => setMood('reposo'), 2800)
    return () => window.clearTimeout(timer)
  }, [])

  const greeting = useMemo(
    () => pickPhrase(creature.phrases, 'bienvenida', profile.name),
    [creature.phrases, profile.name]
  )
  const needed = xpToNext(creature.level)

  const itemVariants = reduced ? fadeOnly : panelItemBlur

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
          onSelect={setSection}
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
                variants={itemVariants}
                lastThreat={history[0] ?? null}
                history={history}
                profileName={profile.name}
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
            {(section === 'analizar' || section === 'historial') && (
              <ComingSoon section={section} variants={itemVariants} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
