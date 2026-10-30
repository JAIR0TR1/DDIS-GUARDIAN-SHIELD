import { AlertTriangle, CheckCircle2, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { Verdict } from '@shared/threat'

/** Semáforo: etiqueta, icono y colores de cada veredicto. Nunca solo color. */
export const verdictMeta: Record<Verdict, { label: string; icon: LucideIcon; className: string }> =
  {
    seguro: {
      label: 'Seguro',
      icon: CheckCircle2,
      className: 'border-safe/45 bg-safe/12 text-safe'
    },
    sospechoso: {
      label: 'Sospechoso',
      icon: AlertTriangle,
      className: 'border-warn/45 bg-warn/12 text-warn'
    },
    peligroso: {
      label: 'Peligroso',
      icon: ShieldAlert,
      className: 'border-danger/50 bg-danger/14 text-danger-text'
    }
  }
