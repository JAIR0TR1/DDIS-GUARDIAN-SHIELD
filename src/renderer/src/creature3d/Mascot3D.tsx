import { useEffect, useRef } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three'
import type { HaloState } from '@design/tokens'
import type { Gesture } from '@domain/gesture'
import type { CreatureState } from '../creature/creatureState'
import { defaultHalo } from '../creature/creatureState'
import { buildMascot, type Frame } from './buildMascot'

export interface Mascot3DProps {
  state: CreatureState
  halo?: HaloState
  /** Segundos de saludo desde que se monta (0 = no saluda). */
  greetFor?: number
  /** Gesto de contexto (celebrar, pensar, alto…). «ninguno» = sin gesto. */
  gesture?: Gesture
  /** Cambia cada vez que el gesto debe REINICIARSE (p. ej. el id de un resultado nuevo). */
  gestureKey?: string | number
  /** `false`: pose fija, sin bucle (movimiento reducido). */
  animated: boolean
  /** Se llama si WebGL falla, para que el padre muestre el respaldo en SVG. */
  onUnavailable: () => void
  title: string
}

/**
 * Nilo en 3D. Ocupa todo su contenedor. El bucle se pausa cuando la ventana no se ve y se
 * libera toda la memoria de GPU al desmontarse.
 */
export function Mascot3D({
  state,
  halo,
  greetFor = 0,
  gesture = 'ninguno',
  gestureKey,
  animated,
  onUnavailable,
  title
}: Mascot3DProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  // Los valores que cambian con el tiempo viajan por una referencia: no reconstruyen la escena.
  const live = useRef({
    state,
    halo: halo ?? defaultHalo[state],
    animated,
    greetFor,
    gesture,
    gestureStart: 0
  })
  const unavailable = useRef(onUnavailable)
  const lastGestureKey = useRef<string | number | undefined>(undefined)
  // Las referencias se ponen al día tras cada dibujado (no durante), sin reconstruir la escena.
  useEffect(() => {
    const restart = lastGestureKey.current !== gestureKey || live.current.gesture !== gesture
    lastGestureKey.current = gestureKey
    live.current = {
      state,
      halo: halo ?? defaultHalo[state],
      animated,
      greetFor,
      gesture,
      // Un gesto nuevo (o el mismo con otra clave) empieza desde cero.
      gestureStart: restart ? performance.now() : live.current.gestureStart
    }
    unavailable.current = onUnavailable
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' })
    } catch (error) {
      console.warn('[3D] WebGL no disponible, uso el dibujo en SVG', error)
      unavailable.current()
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    host.appendChild(renderer.domElement)
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })

    const mascot = buildMascot()
    const look = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const started = performance.now()
    let last = started
    let frameId = 0
    let disposed = false

    const resize = (): void => {
      const { clientWidth: w, clientHeight: h } = host
      if (w === 0 || h === 0) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h, false)
      mascot.camera.aspect = w / h
      mascot.camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const onPointer = (event: PointerEvent): void => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1
      target.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer)

    const draw = (now: number): void => {
      const t = (now - started) / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const cur = live.current
      look.x += (target.x - look.x) * Math.min(1, dt * 6)
      look.y += (target.y - look.y) * Math.min(1, dt * 6)
      const frame: Frame = {
        t,
        dt: cur.animated ? dt : 1,
        state: cur.state,
        halo: cur.halo,
        // El saludo empieza al montar: dura `greetFor` segundos.
        greetAge: cur.greetFor > 0 ? t + 0.001 : 0,
        greetFor: cur.greetFor,
        gesture: cur.gesture,
        gestureAge: cur.gesture === 'ninguno' ? 0 : Math.max(0, (now - cur.gestureStart) / 1000),
        look: cur.animated ? look : { x: 0, y: 0 },
        animated: cur.animated
      }
      mascot.update(frame)
      renderer.render(mascot.scene, mascot.camera)
    }

    const loop = (now: number): void => {
      if (disposed) return
      if (!document.hidden) draw(now)
      frameId = requestAnimationFrame(loop)
    }

    if (live.current.animated) {
      frameId = requestAnimationFrame(loop)
    } else {
      // Movimiento reducido: se dibuja una pose fija (una vez, y de nuevo si cambia el estado).
      draw(performance.now() + 1000)
      frameId = requestAnimationFrame(() => draw(performance.now() + 1000))
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
      mascot.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
    // La escena se crea una sola vez; el resto de datos entran por `live`.
  }, [])

  return <div ref={hostRef} role="img" aria-label={title} className="size-full" />
}
