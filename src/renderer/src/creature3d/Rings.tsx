import { haloColors, type HaloState } from '@design/tokens'

/** Anillos concéntricos de escaneo que rodean a Nilo (estado Despertar). */
export function Rings({ halo }: { halo: HaloState }): React.JSX.Element {
  const color = haloColors[halo]
  return (
    <svg
      aria-hidden
      viewBox="-100 -100 200 200"
      className="creature pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <g fill="none" stroke={color} strokeLinecap="round">
        <circle className="creature-ring-fade" r="56" strokeOpacity="0.5" strokeWidth="0.7" />
        <circle
          data-ring="1"
          className="creature-ring"
          r="72"
          strokeOpacity="0.34"
          strokeWidth="0.7"
          strokeDasharray="2 8 40 10"
        />
        <circle
          data-ring="2"
          className="creature-ring"
          r="88"
          strokeOpacity="0.2"
          strokeWidth="0.7"
          strokeDasharray="3 14 80 16"
        />
      </g>
    </svg>
  )
}
