/**
 * Navegación con teclado de una lista de pestañas (patrón WAI-ARIA «tabs»).
 * Devuelve el índice al que hay que ir, o `null` si la tecla no navega.
 * Las flechas dan la vuelta en los extremos; Inicio y Fin saltan al primero y al último.
 */
export function nextTabIndex(key: string, index: number, count: number): number | null {
  if (count <= 0) return null
  const last = count - 1
  switch (key) {
    case 'ArrowRight':
      return index >= last ? 0 : index + 1
    case 'ArrowLeft':
      return index <= 0 ? last : index - 1
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}
