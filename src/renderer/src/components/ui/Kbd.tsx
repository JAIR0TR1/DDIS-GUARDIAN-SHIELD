import { cn } from '../../lib/cn'

/**
 * Atajo de teclado. Acepta "Ctrl+Shift+G" y dibuja una tecla por parte.
 * `onAccent`: para usarlo dentro de un botón cian (texto oscuro, contraste AA).
 */
export function Kbd({
  keys,
  className,
  onAccent = false
}: {
  keys: string
  className?: string
  onAccent?: boolean
}): React.JSX.Element {
  const parts = keys.split('+').map((k) => k.trim())
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={keys}>
      {parts.map((k) => (
        <kbd
          key={k}
          aria-hidden
          className={cn(
            'rounded-[6px] border px-1.5 py-0.5 font-mono text-[11px] leading-none',
            onAccent
              ? 'border-accent-ink/40 bg-accent-ink/10 text-accent-ink'
              : 'border-white/14 bg-white/8 text-text-muted'
          )}
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}
