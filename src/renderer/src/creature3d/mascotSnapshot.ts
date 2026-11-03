import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three'
import { defaultHalo, type CreatureState } from '../creature/creatureState'
import type { HaloState } from '@design/tokens'
import { buildMascot, type Mascot } from './buildMascot'
import { webglAvailable } from './webgl'
import { DEFAULT_SKIN, SKIN_CATALOG, type SkinId } from '@domain/skins'

const SIZE = 192
const cache = new Map<string, string>()
let shared: { renderer: WebGLRenderer; mascot: Mascot } | null = null
let failed = false

function ensure(): { renderer: WebGLRenderer; mascot: Mascot } | null {
  if (shared) return shared
  if (failed || !webglAvailable()) return null
  try {
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    renderer.setPixelRatio(1)
    renderer.setSize(SIZE, SIZE, false)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    shared = { renderer, mascot: buildMascot() }
    return shared
  } catch (error) {
    console.warn('[3D] No pude preparar las fotos del modelo', error)
    failed = true
    return null
  }
}

/**
 * Foto fija de Nilo (PNG con fondo transparente) para los avatares diminutos. Se usa UN solo
 * contexto WebGL compartido y el resultado se guarda: nunca se dibuja dos veces la misma pose.
 * Devuelve `null` si WebGL no está disponible (el llamador usa el SVG).
 */
export function mascotSnapshot(
  state: CreatureState,
  halo?: HaloState,
  skin: SkinId = DEFAULT_SKIN
): string | null {
  const haloState = halo ?? defaultHalo[state]
  const key = `${state}|${haloState}|${skin}`
  const hit = cache.get(key)
  if (hit) return hit
  const ctx = ensure()
  if (!ctx) return null
  const { renderer, mascot } = ctx
  mascot.setSkin(SKIN_CATALOG[skin].palette)
  mascot.camera.aspect = 1
  mascot.camera.updateProjectionMatrix()
  // Dos pasadas: la primera asienta los colores y las amortiguaciones de la pose.
  for (let i = 0; i < 2; i++) {
    mascot.update({
      t: 1.5,
      dt: 1,
      state,
      halo: haloState,
      greetAge: 0,
      greetFor: 0,
      gesture: 'ninguno',
      gestureScale: 1,
      prop: 'ninguno',
      gestureAge: 0,
      look: { x: 0, y: 0 },
      animated: false
    })
  }
  renderer.render(mascot.scene, mascot.camera)
  const url = renderer.domElement.toDataURL('image/png')
  cache.set(key, url)
  return url
}
