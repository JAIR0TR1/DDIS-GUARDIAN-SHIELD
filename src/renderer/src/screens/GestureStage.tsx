import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import type { Gesture } from '@domain/gesture'
import type { CreatureState } from '../creature/creatureState'

const ITEMS: Array<{ gesture: Gesture; state: CreatureState; label: string; when: string }> = [
  { gesture: 'celebrar', state: 'feliz', label: 'celebrar', when: 'todo bien' },
  { gesture: 'pensar', state: 'escaneando', label: 'pensar', when: 'dudoso' },
  { gesture: 'alto', state: 'alerta', label: 'alto', when: 'presión o urgencia' },
  { gesture: 'proteger', state: 'alerta', label: 'proteger', when: 'piden claves / marca falsa' },
  { gesture: 'negar', state: 'alerta', label: 'negar', when: 'premios, empleo, dinero' },
  { gesture: 'llamar', state: 'alerta', label: 'llamar', when: '«cambié de número»' },
  { gesture: 'leer', state: 'escaneando', label: 'leer', when: 'lo que pegas' }
]

/** SOLO DESARROLLO (hash #gestos): los siete gestos de Nilo juntos, para revisarlos de un vistazo. */
export function GestureStage(): React.JSX.Element {
  return (
    <div className="grid h-full grid-cols-4 content-center gap-x-2 gap-y-5 overflow-y-auto p-6">
      {ITEMS.map((item) => (
        <figure key={item.gesture} className="flex flex-col items-center gap-1">
          <CreatureAvatar
            size={170}
            state={item.state}
            gesture={item.gesture}
            gestureKey={item.gesture}
            title={`Nilo: ${item.label}`}
          />
          <figcaption className="text-center">
            <span className="hud-label !text-accent">{item.label}</span>
            <span className="block text-[12px] text-text-muted">{item.when}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
