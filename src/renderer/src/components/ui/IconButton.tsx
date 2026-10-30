import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: nombre accesible, también se usa como tooltip nativo. */
  label: string
  children: ReactNode
  active?: boolean
  tone?: 'default' | 'danger'
}

/** Botón solo icono. Objetivo de clic mínimo de 36 px (por encima de los 32 px exigidos). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, active = false, tone = 'default', className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={rest['aria-pressed']}
      className={cn(
        'app-no-drag inline-grid size-9 place-items-center rounded-[12px] border border-transparent text-text-muted',
        'transition-[transform,opacity,background-color,color,border-color] duration-[220ms] ease-[var(--ease-guardian)]',
        'hover:bg-white/10 hover:text-text active:scale-95 disabled:pointer-events-none disabled:opacity-45',
        active && 'border-accent/40 bg-accent/12 text-accent-strong',
        tone === 'danger' && 'hover:bg-danger/20 hover:text-danger-text',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
