import { motion, type Variants } from 'framer-motion'
import { Clock, ImageUp, Inbox, ScanSearch } from 'lucide-react'
import type { HistoryEntry } from '@shared/history'
import { excerpt } from '@shared/safeText'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Kbd } from '../components/ui/Kbd'
import { ThreatResultCard } from '../components/ui/ThreatResultCard'
import { verdictMeta } from '../components/ui/verdictMeta'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import type { Section } from '../components/ui/Sidebar'
import type { CreatureState } from '../creature/creatureState'
import { cn } from '../lib/cn'
import { relativeTime } from '../lib/relativeTime'

export interface HomeProps {
  greeting: string
  mood: CreatureState
  variants: Variants
  history: HistoryEntry[]
  onGo: (section: Section) => void
  /** Texto pegado en el panel «Analizar»: abre el analizador con ese texto. */
  onPasteText: (text: string) => void
  /** Atajo global configurado (se muestra junto al botón Analizar). */
  shortcut: string
}

const verdictColor = {
  seguro: 'text-safe',
  sospechoso: 'text-warn',
  peligroso: 'text-danger-text'
} as const

/** Inicio: última amenaza, panel para analizar e historial reciente. */
export function Home({
  greeting,
  mood,
  variants,
  history,
  onGo,
  onPasteText,
  shortcut
}: HomeProps): React.JSX.Element {
  const lastThreat = history[0] ?? null
  return (
    <>
      <motion.div variants={variants} className="col-span-12">
        <div className="glass flex items-center gap-4 rounded-[16px] px-4 py-3">
          <CreatureAvatar size={34} frame="badge" state={mood} title="Nilo" />
          <p className="text-[15px] text-text">{greeting}</p>
        </div>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-7">
        {lastThreat ? (
          <ThreatResultCard
            result={lastThreat.result}
            text={lastThreat.excerpt}
            className="h-full"
          />
        ) : (
          <GlassCard title="Última amenaza" className="h-full">
            <EmptyState
              icon={<Inbox aria-hidden className="size-5" />}
              title="Todo tranquilo por aquí"
              description="Cuando analices un mensaje, el resultado aparece acá con su semáforo."
              action={
                <Button variant="secondary" onClick={() => onGo('analizar')}>
                  Analizar un mensaje
                </Button>
              }
            />
          </GlassCard>
        )}
      </motion.div>

      <div className="col-span-12 flex flex-col gap-4 md:col-span-5">
        <motion.div variants={variants}>
          <GlassCard title="Analizar">
            <div
              role="button"
              tabIndex={0}
              aria-label="Pegar un mensaje para analizarlo"
              onClick={() => onGo('analizar')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onGo('analizar')
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                if (pasted.trim()) {
                  e.preventDefault()
                  onPasteText(pasted)
                }
              }}
              className="app-no-drag grid cursor-pointer place-items-center gap-2 rounded-[14px] border border-dashed border-accent/35 bg-accent/[0.04] px-4 py-7 text-center text-sm text-text-muted transition-[background-color,border-color] duration-[220ms] hover:border-accent/60 hover:bg-accent/[0.08]"
            >
              <ImageUp aria-hidden className="size-5 text-accent-strong" />
              Pega un mensaje o arrastra una captura
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                variant="primary"
                onClick={() => onGo('analizar')}
                icon={<ScanSearch aria-hidden className="size-4" />}
              >
                Analizar
              </Button>
              <Kbd keys={shortcut} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={variants} className="min-h-0 flex-1">
          <GlassCard title="Historial" className="h-full">
            {history.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <Clock aria-hidden className="size-4" />
                Aún no hay análisis. Empieza con el primero.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2.5">
                  {history.slice(0, 3).map((entry) => {
                    const meta = verdictMeta[entry.result.verdict]
                    const Icon = meta.icon
                    return (
                      <li key={entry.id} className="flex items-center gap-3 text-sm">
                        <Icon
                          aria-label={meta.label}
                          className={cn('size-[18px] shrink-0', verdictColor[entry.result.verdict])}
                        />
                        <span className="min-w-0 flex-1 truncate text-text">
                          {excerpt(entry.excerpt, 40)}
                        </span>
                        <span className="shrink-0 font-mono text-[12px] text-text-muted">
                          {relativeTime(entry.at)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <Button variant="ghost" className="mt-3 -ml-2" onClick={() => onGo('historial')}>
                  Ver todo
                </Button>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </>
  )
}
