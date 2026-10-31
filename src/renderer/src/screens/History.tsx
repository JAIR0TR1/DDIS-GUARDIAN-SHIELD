import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { History as HistoryIcon, Trash2 } from 'lucide-react'
import type { HistoryEntry } from '@shared/history'
import { excerpt } from '@shared/safeText'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ThreatResultCard } from '../components/ui/ThreatResultCard'
import { Badge } from '../components/ui/Badge'
import { verdictMeta } from '../components/ui/verdictMeta'
import { cn } from '../lib/cn'
import { relativeTime } from '../lib/relativeTime'
import { reviewLabel } from '../lib/reviewLabel'

export interface HistoryProps {
  variants: Variants
  history: HistoryEntry[]
  onClear: () => Promise<void>
  onGo: (section: 'analizar') => void
  /** Entrada que debe aparecer seleccionada al abrir (viene de la alerta flotante). */
  selectId?: string
}

const verdictColor = {
  seguro: 'text-safe',
  sospechoso: 'text-warn',
  peligroso: 'text-danger-text'
} as const

/** Historial local: lista a la izquierda, detalle a la derecha. */
export function History({
  variants,
  history,
  onClear,
  onGo,
  selectId
}: HistoryProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(selectId ?? null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (history.length === 0) {
    return (
      <motion.div variants={variants} className="col-span-12">
        <GlassCard title="Historial">
          <EmptyState
            icon={<HistoryIcon aria-hidden className="size-5" />}
            title="Aún no hay análisis"
            description="Cada mensaje que revises queda guardado acá, solo en tu computador."
            action={
              <Button variant="primary" onClick={() => onGo('analizar')}>
                Analizar un mensaje
              </Button>
            }
          />
        </GlassCard>
      </motion.div>
    )
  }

  const selected = history.find((h) => h.id === selectedId) ?? history[0]

  const clear = async (): Promise<void> => {
    setBusy(true)
    try {
      await onClear()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <motion.div variants={variants} className="col-span-12 lg:col-span-5">
        <GlassCard title="Historial" className="flex h-full flex-col">
          <ul className="-mx-2 flex flex-col gap-1" aria-label="Análisis anteriores">
            {history.map((entry) => {
              const meta = verdictMeta[entry.result.verdict]
              const Icon = meta.icon
              const active = entry.id === selected.id
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'app-no-drag flex w-full items-center gap-3 rounded-[12px] border border-transparent px-2.5 py-2 text-left text-sm',
                      'transition-[background-color,border-color] duration-[220ms] hover:bg-white/8',
                      active && 'border-accent/35 bg-accent/10'
                    )}
                  >
                    <Icon
                      aria-label={meta.label}
                      className={cn('size-[18px] shrink-0', verdictColor[entry.result.verdict])}
                    />
                    <span className="min-w-0 flex-1 truncate text-text">
                      {excerpt(entry.excerpt, 48)}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-text-muted">
                      {relativeTime(entry.at)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            {confirming ? (
              <>
                <span className="mr-auto text-[13px] text-text-muted">
                  ¿Borrar todo el historial?
                </span>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={() => void clear()} loading={busy}>
                  Sí, borrar
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setConfirming(true)}
                icon={<Trash2 aria-hidden className="size-4" />}
              >
                Borrar historial
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={variants} className="col-span-12 flex flex-col gap-3 lg:col-span-7">
        <ThreatResultCard result={selected.result} text={selected.excerpt} title="Detalle" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{new Date(selected.at).toLocaleString('es-CO')}</Badge>
          <Badge>{reviewLabel(selected)}</Badge>
          <Badge>
            {selected.source === 'link'
              ? 'Link'
              : selected.source === 'image'
                ? 'Captura'
                : 'Texto'}
          </Badge>
        </div>
      </motion.div>
    </>
  )
}
