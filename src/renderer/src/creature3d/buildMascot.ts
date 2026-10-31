import {
  AdditiveBlending,
  AmbientLight,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { haloColors, type HaloState } from '@design/tokens'
import type { CreatureState } from '../creature/creatureState'

/** Datos de cada fotograma: los entrega el bucle de animación (o la foto fija). */
export interface Frame {
  /** Segundos desde que arrancó la escena. */
  t: number
  /** Segundos desde el fotograma anterior. */
  dt: number
  state: CreatureState
  halo: HaloState
  /** Segundos que lleva el saludo (0 = no está saludando, > 0 = saludando). */
  greetAge: number
  /** Duración del saludo en segundos. */
  greetFor: number
  /** Dónde mira el puntero, de -1 a 1 en cada eje. */
  look: { x: number; y: number }
  /** `false`: pose fija, sin movimiento (movimiento reducido y fotos fijas). */
  animated: boolean
}

export interface Mascot {
  scene: Scene
  camera: PerspectiveCamera
  update: (frame: Frame) => void
  dispose: () => void
}

const NAVY = '#1B3560'
const NAVY_DARK = '#07111F'
const CYAN = '#5EEAF8'
const VIOLET = '#8B5CF6'

function radialTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la textura del halo')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.3)')
  g.addColorStop(0.75, 'rgba(255,255,255,0.05)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function shieldShape(): Shape {
  const s = new Shape()
  s.moveTo(0, 0.55)
  s.lineTo(0.42, 0.4)
  s.lineTo(0.42, -0.05)
  s.bezierCurveTo(0.42, -0.35, 0.2, -0.5, 0, -0.62)
  s.bezierCurveTo(-0.2, -0.5, -0.42, -0.35, -0.42, -0.05)
  s.lineTo(-0.42, 0.4)
  s.closePath()
  return s
}

/** Amortiguación exponencial independiente de los fps. */
const damp = (current: number, target: number, rate: number, dt: number): number =>
  MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt))

/**
 * Nilo en 3D, 100 % procedural (sin archivos externos): cuerpo de bloque redondeado, orejas
 * piramidales, visor con ojos luminosos, escudo violeta, bracitos, patas y cola.
 */
export function buildMascot(): Mascot {
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const textures: Texture[] = []
  const track = <T extends BufferGeometry>(g: T): T => (geometries.push(g), g)
  const mat = <T extends Material>(m: T): T => (materials.push(m), m)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0.8, 9.3)
  camera.lookAt(0, 0.5, 0)

  // ---------- Luces ----------
  scene.add(new AmbientLight('#9bbcff', 0.8))
  const key = new DirectionalLight('#e6f3ff', 3)
  key.position.set(-3.5, 5, 6)
  scene.add(key)
  const rim = new DirectionalLight('#22d3ee', 3.4)
  rim.position.set(4, 2.5, -5)
  scene.add(rim)
  const violetFill = new PointLight(VIOLET, 18, 14)
  violetFill.position.set(-4, -1, 3)
  scene.add(violetFill)

  // ---------- Materiales ----------
  const body = mat(
    new MeshPhysicalMaterial({
      color: NAVY,
      roughness: 0.42,
      metalness: 0.2,
      clearcoat: 0.7,
      clearcoatRoughness: 0.35
    })
  )
  const visorMat = mat(
    new MeshStandardMaterial({ color: NAVY_DARK, roughness: 0.2, metalness: 0.5 })
  )
  const eyeMat = mat(new MeshBasicMaterial({ color: CYAN, toneMapped: false }))
  const whiteMat = mat(new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }))
  const violetGlow = mat(
    new MeshStandardMaterial({
      color: VIOLET,
      emissive: VIOLET,
      emissiveIntensity: 1.1,
      roughness: 0.3
    })
  )

  const root = new Group()
  scene.add(root)

  // ---------- Resplandor (halo) y suelo ----------
  const glowTexture = radialTexture()
  textures.push(glowTexture)
  const haloMat = mat(
    new MeshBasicMaterial({
      map: glowTexture,
      color: haloColors.activo,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false
    })
  )
  const halo = new Mesh(track(new PlaneGeometry(6, 6)), haloMat)
  halo.position.set(0, 0.3, -2)
  scene.add(halo)

  const floorMat = mat(
    new MeshBasicMaterial({
      map: glowTexture,
      color: haloColors.activo,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false
    })
  )
  const floor = new Mesh(track(new PlaneGeometry(4.6, 1.5)), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -1.3, 0.2)
  scene.add(floor)

  // ---------- Cuerpo ----------
  const bodyMesh = new Mesh(track(new RoundedBoxGeometry(2.7, 2.1, 1.9, 6, 0.5)), body)
  bodyMesh.position.y = 0.15
  root.add(bodyMesh)

  // Orejas: pirámides con interior violeta luminoso.
  const earGeo = track(new ConeGeometry(0.46, 0.85, 4))
  const earInGeo = track(new ConeGeometry(0.26, 0.55, 4))
  const ears: Group[] = []
  for (const side of [-1, 1]) {
    const ear = new Group()
    const outer = new Mesh(earGeo, body)
    outer.rotation.y = Math.PI / 4
    const inner = new Mesh(earInGeo, violetGlow)
    inner.rotation.y = Math.PI / 4
    inner.position.set(0, -0.08, 0.14)
    ear.add(outer, inner)
    // Las orejas asoman por encima de la gorra.
    ear.position.set(side * 0.88, 1.86, 0.05)
    ear.rotation.z = -side * 0.2
    root.add(ear)
    ears.push(ear)
  }

  // Visor: pantalla oscura donde viven los ojos.
  const visor = new Mesh(track(new RoundedBoxGeometry(2.15, 1.05, 0.14, 4, 0.16)), visorMat)
  visor.position.set(0, 0.22, 0.93)
  root.add(visor)

  // Ojos (cápsulas luminosas) y versión «feliz» (arcos).
  const eyeGeo = track(new CapsuleGeometry(0.17, 0.34, 6, 12))
  const eyes = new Group()
  eyes.position.set(0, 0.34, 1.02)
  for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeo, eyeMat)
    eye.position.x = side * 0.58
    const spark = new Mesh(track(new SphereGeometry(0.05, 10, 10)), whiteMat)
    spark.position.set(-0.05, 0.14, 0.14)
    eye.add(spark)
    eyes.add(eye)
  }
  root.add(eyes)

  const happyGeo = track(new TorusGeometry(0.2, 0.06, 8, 20, Math.PI))
  const happyEyes = new Group()
  happyEyes.position.set(0, 0.28, 1.02)
  for (const side of [-1, 1]) {
    const arc = new Mesh(happyGeo, eyeMat)
    arc.position.x = side * 0.58
    happyEyes.add(arc)
  }
  happyEyes.visible = false
  root.add(happyEyes)

  // Boca: sonrisa (arco hacia abajo) y línea recta para la alerta.
  const smileGeo = track(new TorusGeometry(0.2, 0.05, 8, 20, Math.PI))
  const smile = new Mesh(smileGeo, eyeMat)
  smile.rotation.z = Math.PI
  smile.position.set(0, 0.0, 1.02)
  root.add(smile)
  const flat = new Mesh(track(new CapsuleGeometry(0.04, 0.3, 4, 8)), eyeMat)
  flat.rotation.z = Math.PI / 2
  flat.position.set(0, -0.1, 1.02)
  flat.visible = false
  root.add(flat)

  // Escudo violeta en la frente.
  const shield = new Group()
  const shieldGeo = track(
    new ExtrudeGeometry(shieldShape(), {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 2
    })
  )
  shield.add(new Mesh(shieldGeo, violetGlow))
  const gem = new Mesh(track(new SphereGeometry(0.1, 10, 10)), whiteMat)
  gem.scale.set(0.7, 1.4, 0.5)
  gem.position.set(0, 0.04, 0.17)
  shield.add(gem)
  // El escudo es el logo de Nilo: va bordado en el frente de la gorra.
  shield.scale.setScalar(0.3)
  shield.position.set(0, 1.42, 0.93)
  shield.rotation.x = -0.38
  root.add(shield)

  // ---------- Gorra snapback (genérica, sin logos de marcas) ----------
  const capMat = mat(new MeshPhysicalMaterial({ color: '#5B21B6', roughness: 0.5, clearcoat: 0.4 }))
  const brimMat = mat(
    new MeshStandardMaterial({ color: '#19B8D1', roughness: 0.45, metalness: 0.1 })
  )
  const cap = new Group()
  const crown = new Mesh(
    track(new SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2)),
    capMat
  )
  crown.scale.set(1.14, 0.64, 1.0)
  crown.position.y = 1.18
  cap.add(crown)
  const band = new Mesh(track(new TorusGeometry(1.0, 0.045, 8, 48)), brimMat)
  band.rotation.x = Math.PI / 2
  band.scale.set(1.14, 1.0, 1.0)
  band.position.y = 1.2
  cap.add(band)
  const button = new Mesh(track(new SphereGeometry(0.1, 12, 12)), brimMat)
  button.position.set(0, 1.82, 0)
  cap.add(button)
  // Visera plana, un poco hacia abajo, que sobresale por el frente.
  const brim = new Mesh(
    track(new CylinderGeometry(1.02, 1.02, 0.07, 40, 1, false, -Math.PI / 2, Math.PI)),
    brimMat
  )
  brim.scale.set(1.12, 1, 0.82)
  brim.position.set(0, 1.2, 0.55)
  brim.rotation.x = 0.14
  cap.add(brim)
  // Un poco ladeada, con actitud.
  cap.rotation.z = -0.06
  root.add(cap)

  // ---------- Cadena dorada con dije ----------
  const goldMat = mat(
    new MeshStandardMaterial({
      color: '#F4C95D',
      metalness: 0.9,
      roughness: 0.3,
      emissive: '#7A5410',
      emissiveIntensity: 0.6
    })
  )
  const chainCurve = new CatmullRomCurve3([
    new Vector3(-0.62, -0.34, 0.99),
    new Vector3(-0.3, -0.55, 0.96),
    new Vector3(0, -0.63, 0.94),
    new Vector3(0.3, -0.55, 0.96),
    new Vector3(0.62, -0.34, 0.99)
  ])
  root.add(new Mesh(track(new TubeGeometry(chainCurve, 28, 0.035, 8, false)), goldMat))
  const pendant = new Group()
  pendant.position.set(0, -0.66, 0.95)
  pendant.add(new Mesh(track(new SphereGeometry(0.1, 14, 14)), goldMat))
  const pendantGem = new Mesh(track(new SphereGeometry(0.05, 10, 10)), violetGlow)
  pendantGem.position.z = 0.08
  pendant.add(pendantGem)
  root.add(pendant)

  // Bracitos con pivote en el hombro (el derecho del espectador saluda).
  const armGeo = track(new CapsuleGeometry(0.17, 0.5, 6, 12))
  const arms: Group[] = []
  for (const side of [-1, 1]) {
    const pivot = new Group()
    pivot.position.set(side * 1.42, 0.55, 0.1)
    const arm = new Mesh(armGeo, body)
    arm.position.y = -0.4
    const hand = new Mesh(track(new SphereGeometry(0.19, 12, 12)), body)
    hand.position.y = -0.78
    pivot.add(arm, hand)
    pivot.rotation.z = side * 0.18
    root.add(pivot)
    arms.push(pivot)
  }

  // Tenis deportivos (genéricos): suela con luz, cuerpo blanco, puntera, cordones y franja cian.
  const shoeWhite = mat(new MeshStandardMaterial({ color: '#F4F7FF', roughness: 0.5 }))
  const soleMat = mat(new MeshStandardMaterial({ color: '#DCE4F7', roughness: 0.6 }))
  const accent = mat(new MeshBasicMaterial({ color: CYAN, toneMapped: false }))
  const soleGeo = track(new RoundedBoxGeometry(0.62, 0.14, 1.0, 3, 0.06))
  const upperGeo = track(new RoundedBoxGeometry(0.54, 0.3, 0.78, 3, 0.13))
  const toeGeo = track(new RoundedBoxGeometry(0.5, 0.2, 0.36, 3, 0.1))
  const lacesGeo = track(new RoundedBoxGeometry(0.3, 0.03, 0.05, 2, 0.015))
  const glowStripGeo = track(new RoundedBoxGeometry(0.5, 0.03, 0.85, 2, 0.012))
  const feet: Group[] = []
  const makeSneaker = (side: number): Group => {
    const shoe = new Group()
    shoe.add(new Mesh(soleGeo, soleMat))
    const glowStrip = new Mesh(glowStripGeo, accent)
    glowStrip.position.y = -0.075
    shoe.add(glowStrip)
    const upper = new Mesh(upperGeo, shoeWhite)
    upper.position.set(0, 0.2, -0.06)
    shoe.add(upper)
    const toe = new Mesh(toeGeo, shoeWhite)
    toe.position.set(0, 0.13, 0.33)
    shoe.add(toe)
    for (const z of [-0.12, 0.02, 0.16]) {
      const lace = new Mesh(lacesGeo, accent)
      lace.position.set(0, 0.36, z)
      shoe.add(lace)
    }
    // Franja lateral curva (diseño propio, no es el logo de ninguna marca).
    const stripe = new CatmullRomCurve3([
      new Vector3(side * 0.275, 0.1, -0.3),
      new Vector3(side * 0.285, 0.2, -0.05),
      new Vector3(side * 0.27, 0.12, 0.25)
    ])
    shoe.add(new Mesh(track(new TubeGeometry(stripe, 12, 0.025, 6, false)), accent))
    return shoe
  }
  for (const x of [-0.8, 0.8]) {
    for (const z of [-0.45, 0.5]) {
      const shoe = makeSneaker(x < 0 ? -1 : 1)
      shoe.position.set(x, -1.19, z)
      root.add(shoe)
      feet.push(shoe)
    }
  }

  // Cola con punta violeta luminosa.
  const tail = new Group()
  tail.position.set(0, -0.35, -0.9)
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0, 0),
    new Vector3(0.05, 0.1, -0.6),
    new Vector3(0.45, 0.55, -0.95),
    new Vector3(0.55, 1.2, -0.85)
  ])
  tail.add(new Mesh(track(new TubeGeometry(curve, 24, 0.11, 8, false)), body))
  const tip = new Mesh(track(new SphereGeometry(0.15, 12, 12)), violetGlow)
  tip.position.copy(curve.getPoint(1))
  tail.add(tip)
  root.add(tail)

  // Plano de escaneo: un anillo que barre el cuerpo de abajo arriba.
  const scanRing = new Mesh(
    track(new TorusGeometry(2.05, 0.03, 8, 96)),
    mat(new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9, toneMapped: false }))
  )
  scanRing.rotation.x = Math.PI / 2
  scanRing.visible = false
  root.add(scanRing)

  // Chispas que orbitan (la «aura» del guardián).
  const orbGeo = track(new SphereGeometry(0.06, 8, 8))
  const orbs = Array.from({ length: 6 }, (_, i) => {
    const m = new Mesh(orbGeo, i % 2 === 0 ? eyeMat : violetGlow)
    scene.add(m)
    return {
      mesh: m,
      phase: (i / 6) * Math.PI * 2,
      radius: 2.3 + (i % 3) * 0.25,
      height: -0.6 + i * 0.4
    }
  })

  // ---------- Estado de animación ----------
  const eyeTarget = { sy: 1, sx: 1, shift: 0 }
  const eyeNow = { sy: 1, sx: 1, shift: 0 }
  const haloColor = new Color(haloColors.activo)
  let nextBlink = 2.2
  let blinkUntil = 0
  let lastState: CreatureState = 'reposo'
  let stateSince = 0
  let rotY = -0.28
  let rotX = 0
  let smoothArmR = 0.18
  let capLift = 0

  function update(f: Frame): void {
    const { t, dt, animated } = f
    if (f.state !== lastState) {
      lastState = f.state
      stateSince = t
    }
    const since = t - stateSince
    const live = animated ? 1 : 0

    // Color del halo (cian activo, ámbar duda, rojo amenaza, gris dormida).
    haloColor.lerp(new Color(haloColors[f.halo]), 1 - Math.exp(-6 * dt))
    haloMat.color.copy(haloColor)
    floorMat.color.copy(haloColor)
    haloMat.opacity = 0.5 + live * Math.sin(t * 1.4) * 0.08
    halo.scale.setScalar(1 + live * Math.sin(t * 1.4) * 0.03)

    // Parpadeo.
    if (animated && t > nextBlink) {
      blinkUntil = t + 0.13
      nextBlink = t + 2.6 + ((t * 7.3) % 2.4)
    }
    const blinking = t < blinkUntil

    // Ojos y boca según el estado.
    const happy = f.state === 'feliz'
    const alarmed = f.state === 'alerta'
    const scanning = f.state === 'escaneando'
    eyeTarget.sy = blinking ? 0.08 : alarmed ? 1.18 : 1
    eyeTarget.sx = alarmed ? 1.15 : 1
    eyeTarget.shift = scanning && animated ? Math.sin(t * 3) * 0.16 : f.look.x * 0.1
    eyeNow.sy = damp(eyeNow.sy, eyeTarget.sy, blinking ? 40 : 14, dt)
    eyeNow.sx = damp(eyeNow.sx, eyeTarget.sx, 12, dt)
    eyeNow.shift = damp(eyeNow.shift, eyeTarget.shift, 10, dt)
    eyes.visible = !happy
    happyEyes.visible = happy
    eyes.scale.set(eyeNow.sx, eyeNow.sy, 1)
    eyes.position.x = eyeNow.shift
    happyEyes.position.x = eyeNow.shift
    smile.visible = !alarmed
    flat.visible = alarmed
    smile.scale.setScalar(happy ? 1.3 : 1)
    smile.position.y = happy ? 0.02 : 0.0

    // Cuerpo: respiración, balanceo y movimiento por estado.
    const breathe = Math.sin(t * 1.7) * 0.018 * live
    root.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5)
    let hop = 0
    if (animated && happy && since < 1.6)
      hop = Math.abs(Math.sin(since * 7)) * 0.2 * (1 - since / 1.6)
    let shake = 0
    if (animated && alarmed && since < 1.2) shake = Math.sin(t * 55) * 0.035 * (1 - since / 1.2)
    root.position.set(shake, hop, 0)

    // Mirada del puntero: gira el cuerpo con suavidad.
    const targetY = -0.28 + f.look.x * 0.45 * live
    const targetX = -f.look.y * 0.18 * live
    rotY = damp(rotY, targetY, 5, dt)
    rotX = damp(rotX, targetX, 5, dt)
    root.rotation.set(rotX, rotY, Math.sin(t * 0.9) * 0.012 * live)

    // Tenis: bailan al estar feliz o al saludar; el resto del tiempo, apenas respiran.
    const dancing = animated && (happy || (f.greetAge > 0 && f.greetAge < f.greetFor))
    feet.forEach((shoe, i) => {
      const lift = dancing ? Math.max(0, Math.sin(t * 10 + (i % 2) * Math.PI)) * 0.1 : 0
      shoe.position.y = damp(shoe.position.y, -1.19 + lift, 30, dt)
    })

    // Gorra: salta de susto en alerta y se asienta con un rebote.
    capLift = damp(capLift, alarmed && animated ? 0.16 : 0, alarmed ? 22 : 7, dt)
    cap.position.y = capLift + (animated ? Math.sin(t * 1.7) * 0.01 : 0)
    cap.rotation.z = -0.06 + (alarmed && animated ? Math.sin(t * 40) * 0.03 : 0)
    // Dije de la cadena: se balancea con el cuerpo.
    pendant.rotation.z = Math.sin(t * 2.4) * 0.12 * live

    // Orejas y cola.
    ears.forEach((ear, i) => {
      const side = i === 0 ? -1 : 1
      ear.rotation.z = -side * (0.2 + (alarmed ? -0.18 : 0) + Math.sin(t * 2 + i) * 0.015 * live)
    })
    tail.rotation.y = Math.sin(t * (happy ? 7 : 2.2)) * (happy ? 0.5 : 0.22) * live
    shield.rotation.y = Math.sin(t * 1.1) * 0.12 * live
    violetGlow.emissiveIntensity =
      1.0 + (alarmed ? 0.8 : 0.25) * Math.sin(t * (alarmed ? 9 : 2)) * live

    // Brazos: el derecho del espectador saluda; el izquierdo respira.
    const greeting = f.greetAge > 0 && f.greetAge < f.greetFor
    const wave = greeting ? 2.35 + Math.sin(f.greetAge * 11) * 0.38 * live : 0.18 + breathe * 3
    smoothArmR = damp(smoothArmR, wave, greeting ? 18 : 8, dt)
    arms[1].rotation.z = smoothArmR
    arms[0].rotation.z = -(0.18 + breathe * 3 + (happy ? 0.5 : 0) * Math.min(1, since * 4))

    // Saludo: un saltito al empezar.
    if (animated && greeting) {
      root.position.y = Math.max(
        root.position.y,
        Math.abs(Math.sin(Math.min(f.greetAge, 0.5) * 6.3)) * 0.14
      )
    }

    // Anillo de escaneo (sube y baja por el cuerpo).
    scanRing.visible = scanning && animated
    if (scanRing.visible) scanRing.position.y = -1.2 + ((t * 0.9) % 1) * 3.5

    // Chispas orbitando.
    const speed = scanning ? 1.4 : 0.35
    orbs.forEach((o, i) => {
      const a = o.phase + t * speed * live + (animated ? 0 : i)
      o.mesh.position.set(
        Math.cos(a) * o.radius,
        o.height + Math.sin(a * 2) * 0.1,
        Math.sin(a) * o.radius * 0.6 - 0.4
      )
    })
  }

  function dispose(): void {
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
    textures.forEach((x) => x.dispose())
  }

  return { scene, camera, update, dispose }
}
