import { useEffect } from 'react'
import type { Theme } from '@shared/models'

/** El tema real que se pinta: «system» se resuelve con el modo del sistema operativo. */
export function resolveTheme(theme: Theme, systemPrefersDark: boolean): 'dark' | 'light' {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light'
  return theme
}

/** Aplica el tema al documento (atributo `data-theme`) y lo mantiene al día si cambia el sistema. */
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (): void => {
      document.documentElement.dataset['theme'] = resolveTheme(theme, query.matches)
    }
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [theme])
}
