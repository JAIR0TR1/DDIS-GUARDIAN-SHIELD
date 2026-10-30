import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { transition } from '@design/motion'
import { IconButton } from './IconButton'
import { ToastContext, type ToastApi, type ToastTone } from './toastContext'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

const toneStyle: Record<ToastTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-accent/40 text-accent-strong' },
  success: { icon: CheckCircle2, className: 'border-safe/45 text-safe' },
  error: { icon: AlertTriangle, className: 'border-danger/50 text-danger-text' }
}

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++
      setItems((all) => [...all.slice(-2), { id, tone, message }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3800)
    },
    [dismiss]
  )

  const api = useMemo<ToastApi>(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const { icon: Icon, className } = toneStyle[t.tone]
            return (
              <motion.div
                key={t.id}
                role={t.tone === 'error' ? 'alert' : 'status'}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={transition.base}
                className={cn(
                  'glass pointer-events-auto flex items-start gap-3 rounded-[14px] border p-3 text-sm text-text',
                  className
                )}
              >
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
                <p className="flex-1 text-text">{t.message}</p>
                <IconButton
                  label="Cerrar aviso"
                  onClick={() => dismiss(t.id)}
                  className="-m-1.5 size-8"
                >
                  <X aria-hidden className="size-4" />
                </IconButton>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
