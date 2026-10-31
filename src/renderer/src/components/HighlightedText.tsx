import { Fragment, useMemo } from 'react'
import { findLinks } from '@domain/text'
import { neutralizeLinks } from '@shared/safeText'
import type { Signal } from '@shared/threat'
import { cn } from '../lib/cn'

type Range = [number, number]

/** Une rangos que se tocan y los ensancha para no partir un link por la mitad. */
function buildRanges(text: string, signals: readonly Signal[]): Range[] {
  const links = findLinks(text)
  const raw: Range[] = signals
    .flatMap((s) => s.spans ?? [])
    .map(([a, b]): Range => [Math.max(0, a), Math.min(text.length, b)])
    .filter(([a, b]) => b > a)

  // Si un resaltado toca un link, se extiende a todo el link.
  const expanded = raw.map(([a, b]): Range => {
    let start = a
    let end = b
    for (const link of links) {
      if (start < link.span[1] && link.span[0] < end) {
        start = Math.min(start, link.span[0])
        end = Math.max(end, link.span[1])
      }
    }
    return [start, end]
  })

  expanded.sort((x, y) => x[0] - y[0])
  const merged: Range[] = []
  for (const range of expanded) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return merged
}

const toneClass = {
  seguro: 'bg-safe/15 text-safe decoration-safe',
  sospechoso: 'bg-warn/15 text-warn decoration-warn',
  peligroso: 'bg-danger/20 text-danger-text decoration-danger'
} as const

export interface HighlightedTextProps {
  text: string
  signals: readonly Signal[]
  tone: keyof typeof toneClass
  className?: string
}

/**
 * Muestra el mensaje analizado como TEXTO PLANO (React lo escapa; nunca HTML) y resalta las
 * partes que dispararon las señales. Los links se muestran con el punto neutralizado y nunca
 * son clicables.
 */
export function HighlightedText({
  text,
  signals,
  tone,
  className
}: HighlightedTextProps): React.JSX.Element {
  const parts = useMemo(() => {
    const ranges = buildRanges(text, signals)
    const out: Array<{ value: string; marked: boolean }> = []
    let cursor = 0
    for (const [a, b] of ranges) {
      if (a > cursor) out.push({ value: text.slice(cursor, a), marked: false })
      out.push({ value: text.slice(a, b), marked: true })
      cursor = b
    }
    if (cursor < text.length) out.push({ value: text.slice(cursor), marked: false })
    return out
  }, [text, signals])

  return (
    <p
      className={cn(
        'selectable whitespace-pre-wrap break-words font-mono text-[13.5px] leading-relaxed text-text',
        className
      )}
    >
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part.marked ? (
            <mark
              className={cn(
                'highlight-in rounded-[4px] px-0.5 underline decoration-wavy decoration-1 underline-offset-[3px]',
                toneClass[tone]
              )}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              {neutralizeLinks(part.value)}
            </mark>
          ) : (
            neutralizeLinks(part.value)
          )}
        </Fragment>
      ))}
    </p>
  )
}
