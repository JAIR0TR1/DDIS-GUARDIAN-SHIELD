import { useState } from 'react'
import type { HaloState } from '@design/tokens'
import type { Gesture, Prop } from '@domain/gesture'
import { Creature } from '../creature/Creature'
import { defaultHalo, type CreatureState } from '../creature/creatureState'
import { useReducedMotionPref } from '../lib/motionPref'
import { Mascot3D } from './Mascot3D'
import { webglAvailable } from './webgl'
import { mascotSnapshot } from './mascotSnapshot'
import { Rings } from './Rings'

export interface CreatureViewProps {
  /** Lado en px del contenedor: decide entre 3D vivo, foto fija o SVG. */
  size: number
  state?: CreatureState
  halo?: HaloState
  rings?: boolean
  /** Segundos de saludo al aparecer (0 = no saluda). */
  greet?: number
  /** Gesto de contexto. Solo lo hace el 3D vivo (en foto fija o SVG se ignora). */
  gesture?: Gesture
  /** Objeto flotante sobre la cabeza (solo 3D vivo). */
  prop?: Prop
  /** Cambia para reiniciar el gesto (p. ej. el id del resultado). */
  gestureKey?: string | number
  title?: string
}

/** Desde este tamaño, Nilo es 3D vivo; por debajo, una foto fija del mismo modelo. */
const LIVE_MIN_SIZE = 40

/**
 * Elige cómo dibujar a Nilo:
 *  - 3D vivo (Three.js) si el avatar es lo bastante grande;
 *  - foto fija del modelo 3D si es diminuto (un solo contexto WebGL compartido);
 *  - el dibujo SVG como respaldo si el equipo no soporta WebGL.
 */
export function CreatureView({
  size,
  state = 'reposo',
  halo,
  rings = false,
  greet = 0,
  gesture = 'ninguno',
  prop = 'ninguno',
  gestureKey,
  title = 'Nilo, tu Guardián'
}: CreatureViewProps): React.JSX.Element {
  const reduced = useReducedMotionPref()
  const [live3dFailed, setLive3dFailed] = useState(false)
  const haloState = halo ?? defaultHalo[state]
  const canUse3D = webglAvailable()

  if (canUse3D && size >= LIVE_MIN_SIZE && !live3dFailed) {
    return (
      <div className="relative size-full">
        {rings && <Rings halo={haloState} />}
        <Mascot3D
          state={state}
          halo={haloState}
          greetFor={reduced ? 0 : greet}
          gesture={reduced ? 'ninguno' : gesture}
          prop={reduced ? 'ninguno' : prop}
          gestureKey={gestureKey}
          animated={!reduced}
          onUnavailable={() => setLive3dFailed(true)}
          title={title}
        />
      </div>
    )
  }

  const photo = canUse3D ? mascotSnapshot(state, haloState) : null
  if (photo) {
    return <img src={photo} alt={title} draggable={false} className="size-full object-contain" />
  }

  return <Creature state={state} halo={halo} rings={rings} title={title} />
}
