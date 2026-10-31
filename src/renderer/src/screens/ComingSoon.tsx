import { motion, type Variants } from 'framer-motion'
import { Hourglass } from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { EmptyState } from '../components/ui/EmptyState'

const copy = {
  analizar: {
    title: 'Analizar',
    heading: 'El analizador llega en la siguiente fase',
    text: 'Aquí vas a pegar mensajes y links para que Nilo los revise.'
  },
  historial: {
    title: 'Historial',
    heading: 'Sin historial todavía',
    text: 'Tus análisis van a quedar guardados acá, solo en tu computador.'
  }
} as const

export function ComingSoon({
  section,
  variants
}: {
  section: keyof typeof copy
  variants: Variants
}): React.JSX.Element {
  const { title, heading, text } = copy[section]
  return (
    <motion.div variants={variants} className="col-span-12">
      <GlassCard title={title}>
        <EmptyState
          icon={<Hourglass aria-hidden className="size-5" />}
          title={heading}
          description={text}
        />
      </GlassCard>
    </motion.div>
  )
}
