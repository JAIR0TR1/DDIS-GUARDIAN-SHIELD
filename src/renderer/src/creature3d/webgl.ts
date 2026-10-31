let checked: boolean | null = null

/** ¿Este equipo puede crear un contexto WebGL? Se comprueba una sola vez. */
export function webglAvailable(): boolean {
  if (checked !== null) return checked
  try {
    const canvas = document.createElement('canvas')
    checked = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    checked = false
  }
  return checked
}
