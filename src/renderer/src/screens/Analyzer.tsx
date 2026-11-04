import { useEffect, useId, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  AlertTriangle,
  CheckCheck,
  FlaskConical,
  ImagePlus,
  ImageUp,
  RotateCcw,
  ScanSearch
} from 'lucide-react'
import { analyzeInputSchema, MAX_TEXT_LENGTH, type AnalysisOutcome } from '@shared/analysis'
import { IMAGE_TYPES, type AnalyzeImageInput } from '@shared/image'
import { findLinks } from '@domain/text'
import { preReaction, type Gesture } from '@domain/gesture'
import type { Verdict } from '@shared/threat'
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
import { verdictMeta } from '../components/ui/verdictMeta'
import { reviewLabel } from '../lib/reviewLabel'
import { useT } from '../lib/i18n'
import { localizeText } from '@shared/i18n/localize'
import type { MessageKey } from '@shared/i18n'
import { firstImage, readImageFile } from '../lib/imageFile'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import type { CreatureState } from '../creature/creatureState'

/** Texto mínimo para que Nilo lo «lea» en vivo, y cuánto esperar tras la última tecla. */
const MIN_PEEK_LENGTH = 12
const PEEK_DELAY_MS = 450

/** Tiempo mínimo que se muestra el escáner, para que se vea qué hace Nilo aunque sea instantáneo. */
const SCAN_MS = 1100

const SCAN_LOG: readonly MessageKey[] = [
  'analyzer.scan.links',
  'analyzer.scan.brands',
  'analyzer.scan.urgency',
  'analyzer.scan.risk'
]

type Status = 'idle' | 'scanning' | 'done' | 'error'

export interface AnalyzerProps {
  variants: Variants
  /** Texto que viene de otra pantalla (p. ej. pegado en Inicio). */
  initialText: string
  /** Captura que viene de otra pantalla (p. ej. soltada sobre Inicio): se analiza al abrir. */
  initialFile: File | null
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
  initialFile,
  reduced,
  onAnalyzing,
  onOutcome
}: AnalyzerProps): React.JSX.Element {
  const t = useT()
  const [text, setText] = useState(initialText)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  // Una captura puede traer varios mensajes: un resultado por cada uno, y cuál se está viendo.
  const [outcomes, setOutcomes] = useState<AnalysisOutcome[]>([])
  const [selected, setSelected] = useState(0)
  const outcome = outcomes[selected] ?? null
  /** Captura en análisis: la imagen (para mostrarla) y lo que se envió (para reintentar). */
  const [image, setImage] = useState<{ preview: string; input: AnalyzeImageInput } | null>(null)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const areaId = useId()
  const errorId = useId()

  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'idle') areaRef.current?.focus()
    // Al terminar, el foco pasa al resultado (antes quedaba en el cuerpo de la página): con
    // teclado se sigue desde ahí y el lector de pantalla lo anuncia.
    if (status === 'done') resultRef.current?.focus()
    if (status === 'error') resultRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [status])

  /** Analiza una captura ya leída. Si falla, deja un mensaje amable y permite reintentar. */
  const runImage = async (input: AnalyzeImageInput, preview: string): Promise<void> => {
    setImage({ preview, input })
    setError(null)
    setStatus('scanning')
    onAnalyzing()
    try {
      const [response] = await Promise.all([
        window.guardian.analysis.runImage(input),
        reduced ? Promise.resolve() : sleep(SCAN_MS)
      ])
      if (!response.ok) {
        setError(localizeText(response.message, t))
        setStatus('error')
        return
      }
      setOutcomes(response.outcomes)
      setSelected(worstIndex(response.outcomes))
      setStatus('done')
      // Se informan del menos al más grave: Nilo y el fondo terminan reaccionando al peor.
      for (const item of bySeverity(response.outcomes)) onOutcome(item)
    } catch (cause) {
      console.error('Falló el análisis de la captura', cause)
      setError(t('analyzer.imageFailed'))
      setStatus('error')
    }
  }

  const analyzeFile = async (file: File): Promise<void> => {
    const read = await readImageFile(file)
    if (!read.ok) {
      setError(read.message)
      setStatus('idle')
      return
    }
    await runImage(read.input, read.preview)
  }

  // Una captura que llega desde Inicio se analiza al abrir (de forma asíncrona, no dentro del efecto).
  useEffect(() => {
    if (!initialFile) return
    const timer = window.setTimeout(() => void analyzeFile(initialFile), 0)
    return () => window.clearTimeout(timer)
    // Solo al abrir con ese archivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile])

  // Primer vistazo en vivo: cuando hay texto, Nilo lo lee y reacciona con las reglas locales
  // (sin IA, sin costo, sin guardar nada). Solo se actualiza cuando dejas de escribir.
  const [peeked, setPeeked] = useState<{ forText: string; verdict: Verdict } | null>(null)
  const typed = text.trim()
  useEffect(() => {
    if (status !== 'idle' || typed.length < MIN_PEEK_LENGTH) return
    const timer = window.setTimeout(() => {
      window.guardian.analysis
        .peek(typed)
        .then((r) => setPeeked({ forText: typed, verdict: r.verdict }))
        .catch(() => undefined) // el primer vistazo es opcional: si falla, no se muestra nada
    }, PEEK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [typed, status])
  const reading = status === 'idle' && typed.length >= MIN_PEEK_LENGTH
  const peek = reading && peeked?.forText === typed ? preReaction(peeked.verdict) : null
  const liveReaction: { mood: CreatureState; bubble: string } = peek ?? {
    mood: 'reposo',
    bubble: reading ? t('analyzer.bubble.reading') : t('analyzer.bubble.idle')
  }

  const canDrop = status === 'idle' || status === 'error'
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!canDrop || !e.dataTransfer.types.includes('Files')) return
      e.preventDefault()
      setDragging(true)
    },
    onDragOver: (e: React.DragEvent) => {
      if (!canDrop || !e.dataTransfer.types.includes('Files')) return
      e.preventDefault() // sin esto el navegador no permite soltar
    },
    onDragLeave: (e: React.DragEvent) => {
      // Ignora los «leave» que ocurren al pasar sobre elementos hijos.
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
    },
    onDrop: (e: React.DragEvent) => {
      if (!canDrop) return
      e.preventDefault()
      setDragging(false)
      const file = firstImage(e.dataTransfer.files)
      if (file) void analyzeFile(file)
    }
  }

  const run = async (value: string = text): Promise<void> => {
    const parsed = analyzeInputSchema.safeParse({ text: value, source: detectSource(value) })
    if (!parsed.success) {
      setError(value.trim() ? t('analyzer.checkMessage') : t('analyzer.empty'))
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
      setOutcomes([result])
      setSelected(0)
      setStatus('done')
      onOutcome(result)
    } catch (cause) {
      console.error('Falló el análisis', cause)
      setError(t('analyzer.textFailed'))
      setStatus('error')
    }
  }

  const reset = (): void => {
    setStatus('idle')
    setOutcomes([])
    setSelected(0)
    setError(null)
    setImage(null)
    setText('')
  }

  /** Reintenta lo último que se intentó: la captura, o el texto. */
  const retry = (): void => {
    if (image) void runImage(image.input, image.preview)
    else void run()
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
          title={t('analyzer.card.title')}
          className="relative flex h-full flex-col overflow-hidden"
          {...dropHandlers}
        >
          {/* Estado visual al arrastrar una captura sobre la tarjeta. */}
          {dragging && (
            <div
              role="status"
              className="absolute inset-3 z-20 grid place-items-center rounded-[16px] border-2 border-dashed border-accent bg-[var(--surface-solid)]/[0.97] text-center shadow-[0_0_32px_rgb(34_211_238/0.25)]"
            >
              <div className="flex flex-col items-center gap-2">
                <ImageUp aria-hidden className="size-8 text-accent-strong" />
                <p className="font-display text-lg font-semibold text-text">
                  {t('analyzer.drop.title')}
                </p>
                <p className="text-[13px] text-text-muted">{t('analyzer.drop.hint')}</p>
              </div>
            </div>
          )}
          {status === 'idle' || status === 'error' ? (
            <>
              <label htmlFor={areaId} className="sr-only">
                {t('analyzer.label')}
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
                onPaste={(e) => {
                  // Pegar una captura (Ctrl+V con una imagen copiada) también funciona.
                  const file = firstImage(e.clipboardData.files)
                  if (file) {
                    e.preventDefault()
                    void analyzeFile(file)
                  }
                }}
                placeholder={t('analyzer.placeholder')}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="selectable min-h-[170px] flex-1 resize-none rounded-[12px] border border-white/12 bg-[var(--field-bg)] p-3.5 font-mono text-[13.5px] leading-relaxed text-text placeholder:text-text-subtle transition-[border-color,background-color] duration-[220ms] hover:border-white/20 focus:border-accent/60 aria-invalid:border-danger/60"
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
                  {t('analyzer.analyze')}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => fileRef.current?.click()}
                  icon={<ImagePlus aria-hidden className="size-4" />}
                >
                  {t('analyzer.pickImage')}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t('analyzer.pickImage.aria')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = '' // permite elegir la misma imagen otra vez
                    if (file) void analyzeFile(file)
                  }}
                />
                <span className="ml-auto flex items-center gap-2 text-[12.5px] text-text-muted">
                  <Kbd keys="Ctrl+Enter" /> {t('analyzer.toAnalyze')}
                </span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-text-subtle">
                {t('analyzer.imageNote')}
              </p>

              {/* Modo presentación: ejemplos listos, sin depender de internet. */}
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="hud-label mb-2.5 flex items-center gap-2">
                  <FlaskConical aria-hidden className="size-3.5" /> {t('analyzer.presentation')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {demoMessages.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => loadSample(m.text)}
                      className="app-no-drag glass rounded-[12px] px-3 py-2.5 text-left transition-[transform,background-color] duration-[220ms] ease-[var(--ease-guardian)] hover:bg-white/10 active:scale-[0.98]"
                    >
                      <span className="block text-sm font-medium text-text">
                        {t(`analyzer.demo.${m.id}.label` as MessageKey)}
                      </span>
                      <span className="block text-[12px] text-text-muted">
                        {t(`analyzer.demo.${m.id}.hint` as MessageKey)}
                      </span>
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
              preview={image?.preview}
              onReset={reset}
            />
          )}
        </GlassCard>
      </motion.div>

      <motion.div
        ref={resultRef}
        variants={variants}
        tabIndex={-1}
        aria-label={t('analyzer.result')}
        className="col-span-12 rounded-[24px] lg:col-span-5"
      >
        {status === 'error' ? (
          <GlassCard title={t('analyzer.result')} className="h-full">
            <EmptyState
              tone="error"
              icon={<AlertTriangle aria-hidden className="size-5" />}
              title={t('analyzer.failed.title')}
              description={error ?? t('analyzer.failed.body')}
              action={<Button onClick={retry}>{t('analyzer.retry')}</Button>}
            />
          </GlassCard>
        ) : scanning ? (
          <GlassCard title={t('analyzer.result')} className="h-full">
            <NiloStage mood="escaneando" gesture="ninguno" bubble="" />
            <ScanLog />
          </GlassCard>
        ) : outcome && result ? (
          <div className="flex flex-col gap-3">
            {outcomes.length > 1 && (
              <MessageTabs outcomes={outcomes} selected={selected} onSelect={setSelected} />
            )}
            <ThreatResultCard
              result={result}
              title={t('analyzer.result')}
              reactionKey={outcome.entry.id}
            />
            <Gains outcome={outcome} />
          </div>
        ) : (
          <GlassCard title="Nilo" className="h-full">
            <NiloStage
              mood={liveReaction.mood}
              gesture={reading ? 'leer' : 'ninguno'}
              bubble={liveReaction.bubble}
            />
          </GlassCard>
        )}
      </motion.div>
    </>
  )
}

/**
 * Nilo en grande dentro del panel de resultado. Mientras escribes o pegas, lo lee y reacciona
 * (esto es solo un primer vistazo con las reglas locales; el resultado completo llega al analizar).
 */
function NiloStage({
  mood,
  gesture,
  bubble
}: {
  mood: CreatureState
  gesture: Gesture
  bubble: string
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 pb-2 pt-1">
      <CreatureAvatar size={190} state={mood} gesture={gesture} gestureKey="leer" title="Nilo" />
      {bubble && (
        <p
          aria-live="polite"
          className="glass max-w-[320px] rounded-[16px] rounded-tl-[4px] px-4 py-2.5 text-center text-sm text-text"
        >
          {bubble}
        </p>
      )}
    </div>
  )
}

function ScannedMessage({
  text,
  scanning,
  reduced,
  result,
  preview,
  onReset
}: {
  text: string
  scanning: boolean
  reduced: boolean
  result: AnalysisOutcome['entry']['result'] | undefined
  /** Captura analizada (data URL). Solo cuando el análisis es de una imagen. */
  preview: string | undefined
  onReset: () => void
}): React.JSX.Element {
  const t = useT()
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[170px] flex-1 overflow-hidden rounded-[12px] border border-white/12 bg-black/25 p-3.5">
        {preview && (
          <img
            src={preview}
            alt={t('analyzer.imageAlt')}
            draggable={false}
            className="mb-3 max-h-40 w-auto max-w-full rounded-[10px] border border-white/10 object-contain"
          />
        )}
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
            <span className="pulse-dot size-1.5 text-accent" aria-hidden /> {t('analyzer.scanning')}
          </p>
        ) : (
          <Button
            variant="secondary"
            onClick={onReset}
            icon={<RotateCcw aria-hidden className="size-4" />}
          >
            {t('analyzer.another')}
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
  const t = useT()
  return (
    <ul
      className="flex flex-col gap-2.5 py-2 font-mono text-[13px]"
      aria-label={t('analyzer.scan.aria')}
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
          {t(line)}
        </li>
      ))}
    </ul>
  )
}

function Gains({ outcome }: { outcome: AnalysisOutcome }): React.JSX.Element {
  const t = useT()
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
      {outcome.levelsGained > 0 && (
        <Badge color="#F59E0B">{t('analyzer.levelBadge', { level: outcome.creature.level })}</Badge>
      )}
      <Badge>{reviewLabel(outcome.entry, t)}</Badge>
      {outcome.notice && (
        <p className="flex w-full items-center gap-2 text-[13px] text-text-muted">
          <CheckCheck aria-hidden className="size-4 shrink-0" />
          {localizeText(outcome.notice, t)}
        </p>
      )}
    </motion.div>
  )
}

const SEVERITY: Record<Verdict, number> = { seguro: 0, sospechoso: 1, peligroso: 2 }

/** Copia ordenada del menos al más grave. */
function bySeverity(list: readonly AnalysisOutcome[]): AnalysisOutcome[] {
  return [...list].sort(
    (a, b) => SEVERITY[a.entry.result.verdict] - SEVERITY[b.entry.result.verdict]
  )
}

/** Índice del mensaje más grave (el primero que se muestra). */
function worstIndex(list: readonly AnalysisOutcome[]): number {
  let worst = 0
  list.forEach((item, index) => {
    if (SEVERITY[item.entry.result.verdict] > SEVERITY[list[worst].entry.result.verdict]) {
      worst = index
    }
  })
  return worst
}

/** Resumen y pestañas cuando la captura trae varios mensajes. Flechas para moverse. */
function MessageTabs({
  outcomes,
  selected,
  onSelect
}: {
  outcomes: readonly AnalysisOutcome[]
  selected: number
  onSelect: (index: number) => void
}): React.JSX.Element {
  const t = useT()
  const counts = (['peligroso', 'sospechoso', 'seguro'] as const)
    .map((verdict) => ({
      verdict,
      n: outcomes.filter((o) => o.entry.result.verdict === verdict).length
    }))
    .filter((c) => c.n > 0)
  const move = (event: React.KeyboardEvent, index: number): void => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    onSelect((index + step + outcomes.length) % outcomes.length)
  }
  return (
    <div className="glass rounded-[16px] px-4 py-3">
      <p className="text-sm font-medium text-text">
        {t('analyzer.multi.summary', { n: outcomes.length })}
        <span className="text-text-muted">
          {' · '}
          {counts.map((c) => `${c.n} ${t(`verdict.${c.verdict}`).toLowerCase()}`).join(', ')}
        </span>
      </p>
      <div
        role="tablist"
        aria-label={t('analyzer.multi.aria')}
        className="mt-2.5 flex flex-wrap gap-2"
      >
        {outcomes.map((item, index) => {
          const meta = verdictMeta[item.entry.result.verdict]
          const Icon = meta.icon
          const active = index === selected
          return (
            <button
              key={item.entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => move(event, index)}
              className={cn(
                'app-no-drag inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-[13px] font-medium transition-[background-color,border-color] duration-[220ms]',
                active
                  ? meta.className
                  : 'border-white/12 bg-white/5 text-text-muted hover:bg-white/10'
              )}
            >
              <Icon aria-hidden className="size-4" />
              {t('analyzer.multi.tab', { n: index + 1 })}
            </button>
          )
        })}
      </div>
    </div>
  )
}
