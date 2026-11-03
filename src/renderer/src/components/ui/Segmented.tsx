import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SegmentedProps<T extends string> {
  label: string
  description?: string
  value: T
  options: ReadonlyArray<SegmentedOption<T>>
  onChange: (value: T) => void
  disabled?: boolean
}

/**
 * Selector de una opción entre pocas (radiogroup): flechas para moverse, Tab entra y sale.
 * Pensado para tema e idioma en Ajustes.
 */
export function Segmented<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  disabled
}: SegmentedProps<T>): React.JSX.Element {
  const labelId = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const move = (event: KeyboardEvent, index: number): void => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    const option = options[next]
    if (!option) return
    onChange(option.value)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-text">
          {label}
        </p>
        {description && <p className="text-[13px] text-text-muted">{description}</p>}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="app-no-drag inline-flex rounded-[12px] border border-white/12 bg-white/6 p-0.5"
      >
        {options.map((option, index) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              ref={(node) => {
                refs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => move(event, index)}
              className={cn(
                'inline-flex min-h-8 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium',
                'transition-[background-color,color] duration-[220ms] ease-[var(--ease-guardian)]',
                'disabled:pointer-events-none disabled:opacity-45',
                selected
                  ? 'bg-accent/18 text-accent-strong shadow-[inset_0_0_0_1px_rgb(34_211_238/0.4)]'
                  : 'text-text-muted hover:bg-white/8 hover:text-text'
              )}
            >
              {option.icon}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
