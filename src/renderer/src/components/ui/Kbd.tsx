import { cn } from '../../lib/cn'

/** Atajo de teclado. Acepta "Ctrl+Shift+G" y dibuja una tecla por parte. */
export function Kbd({ keys, className }: { keys: string; className?: string }): React.JSX.Element {
  const parts = keys.split('+').map((k) => k.trim())
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={keys}>
      {parts.map((k) => (
        <kbd
          key={k}
          aria-hidden
          className="rounded-[6px] border border-white/14 bg-white/8 px-1.5 py-0.5 font-mono text-[11px] leading-none text-text-muted"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}
