import { cn } from '../lib/cn'

export interface AmbientBackgroundProps {
  /**
   * 'open': estado Despertar, más luminoso y centrado en la criatura.
   * 'panels': estado Sesión activa, atenuado para que el texto sobre vidrio cumpla AA
   * (el cian nunca pasa del 14 % bajo los paneles; ver tests/contrast.test.ts).
   */
  mode?: 'open' | 'panels'
  className?: string
}

/**
 * Malla de gradientes y formas de color DETRÁS de la interfaz. Sin ella el vidrio no tiene
 * nada que desenfocar. Es estática (degradados radiales), sin blur animado.
 */
export function AmbientBackground({
  mode = 'open',
  className
}: AmbientBackgroundProps): React.JSX.Element {
  const open = mode === 'open'
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(60% 55% at 50% 38%, rgb(34 211 238 / ${open ? 0.2 : 0.1}) 0%, transparent 70%)`,
            `radial-gradient(45% 45% at 88% 12%, rgb(139 92 246 / ${open ? 0.16 : 0.1}) 0%, transparent 70%)`,
            `radial-gradient(50% 50% at 8% 95%, rgb(14 116 144 / ${open ? 0.22 : 0.12}) 0%, transparent 72%)`,
            `radial-gradient(35% 35% at 96% 92%, rgb(139 92 246 / ${open ? 0.1 : 0.06}) 0%, transparent 70%)`
          ].join(',')
        }}
      />
      {/* Formas de color con borde: dan algo concreto que el vidrio desenfoca. */}
      <div
        className="absolute -left-24 top-1/3 size-72 rounded-full border border-accent/10"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgb(34 211 238 / 0.09), transparent 65%)'
        }}
      />
      <div
        className="absolute -right-16 bottom-10 size-64 rotate-12 rounded-[40px] border border-violet/10"
        style={{
          background: 'radial-gradient(circle at 70% 30%, rgb(139 92 246 / 0.1), transparent 65%)'
        }}
      />
      {/* Cuadrícula HUD muy tenue */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.025) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(70% 70% at 50% 45%, black, transparent)'
        }}
      />
    </div>
  )
}
