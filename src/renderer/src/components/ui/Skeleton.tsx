import { cn } from '../../lib/cn'

/** Marcador de carga con brillo que se desplaza (solo transform). */
export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      aria-hidden
      className={cn('skeleton relative overflow-hidden rounded-[10px] bg-white/7', className)}
    />
  )
}
