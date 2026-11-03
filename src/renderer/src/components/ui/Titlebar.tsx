import { useEffect, useState } from 'react'
import { Minus, Shield, Square, Copy, X } from 'lucide-react'
import { IconButton } from './IconButton'
import { useT } from '../../lib/i18n'

/** Barra de título propia: la ventana no tiene marco. El área libre arrastra la ventana. */
export function Titlebar(): React.JSX.Element {
  const t = useT()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let alive = true
    void window.guardian.window.isMaximized().then((m) => alive && setMaximized(m))
    const off = window.guardian.window.onMaximizedChange(setMaximized)
    return () => {
      alive = false
      off()
    }
  }, [])

  return (
    <header className="app-drag relative z-30 flex h-11 shrink-0 items-center justify-between border-b border-white/8 pl-4 pr-2">
      <div className="flex items-center gap-2.5">
        <Shield aria-hidden className="size-4 text-accent" />
        <span className="font-display text-[13px] font-medium text-text">Escudo Guardián</span>
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton
          label={t('titlebar.minimize')}
          onClick={() => window.guardian.window.minimize()}
        >
          <Minus aria-hidden className="size-4" />
        </IconButton>
        <IconButton
          label={maximized ? t('titlebar.restore') : t('titlebar.maximize')}
          onClick={() => window.guardian.window.toggleMaximize()}
        >
          {maximized ? (
            <Copy aria-hidden className="size-3.5" />
          ) : (
            <Square aria-hidden className="size-3.5" />
          )}
        </IconButton>
        <IconButton
          label={t('titlebar.close')}
          tone="danger"
          onClick={() => window.guardian.window.close()}
        >
          <X aria-hidden className="size-4" />
        </IconButton>
      </div>
    </header>
  )
}
