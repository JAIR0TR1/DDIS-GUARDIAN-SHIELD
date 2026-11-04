import { useCallback, useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Flame, Heart, HeartCrack, ShieldAlert, ShieldCheck, Swords, Trophy } from 'lucide-react'
import type { Creature } from '@shared/models'
import type { ThreatResult } from '@shared/threat'
import { neutralizeLinks } from '@shared/safeText'
import { localizeText } from '@shared/i18n/localize'
import type { Gesture } from '@domain/gesture'
import {
  answer,
  buildRounds,
  gameXp,
  MAX_HEARTS,
  nextRound,
  ROUNDS,
  startGame,
  XP_PER_HIT,
  type ArenaSample,
  type ArenaState
} from '@domain/arena'
import { VILLAIN_COLORS, VILLAINS, villainFor, type VillainId } from '@domain/villains'
import corpusData from '@data/corpus.json'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Kbd } from '../components/ui/Kbd'
import { Badge } from '../components/ui/Badge'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { useToast } from '../components/ui/toastContext'
import { villainIcons } from '../components/villainIcons'
import type { CreatureState } from '../creature/creatureState'
import { cn } from '../lib/cn'
import { useT } from '../lib/i18n'

export interface ArenaProps {
  creature: Creature
  variants: Variants
  reduced: boolean
  /** La partida dio experiencia: la criatura actualizada. */
  onCreature: (creature: Creature) => void
}

interface CorpusItem {
  id: string
  label: string
  text: string
}
const SAMPLES: ArenaSample[] = (corpusData as CorpusItem[]).map((c) => ({
  id: c.id,
  text: c.text,
  isScam: c.label === 'estafa'
}))

/** Lo que se sabe de la ronda actual (con las reglas locales, sin IA ni costo). */
interface RoundInfo {
  villain: VillainId | null
  signal: string | null
}

interface Feedback {
  correct: boolean
}

type Phase = 'intro' | 'play' | 'end'

/** Arena del Guardián: un minijuego para aprender a reconocer estafas y darle XP a Nilo. */
export function Arena({ creature, variants, reduced, onCreature }: ArenaProps): React.JSX.Element {
  const t = useT()
  const toast = useToast()
  const [phase, setPhase] = useState<Phase>('intro')
  const [game, setGame] = useState<ArenaState>(() => startGame([]))
  const [info, setInfo] = useState<RoundInfo | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [reward, setReward] = useState<{ xp: number; levelsGained: number } | null>(null)

  const round = game.rounds[game.index]

  // Al empezar cada ronda, las reglas locales identifican al villano (se revela al responder).
  useEffect(() => {
    if (phase !== 'play' || !round) return
    let alive = true
    void window.guardian.analysis
      .peek(round.text)
      .then((result: ThreatResult) => {
        if (!alive) return
        setInfo({
          villain: round.isScam ? villainFor(result) : null,
          signal: result.signals[0]?.label ?? null
        })
      })
      .catch(() => alive && setInfo({ villain: round.isScam ? 'impostor' : null, signal: null }))
    return () => {
      alive = false
    }
  }, [phase, round])

  const start = (): void => {
    setGame(startGame(buildRounds(SAMPLES)))
    setInfo(null)
    setFeedback(null)
    setReward(null)
    setPhase('play')
  }

  const respond = useCallback(
    (saysScam: boolean): void => {
      if (feedback || !round) return
      const result = answer(game, saysScam)
      setGame(result.state)
      setFeedback({ correct: result.correct })
    },
    [feedback, game, round]
  )

  const finish = useCallback(
    async (final: ArenaState): Promise<void> => {
      setPhase('end')
      const xp = gameXp(final)
      try {
        const out = await window.guardian.arena.reward(xp)
        setReward({ xp, levelsGained: out.levelsGained })
        onCreature(out.creature)
      } catch (error) {
        console.error('No se pudo guardar la XP de la Arena', error)
        toast.show(t('arena.rewardFailed'), 'error')
        setReward({ xp: 0, levelsGained: 0 })
      }
    },
    [onCreature, t, toast]
  )

  const advance = useCallback((): void => {
    if (!feedback) return
    const next = nextRound(game)
    setFeedback(null)
    setInfo(null)
    if (next.finished) void finish(next)
    else setGame(next)
  }, [feedback, finish, game])

  // Teclado: E = estafa, S = seguro, Enter = siguiente.
  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return
      const key = event.key.toLowerCase()
      if (!feedback && key === 'e') respond(true)
      else if (!feedback && key === 's') respond(false)
      else if (feedback && event.key === 'Enter') {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, feedback, phase, respond])

  if (phase === 'intro') {
    return <Intro variants={variants} creatureName={creature.name} onStart={start} />
  }

  if (phase === 'end') {
    const won = game.hearts > 0
    return (
      <motion.div variants={variants} className="col-span-12">
        <GlassCard className="flex flex-col items-center gap-3 py-8 text-center" glow="accent">
          <CreatureAvatar
            size={170}
            state={won ? 'feliz' : 'alerta'}
            gesture={won ? 'celebrar' : 'pensar'}
            gestureKey="arena-end"
            title={creature.name}
          />
          <h2 className="flex items-center gap-2 font-display text-[28px] font-semibold tracking-tight">
            {won ? (
              <Trophy aria-hidden className="size-7 text-warn" />
            ) : (
              <HeartCrack aria-hidden className="size-7 text-danger-text" />
            )}
            {won ? t('arena.end.win') : t('arena.end.lose')}
          </h2>
          <p className="tabular text-[15px] text-text-muted">
            {t('arena.end.score', { hits: game.hits, total: ROUNDS, streak: game.bestStreak })}
          </p>
          {reward && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="tabular font-display text-2xl font-semibold text-accent-strong">
                {t('arena.end.xp', { xp: reward.xp, name: creature.name })}
              </span>
              {reward.levelsGained > 0 && (
                <Badge color="#F59E0B">
                  {t('arena.end.level', { name: creature.name, level: creature.level })}
                </Badge>
              )}
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            className="mt-2"
            onClick={start}
            icon={<Swords aria-hidden className="size-4" />}
          >
            {t('arena.again')}
          </Button>
        </GlassCard>
      </motion.div>
    )
  }

  const answered = feedback !== null
  const villain = answered ? (info?.villain ?? null) : null
  const nilo = niloReaction(feedback, round?.isScam ?? false)

  return (
    <>
      <motion.div variants={variants} className="col-span-12">
        <Hud game={game} />
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-5">
        <GlassCard className="flex h-full flex-col items-center justify-center gap-3 py-6">
          <CreatureAvatar
            size={200}
            state={nilo.state}
            gesture={nilo.gesture}
            gestureKey={`${game.index}-${answered ? 'a' : 'q'}`}
            rings
            title={creature.name}
          />
          <p className="glass rounded-[16px] rounded-tl-[4px] px-4 py-2.5 text-center text-sm text-text">
            {answered
              ? feedback.correct
                ? round?.isScam
                  ? t('arena.right.scam', { villain: villainName(villain, t) })
                  : t('arena.right.safe')
                : round?.isScam
                  ? t('arena.wrong.scam', { villain: villainName(villain, t) })
                  : t('arena.wrong.safe')
              : t('arena.question')}
          </p>
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-7">
        <GlassCard
          className="flex h-full flex-col gap-4"
          glow={answered && round?.isScam ? 'danger' : 'none'}
        >
          <Opponent
            villain={villain}
            answered={answered}
            isScam={round?.isScam ?? false}
            defeated={answered && feedback.correct && (round?.isScam ?? false)}
            reduced={reduced}
          />

          <p className="selectable rounded-[12px] border border-white/10 bg-[var(--field-bg)] p-3.5 font-mono text-[13.5px] leading-relaxed text-text">
            {round ? neutralizeLinks(round.text) : ''}
          </p>

          {answered ? (
            <div className="flex flex-col gap-3" role="status">
              <p className="text-[13.5px] leading-relaxed text-text-muted">
                {round?.isScam
                  ? `${villain ? t(`villain.${villain}.tell`) : ''}${
                      info?.signal
                        ? ` ${t('arena.keySignal', { signal: localizeText(info.signal, t) })}`
                        : ''
                    }`
                  : t('arena.safeTip')}
              </p>
              <Button variant="primary" onClick={advance} className="self-start" autoFocus>
                {game.index + 1 >= game.rounds.length || game.hearts <= 0
                  ? t('arena.finish')
                  : t('arena.next')}
                <Kbd keys="Enter" onAccent className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="danger"
                size="lg"
                onClick={() => respond(true)}
                icon={<ShieldAlert aria-hidden className="size-4" />}
                aria-keyshortcuts="E"
              >
                {t('arena.saysScam')} <Kbd keys="E" className="ml-1" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => respond(false)}
                icon={<ShieldCheck aria-hidden className="size-4" />}
                aria-keyshortcuts="S"
              >
                {t('arena.saysSafe')} <Kbd keys="S" className="ml-1" />
              </Button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </>
  )
}

function villainName(villain: VillainId | null, t: ReturnType<typeof useT>): string {
  return t(`villain.${villain ?? 'impostor'}.name`)
}

/** Cómo reacciona Nilo: lee mientras decides; celebra o protege si aciertas; se alarma si no. */
function niloReaction(
  feedback: Feedback | null,
  isScam: boolean
): { state: CreatureState; gesture: Gesture } {
  if (!feedback) return { state: 'escaneando', gesture: 'leer' }
  if (feedback.correct) return { state: 'feliz', gesture: isScam ? 'proteger' : 'celebrar' }
  return { state: 'alerta', gesture: 'alto' }
}

function Hud({ game }: { game: ArenaState }): React.JSX.Element {
  const t = useT()
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[16px] px-5 py-3">
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={t('arena.hearts', { n: game.hearts })}
      >
        {Array.from({ length: MAX_HEARTS }, (_, i) => (
          <Heart
            key={i}
            aria-hidden
            className={cn(
              'size-5 transition-colors duration-[220ms]',
              i < game.hearts ? 'fill-danger text-danger' : 'text-text-subtle'
            )}
          />
        ))}
      </div>
      <p className="tabular font-mono text-[13px] text-text-muted">
        {t('arena.round', {
          n: Math.min(game.index + 1, game.rounds.length),
          total: game.rounds.length
        })}
      </p>
      <p className="tabular font-mono text-[13px] text-text-muted">
        {t('arena.hits', { n: game.hits })}
      </p>
      <p className="tabular flex items-center gap-1.5 font-mono text-[13px] text-warn">
        <Flame aria-hidden className="size-4" />
        {t('arena.streak', { n: game.streak })}
      </p>
    </div>
  )
}

/** El rival de la ronda: misterioso hasta responder; luego el villano (o el mensaje amigo). */
function Opponent({
  villain,
  answered,
  isScam,
  defeated,
  reduced
}: {
  villain: VillainId | null
  answered: boolean
  isScam: boolean
  defeated: boolean
  reduced: boolean
}): React.JSX.Element {
  const t = useT()
  const color =
    answered && isScam && villain ? VILLAIN_COLORS[villain] : answered ? '#34D399' : '#94A3B8'
  const Icon =
    answered && isScam && villain ? villainIcons[villain] : answered ? ShieldCheck : Swords
  const title =
    answered && isScam && villain
      ? t(`villain.${villain}.name`)
      : answered
        ? t('arena.friend')
        : t('arena.mystery')
  const tagline =
    answered && isScam && villain ? t(`villain.${villain}.tagline`) : t('arena.friend.tagline')
  const hp = defeated ? 0 : 100

  return (
    <div className="flex items-center gap-4">
      <motion.span
        key={`${answered}-${villain ?? 'none'}`}
        className="grid size-16 shrink-0 place-items-center rounded-[18px] border"
        style={{
          borderColor: `${color}80`,
          backgroundColor: `${color}1f`,
          boxShadow: `0 0 26px ${color}55`
        }}
        initial={reduced ? false : { scale: 0.7, opacity: 0 }}
        animate={
          defeated && !reduced
            ? { scale: [1, 1.12, 0.92], x: [0, -6, 6, -4, 0], opacity: 0.55 }
            : { scale: 1, opacity: 1 }
        }
        transition={{ duration: defeated ? 0.6 : 0.35 }}
      >
        <Icon aria-hidden className="size-8" style={{ color }} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold leading-tight text-text">{title}</p>
        <p className="mt-0.5 text-[13px] text-text-muted">
          {answered ? tagline : t('arena.question')}
        </p>
        {answered && isScam && (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label={t('arena.hp')}
            aria-valuenow={hp}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full origin-left rounded-full"
              style={{ backgroundColor: color }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: hp / 100 }}
              transition={{ duration: reduced ? 0 : 0.6 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** Introducción: reglas y galería de villanos (la identidad de cada estafa). */
function Intro({
  variants,
  creatureName,
  onStart
}: {
  variants: Variants
  creatureName: string
  onStart: () => void
}): React.JSX.Element {
  const t = useT()
  return (
    <>
      <motion.div variants={variants} className="col-span-12">
        <GlassCard className="flex flex-wrap items-center gap-6" glow="accent">
          <CreatureAvatar
            size={130}
            state="feliz"
            gesture="proteger"
            gestureKey="arena-intro"
            title={creatureName}
          />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-display text-[28px] font-semibold tracking-tight">
              <Swords aria-hidden className="size-7 text-accent-strong" />
              {t('arena.title')}
            </h2>
            <p className="mt-1.5 max-w-[560px] text-[15px] leading-relaxed text-text-muted">
              {t('arena.intro', { name: creatureName })}
            </p>
            <p className="hud-label mt-2">
              {t('arena.rules', { rounds: ROUNDS, hearts: MAX_HEARTS, xp: XP_PER_HIT })}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            icon={<Swords aria-hidden className="size-4" />}
            autoFocus
          >
            {t('arena.start')}
          </Button>
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12">
        <GlassCard title={t('arena.meet')}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VILLAINS.map((id) => {
              const Icon = villainIcons[id]
              const color = VILLAIN_COLORS[id]
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] p-3"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-[12px] border"
                    style={{ borderColor: `${color}80`, backgroundColor: `${color}1f` }}
                  >
                    <Icon aria-hidden className="size-6" style={{ color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{t(`villain.${id}.name`)}</p>
                    <p className="truncate text-[12.5px] text-text-muted">
                      {t(`villain.${id}.tagline`)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </GlassCard>
      </motion.div>
    </>
  )
}
