import { AlertTriangle, CheckCircle2, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { Verdict } from '@shared/threat'
import type { MessageKey } from '@shared/i18n'

/** Semáforo: etiqueta, icono y colores de cada veredicto. Nunca solo color. */
export const verdictMeta: Record<
  Verdict,
  { labelKey: MessageKey; icon: LucideIcon; className: string }
> = {
  seguro: {
    labelKey: 'verdict.seguro',
    icon: CheckCircle2,
    className: 'border-safe/45 bg-safe/12 text-safe'
  },
  sospechoso: {
    labelKey: 'verdict.sospechoso',
    icon: AlertTriangle,
    className: 'border-warn/45 bg-warn/12 text-warn'
  },
  peligroso: {
    labelKey: 'verdict.peligroso',
    icon: ShieldAlert,
    className: 'border-danger/50 bg-danger/14 text-danger-text'
  }
}
