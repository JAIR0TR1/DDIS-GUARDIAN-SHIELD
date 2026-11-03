import { describe, expect, it } from 'vitest'
import { mergeHistory, stateDirection, MAX_HISTORY } from '../src/main/cloud/syncPlan'
import { authErrorCode } from '../src/main/cloud/cloud'
import { credentialsSchema } from '../src/shared/auth'
import type { HistoryEntry } from '../src/shared/history'

const entry = (id: string, minutesAgo: number): HistoryEntry =>
  ({
    id,
    at: new Date(Date.UTC(2026, 10, 3, 12, 0) - minutesAgo * 60_000).toISOString()
  }) as HistoryEntry

describe('mergeHistory', () => {
  it('une los análisis de los dos lados sin repetir y del más nuevo al más viejo', () => {
    const local = [entry('a', 1), entry('b', 10)]
    const remote = [entry('b', 10), entry('c', 5)]
    expect(mergeHistory(local, remote).map((e) => e.id)).toEqual(['a', 'c', 'b'])
  })

  it('nunca supera el máximo del historial', () => {
    const many = Array.from({ length: MAX_HISTORY + 20 }, (_, i) => entry(`e${i}`, i))
    expect(mergeHistory(many, [])).toHaveLength(MAX_HISTORY)
  })
})

describe('stateDirection', () => {
  it('cuenta usada en otro equipo → baja los datos de la nube', () => {
    expect(
      stateDirection({ remoteHasState: true, localHasState: false, localPending: false })
    ).toBe('pull')
  })
  it('primera vez en la nube con datos locales → los sube', () => {
    expect(
      stateDirection({ remoteHasState: false, localHasState: true, localPending: false })
    ).toBe('push')
  })
  it('cambios hechos sin internet → se suben antes de bajar nada', () => {
    expect(stateDirection({ remoteHasState: true, localHasState: true, localPending: true })).toBe(
      'push'
    )
  })
  it('cuenta nueva en equipo nuevo → nada que sincronizar', () => {
    expect(
      stateDirection({ remoteHasState: false, localHasState: false, localPending: false })
    ).toBe('none')
  })
})

describe('authErrorCode', () => {
  it.each([
    ['invalid_credentials', 'invalid-credentials'],
    ['user_already_exists', 'user-exists'],
    ['weak_password', 'weak-password'],
    ['email_not_confirmed', 'confirm-email'],
    ['over_request_rate_limit', 'rate-limit']
  ])('%s → %s', (code, expected) => {
    expect(authErrorCode({ code, status: 400, name: 'AuthApiError' })).toBe(expected)
  })

  it('sin red → network', () => {
    expect(authErrorCode({ code: undefined, status: 0, name: 'AuthRetryableFetchError' })).toBe(
      'network'
    )
  })
})

describe('credentialsSchema', () => {
  it('normaliza el correo y exige 8 caracteres de contraseña', () => {
    expect(credentialsSchema.parse({ email: '  Ana@Correo.COM ', password: '12345678' })).toEqual({
      email: 'ana@correo.com',
      password: '12345678'
    })
    expect(
      credentialsSchema.safeParse({ email: 'ana@correo.com', password: 'corta' }).success
    ).toBe(false)
    expect(
      credentialsSchema.safeParse({ email: 'no-es-correo', password: '12345678' }).success
    ).toBe(false)
  })
})
