import { CreatureView } from '../creature3d/CreatureView'
import { ReducedMotionContext } from '../lib/motionPref'

/**
 * SOLO DESARROLLO (hash #icon y #icon-small). Dibuja el icono de la app sobre una placa cuadrada
 * de 512 px que `scripts/make-icon.mjs` captura y `scripts/finish-icon.cjs` convierte en .ico.
 *
 * - `full` (#icon): Nilo de cuerpo entero con gorra, cadena y tenis. Para 48 px o más.
 * - `small` (#icon-small): primer plano de la cara y la gorra sobre una placa más clara. A 16 y
 *   32 px el cuerpo entero se vuelve una mancha oscura que se pierde en la barra de tareas; en
 *   primer plano se leen la gorra (violeta) y los ojos (cian), que son lo que identifica a Nilo.
 */
export function IconStage({ variant }: { variant: 'full' | 'small' }): React.JSX.Element {
  const small = variant === 'small'
  return (
    <div
      className="fixed left-0 top-0 z-[100] size-[512px] overflow-hidden"
      style={{
        background: small
          ? 'radial-gradient(75% 70% at 50% 45%, #2b6f9c 0%, #17466b 55%, #0c2640 100%)'
          : 'radial-gradient(70% 60% at 50% 42%, #14304d 0%, #0a1829 55%, #05070d 100%)'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: small
            ? 'radial-gradient(48% 42% at 50% 52%, rgb(34 211 238 / 0.38), transparent 72%)'
            : 'radial-gradient(45% 40% at 50% 45%, rgb(34 211 238 / 0.28), transparent 70%)'
        }}
      />
      {/* Pose fija (movimiento reducido): sin saludo ni animación, siempre la misma imagen. */}
      <ReducedMotionContext.Provider value={true}>
        {small ? (
          <div className="absolute left-[-62px] top-[-124px] size-[700px]">
            <CreatureView size={700} state="reposo" greet={0} title="Icono de Nilo" />
          </div>
        ) : (
          <div className="absolute left-[26px] top-[34px] size-[460px]">
            <CreatureView size={460} state="reposo" greet={0} title="Icono de Nilo" />
          </div>
        )}
      </ReducedMotionContext.Provider>
    </div>
  )
}
