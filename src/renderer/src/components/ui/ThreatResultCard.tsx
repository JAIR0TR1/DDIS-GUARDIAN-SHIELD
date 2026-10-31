import {
  BadgeDollarSign,
  Briefcase,
  CircleHelp,
  Gift,
  Headset,
  KeyRound,
  Link2,
  Package,
  Receipt,
  Smartphone,
  Timer,
  Landmark,
  Globe,
  type LucideIcon
} from 'lucide-react'
import type { Signal, SignalKind, ThreatResult } from '@shared/threat'
import { neutralizeLinks } from '@shared/safeText'
import { cn } from '../../lib/cn'
import { GlassCard } from './GlassCard'
import { VerdictBadge } from './Badge'
import { CreatureAvatar } from './CreatureAvatar'
import { gestureFor } from '@domain/gesture'
import type { CreatureState } from '../../creature/creatureState'

const signalIcon: Record<SignalKind, LucideIcon> = {
  'link-acortado': Link2,
  urgencia: Timer,
  'pide-clave': KeyRound,
  'suplanta-marca': Landmark,
  'dominio-sospechoso': Globe,
  premio: Gift,
  comprobante: Receipt,
  paquete: Package,
  empleo: Briefcase,
  soporte: Headset,
  'cambio-numero': Smartphone,
  dinero: BadgeDollarSign,
  otro: CircleHelp
}

const severityColor: Record<Signal['severity'], string> = {
  alta: 'text-danger-text',
  media: 'text-warn',
  baja: 'text-text-muted'
}

const scoreColor: Record<ThreatResult['verdict'], string> = {
  seguro: 'text-safe',
  sospechoso: 'text-warn',
  peligroso: 'text-danger-text'
}

const creatureByVerdict: Record<ThreatResult['verdict'], CreatureState> = {
  seguro: 'feliz',
  sospechoso: 'escaneando',
  peligroso: 'alerta'
}

export interface ThreatResultCardProps {
  result: ThreatResult
  /** Texto analizado. Se muestra como texto plano y con los links neutralizados. Opcional. */
  text?: string
  title?: string
  className?: string
  /** Cambia para que Nilo repita su gesto (p. ej. el id del análisis). */
  reactionKey?: string | number
}

/** Resultado de un análisis: semáforo, puntaje, mensaje, señales, acción y voz de la criatura. */
export function ThreatResultCard({
  result,
  text,
  title = 'Última amenaza',
  className,
  reactionKey
}: ThreatResultCardProps): React.JSX.Element {
  return (
    <GlassCard
      title={title}
      glow={result.verdict === 'peligroso' ? 'danger' : 'none'}
      className={cn('flex flex-col', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <VerdictBadge verdict={result.verdict} />
        <p
          className={cn(
            'tabular font-display text-[44px] font-semibold leading-none',
            scoreColor[result.verdict]
          )}
          aria-label={`Puntaje de riesgo ${result.score} de 100`}
        >
          {result.score}
          <span className="text-lg font-normal text-text-muted">/100</span>
        </p>
      </div>

      {text !== undefined && (
        <p className="selectable mt-4 line-clamp-3 overflow-hidden break-words rounded-[10px] border border-white/8 bg-black/30 px-3 py-2 font-mono text-[13px] text-text-muted">
          {neutralizeLinks(text)}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2" aria-label="Señales detectadas">
        {result.signals.length === 0 && (
          <li className="text-sm text-text-muted">No encontré señales de estafa.</li>
        )}
        {result.signals.map((signal) => {
          const Icon = signalIcon[signal.kind]
          return (
            <li key={signal.id} className="flex items-center gap-2.5 text-sm text-text">
              <Icon aria-hidden className={cn('size-4 shrink-0', severityColor[signal.severity])} />
              {signal.label}
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
        {/* Nilo reacciona con un gesto según el CONTEXTO del resultado (ver domain/gesture.ts). */}
        <CreatureAvatar
          size={104}
          state={creatureByVerdict[result.verdict]}
          gesture={gestureFor(result)}
          gestureKey={reactionKey ?? `${result.verdict}-${result.score}`}
          halo={
            result.verdict === 'peligroso'
              ? 'amenaza'
              : result.verdict === 'sospechoso'
                ? 'duda'
                : 'activo'
          }
          title="Nilo"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{result.creatureMessage}</p>
          <p className="mt-0.5 text-[13px] text-text-muted">{result.recommendedAction}</p>
        </div>
      </div>
    </GlassCard>
  )
}
