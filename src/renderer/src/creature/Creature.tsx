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

const SKIN = '#0A1424'
const SKIN_HI = '#0F2036'
const LINE = '#22D3EE'
const EYE = '#5EEAF8'
const VIOLET = '#8B5CF6'

/**
 * Nilo, el Guardián. SVG por capas: halo → anillos → orejas → cabeza → escudo → ojos → boca.
 * Cada parte lleva `data-part` para animarla con transform desde animations.css.
 */
export function Creature({
  state = 'reposo',
  halo,
  rings = false,
  className,
  title = 'Nilo, tu Guardián'
}: CreatureProps): React.JSX.Element {
  const uid = useId().replace(/:/g, '')
  const haloColor = haloColors[halo ?? defaultHalo[state]]
  const eyeRy = state === 'alerta' ? 15 : 13
  const eyeRx = state === 'alerta' ? 10 : 9

  return (
    <div
      className={`creature size-full ${className ?? ''}`}
      data-state={state}
      data-halo={halo ?? defaultHalo[state]}
    >
      <svg viewBox="14 4 172 172" role="img" aria-label={title} width="100%" height="100%">
        <title>{title}</title>
        <defs>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={haloColor} stopOpacity="0.5" />
            <stop offset="55%" stopColor={haloColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={haloColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`head-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKIN_HI} />
            <stop offset="100%" stopColor={SKIN} />
          </linearGradient>
          <radialGradient id={`eye-${uid}`} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#CFFAFE" />
            <stop offset="45%" stopColor={EYE} />
            <stop offset="100%" stopColor="#0EA5C4" />
          </radialGradient>
        </defs>

        {/* Capa 1: halo que respira */}
        <circle
          data-part="halo"
          className="creature-halo"
          cx="100"
          cy="104"
          r="150"
          fill={`url(#halo-${uid})`}
        />

        {/* Capa 2: anillos concéntricos de escaneo */}
        {rings && (
          <g fill="none" stroke={haloColor} strokeLinecap="round">
            <circle
              data-part="ring"
              className="creature-ring-fade"
              cx="100"
              cy="104"
              r="82"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <circle
              data-part="ring"
              data-ring="1"
              className="creature-ring"
              cx="100"
              cy="104"
              r="108"
              strokeOpacity="0.32"
              strokeWidth="1"
              strokeDasharray="2 10 60 14"
            />
            <circle
              data-part="ring"
              data-ring="2"
              className="creature-ring"
              cx="100"
              cy="104"
              r="138"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="4 18 120 22"
            />
          </g>
        )}

        <g data-part="body" className="creature-body">
          {/* Capa 3: orejas triangulares */}
          <g fill={SKIN} stroke={LINE} strokeWidth="2" strokeLinejoin="round">
            <path d="M52 78 L40 20 L96 56 Z" />
            <path d="M148 78 L160 20 L104 56 Z" />
          </g>
          <g fill={VIOLET} fillOpacity="0.22" stroke="none">
            <path d="M52 66 L47 38 L76 56 Z" />
            <path d="M148 66 L153 38 L124 56 Z" />
          </g>

          {/* Capa 4: cabeza */}
          <circle
            cx="100"
            cy="106"
            r="62"
            fill={`url(#head-${uid})`}
            stroke={LINE}
            strokeWidth="2.2"
          />
          <path
            d="M58 92 Q100 62 142 92"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.08"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Capa 5: escudo violeta en la frente */}
          <g data-part="shield">
            <path
              d="M100 62 L113 67 V80 C113 88 107 93 100 96 C93 93 87 88 87 80 V67 Z"
              fill={VIOLET}
              fillOpacity="0.16"
              stroke={VIOLET}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M100 71 V89"
              stroke={VIOLET}
              strokeOpacity="0.7"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>

          {/* Capa 6: ojos */}
          <g className="creature-eye-group" data-part="eye-group">
            {state === 'feliz' ? (
              <g fill="none" stroke={EYE} strokeWidth="5" strokeLinecap="round">
                <path d="M68 118 Q77 104 86 118" />
                <path d="M114 118 Q123 104 132 118" />
              </g>
            ) : (
              <g className="creature-eyes" data-part="eyes">
                <ellipse cx="77" cy="116" rx={eyeRx} ry={eyeRy} fill={`url(#eye-${uid})`} />
                <ellipse cx="123" cy="116" rx={eyeRx} ry={eyeRy} fill={`url(#eye-${uid})`} />
                <circle cx="73.5" cy="110.5" r="3" fill="#FFFFFF" fillOpacity="0.95" />
                <circle cx="119.5" cy="110.5" r="3" fill="#FFFFFF" fillOpacity="0.95" />
                <circle cx="81" cy="122" r="1.6" fill="#FFFFFF" fillOpacity="0.6" />
                <circle cx="127" cy="122" r="1.6" fill="#FFFFFF" fillOpacity="0.6" />
              </g>
            )}
          </g>

          {/* Capa 7: boca */}
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
