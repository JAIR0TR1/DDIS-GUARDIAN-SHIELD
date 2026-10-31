import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Prop } from '@domain/gesture'

/** Objetos que flotan sobre la cabeza de Nilo y dicen de qué trata el mensaje. */
export interface Props {
  group: Group
  /** Muestra el objeto `prop` (con animación de aparición) o lo esconde. */
  update: (prop: Prop, age: number, t: number, live: number, dt: number) => void
  dispose: () => void
}

const GOLD = '#F4C95D'

/** Rebote al aparecer (easeOutBack). */
function popIn(x: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const k = Math.min(1, Math.max(0, x))
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
}

export function buildProps(): Props {
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const geo = <T extends BufferGeometry>(g: T): T => (geometries.push(g), g)
  const std = (
    color: string,
    extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}
  ): MeshStandardMaterial => {
    const m = new MeshStandardMaterial({ color, roughness: 0.45, ...extra })
    materials.push(m)
    return m
  }
  const glow = (color: string): MeshBasicMaterial => {
    const m = new MeshBasicMaterial({ color, toneMapped: false })
    materials.push(m)
    return m
  }
  const gold = std(GOLD, {
    metalness: 0.85,
    roughness: 0.3,
    emissive: '#7A5410',
    emissiveIntensity: 0.5
  })

  const group = new Group()
  group.position.set(0, 2.85, 0.2)
  const items = new Map<Prop, Group>()
  const add = (name: Prop, build: (g: Group) => void): void => {
    const g = new Group()
    build(g)
    g.visible = false
    group.add(g)
    items.set(name, g)
  }

  // Regalo: caja con moño y listón.
  add('regalo', (g) => {
    const mag = std('#E11D74', { emissive: '#5a0a2f', emissiveIntensity: 0.4 })
    g.add(new Mesh(geo(new BoxGeometry(0.7, 0.58, 0.7)), mag))
    g.add(new Mesh(geo(new BoxGeometry(0.14, 0.6, 0.72)), gold))
    g.add(new Mesh(geo(new BoxGeometry(0.72, 0.6, 0.14)), gold))
    for (const side of [-1, 1]) {
      const bow = new Mesh(geo(new SphereGeometry(0.15, 14, 14)), gold)
      bow.scale.set(1, 0.7, 0.7)
      bow.position.set(side * 0.13, 0.38, 0)
      g.add(bow)
    }
  })

  // Paquete: caja de cartón con cinta.
  add('paquete', (g) => {
    g.add(new Mesh(geo(new BoxGeometry(0.9, 0.62, 0.7)), std('#B98A55')))
    g.add(new Mesh(geo(new BoxGeometry(0.17, 0.64, 0.72)), std('#E9D8B0')))
    const label = new Mesh(geo(new PlaneGeometry(0.3, 0.2)), std('#F8FAFC'))
    label.position.set(0.22, 0.05, 0.361)
    g.add(label)
  })

  // Maletín: empleo.
  add('maletin', (g) => {
    g.add(new Mesh(geo(new RoundedBoxGeometry(0.95, 0.65, 0.3, 3, 0.07)), std('#7C4A21')))
    const handle = new Mesh(geo(new TorusGeometry(0.17, 0.035, 8, 20, Math.PI)), std('#3B2410'))
    handle.position.y = 0.32
    g.add(handle)
    const clasp = new Mesh(geo(new BoxGeometry(0.12, 0.1, 0.05)), gold)
    clasp.position.set(0, 0.12, 0.16)
    g.add(clasp)
  })

  // Moneda: dinero fácil. Gira de frente.
  add('moneda', (g) => {
    const coin = new Mesh(geo(new CylinderGeometry(0.42, 0.42, 0.08, 36)), gold)
    coin.rotation.x = Math.PI / 2
    g.add(coin)
    const ring = new Mesh(
      geo(new TorusGeometry(0.3, 0.025, 8, 32)),
      std('#B7791F', { metalness: 0.8 })
    )
    ring.position.z = 0.045
    g.add(ring)
    const mark = new Mesh(
      geo(new CapsuleGeometry(0.035, 0.28, 4, 8)),
      std('#B7791F', { metalness: 0.8 })
    )
    mark.position.z = 0.05
    g.add(mark)
  })

  // Teléfono: «cambié de número».
  add('telefono', (g) => {
    g.add(new Mesh(geo(new RoundedBoxGeometry(0.5, 0.9, 0.1, 3, 0.07)), std('#111827')))
    const screen = new Mesh(geo(new PlaneGeometry(0.4, 0.74)), glow('#5EEAF8'))
    screen.position.z = 0.055
    g.add(screen)
    const dot = new Mesh(geo(new SphereGeometry(0.035, 8, 8)), std('#111827'))
    dot.position.set(0, -0.37, 0.07)
    g.add(dot)
  })

  // Llave: te piden la clave o acceso.
  add('llave', (g) => {
    const head = new Mesh(geo(new TorusGeometry(0.22, 0.07, 10, 24)), gold)
    head.position.x = -0.3
    g.add(head)
    const shaft = new Mesh(geo(new BoxGeometry(0.62, 0.1, 0.1)), gold)
    shaft.position.x = 0.1
    g.add(shaft)
    for (const x of [0.28, 0.42]) {
      const tooth = new Mesh(geo(new BoxGeometry(0.1, 0.22, 0.1)), gold)
      tooth.position.set(x, -0.1, 0)
      g.add(tooth)
    }
  })

  // Banco: se hacen pasar por una marca o banco.
  add('banco', (g) => {
    const stone = std('#CBD5E1', { roughness: 0.6 })
    const base = new Mesh(geo(new BoxGeometry(1.0, 0.1, 0.5)), stone)
    base.position.y = -0.34
    g.add(base)
    for (const x of [-0.32, 0, 0.32]) {
      const column = new Mesh(geo(new CylinderGeometry(0.08, 0.08, 0.5, 14)), stone)
      column.position.set(x, -0.04, 0)
      g.add(column)
    }
    const slab = new Mesh(geo(new BoxGeometry(1.08, 0.08, 0.54)), stone)
    slab.position.y = 0.25
    g.add(slab)
    const roof = new Mesh(geo(new ConeGeometry(0.66, 0.3, 3)), stone)
    roof.rotation.y = Math.PI / 2
    roof.scale.z = 0.75
    roof.position.y = 0.44
    g.add(roof)
  })

  // Documento: comprobante falso.
  add('documento', (g) => {
    g.add(new Mesh(geo(new BoxGeometry(0.64, 0.84, 0.05)), std('#F8FAFC')))
    for (const [y, w] of [
      [0.28, 0.42],
      [0.12, 0.42],
      [-0.04, 0.32],
      [-0.2, 0.42]
    ]) {
      const line = new Mesh(geo(new BoxGeometry(w, 0.05, 0.02)), std('#94A3B8'))
      line.position.set(0, y, 0.035)
      g.add(line)
    }
  })

  // Check: todo bien.
  add('check', (g) => {
    const green = glow('#34D399')
    g.add(new Mesh(geo(new TorusGeometry(0.4, 0.06, 12, 36)), green))
    const mark = new CatmullRomCurve3([
      new Vector3(-0.19, 0.0, 0),
      new Vector3(-0.05, -0.15, 0),
      new Vector3(0.22, 0.17, 0)
    ])
    g.add(new Mesh(geo(new TubeGeometry(mark, 16, 0.06, 8, false)), green))
  })

  // Signo de interrogación: dudoso, sin un tema claro.
  add('interrogacion', (g) => {
    const amber = glow('#FBBF24')
    const hook = new Mesh(geo(new TorusGeometry(0.2, 0.07, 10, 28, Math.PI * 1.5)), amber)
    hook.rotation.z = Math.PI * 0.1
    hook.position.y = 0.2
    g.add(hook)
    const stem = new Mesh(geo(new CapsuleGeometry(0.07, 0.14, 4, 8)), amber)
    stem.position.set(0.0, -0.12, 0)
    g.add(stem)
    const dot = new Mesh(geo(new SphereGeometry(0.075, 10, 10)), amber)
    dot.position.y = -0.36
    g.add(dot)
  })

  let shown: Prop = 'ninguno'
  let shownSince = 0
  let scale = 0

  function update(prop: Prop, age: number, t: number, live: number, dt: number): void {
    if (prop !== shown) {
      shown = prop
      shownSince = t
    }
    items.forEach((item, name) => {
      item.visible = name === prop
    })
    // Aparece con rebote y se esconde encogiéndose.
    const target = prop === 'ninguno' ? 0 : 1
    const appear = prop === 'ninguno' ? 0 : popIn((t - shownSince) / 0.45)
    scale = MathUtils.lerp(scale, target === 0 ? 0 : appear, 1 - Math.exp(-18 * dt))
    group.scale.setScalar(Math.max(0.0001, scale) * 1.1)
    group.visible = scale > 0.01
    // Flota y gira despacio (la moneda gira de frente).
    group.position.y = 2.78 + Math.sin(t * 1.6) * 0.06 * live
    const spin = prop === 'moneda' ? age * 2.4 : Math.sin(t * 0.9) * 0.45
    group.rotation.y = live ? spin : 0
  }

  function dispose(): void {
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
  }

  return { group, update, dispose }
}
