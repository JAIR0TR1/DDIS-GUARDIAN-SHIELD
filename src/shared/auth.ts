import { z } from 'zod'

/** Cuenta con sesión iniciada (lo único que el renderer sabe de ella: nunca ve los tokens). */
export interface Account {
  userId: string
  email: string
}

export const AUTH_ERROR_CODES = [
  'invalid-credentials',
  'user-exists',
  'weak-password',
  'invalid-email',
  'confirm-email',
  'network',
  'rate-limit',
  'not-configured',
  'unknown'
] as const
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export type AuthResult = { ok: true; account: Account } | { ok: false; code: AuthErrorCode }

/** Estado de la cuenta al abrir la app. `cloud: false` = sin nube configurada (solo local). */
export interface AuthState {
  cloud: boolean
  account: Account | null
}

export const PASSWORD_MIN = 8

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(PASSWORD_MIN).max(72)
})
export type Credentials = z.infer<typeof credentialsSchema>
