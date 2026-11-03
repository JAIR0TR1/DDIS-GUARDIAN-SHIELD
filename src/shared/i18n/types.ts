/** Idiomas de la interfaz. */
export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'es'

/** Valores que se insertan en un texto: «Hola, {name}». */
export type Params = Readonly<Record<string, string | number>>
