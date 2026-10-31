import { useEffect, useState } from 'react'

/** Alto actual de la ventana, para que la criatura se adapte al redimensionar. */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = (): void => setHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return height
}
