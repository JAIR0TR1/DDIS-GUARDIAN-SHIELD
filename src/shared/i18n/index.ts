import { en } from './en'
import { es, type MessageKey } from './es'
import { DEFAULT_LANGUAGE, type Language, type Params } from './types'

export { LANGUAGES, DEFAULT_LANGUAGE, type Language, type Params } from './types'
export type { MessageKey } from './es'

const dictionaries: Record<Language, Record<MessageKey, string>> = { es, en }

export type Translate = (key: MessageKey, params?: Params) => string

/** Reemplaza cada «{nombre}» por su valor; si falta el valor deja el marcador visible. */
function interpolate(template: string, params: Params | undefined): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (marker, name: string) => {
    const value = params[name]
    return value === undefined ? marker : String(value)
  })
}

/** Crea la función de traducción de un idioma. Si una clave faltara, cae al español. */
export function createTranslator(language: Language): Translate {
  const dictionary = dictionaries[language]
  return (key, params) => interpolate(dictionary[key] ?? es[key], params)
}

export function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en'
}

export const translateDefault: Translate = createTranslator(DEFAULT_LANGUAGE)
