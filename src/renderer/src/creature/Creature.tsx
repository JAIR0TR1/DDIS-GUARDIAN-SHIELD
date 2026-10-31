import { useId } from 'react'
import { haloColors, type HaloState } from '@design/tokens'
import { defaultHalo, type CreatureState } from './creatureState'

export interface CreatureProps {
  state?: CreatureState
  /** Sobrescribe el halo (cian activo, ámbar duda, rojo amenaza, gris dormida). */
  halo?: HaloState
  /** Dibuja los anillos concéntricos de escaneo alrededor (estado Despertar). */
  rings?: boolean
  className?: string
  title?: string
}

const LINE = '#22D3EE'
const EYE = '#5EEAF8'
const VIOLET = '#8B5CF6'

/** Chispas flotantes alrededor de Nilo: [x, y, radio, retraso]. */
const SPARKS = [
  [34, 52, 1.6, 0],
  [168, 70, 1.3, 1.1],
  [24, 128, 1.2, 2.2],
  [178, 138, 1.7, 0.7],
  [100, 6, 1.2, 1.8]
] as const

/**
 * Nilo, el Guardián. SVG por capas: halo → anillos → orejas → cabeza → luz → escudo → ojos → boca.
 * Cada parte lleva `data-part` para animarla con transform desde animations.css.
 */
export function Creature({
  state = 'reposo',
  halo,
  rings = false,
  className,
  title = 'Nilo, tu Guardián'
}: CreatureProps): React.JSX.Element {
  const uid = useId().replaceAll(':', '')
  const haloColor = haloColors[halo ?? defaultHalo[state]]
  const eyeRy = state === 'alerta' ? 15 : 13
  const eyeRx = state === 'alerta' ? 10 : 9
  const id = (name: string): string => `${name}-${uid}`

  return (
    <div
      className={`creature size-full ${className ?? ''}`}
      data-state={state}
      data-halo={halo ?? defaultHalo[state]}
    >
      <svg viewBox="14 4 172 172" role="img" aria-label={title} width="100%" height="100%">
        <title>{title}</title>
        <defs>
          <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={haloColor} stopOpacity="0.55" />
            <stop offset="50%" stopColor={haloColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={haloColor} stopOpacity="0" />
          </radialGradient>
          {/* Cabeza: iluminada desde arriba, más oscura abajo */}
          <radialGradient id={id('head')} cx="50%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#17304D" />
            <stop offset="55%" stopColor="#0B1A2E" />
            <stop offset="100%" stopColor="#050C18" />
          </radialGradient>
          {/* Luz de borde: el contorno brilla más arriba y se apaga abajo */}
          <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="45%" stopColor={LINE} />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
          <radialGradient id={id('face')} cx="50%" cy="62%" r="45%">
            <stop offset="0%" stopColor={haloColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={haloColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('ear')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B3556" />
            <stop offset="100%" stopColor="#081425" />
          </linearGradient>
          <linearGradient id={id('earIn')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VIOLET} stopOpacity="0.75" />
            <stop offset="100%" stopColor={LINE} stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id={id('eye')} cx="40%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#ECFEFF" />
            <stop offset="40%" stopColor={EYE} />
            <stop offset="100%" stopColor="#0891B2" />
          </radialGradient>
          <linearGradient id={id('shield')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor={VIOLET} />
          </linearGradient>
          <filter id={id('glow')} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Capa 1: halo que respira */}
        <circle
          data-part="halo"
          className="creature-halo"
          cx="100"
          cy="104"
          r="150"
          fill={`url(#${id('halo')})`}
        />

        {/* Capa 2: anillos concéntricos de escaneo */}
        {rings && (
          <g fill="none" stroke={haloColor} strokeLinecap="round">
            <circle
              data-part="ring"
              className="creature-ring-fade"
              cx="100"
              cy="98"
              r="74"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <circle
              data-part="ring"
              data-ring="1"
              className="creature-ring"
              cx="100"
              cy="98"
              r="92"
              strokeOpacity="0.34"
              strokeWidth="1"
              strokeDasharray="2 10 60 14"
            />
            <circle
              data-part="ring"
              data-ring="2"
              className="creature-ring"
              cx="100"
              cy="98"
              r="112"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="4 18 120 22"
            />
          </g>
        )}

        {/* Chispas flotantes */}
        <g fill={EYE}>
          {SPARKS.map(([x, y, r, delay]) => (
            <circle
              key={`${x}-${y}`}
              className="ambient-twinkle"
              cx={x}
              cy={y}
              r={r}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </g>

        {/* Reflejo de luz en el suelo */}
        <ellipse
          cx="100"
          cy="172"
          rx="46"
          ry="5"
          fill={haloColor}
          fillOpacity="0.28"
          filter={`url(#${id('soft')})`}
        />

        <g data-part="body" className="creature-body">
          {/* Capa 3: orejas con interior luminoso */}
          <g stroke={`url(#${id('rim')})`} strokeWidth="2.2" strokeLinejoin="round">
            <path d="M52 80 L38 18 L98 56 Z" fill={`url(#${id('ear')})`} />
            <path d="M148 80 L162 18 L102 56 Z" fill={`url(#${id('ear')})`} />
          </g>
          <g fill={`url(#${id('earIn')})`}>
            <path d="M54 68 L46 33 L82 55 Z" />
            <path d="M146 68 L154 33 L118 55 Z" />
          </g>

          {/* Capa 4: cabeza con volumen */}
          <circle cx="100" cy="106" r="62" fill={`url(#${id('head')})`} />
          <circle cx="100" cy="106" r="62" fill={`url(#${id('face')})`} />
          <circle
            cx="100"
            cy="106"
            r="62"
            fill="none"
            stroke={`url(#${id('rim')})`}
            strokeWidth="2.4"
          />
          {/* Segundo contorno interior, muy tenue: da sensación de grosor */}
          <circle
            cx="100"
            cy="106"
            r="57.5"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
          {/* Brillo superior (reflejo de luz) */}
          <path
            d="M56 90 Q100 56 144 90"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.14"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Mechones laterales */}
          <g fill="none" stroke={LINE} strokeOpacity="0.28" strokeWidth="1.4" strokeLinecap="round">
            <path d="M46 118 Q52 122 50 130" />
            <path d="M43 128 Q50 132 48 140" />
            <path d="M154 118 Q148 122 150 130" />
            <path d="M157 128 Q150 132 152 140" />
          </g>
          {/* Mejillas con un toque de color */}
          <ellipse cx="66" cy="136" rx="9" ry="4.5" fill={VIOLET} fillOpacity="0.22" />
          <ellipse cx="134" cy="136" rx="9" ry="4.5" fill={VIOLET} fillOpacity="0.22" />

          {/* Capa 5: escudo violeta en la frente, con luz propia */}
          <g data-part="shield" filter={`url(#${id('glow')})`}>
            <path
              d="M100 60 L114 65.5 V80 C114 89 108 94 100 97.5 C92 94 86 89 86 80 V65.5 Z"
              fill={`url(#${id('shield')})`}
              fillOpacity="0.28"
              stroke={`url(#${id('shield')})`}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M100 70 L103 77 L100 87 L97 77 Z"
              fill="#EDE9FE"
              fillOpacity="0.85"
              stroke="none"
            />
          </g>

          {/* Capa 6: ojos */}
          <g className="creature-eye-group" data-part="eye-group">
            {state === 'feliz' ? (
              <g
                fill="none"
                stroke={EYE}
                strokeWidth="5"
                strokeLinecap="round"
                filter={`url(#${id('glow')})`}
              >
                <path d="M68 118 Q77 104 86 118" />
                <path d="M114 118 Q123 104 132 118" />
              </g>
            ) : (
              <g className="creature-eyes" data-part="eyes">
                <g filter={`url(#${id('glow')})`}>
                  <ellipse cx="77" cy="116" rx={eyeRx} ry={eyeRy} fill={`url(#${id('eye')})`} />
                  <ellipse cx="123" cy="116" rx={eyeRx} ry={eyeRy} fill={`url(#${id('eye')})`} />
                </g>
                {/* Pupila suave y dos reflejos: da profundidad y mirada */}
                <ellipse cx="78" cy="118" rx="4" ry="6.5" fill="#0369A1" fillOpacity="0.55" />
                <ellipse cx="124" cy="118" rx="4" ry="6.5" fill="#0369A1" fillOpacity="0.55" />
                <circle cx="73.5" cy="110" r="3.2" fill="#FFFFFF" fillOpacity="0.96" />
                <circle cx="119.5" cy="110" r="3.2" fill="#FFFFFF" fillOpacity="0.96" />
                <circle cx="81.5" cy="123" r="1.6" fill="#FFFFFF" fillOpacity="0.65" />
                <circle cx="127.5" cy="123" r="1.6" fill="#FFFFFF" fillOpacity="0.65" />
              </g>
            )}
          </g>

          {/* Capa 7: nariz y boca */}
          <path d="M97.5 133 H102.5 L100 136.5 Z" fill={EYE} fillOpacity="0.8" />
          {state === 'alerta' ? (
            <path d="M92 146 H108" stroke={EYE} strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : state === 'feliz' ? (
            <path
              d="M86 140 Q100 158 114 140"
              stroke={EYE}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <path
              d="M91 142 Q100 149 109 142"
              stroke={EYE}
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </svg>
    </div>
  )
}
