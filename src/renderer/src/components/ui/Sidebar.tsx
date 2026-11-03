import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  History,
  LayoutDashboard,
  PawPrint,
  ScanLine,
  Settings,
  Swords,
  type LucideIcon
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { transition } from '@design/motion'
import type { MessageKey } from '@shared/i18n'
import { useT } from '../../lib/i18n'

export type Section = 'inicio' | 'analizar' | 'historial' | 'criatura' | 'arena' | 'ajustes'

interface NavItem {
  id: Section
  labelKey: MessageKey
  icon: LucideIcon
}

const MAIN: NavItem[] = [
  { id: 'inicio', labelKey: 'nav.home', icon: LayoutDashboard },
  { id: 'analizar', labelKey: 'nav.analyze', icon: ScanLine },
  { id: 'historial', labelKey: 'nav.history', icon: History },
  { id: 'criatura', labelKey: 'nav.creature', icon: PawPrint },
  { id: 'arena', labelKey: 'nav.arena', icon: Swords }
]

const SETTINGS: NavItem = { id: 'ajustes', labelKey: 'nav.settings', icon: Settings }

export interface SidebarProps {
  current: Section
  onSelect: (section: Section) => void
  /** Hueco para la criatura (elemento compartido de la transición). */
  creatureSlot: ReactNode
}

function NavButton({
  item,
  active,
  onSelect
}: {
  item: NavItem
  active: boolean
  onSelect: (s: Section) => void
}): React.JSX.Element {
  const t = useT()
  const label = t(item.labelKey)
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
      onClick={() => onSelect(item.id)}
      className={cn(
        'app-no-drag relative grid size-11 place-items-center rounded-[14px] text-text-muted',
        'transition-[color,background-color,transform] duration-[220ms] ease-[var(--ease-guardian)]',
        'hover:bg-white/8 hover:text-text active:scale-95',
        active && 'text-accent-strong'
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={transition.base}
          className="absolute inset-0 rounded-[14px] border border-accent/45 bg-accent/12 shadow-[0_0_18px_rgb(34_211_238/0.18)]"
        />
      )}
      <Icon aria-hidden className="relative size-[22px]" strokeWidth={1.75} />
    </button>
  )
}

/** Barra lateral estrecha: criatura arriba, 4 secciones y Ajustes abajo. */
export function Sidebar({ current, onSelect, creatureSlot }: SidebarProps): React.JSX.Element {
  const t = useT()
  return (
    <nav
      aria-label={t('nav.label')}
      className="relative z-20 flex w-[72px] shrink-0 flex-col items-center border-r border-white/8 bg-white/[0.025] py-4"
    >
      <div className="mb-5">{creatureSlot}</div>
      <div className="flex flex-col items-center gap-1.5">
        {MAIN.map((item) => (
          <NavButton key={item.id} item={item} active={current === item.id} onSelect={onSelect} />
        ))}
      </div>
      <div className="mt-auto">
        <NavButton item={SETTINGS} active={current === 'ajustes'} onSelect={onSelect} />
      </div>
    </nav>
  )
}
