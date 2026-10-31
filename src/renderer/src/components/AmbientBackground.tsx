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

/** Grano de película (SVG embebido, sin red): rompe el degradado plano y da textura. */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/** Posiciones fijas de partículas (determinista: sin Math.random en el render). */
const PARTICLES = [
  [12, 22, 2, 0],
  [24, 68, 1.5, 1.2],
  [33, 14, 1.5, 2.4],
  [47, 82, 2, 0.6],
  [58, 10, 1.5, 3],
  [66, 74, 2, 1.8],
  [78, 28, 1.5, 0.3],
  [86, 62, 2, 2.1],
  [92, 16, 1.5, 1.5],
  [7, 48, 1.5, 2.7],
  [71, 46, 1, 0.9],
  [39, 52, 1, 3.3]
] as const

/**
 * Fondo en capas DETRÁS de la interfaz: aurora de color, formas con borde, cuadrícula HUD,
 * viñeta y grano. Sin ello el vidrio no tiene nada que desenfocar.
 * Es estático salvo el parpadeo (opacity) de las partículas y la deriva (transform) de la aurora.
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
      {/* Aurora: manchas grandes de color que derivan despacio (solo transform). */}
      <div
        className="ambient-drift absolute -left-[10%] -top-[20%] h-[70%] w-[60%] rounded-full"
        style={{
          background: `radial-gradient(closest-side, rgb(34 211 238 / ${open ? 0.2 : 0.11}), transparent)`
        }}
      />
      <div
        className="ambient-drift-reverse absolute -right-[12%] top-[8%] h-[65%] w-[50%] rounded-full"
        style={{
          background: `radial-gradient(closest-side, rgb(139 92 246 / ${open ? 0.2 : 0.11}), transparent)`
        }}
      />
      <div
        className="ambient-drift absolute -bottom-[25%] left-[22%] h-[65%] w-[60%] rounded-full"
        style={{
          background: `radial-gradient(closest-side, rgb(14 116 144 / ${open ? 0.26 : 0.13}), transparent)`
        }}
      />

      {/* Formas con borde: algo concreto que el vidrio desenfoca. */}
      <div
        className="absolute -left-20 top-[38%] size-72 rounded-full border border-accent/15"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgb(34 211 238 / 0.12), transparent 65%)'
        }}
      />
      <div
        className="absolute -right-14 bottom-[8%] size-64 rotate-12 rounded-[44px] border border-violet/20"
        style={{
          background: 'radial-gradient(circle at 70% 30%, rgb(139 92 246 / 0.14), transparent 65%)'
        }}
      />

      {/* Cuadrícula HUD con desvanecido hacia los bordes */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgb(148 220 255 / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(148 220 255 / 0.045) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(75% 70% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(75% 70% at 50% 45%, black, transparent)'
        }}
      />

      {/* Partículas muy sutiles (solo en Despertar) */}
      {open &&
        PARTICLES.map(([x, y, size, delay]) => (
          <span
            key={`${x}-${y}`}
            className="ambient-twinkle absolute rounded-full bg-accent-strong"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              animationDelay: `${delay}s`
            }}
          />
        ))}

      {/* Viñeta y grano */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(120% 100% at 50% 40%, transparent 55%, rgb(0 0 0 / 0.55))'
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
      />
    </div>
  )
}
