import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface WatcherChipProps {
  on: boolean
  onToggle: () => void
  disabled?: boolean
}

/**
 * Indicador y interruptor del vigilante del portapapeles. Siempre visible en la cabecera:
 * el usuario debe saber, en todo momento, si Nilo está mirando lo que copia.
 */
export function WatcherChip({ on, onToggle, disabled }: WatcherChipProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Vigilar el portapapeles"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'app-no-drag inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[13px]',
        'transition-[background-color,border-color,color,transform] duration-[220ms] ease-[var(--ease-guardian)]',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        on
          ? 'border-accent/45 bg-accent/10 text-accent-strong hover:bg-accent/16'
          : 'border-white/14 bg-white/6 text-text-muted hover:bg-white/10 hover:text-text'
      )}
    >
      {on ? (
        <>
          <span aria-hidden className="pulse-dot size-1.5 text-accent" />
          <Eye aria-hidden className="size-4" />
          Vigilando portapapeles
        </>
      ) : (
        <>
          <EyeOff aria-hidden className="size-4" />
          Vigilante apagado
        </>
      )}
    </button>
  )
}
