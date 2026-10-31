/** Error de un proveedor de IA con un mensaje amable para mostrar al usuario. */
export class ProviderError extends Error {
  constructor(
    message: string,
    /** Frase corta y en español para la interfaz. Nunca incluye datos técnicos ni la clave. */
    readonly userMessage: string
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

export function userMessageOf(error: unknown): string {
  return error instanceof ProviderError
    ? error.userMessage
    : 'No pude consultar a la IA. Usé las reglas locales.'
}
