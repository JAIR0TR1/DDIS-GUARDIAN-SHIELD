import { useEffect, useId, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  AlertTriangle,
  CheckCheck,
  FlaskConical,
  RotateCcw,
  ScanSearch,
  Sparkles
} from 'lucide-react'
import { analyzeInputSchema, MAX_TEXT_LENGTH, type AnalysisOutcome } from '@shared/analysis'
import { findLinks } from '@domain/text'
import { transition } from '@design/motion'
import demoMessages from '@data/demo-messages.json'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Kbd } from '../components/ui/Kbd'
import { EmptyState } from '../components/ui/EmptyState'
import { ThreatResultCard } from '../components/ui/ThreatResultCard'
import { HighlightedText } from '../components/HighlightedText'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/cn'
import { reviewLabel } from '../lib/reviewLabel'

/** Tiempo mínimo que se muestra el escáner, para que se vea qué hace Nilo aunque sea instantáneo. */
const SCAN_MS = 1100

const SCAN_LOG = [
  'Buscando links y dominios…',
  'Comparando con marcas conocidas…',
  'Revisando urgencia y pedidos de claves…',
  'Calculando el riesgo…'
] as const

type Status = 'idle' | 'scanning' | 'done' | 'error'

export interface AnalyzerProps {
  variants: Variants
  /** Texto que viene de otra pantalla (p. ej. pegado en Inicio). */
  initialText: string
  reduced: boolean
  onAnalyzing: () => void
  onOutcome: (outcome: AnalysisOutcome) => void
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Un solo link sin más texto se registra como «link»; todo lo demás como texto. */
function detectSource(text: string): 'text' | 'link' {
  const links = findLinks(text.trim())
  return links.length === 1 && links[0].raw.length >= text.trim().length - 1 ? 'link' : 'text'
}

export function Analyzer({
  variants,
  initialText,
  reduced,
  onAnalyzing,
  onOutcome
}: AnalyzerProps): React.JSX.Element {
  const [text, setText] = useState(initialText)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<AnalysisOutcome | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const areaId = useId()
  const errorId = useId()

  useEffect(() => {
    if (status === 'idle') areaRef.current?.focus()
  }, [status])

  const run = async (value: string = text): Promise<void> => {
    const parsed = analyzeInputSchema.safeParse({ text: value, source: detectSource(value) })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa el mensaje')
      areaRef.current?.focus()
      return
    }
    setError(null)
    setStatus('scanning')
    onAnalyzing()
    try {
      const [result] = await Promise.all([
        window.guardian.analysis.run(parsed.data),
        reduced ? Promise.resolve() : sleep(SCAN_MS)
      ])
      setOutcome(result)
      setStatus('done')
      onOutcome(result)
    } catch (cause) {
      console.error('Falló el análisis', cause)
      setError('No pude analizar el mensaje. Inténtalo de nuevo.')
      setStatus('error')
    }
  }

  const reset = (): void => {
    setStatus('idle')
    setOutcome(null)
    setError(null)
    setText('')
  }

  const loadSample = (sample: string): void => {
    setText(sample)
    setError(null)
    areaRef.current?.focus()
  }

  const scanning = status === 'scanning'
  const result = outcome?.entry.result

  return (
    <>
      <motion.div variants={variants} className="col-span-12 lg:col-span-7">
        <GlassCard
          title="Mensaje a revisar"
          className="relative flex h-full flex-col overflow-hidden"
        >
          {status === 'idle' || status === 'error' ? (
            <>
              <label htmlFor={areaId} className="sr-only">
                Pega aquí el mensaje o link sospechoso
              </label>
              <textarea
                ref={areaRef}
                id={areaId}
                value={text}
                maxLength={MAX_TEXT_LENGTH}
                onChange={(e) => {
                  setText(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    void run()
                  }
                }}
                placeholder="Pega aquí el mensaje o link que te dio mala espina…"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="selectable min-h-[170px] flex-1 resize-none rounded-[12px] border border-white/12 bg-black/25 p-3.5 font-mono text-[13.5px] leading-relaxed text-text placeholder:text-text-subtle transition-[border-color,background-color] duration-[220ms] hover:border-white/20 focus:border-accent/60 aria-invalid:border-danger/60"
              />
              <div className="mt-1.5 flex min-h-5 items-center justify-between text-[12px]">
                <p id={errorId} role="alert" className="text-danger-text">
                  {error}
                </p>
                <p className="tabular font-mono text-text-subtle">
                  {text.length} / {MAX_TEXT_LENGTH}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void run()}
                  icon={<ScanSearch aria-hidden className="size-4" />}
                >
                  Analizar
                </Button>
                <span className="flex items-center gap-2 text-[12.5px] text-text-muted">
                  <Kbd keys="Ctrl+Enter" /> para analizar
                </span>
              </div>

              {/* Modo presentación: ejemplos listos, sin depender de internet. */}
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="hud-label mb-2.5 flex items-center gap-2">
                  <FlaskConical aria-hidden className="size-3.5" /> Modo presentación
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {demoMessages.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => loadSample(m.text)}
                      className="app-no-drag glass rounded-[12px] px-3 py-2.5 text-left transition-[transform,background-color] duration-[220ms] ease-[var(--ease-guardian)] hover:bg-white/10 active:scale-[0.98]"
                    >
                      <span className="block text-sm font-medium text-text">{m.label}</span>
                      <span className="block text-[12px] text-text-muted">{m.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <ScannedMessage
              text={outcome?.text ?? text}
              scanning={scanning}
              reduced={reduced}
              result={result}
              onReset={reset}
            />
          )}
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 lg:col-span-5">
        {status === 'error' ? (
          <GlassCard title="Resultado" className="h-full">
            <EmptyState
              tone="error"
              icon={<AlertTriangle aria-hidden className="size-5" />}
              title="No salió el análisis"
              description="Algo falló de mi lado. Tu mensaje sigue ahí: inténtalo otra vez."
              action={<Button onClick={() => void run()}>Reintentar</Button>}
            />
          </GlassCard>
        ) : scanning ? (
          <GlassCard title="Resultado" className="h-full">
            <ScanLog />
          </GlassCard>
        ) : outcome && result ? (
          <div className="flex flex-col gap-3">
            <ThreatResultCard result={result} title="Resultado" />
            <Gains outcome={outcome} />
          </div>
        ) : (
          <GlassCard title="Resultado" className="h-full">
            <EmptyState
              icon={<Sparkles aria-hidden className="size-5" />}
              title="Esperando tu mensaje"
              description="Pega algo sospechoso y Nilo lo revisa en segundos."
            />
          </GlassCard>
        )}
      </motion.div>
    </>
  )
}

function ScannedMessage({
  text,
  scanning,
  reduced,
  result,
  onReset
}: {
  text: string
  scanning: boolean
  reduced: boolean
  result: AnalysisOutcome['entry']['result'] | undefined
  onReset: () => void
}): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[170px] flex-1 overflow-hidden rounded-[12px] border border-white/12 bg-black/25 p-3.5">
        <HighlightedText
          text={text}
          signals={scanning ? [] : (result?.signals ?? [])}
          tone={result?.verdict ?? 'sospechoso'}
        />
        {scanning && !reduced && <RepeatingScan />}
      </div>
      <div className="mt-3 flex min-h-9 items-center justify-between">
        {scanning ? (
          <p className="hud-label flex items-center gap-2 !text-accent" role="status">
            <span className="pulse-dot size-1.5 text-accent" aria-hidden /> Escaneando…
          </p>
        ) : (
          <Button
            variant="secondary"
            onClick={onReset}
            icon={<RotateCcw aria-hidden className="size-4" />}
          >
            Analizar otro
          </Button>
        )}
      </div>
    </div>
  )
}

/** Rayo de escáner que cruza el mensaje en bucle mientras se analiza. */
function RepeatingScan(): React.JSX.Element {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-full"
      initial={{ y: '-100%' }}
      animate={{ y: '100%' }}
      transition={{ duration: 0.95, ease: 'linear', repeat: Infinity }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 55%, rgb(34 211 238 / 0.12) 90%, rgb(103 232 249 / 0.4) 100%)'
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-accent-strong"
        style={{ boxShadow: '0 0 12px 2px rgb(34 211 238 / 0.7)' }}
      />
    </motion.div>
  )
}

function ScanLog(): React.JSX.Element {
  return (
    <ul
      className="flex flex-col gap-2.5 py-2 font-mono text-[13px]"
      aria-label="Pasos del análisis"
    >
      {SCAN_LOG.map((line, i) => (
        <li
          key={line}
          className="log-line flex items-center gap-2.5 text-text-muted"
          style={{ animationDelay: `${i * 240}ms` }}
        >
          <span aria-hidden className="text-accent">
            ›
          </span>
          {line}
        </li>
      ))}
    </ul>
  )
}

function Gains({ outcome }: { outcome: AnalysisOutcome }): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transition.slow, delay: 0.35 }}
      className="glass flex flex-wrap items-center gap-2.5 rounded-[14px] px-4 py-3"
    >
      <span
        className={cn(
          'tabular font-display text-lg font-semibold',
          outcome.xpGained > 0 ? 'text-accent-strong' : 'text-text-muted'
        )}
      >
        +{outcome.xpGained} XP
      </span>
      {outcome.levelsGained > 0 && <Badge color="#F59E0B">¡Nivel {outcome.creature.level}!</Badge>}
      <Badge>{reviewLabel(outcome.entry)}</Badge>
      {outcome.notice && (
        <p className="flex w-full items-center gap-2 text-[13px] text-text-muted">
          <CheckCheck aria-hidden className="size-4 shrink-0" />
          {outcome.notice}
        </p>
      )}
    </motion.div>
  )
}
