import type { Transition, Variants } from 'framer-motion'

/** Curva y duraciones del lenguaje de movimiento (en segundos para Framer Motion). */
export const EASE = [0.22, 1, 0.36, 1] as const

export const duration = {
  fast: 0.12,
  base: 0.22,
  slow: 0.42,
  scene: 0.8
} as const

export const transition = {
  fast: { duration: duration.fast, ease: EASE },
  base: { duration: duration.base, ease: EASE },
  slow: { duration: duration.slow, ease: EASE },
  scene: { duration: duration.scene, ease: EASE }
} satisfies Record<string, Transition>

/** Cascada de paneles: 70 ms entre elementos (rango pedido: 60-80 ms). */
export const STAGGER = 0.07

export const panelContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } }
}

/** Entrada de panel: solo transform y opacity. */
export const panelItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: transition.slow }
}

/** Variante con desenfoque, válida SOLO en la entrada única A → B. */
export const panelItemBlur: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: transition.slow }
}

/** Versión sin desplazamiento ni desenfoque, para movimiento reducido (fundido simple). */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base } }
}
