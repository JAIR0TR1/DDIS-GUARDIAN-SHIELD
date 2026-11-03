import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion'
import { Check, Lock, Shield, Sparkles, Swords } from 'lucide-react'
import type { Creature } from '@shared/models'
import { xpToNext } from '@domain/xp'
import {
  isSkinUnlocked,
  nextSkin,
  SKIN_CATALOG,
  SKINS,
  usableSkin,
  type SkinId
} from '@domain/skins'
import { rarityColors } from '@design/tokens'
import { useT } from '../lib/i18n'
import { cn } from '../lib/cn'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { useToast } from '../components/ui/toastContext'
import type { CreatureState } from '../creature/creatureState'

export interface CreatureScreenProps {
  creature: Creature
  variants: Variants
  mood: CreatureState
  reduced: boolean
  /** Se eligió otra apariencia: la criatura guardada. */
  onCreature: (creature: Creature) => void
}

/** Ficha de la criatura: carta coleccionable, estadísticas, apariencias y personalidad. */
export function CreatureScreen({
  creature,
  variants,
  mood,
  reduced,
  onCreature
}: CreatureScreenProps): React.JSX.Element {
  const t = useT()
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
        <CollectibleCard creature={creature} mood={mood} typeText={typeText} reduced={reduced} />
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
          <SkinPicker creature={creature} onCreature={onCreature} />
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

/**
 * Carta coleccionable: marco del color de la rareza, brillo holográfico que sigue al puntero e
 * inclinación 3D (solo transform y opacity). Con movimiento reducido queda quieta.
 */
function CollectibleCard({
  creature,
  mood,
  typeText,
  reduced
}: {
  creature: Creature
  mood: CreatureState
  typeText: string
  reduced: boolean
}): React.JSX.Element {
  const t = useT()
  const rarity = creature.rarity
  const color = rarityColors[rarity]
  const skin = SKIN_CATALOG[usableSkin(creature.skin, creature.level)]
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 180, damping: 18 }
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), spring)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), spring)
  const sheenX = useSpring(useTransform(px, [-0.5, 0.5], ['-35%', '35%']), spring)
  const sheenOpacity = useSpring(0, spring)

  const onMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (reduced) return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
    sheenOpacity.set(1)
  }
  const onLeave = (): void => {
    px.set(0)
    py.set(0)
    sheenOpacity.set(0)
  }

  return (
    <div className="h-full" style={{ perspective: 900 }}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        // El marco toma el color de la rareza; la inclinación se apaga con movimiento reducido.
        style={{ ...(reduced ? {} : { rotateX, rotateY }), borderColor: `${color}b3` }}
        aria-label={t('creature.portrait')}
        role="group"
        className="relative flex h-full flex-col overflow-hidden rounded-[24px] border-2 p-1.5 shadow-[var(--shadow-panel)]"
      >
        <div
          className="relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-[18px] px-4 pb-4 pt-3"
          style={{
            background: `radial-gradient(120% 80% at 50% 0%, ${skin.palette.shield}33, transparent 60%), linear-gradient(180deg, var(--surface-solid), var(--color-bg))`
          }}
        >
          <div className="flex w-full items-center justify-between">
            <span className="hud-label">{t('creature.card.serial', { n: '001' })}</span>
            <span className="tabular font-mono text-[12px] font-semibold" style={{ color }}>
              {t('creature.card.level', { n: creature.level })}
            </span>
          </div>
          <CreatureAvatar size={200} state={mood} rings title={`${creature.name}, ${typeText}`} />
          <h2 className="font-display text-[26px] font-semibold leading-tight">{creature.name}</h2>
          <p className="text-sm text-text-muted">{typeText}</p>
          <div className="flex items-center gap-2">
            <Badge color={color}>{t(`rarity.${rarity}`)}</Badge>
            <Badge color={skin.palette.shield}>{t(`skin.${skin.id}`)}</Badge>
          </div>
          <div className="mt-auto grid w-full grid-cols-2 gap-2 border-t border-white/10 pt-3 text-center">
            <p className="tabular font-mono text-[13px] text-text-muted">
              <Swords aria-hidden className="mr-1 inline size-3.5 text-danger-text" />
              {t('creature.attack')}{' '}
              <span className="font-semibold text-text">{creature.attack}</span>
            </p>
            <p className="tabular font-mono text-[13px] text-text-muted">
              <Shield aria-hidden className="mr-1 inline size-3.5 text-accent-strong" />
              {t('creature.defense')}{' '}
              <span className="font-semibold text-text">{creature.defense}</span>
            </p>
          </div>

          {/* Brillo holográfico: una franja de arcoíris que se desliza con el puntero. */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-1/2 mix-blend-soft-light"
              style={{
                x: sheenX,
                opacity: sheenOpacity,
                rotate: 20,
                background:
                  'linear-gradient(100deg, transparent 35%, rgb(255 0 128 / 0.35) 42%, rgb(255 210 0 / 0.35) 47%, rgb(0 255 170 / 0.35) 52%, rgb(0 170 255 / 0.35) 57%, transparent 64%)'
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

/** Selector de apariencias: las bloqueadas muestran el nivel que falta. */
function SkinPicker({
  creature,
  onCreature
}: {
  creature: Creature
  onCreature: (creature: Creature) => void
}): React.JSX.Element {
  const t = useT()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const current = usableSkin(creature.skin, creature.level)
  const upcoming = nextSkin(creature.level)

  const choose = async (skin: SkinId): Promise<void> => {
    if (skin === current || !isSkinUnlocked(skin, creature.level)) return
    setSaving(true)
    try {
      const saved = await window.guardian.data.saveCreature({ ...creature, skin })
      onCreature(saved)
      toast.show(t('creature.skins.saved', { name: t(`skin.${skin}`) }), 'success')
    } catch (error) {
      console.error('No se pudo cambiar la apariencia', error)
      toast.show(t('creature.skins.failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassCard title={t('creature.skins')}>
      <ul className="grid grid-cols-5 gap-2">
        {SKINS.map((id) => {
          const skin = SKIN_CATALOG[id]
          const unlocked = isSkinUnlocked(id, creature.level)
          const selected = id === current
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => void choose(id)}
                disabled={saving || !unlocked}
                aria-pressed={selected}
                aria-label={
                  unlocked
                    ? t(`skin.${id}`)
                    : `${t(`skin.${id}`)} · ${t('creature.skins.locked', { n: skin.unlockLevel })}`
                }
                className={cn(
                  'app-no-drag flex w-full flex-col items-center gap-1.5 rounded-[14px] border p-2 transition-[background-color,border-color,transform] duration-[220ms] ease-[var(--ease-guardian)]',
                  selected
                    ? 'border-accent/60 bg-accent/12'
                    : 'border-white/10 bg-white/[0.04] hover:bg-white/8',
                  unlocked ? 'active:scale-[0.97]' : 'cursor-not-allowed opacity-60'
                )}
              >
                <span
                  aria-hidden
                  className="relative grid size-11 place-items-center rounded-full border border-white/15"
                  style={{
                    background: `linear-gradient(160deg, ${skin.palette.cap} 0 48%, ${skin.palette.body} 52%)`,
                    boxShadow: `0 0 14px ${skin.palette.shield}55`
                  }}
                >
                  {unlocked ? (
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: skin.palette.eyes }}
                    />
                  ) : (
                    <Lock className="size-4 text-white/80" />
                  )}
                  {selected && (
                    <Check className="absolute -right-1 -top-1 size-4 rounded-full bg-accent p-0.5 text-accent-ink" />
                  )}
                </span>
                <span className="text-[12px] font-medium text-text">{t(`skin.${id}`)}</span>
                <span
                  className="tabular font-mono text-[10.5px]"
                  style={{ color: unlocked ? rarityColors[skin.rarity] : undefined }}
                >
                  {unlocked
                    ? t(`rarity.${skin.rarity}`)
                    : t('creature.skins.locked', { n: skin.unlockLevel })}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-text-muted">
        <Sparkles aria-hidden className="size-3.5 shrink-0 text-warn" />
        {upcoming
          ? t('creature.skins.next', { name: t(`skin.${upcoming.id}`), n: upcoming.unlockLevel })
          : t('creature.skins.all')}
      </p>
    </GlassCard>
  )
}
