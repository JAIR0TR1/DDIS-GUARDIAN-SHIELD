import { motion, type Variants } from 'framer-motion'
import {
  Clock,
  ImageUp,
  Inbox,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react'
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
import { firstImage } from '../lib/imageFile'
import { useT } from '../lib/i18n'

export interface HomeProps {
  greeting: string
  mood: CreatureState
  variants: Variants
  history: HistoryEntry[]
  onGo: (section: Section) => void
  /** Texto pegado en el panel «Analizar»: abre el analizador con ese texto. */
  onPasteText: (text: string) => void
  /** Captura soltada sobre el panel «Analizar»: abre el analizador y la revisa. */
  onDropImage: (file: File) => void
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
  onDropImage,
  shortcut
}: HomeProps): React.JSX.Element {
  const t = useT()
  const lastThreat = history[0] ?? null
  return (
    <>
      <motion.div variants={variants} className="col-span-12">
        <div className="glass flex items-center gap-4 rounded-[16px] px-4 py-3">
          <CreatureAvatar size={34} frame="badge" state={mood} title="Nilo" />
          <p className="text-[15px] text-text">{greeting}</p>
        </div>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 grid grid-cols-3 gap-4">
        <StatTile
          icon={ScanSearch}
          label={t('home.stats.analyzed')}
          value={history.length}
          tone="text-accent-strong"
        />
        <StatTile
          icon={ShieldAlert}
          label={t('home.stats.threats')}
          value={history.filter((h) => h.result.verdict === 'peligroso').length}
          tone="text-danger-text"
        />
        <StatTile
          icon={ShieldCheck}
          label={t('home.stats.safe')}
          value={history.filter((h) => h.result.verdict === 'seguro').length}
          tone="text-safe"
        />
      </motion.div>

      <motion.div variants={variants} className="col-span-12 md:col-span-7">
        {lastThreat ? (
          <ThreatResultCard
            result={lastThreat.result}
            text={lastThreat.excerpt}
            className="h-full"
          />
        ) : (
          <GlassCard title={t('home.lastThreat')} className="h-full">
            <EmptyState
              icon={<Inbox aria-hidden className="size-5" />}
              title={t('home.empty.title')}
              description={t('home.empty.body')}
              action={
                <Button variant="secondary" onClick={() => onGo('analizar')}>
                  {t('home.empty.action')}
                </Button>
              }
            />
          </GlassCard>
        )}
      </motion.div>

      <div className="col-span-12 flex flex-col gap-4 md:col-span-5">
        <motion.div variants={variants}>
          <GlassCard title={t('home.analyze')}>
            <div
              role="button"
              tabIndex={0}
              aria-label={t('home.dropAria')}
              onClick={() => onGo('analizar')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onGo('analizar')
                }
              }}
              onPaste={(e) => {
                const file = firstImage(e.clipboardData.files)
                if (file) {
                  e.preventDefault()
                  onDropImage(file)
                  return
                }
                const pasted = e.clipboardData.getData('text')
                if (pasted.trim()) {
                  e.preventDefault()
                  onPasteText(pasted)
                }
              }}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('Files')) e.preventDefault()
              }}
              onDrop={(e) => {
                const file = firstImage(e.dataTransfer.files)
                if (file) {
                  e.preventDefault()
                  onDropImage(file)
                }
              }}
              className="app-no-drag grid cursor-pointer place-items-center gap-2 rounded-[14px] border border-dashed border-accent/35 bg-accent/[0.04] px-4 py-7 text-center text-sm text-text-muted transition-[background-color,border-color] duration-[220ms] hover:border-accent/60 hover:bg-accent/[0.08]"
            >
              <ImageUp aria-hidden className="size-5 text-accent-strong" />
              {t('home.drop')}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                variant="primary"
                onClick={() => onGo('analizar')}
                icon={<ScanSearch aria-hidden className="size-4" />}
              >
                {t('home.analyze')}
              </Button>
              <Kbd keys={shortcut} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={variants} className="min-h-0 flex-1">
          <GlassCard title={t('home.history')} className="h-full">
            {history.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <Clock aria-hidden className="size-4" />
                {t('home.history.empty')}
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
                          aria-label={t(meta.labelKey)}
                          className={cn('size-[18px] shrink-0', verdictColor[entry.result.verdict])}
                        />
                        <span className="min-w-0 flex-1 truncate text-text">
                          {excerpt(entry.excerpt, 40)}
                        </span>
                        <span className="shrink-0 font-mono text-[12px] text-text-muted">
                          {relativeTime(entry.at, t)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <Button variant="ghost" className="mt-3 -ml-2" onClick={() => onGo('historial')}>
                  {t('home.history.all')}
                </Button>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </>
  )
}

/** Métrica del panel de Inicio: un número grande con su etiqueta y un icono de color. */
function StatTile({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon
  label: string
  value: number
  tone: string
}): React.JSX.Element {
  return (
    <div className="glass flex items-center gap-3.5 rounded-[16px] px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-white/10 bg-white/6">
        <Icon aria-hidden className={cn('size-5', tone)} />
      </span>
      <div className="min-w-0">
        <p className="tabular font-display text-[26px] font-semibold leading-none text-text">
          {value}
        </p>
        <p className="mt-1 truncate text-[12.5px] text-text-muted">{label}</p>
      </div>
    </div>
  )
}
