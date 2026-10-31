import { CreatureView } from '../creature3d/CreatureView'
import { ReducedMotionContext } from '../lib/motionPref'

/**
 * SOLO DESARROLLO (hash #icon). Dibuja el icono de la app: Nilo 3D en una pose fija sobre una
 * placa cuadrada de 512 px. `scripts/make-icon.mjs` la captura y le aplica las esquinas redondeadas.
 */
export function IconStage(): React.JSX.Element {
  return (
    <div
      className="fixed left-0 top-0 z-[100] size-[512px] overflow-hidden"
      style={{
        background: 'radial-gradient(70% 60% at 50% 42%, #14304d 0%, #0a1829 55%, #05070d 100%)'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(45% 40% at 50% 45%, rgb(34 211 238 / 0.28), transparent 70%)'
        }}
      />
      {/* Pose fija (movimiento reducido): sin saludo ni animación, siempre la misma imagen. */}
      <ReducedMotionContext.Provider value={true}>
        <div className="absolute left-[26px] top-[34px] size-[460px]">
          <CreatureView size={460} state="reposo" greet={0} title="Icono de Nilo" />
        </div>
      </ReducedMotionContext.Provider>
    </div>
  )
}
