import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import type { AlertPayload } from '@shared/alert'
import type { Verdict } from '@shared/threat'
import { transition } from '@design/motion'
import { contextFor } from '@domain/gesture'
import { Button } from '../components/ui/Button'
import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import { Kbd } from '../components/ui/Kbd'
import { VerdictBadge } from '../components/ui/Badge'
import { ReducedMotionContext } from '../lib/motionPref'
import type { CreatureState } from '../creature/creatureState'
import type { HaloState } from '@design/tokens'
import { cn } from '../lib/cn'

/** Evita que un Enter o Esc que estabas tecleando para otra cosa cierre o abra la alerta. */
const KEY_GUARD_MS = 700

const moodByVerdict: Record<Verdict, CreatureState> = {
  peligroso: 'alerta',
  sospechoso: 'escaneando',
  seguro: 'feliz'
}
const haloByVerdict: Record<Verdict, HaloState> = {
  peligroso: 'amenaza',
  sospechoso: 'duda',
  seguro: 'activo'
}
const scoreColor: Record<Verdict, string> = {
  seguro: 'text-safe',
  sospechoso: 'text-warn',
  peligroso: 'text-danger-text'
}

/** Tiempo tras el cual la alerta se retira sola si nadie la atiende. */
function autoDismissMs(payload: AlertPayload): number | null {
  if (payload.kind === 'empty') return 3500
  if (payload.kind === 'safe') return 4000
  if (payload.kind === 'error') return 6000
  if (payload.kind === 'result') {
    if (payload.entry.result.verdict === 'seguro') return 7000
    return payload.passive ? 25000 : null
  }
  return null
}

/**
 * Ventana flotante de alerta (estilo «launcher»). Se abre con el atajo global o cuando el
 * vigilante detecta algo. Enter abre el detalle; Esc la descarta.
 */
export function AlertApp(): React.JSX.Element {
  const [payload, setPayload] = useState<AlertPayload | null>(null)
  const [reduceSetting, setReduceSetting] = useState(false)
  const shownAt = useRef(0)
  const osReduced = useReducedMotion()

  useEffect(() => {
    const off = window.guardian.alert.onShow((next) => {
      shownAt.current = Date.now()
      setPayload(next)
      void window.guardian.data
        .getSettings()
        .then((s) => setReduceSetting(s.reduceMotion))
        .catch(() => undefined)
    })
    window.guardian.alert.ready()
    return off
  }, [])

  const dismiss = useCallback(() => window.guardian.alert.dismiss(), [])
  const openDetail = useCallback(() => {
    if (payload?.kind === 'result') window.guardian.alert.openDetail(payload.entry.id)
    else dismiss()
  }, [payload, dismiss])

  // Teclado: Esc descarta, Enter abre el detalle.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (Date.now() - shownAt.current < KEY_GUARD_MS) return
      if (event.key === 'Escape') {
        event.preventDefault()
        dismiss()
      } else if (event.key === 'Enter') {
        event.preventDefault()
        openDetail()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss, openDetail])

  // Se retira sola cuando corresponde.
  useEffect(() => {
    if (!payload) return
    const ms = autoDismissMs(payload)
    if (ms === null) return
    const timer = window.setTimeout(dismiss, ms)
    return () => window.clearTimeout(timer)
  }, [payload, dismiss])

  const reduced = reduceSetting || osReduced === true

  return (
    <ReducedMotionContext.Provider value={reduced}>
      <div className="grid h-screen w-screen place-items-center p-3">
        {payload && (
          <motion.section
            key={payload.kind === 'result' ? payload.entry.id : payload.kind}
            role="alertdialog"
            aria-labelledby="alert-title"
            initial={{ opacity: 0, y: reduced ? 0 : -14, scale: reduced ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={transition.base}
            className="glass relative flex h-full w-full items-center gap-5 rounded-[24px] bg-[#0a1220] px-6"
          >
            <AlertBody payload={payload} onDetail={openDetail} onDismiss={dismiss} />
          </motion.section>
        )}
      </div>
    </ReducedMotionContext.Provider>
  )
}

function AlertBody({
  payload,
  onDetail,
  onDismiss
}: {
  payload: AlertPayload
  onDetail: () => void
  onDismiss: () => void
}): React.JSX.Element {
  if (payload.kind === 'result') {
    const { result } = payload.entry
    const verdict = result.verdict
    const context = contextFor(result)
    return (
      <>
        <CreatureAvatar
          size={104}
          state={moodByVerdict[verdict]}
          gesture={context.gesture}
          prop={context.prop}
          gestureKey={payload.entry.id}
          halo={haloByVerdict[verdict]}
          title="Nilo"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <VerdictBadge verdict={verdict} />
            <p
              className={cn(
                'tabular font-display text-[34px] font-semibold leading-none',
                scoreColor[verdict]
              )}
              aria-label={`Puntaje de riesgo ${result.score} de 100`}
            >
              {result.score}
              <span className="text-base font-normal text-text-muted">/100</span>
            </p>
          </div>
          <h2 id="alert-title" className="mt-2.5 text-[15px] font-medium leading-snug text-text">
            {result.creatureMessage}
          </h2>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-text-muted">
            {result.recommendedAction}
          </p>
          <div className="mt-3.5 flex items-center gap-2.5">
            <Button
              variant="primary"
              onClick={onDetail}
              autoFocus
              className="min-h-9"
              aria-keyshortcuts="Enter"
            >
              Ver detalle <Kbd keys="Enter" onAccent className="ml-1" />
            </Button>
            <Button variant="ghost" onClick={onDismiss} aria-keyshortcuts="Escape">
              Descartar <Kbd keys="Esc" className="ml-1" />
            </Button>
            {payload.passive && (
              <span className="ml-auto text-[12px] text-text-subtle">Vigilante</span>
            )}
          </div>
        </div>
      </>
    )
  }

  const simple = {
    safe: {
      mood: 'feliz' as const,
      title: 'Revisé lo que copiaste',
      text: payload.kind === 'safe' ? `${payload.message} Riesgo: ${payload.score}/100.` : ''
    },
    scanning: {
      mood: 'escaneando' as const,
      title: 'Revisando lo que copiaste…',
      text: 'Un momento, Nilo está mirando el mensaje.'
    },
    empty: {
      mood: 'reposo' as const,
      title: 'No hay nada copiado',
      text: 'Copia un mensaje o un link sospechoso y vuelve a presionar el atajo.'
    },
    error: {
      mood: 'alerta' as const,
      title: 'Algo salió mal',
      text: payload.kind === 'error' ? payload.message : ''
    }
  }[payload.kind]

  return (
    <>
      <CreatureAvatar size={104} state={simple.mood} title="Nilo" />
      <div className="min-w-0 flex-1">
        <h2 id="alert-title" className="font-display text-lg font-semibold text-text">
          {simple.title}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{simple.text}</p>
        {payload.kind !== 'scanning' && (
          <div className="mt-3.5">
            <Button
              variant="ghost"
              onClick={onDismiss}
              autoFocus
              className="-ml-3"
              icon={<X aria-hidden className="size-4" />}
            >
              Cerrar <Kbd keys="Esc" className="ml-1" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
