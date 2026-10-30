import { motion } from 'framer-motion'
import { Creature, type CreatureProps } from '../../creature/Creature'
import { cn } from '../../lib/cn'
import { transition } from '@design/motion'

export interface CreatureAvatarProps extends Omit<CreatureProps, 'className'> {
  /** Lado en píxeles. */
  size: number
  /** 'hero': sin marco (estado Despertar). 'badge': círculo de vidrio (barra lateral, mensajes). */
  frame?: 'hero' | 'badge'
  /** Identificador compartido para que Framer Motion viaje la criatura entre pantallas. */
  layoutId?: string
  className?: string
}

/**
 * Criatura con tamaño y marco. Con `layoutId` es el elemento compartido de la transición A → B:
 * el mismo nodo se anima de grande y centrado a pequeño en la barra lateral.
 */
export function CreatureAvatar({
  size,
  frame = 'hero',
  layoutId,
  className,
  ...creature
}: CreatureAvatarProps): React.JSX.Element {
  return (
    <motion.div
      layoutId={layoutId}
      transition={transition.scene}
      style={{
        width: size,
        height: size,
        // En px: un padding en % se calcularía sobre el ancho del contenedor, no del avatar.
        padding: frame === 'badge' ? Math.round(size * 0.15) : undefined
      }}
      data-frame={frame}
      className={cn(
        'relative shrink-0',
        frame === 'badge' &&
          'rounded-full border border-accent/35 bg-[#07101c]/80 box-border shadow-[0_0_18px_rgb(34_211_238/0.18)]',
        className
      )}
    >
      <Creature {...creature} />
    </motion.div>
  )
}
