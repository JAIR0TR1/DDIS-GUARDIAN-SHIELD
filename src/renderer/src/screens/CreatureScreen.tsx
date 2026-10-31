import { motion, type Variants } from 'framer-motion'
import { Shield, Swords } from 'lucide-react'
import type { Creature } from '@shared/models'
import { xpToNext } from '@domain/xp'
import { rarityColors, rarityLabels } from '@design/tokens'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import type { CreatureState } from '../creature/creatureState'

export interface CreatureScreenProps {
  creature: Creature
  variants: Variants
  mood: CreatureState
}

/** Ficha de la criatura: retrato, rareza, estadísticas, nivel y personalidad. */
export function CreatureScreen({
  creature,
  variants,
  mood
}: CreatureScreenProps): React.JSX.Element {
  const rarity = creature.rarity
  const needed = xpToNext(creature.level)
  const stats = [
    { label: 'Ataque', value: creature.attack, icon: Swords, tone: 'danger' as const },
    { label: 'Defensa', value: creature.defense, icon: Shield, tone: 'accent' as const }
  ]
  return (
    <>
      <motion.div variants={variants} className="col-span-12 md:col-span-5">
        <GlassCard
          className="flex h-full flex-col items-center gap-3 py-6"
          glow="accent"
          aria-label="Retrato de la criatura"
        >
          <CreatureAvatar
            size={210}
            state={mood}
            rings
            title={`${creature.name}, ${creature.type}`}
          />
          <h2 className="font-display text-2xl font-semibold">{creature.name}</h2>
          <p className="text-sm text-text-muted">{creature.type}</p>
          <Badge color={rarityColors[rarity]}>{rarityLabels[rarity]}</Badge>
        </GlassCard>
      </motion.div>

      <div className="col-span-12 flex flex-col gap-4 md:col-span-7">
        <motion.div variants={variants}>
          <GlassCard title="Estadísticas">
            <div className="grid gap-4">
              {stats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label}>
                  <p className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-text-muted">
                      <Icon aria-hidden className="size-4" />
                      {label}
                    </span>
                    <span className="tabular font-mono text-text">{value}</span>
                  </p>
                  <ProgressBar value={value} max={100} label={label} tone={tone} />
                </div>
              ))}
              <div>
                <p className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-text-muted">Nivel {creature.level}</span>
                  <span className="tabular font-mono text-text">
                    {creature.xp} / {needed} XP
                  </span>
                </p>
                <ProgressBar value={creature.xp} max={needed} label="Experiencia" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
        <motion.div variants={variants}>
          <GlassCard title="Personalidad">
            <p className="text-sm leading-relaxed text-text">{creature.personality}</p>
          </GlassCard>
        </motion.div>
      </div>
    </>
  )
}
