import { motion } from 'framer-motion'
import type { CreatureProps } from '../../creature/Creature'
import { CreatureView } from '../../creature3d/CreatureView'
import type { Gesture, Prop } from '@domain/gesture'
import { cn } from '../../lib/cn'
import { transition } from '@design/motion'

export interface CreatureAvatarProps extends Omit<CreatureProps, 'className'> {
  /** Lado en píxeles. */
  size: number
  /** 'hero': sin marco (estado Despertar). 'badge': círculo de vidrio (barra lateral, mensajes). */
  frame?: 'hero' | 'badge'
  /** Identificador compartido para que Framer Motion viaje la criatura entre pantallas. */
  layoutId?: string
  /** Segundos de saludo (la mascota 3D saluda con la mano al aparecer). 0 = no saluda. */
  greet?: number
  /** Gesto de contexto: Nilo reacciona con el cuerpo a lo que se analizó. */
  gesture?: Gesture
  /** Objeto que flota sobre la cabeza y dice de qué trata el mensaje. */
  prop?: Prop
  /** Cambia para reiniciar el gesto (p. ej. el id del resultado). */
  gestureKey?: string | number
  className?: string
}

/**
 * Criatura con tamaño y marco. Con `layoutId` es el elemento compartido de la transición A → B:
 * el mismo nodo se anima de grande y centrado a pequeño en la barra lateral.
 * Por dentro, `CreatureView` decide entre 3D vivo, foto fija del modelo o SVG de respaldo.
 */
export function CreatureAvatar({
  size,
  frame = 'hero',
  layoutId,
  greet = 0,
  gesture,
  prop,
  gestureKey,
  className,
  state,
  halo,
  rings,
  title
}: CreatureAvatarProps): React.JSX.Element {
  return (
    <motion.div
      layoutId={layoutId}
      transition={transition.scene}
      style={{
        width: size,
        height: size,
        // En px: un padding en % se calcularía sobre el ancho del contenedor, no del avatar.
        padding: frame === 'badge' ? Math.round(size * 0.07) : undefined
      }}
      data-frame={frame}
      className={cn(
        'relative shrink-0',
        frame === 'badge' &&
          'box-border rounded-full border border-accent/35 bg-[#07101c]/80 shadow-[0_0_18px_rgb(34_211_238/0.18)]',
        className
      )}
    >
      <CreatureView
        size={size}
        state={state}
        halo={halo}
        rings={rings}
        greet={greet}
        gesture={gesture}
        prop={prop}
        gestureKey={gestureKey}
        title={title}
      />
    </motion.div>
  )
}
