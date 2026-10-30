import { useId } from 'react'
import { cn } from '../../lib/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Interruptor accesible (role="switch"), operable con Espacio y Enter. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled
}: SwitchProps): React.JSX.Element {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
        {description && <p className="text-[13px] text-text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'app-no-drag relative h-6 w-11 shrink-0 rounded-full border transition-[background-color,border-color,opacity] duration-[220ms] ease-[var(--ease-guardian)]',
          'disabled:pointer-events-none disabled:opacity-45',
          checked ? 'border-accent/60 bg-accent/30' : 'border-white/15 bg-white/8'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute left-0.5 top-0.5 size-[18px] rounded-full transition-[transform,background-color] duration-[220ms] ease-[var(--ease-guardian)]',
            checked
              ? 'translate-x-5 bg-accent-strong shadow-[0_0_10px_rgb(34_211_238/0.6)]'
              : 'translate-x-0 bg-text-muted'
          )}
        />
      </button>
    </div>
  )
}
