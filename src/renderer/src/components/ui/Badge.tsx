import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { Verdict } from '@shared/threat'
import { verdictMeta } from './verdictMeta'
import { useT } from '../../lib/i18n'

/** Semáforo: SIEMPRE icono + texto, nunca solo color. */
export function VerdictBadge({
  verdict,
  className
}: {
  verdict: Verdict
  className?: string
}): React.JSX.Element {
  const t = useT()
  const meta = verdictMeta[verdict]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1 text-sm font-medium',
        meta.className,
        className
      )}
    >
      <Icon aria-hidden className="size-4" />
      {t(meta.labelKey)}
    </span>
  )
}

/** Insignia neutra (rareza, estado, atajos de estado). */
export function Badge({
  children,
  color,
  className
}: {
  children: ReactNode
  /** Color CSS del borde y el punto, p. ej. el de rareza. */
  color?: string
  className?: string
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-0.5 text-xs text-text-muted',
        className
      )}
      style={color ? { borderColor: `${color}66` } : undefined}
    >
      {color && (
        <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      {children}
    </span>
  )
}
