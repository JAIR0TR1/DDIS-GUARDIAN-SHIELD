import { CreatureAvatar } from '../components/ui/CreatureAvatar'
import type { Gesture, Prop } from '@domain/gesture'
import type { CreatureState } from '../creature/creatureState'

const ITEMS: Array<{ gesture: Gesture; prop: Prop; state: CreatureState; when: string }> = [
  { gesture: 'celebrar', prop: 'check', state: 'feliz', when: 'todo bien' },
  { gesture: 'pensar', prop: 'interrogacion', state: 'escaneando', when: 'dudoso' },
  { gesture: 'negar', prop: 'regalo', state: 'alerta', when: 'premios y subsidios' },
  { gesture: 'alto', prop: 'paquete', state: 'alerta', when: 'paquete retenido' },
  { gesture: 'negar', prop: 'maletin', state: 'alerta', when: 'empleo falso' },
  { gesture: 'proteger', prop: 'moneda', state: 'alerta', when: 'dinero fácil' },
  { gesture: 'llamar', prop: 'telefono', state: 'alerta', when: '«cambié de número»' },
  { gesture: 'proteger', prop: 'llave', state: 'alerta', when: 'piden tu clave' },
  { gesture: 'proteger', prop: 'banco', state: 'alerta', when: 'marca o banco falso' },
  { gesture: 'alto', prop: 'documento', state: 'alerta', when: 'comprobante falso' }
]

/** SOLO DESARROLLO (hash #gestos): los gestos y objetos de Nilo juntos, para revisarlos de un vistazo. */
export function GestureStage(): React.JSX.Element {
  return (
    <div className="grid h-full grid-cols-5 content-center gap-x-1 gap-y-3 overflow-y-auto p-4">
      {ITEMS.map((item) => (
        <figure key={`${item.gesture}-${item.prop}`} className="flex flex-col items-center">
          <CreatureAvatar
            size={150}
            state={item.state}
            gesture={item.gesture}
            prop={item.prop}
            gestureKey={`${item.gesture}-${item.prop}`}
            title={`Nilo: ${item.gesture} con ${item.prop}`}
          />
          <figcaption className="text-center">
            <span className="hud-label !text-accent">
              {item.gesture} · {item.prop}
            </span>
            <span className="block text-[12px] text-text-muted">{item.when}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
