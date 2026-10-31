import { describe, expect, it } from 'vitest'
import { decideClipboard } from '../src/domain/clipboardFilter'

const skipped = (text: string): string | null => {
  const d = decideClipboard(text)
  return d.analyze ? null : d.reason
}

describe('decideClipboard: lo que SÍ se analiza', () => {
  it.each([
    'Ganaste un premio. Confirma tu clave en bit.ly/premio-nequi',
    'Hola mamá, cambié de número. ¿Me transfieres $150.000 por Nequi?',
    'https://nequi-premios.com/ganador',
    'bit.ly/abc123 mira esto',
    'Recordatorio: mañana tienes clase a las 8:00 a. m. en el salón 204.'
  ])('%s', (text) => {
    expect(decideClipboard(text)).toEqual({ analyze: true })
  })
})

describe('decideClipboard: contraseñas, claves y tarjetas NUNCA se analizan', () => {
  it('contraseñas típicas (una sola palabra con mezcla de caracteres)', () => {
    expect(skipped('Hola2026!Clave')).toBe('parece una contraseña')
    expect(skipped('P@ssw0rd-Segura9')).toBe('parece una contraseña')
  })

  it('tokens y claves de API conocidos', () => {
    expect(skipped('AIzaSyD-ejemplo-de-clave-0123456789abc')).toBe('clave o token')
    expect(skipped('sk-abcdefghijklmnopqrstuvwxyz0123456789')).toBe('clave o token')
    expect(skipped('ghp_abcdefghijklmnopqrstuvwxyz0123456789')).toBe('clave o token')
    expect(
      skipped('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r')
    ).toBe('clave o token')
    expect(skipped('-----BEGIN PRIVATE KEY----- MIIEvQ')).toBe('clave o token')
  })

  it('números de tarjeta', () => {
    expect(skipped('4111 1111 1111 1111')).toBe('número de tarjeta')
    expect(skipped('4111-1111-1111-1111')).toBe('número de tarjeta')
  })

  it('tokens hexadecimales o base64 largos', () => {
    expect(skipped('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b')).toBe('parece una contraseña')
  })

  it('alguien copiando sus propios datos («clave: …»)', () => {
    expect(skipped('mi clave es Hola2026 para entrar')).toBe('contiene datos sensibles')
    expect(skipped('pin: 4821 del banco')).toBe('contiene datos sensibles')
  })
})

describe('decideClipboard: lo que no es un mensaje', () => {
  it('textos muy cortos o de una palabra', () => {
    expect(skipped('hola')).toBe('muy corto')
    expect(skipped('trescientosmil')).not.toBeNull()
  })

  it('textos enormes', () => {
    expect(skipped('palabra '.repeat(1000))).toBe('muy largo')
  })

  it('un link solo SÍ se analiza (no es una contraseña)', () => {
    expect(decideClipboard('https://bit.ly/3xYzAbC')).toEqual({ analyze: true })
  })
})
