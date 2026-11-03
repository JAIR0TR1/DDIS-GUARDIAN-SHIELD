import { createContext, useContext } from 'react'
import { translateDefault, type Translate } from '@shared/i18n'

/** Función de traducción del idioma activo; por defecto, español. */
export const I18nContext = createContext<Translate>(translateDefault)

/** Uso: `const t = useT()` y luego `t('settings.title')` o `t('home.hello', { name })`. */
export function useT(): Translate {
  return useContext(I18nContext)
}
