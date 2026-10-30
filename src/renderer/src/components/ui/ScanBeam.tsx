import { motion } from 'framer-motion'
import { EASE } from '@design/motion'

export interface ScanBeamProps {
  /** Se llama cuando la onda termina de recorrer el contenedor. */
  onComplete?: () => void
  /** Segundos que tarda en cruzar. */
  duration?: number
  /** Con movimiento reducido no se dibuja el rayo: se avisa de inmediato. */
  reduced?: boolean
}

/**
 * Onda de escaneo cian que barre el contenedor de arriba abajo.
 * El contenedor padre debe ser `relative` y tener `overflow-hidden`.
 */
export function ScanBeam({
  onComplete,
  duration = 0.9,
  reduced = false
}: ScanBeamProps): React.JSX.Element | null {
  if (reduced) {
    queueMicrotask(() => onComplete?.())
    return null
  }
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40"
      initial={{ y: '-100%' }}
      animate={{ y: '100%' }}
      transition={{ duration, ease: EASE }}
      onAnimationComplete={onComplete}
    >
      {/* Estela degradada que termina en una línea luminosa en el borde inferior. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 78%, rgb(34 211 238 / 0.08) 92%, rgb(103 232 249 / 0.35) 100%)'
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-accent-strong"
        style={{ boxShadow: '0 0 14px 2px rgb(34 211 238 / 0.7)' }}
      />
    </motion.div>
  )
}
