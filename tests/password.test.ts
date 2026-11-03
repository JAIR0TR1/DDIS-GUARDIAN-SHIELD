import { describe, expect, it } from 'vitest'
import { checkPassword, suggestPassword } from '../src/domain/password'

describe('checkPassword', () => {
  it.each(['12345678', 'password123', 'aaaaaaaa', 'qwerty2026', 'corta'])(
    '«%s» es débil',
    (password) => {
      expect(checkPassword(password).strength).toBe('debil')
    }
  )

  it('una contraseña larga y variada es fuerte', () => {
    expect(checkPassword('Faro-Cometa-Jaguar47!').strength).toBe('fuerte')
    expect(checkPassword('Tr3s.Gatos.Azules').strength).toBe('fuerte')
  })

  it('una de 8-11 caracteres con algo de variedad es aceptable', () => {
    expect(checkPassword('Guardian7x').strength).toBe('aceptable')
  })

  it('da como mucho dos consejos y el primero es el más importante', () => {
    expect(checkPassword('abc').hints[0]).toBe('length')
    expect(checkPassword('micontraseñalarga').hints.length).toBeLessThanOrEqual(2)
    expect(checkPassword('password2026!').hints[0]).toBe('common')
  })
})

describe('suggestPassword', () => {
  it('siempre sugiere una contraseña fuerte', () => {
    for (let i = 0; i < 200; i++) {
      expect(checkPassword(suggestPassword()).strength).toBe('fuerte')
    }
  })

  it('es determinista con un generador inyectado', () => {
    expect(suggestPassword(() => 0)).toBe('Escudo-Escudo-Escudo10!')
  })
})
