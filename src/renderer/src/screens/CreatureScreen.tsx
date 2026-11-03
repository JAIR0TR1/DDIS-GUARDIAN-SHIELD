import { motion, type Variants } from 'framer-motion'
import { Shield, Swords } from 'lucide-react'
import type { Creature } from '@shared/models'
import { xpToNext } from '@domain/xp'
import { rarityColors } from '@design/tokens'
import { useT } from '../lib/i18n'
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
  const t = useT()
  const rarity = creature.rarity
  // Los datos base de Nilo vienen en español; si no se editaron, se muestran en el idioma activo.
  const isDefault = creature.name === 'Nilo'
  const typeText = isDefault ? t('creature.type.default') : creature.type
  const personalityText = isDefault ? t('creature.personality.default') : creature.personality
  const needed = xpToNext(creature.level)
  const stats = [
    { label: t('creature.attack'), value: creature.attack, icon: Swords, tone: 'danger' as const },
    { label: t('creature.defense'), value: creature.defense, icon: Shield, tone: 'accent' as const }
  ]
  return (
    <>
      <motion.div variants={variants} className="col-span-12 md:col-span-5">
        <GlassCard
          className="flex h-full flex-col items-center gap-3 py-6"
          glow="accent"
          aria-label={t('creature.portrait')}
        >
          <CreatureAvatar size={210} state={mood} rings title={`${creature.name}, ${typeText}`} />
          <h2 className="font-display text-2xl font-semibold">{creature.name}</h2>
          <p className="text-sm text-text-muted">{typeText}</p>
          <Badge color={rarityColors[rarity]}>{t(`rarity.${rarity}`)}</Badge>
        </GlassCard>
      </motion.div>

      <div className="col-span-12 flex flex-col gap-4 md:col-span-7">
        <motion.div variants={variants}>
          <GlassCard title={t('creature.stats')}>
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
                  <span className="text-text-muted">
                    {t('creature.level', { level: creature.level })}
                  </span>
                  <span className="tabular font-mono text-text">
                    {creature.xp} / {needed} XP
                  </span>
                </p>
                <ProgressBar value={creature.xp} max={needed} label={t('creature.experience')} />
              </div>
            </div>
          </GlassCard>
        </motion.div>
        <motion.div variants={variants}>
          <GlassCard title={t('creature.personality')}>
            <p className="text-sm leading-relaxed text-text">{personalityText}</p>
          </GlassCard>
        </motion.div>
      </div>
    </>
  )
}
