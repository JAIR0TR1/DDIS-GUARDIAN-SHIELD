import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  /** "error" usa role="alert" para que lo lea un lector de pantalla. */
  tone?: 'neutral' | 'error'
}

/** Estado vacío o de error: icono, mensaje con la voz de la criatura y una salida clara. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral'
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
    >
      <div
        aria-hidden
        className={
          tone === 'error'
            ? 'grid size-12 place-items-center rounded-full border border-danger/40 bg-danger/12 text-danger-text'
            : 'grid size-12 place-items-center rounded-full border border-white/12 bg-white/7 text-accent-strong'
        }
      >
        {icon}
      </div>
      <h3 className="font-display text-base font-medium text-text">{title}</h3>
      <p className="max-w-xs text-sm text-text-muted">{description}</p>
      {action}
    </div>
  )
}
