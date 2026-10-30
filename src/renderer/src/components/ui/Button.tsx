import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  /** Ocupa todo el ancho disponible. */
  block?: boolean
}

const base =
  'app-no-drag inline-flex select-none items-center justify-center gap-2 rounded-[12px] font-medium ' +
  'transition-[transform,opacity,background-color,box-shadow] duration-[220ms] ease-[var(--ease-guardian)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-[0_0_0_1px_rgb(103_232_249/0.5),0_6px_20px_rgb(34_211_238/0.28)] ' +
    'hover:bg-accent-strong hover:shadow-[0_0_0_1px_rgb(103_232_249/0.7),0_8px_28px_rgb(34_211_238/0.4)]',
  secondary: 'border border-white/12 bg-white/7 text-text hover:bg-white/12 hover:border-white/20',
  ghost: 'text-text-muted hover:bg-white/8 hover:text-text',
  danger:
    'border border-danger/50 bg-danger/15 text-danger-text hover:bg-danger/25 hover:border-danger/70'
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-9 px-4 text-sm',
  lg: 'min-h-12 px-5 text-[15px]'
}

/** Botón con estados: normal, hover, foco visible, activo, deshabilitado y cargando. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon,
    block = false,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  )
})
