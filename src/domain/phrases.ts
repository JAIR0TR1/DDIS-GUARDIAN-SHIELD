/** Frases de la criatura por situación. Dominio puro. */

export type Phrases = Readonly<Record<string, readonly string[]>>

/**
 * Elige una frase de la situación y sustituye `{nombre}`.
 * `random` se inyecta para poder probarlo; devuelve `fallback` si no hay frases.
 */
export function pickPhrase(
  phrases: Phrases,
  situation: string,
  name: string,
  random: () => number = Math.random,
  fallback = '…'
): string {
  const options = phrases[situation]
  if (!options || options.length === 0) return fallback
  const index = Math.min(options.length - 1, Math.floor(random() * options.length))
  return options[index].replaceAll('{nombre}', name)
}
