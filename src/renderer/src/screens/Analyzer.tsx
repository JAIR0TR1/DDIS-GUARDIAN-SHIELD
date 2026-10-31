import { useEffect, useId, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  AlertTriangle,
  CheckCheck,
  FlaskConical,
  ImagePlus,
  ImageUp,
  RotateCcw,
  ScanSearch,
  Sparkles
} from 'lucide-react'
import { analyzeInputSchema, MAX_TEXT_LENGTH, type AnalysisOutcome } from '@shared/analysis'
import { IMAGE_TYPES, type AnalyzeImageInput } from '@shared/image'
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
import { firstImage, readImageFile } from '../lib/imageFile'

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
  const [text, setText] = useState(initialText)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<AnalysisOutcome | null>(null)
  /** Captura en análisis: la imagen (para mostrarla) y lo que se envió (para reintentar). */
  const [image, setImage] = useState<{ preview: string; input: AnalyzeImageInput } | null>(null)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const areaId = useId()
  const errorId = useId()

  useEffect(() => {
    if (status === 'idle') areaRef.current?.focus()
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
        setError(response.message)
        setStatus('error')
        return
      }
      setOutcome(response.outcome)
      setStatus('done')
      onOutcome(response.outcome)
    } catch (cause) {
      console.error('Falló el análisis de la captura', cause)
      setError('No pude analizar la captura. Inténtalo de nuevo.')
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
          title="Mensaje a revisar"
          className="relative flex h-full flex-col overflow-hidden"
          {...dropHandlers}
        >
          {/* Estado visual al arrastrar una captura sobre la tarjeta. */}
          {dragging && (
            <div
              role="status"
              className="absolute inset-3 z-20 grid place-items-center rounded-[16px] border-2 border-dashed border-accent bg-[#06121c]/[0.97] text-center shadow-[0_0_32px_rgb(34_211_238/0.25)]"
            >
              <div className="flex flex-col items-center gap-2">
                <ImageUp aria-hidden className="size-8 text-accent-strong" />
                <p className="font-display text-lg font-semibold text-text">
                  Suelta la captura aquí
                </p>
                <p className="text-[13px] text-text-muted">PNG, JPG o WEBP, hasta 4 MB</p>
              </div>
            </div>
          )}
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
                onPaste={(e) => {
                  // Pegar una captura (Ctrl+V con una imagen copiada) también funciona.
                  const file = firstImage(e.clipboardData.files)
                  if (file) {
                    e.preventDefault()
                    void analyzeFile(file)
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
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => fileRef.current?.click()}
                  icon={<ImagePlus aria-hidden className="size-4" />}
                >
                  Elegir captura
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Elegir una captura de pantalla"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = '' // permite elegir la misma imagen otra vez
                    if (file) void analyzeFile(file)
                  }}
                />
                <span className="ml-auto flex items-center gap-2 text-[12.5px] text-text-muted">
                  <Kbd keys="Ctrl+Enter" /> para analizar
                </span>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-text-subtle">
                También puedes arrastrar una captura a esta tarjeta o pegarla con Ctrl+V. La imagen
                se envía a la IA de Google para leerla (en modo demo no se envía nada).
              </p>

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
              preview={image?.preview}
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
              description={
                error ?? 'Algo falló de mi lado. Tu mensaje sigue ahí: inténtalo otra vez.'
              }
              action={<Button onClick={retry}>Reintentar</Button>}
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
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[170px] flex-1 overflow-hidden rounded-[12px] border border-white/12 bg-black/25 p-3.5">
        {preview && (
          <img
            src={preview}
            alt="Captura que estás analizando"
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
