import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside'
  /** Resplandor de color: refuerza el borde cuando el panel comunica un estado. */
  glow?: 'none' | 'accent' | 'danger'
  padded?: boolean
  /** Etiqueta HUD opcional en la esquina superior izquierda. */
  title?: string
}

/** Panel de vidrio: translúcido, con desenfoque, borde fino y resaltado interno superior. */
export const GlassCard = forwardRef<HTMLElement, GlassCardProps>(function GlassCard(
  { as = 'section', glow = 'none', padded = true, title, className, children, ...rest },
  ref
) {
  const Tag = as as 'section'
  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      aria-label={title}
      className={cn(
        'glass relative rounded-[16px]',
        padded && 'p-5',
        glow === 'accent' &&
          'shadow-[var(--glass-highlight),var(--shadow-panel),var(--shadow-glow-accent)]',
        glow === 'danger' &&
          'shadow-[var(--glass-highlight),var(--shadow-panel),var(--shadow-glow-danger)]',
        className
      )}
      {...rest}
    >
      {title && (
        <h2 className="mb-3 font-display text-[15px] font-medium text-text-muted">{title}</h2>
      )}
      {children}
    </Tag>
  )
})
