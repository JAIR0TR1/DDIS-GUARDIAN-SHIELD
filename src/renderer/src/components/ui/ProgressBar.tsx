import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { transition } from '@design/motion'

export type ProgressTone = 'accent' | 'safe' | 'warn' | 'danger'

const toneColor: Record<ProgressTone, string> = {
  accent: 'var(--color-accent)',
  safe: 'var(--color-safe)',
  warn: 'var(--color-warn)',
  danger: 'var(--color-danger)'
}

export interface ProgressBarProps {
  value: number
  max?: number
  /** Nombre accesible de la barra. */
  label: string
  tone?: ProgressTone
  className?: string
}

/** Barra fina con punta luminosa. Anima solo transform (scaleX), no el ancho. */
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'accent',
  className
}: ProgressBarProps): React.JSX.Element {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const color = toneColor[tone]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-white/10', className)}
    >
      <motion.div
        className="absolute inset-0 origin-left rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: ratio }}
        transition={transition.slow}
      />
    </div>
  )
}
