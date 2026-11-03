import { createClient, type AuthError, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Account, AuthErrorCode, AuthResult, Credentials } from '../../shared/auth'
import { historySchema, type HistoryEntry } from '../../shared/history'
import {
  creatureSchema,
  profileSchema,
  settingsSchema,
  type Creature,
  type Profile,
  type Settings
} from '../../shared/models'
import type { CloudConfig } from './config'
import type { AsyncStorage } from './encryptedStorage'

/** Lo que hay en la nube para un usuario. Cada parte puede faltar (cuenta recién creada). */
export interface RemoteState {
  profile: Profile | null
  creature: Creature | null
  settings: Settings | null
}

export interface Cloud {
  /** Cuenta con sesión guardada (sin red: se lee de la sesión cifrada local). */
  account: () => Promise<Account | null>
  signUp: (credentials: Credentials) => Promise<AuthResult>
  signIn: (credentials: Credentials) => Promise<AuthResult>
  signOut: () => Promise<void>
  fetchState: (userId: string) => Promise<RemoteState>
  pushState: (userId: string, state: RemoteState) => Promise<void>
  fetchHistory: (userId: string) => Promise<HistoryEntry[]>
  upsertHistory: (userId: string, entries: readonly HistoryEntry[]) => Promise<void>
  clearHistory: (userId: string) => Promise<void>
}

/** Fila de `user_state` tal como llega (se valida antes de usarla: es dato externo). */
const stateRowSchema = z.object({
  profile: z.unknown().nullable(),
  creature: z.unknown().nullable(),
  settings: z.unknown().nullable()
})
const historyRowsSchema = z.array(z.object({ entry: z.unknown() }))

/** Valida una parte del estado; si no cumple el esquema se ignora (no se rompe la app). */
function parsePart<T>(schema: z.ZodType<T>, value: unknown): T | null {
  if (value === null || value === undefined) return null
  const parsed = schema.safeParse(value)
  if (!parsed.success) console.warn('[cloud] Dato de la nube con formato inesperado; lo ignoro')
  return parsed.success ? parsed.data : null
}

/** Traduce los errores de Supabase Auth a códigos que la interfaz sabe explicar. */
export function authErrorCode(error: Pick<AuthError, 'code' | 'status' | 'name'>): AuthErrorCode {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'network'
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalid-credentials'
    case 'user_already_exists':
    case 'email_exists':
      return 'user-exists'
    case 'weak_password':
      return 'weak-password'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'invalid-email'
    case 'email_not_confirmed':
      return 'confirm-email'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rate-limit'
    default:
      return 'unknown'
  }
}

function toAccount(user: { id: string; email?: string | null }): Account {
  return { userId: user.id, email: user.email ?? '' }
}

export function createCloud(config: CloudConfig, storage: AsyncStorage): Cloud {
  const client: SupabaseClient = createClient(config.url, config.key, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  })

  async function check(promise: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
    const { error } = await promise
    if (error) throw new Error(`[cloud] ${error.message}`)
  }

  return {
    async account() {
      const { data } = await client.auth.getSession()
      return data.session ? toAccount(data.session.user) : null
    },

    async signUp({ email, password }) {
      try {
        const { data, error } = await client.auth.signUp({ email, password })
        if (error) return { ok: false, code: authErrorCode(error) }
        // Con «Confirm email» activo en Supabase no hay sesión hasta confirmar el correo.
        if (!data.session || !data.user) return { ok: false, code: 'confirm-email' }
        // Supabase no revela si el correo ya existía: devuelve un usuario sin identidades.
        if (data.user.identities?.length === 0) return { ok: false, code: 'user-exists' }
        return { ok: true, account: toAccount(data.user) }
      } catch (error) {
        console.warn('[cloud] Falló el registro', error)
        return { ok: false, code: 'network' }
      }
    },

    async signIn({ email, password }) {
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, code: authErrorCode(error) }
        return { ok: true, account: toAccount(data.user) }
      } catch (error) {
        console.warn('[cloud] Falló el inicio de sesión', error)
        return { ok: false, code: 'network' }
      }
    },

    async signOut() {
      // «local»: cierra la sesión en este equipo aunque no haya internet.
      await client.auth.signOut({ scope: 'local' })
    },

    async fetchState(userId) {
      const { data, error } = await client
        .from('user_state')
        .select('profile, creature, settings')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw new Error(`[cloud] ${error.message}`)
      const row = stateRowSchema.nullable().parse(data)
      return {
        profile: parsePart(profileSchema, row?.profile),
        creature: parsePart(creatureSchema, row?.creature),
        settings: parsePart(settingsSchema, row?.settings)
      }
    },

    async pushState(userId, state) {
      await check(
        client.from('user_state').upsert({
          user_id: userId,
          profile: state.profile,
          creature: state.creature,
          settings: state.settings,
          updated_at: new Date().toISOString()
        })
      )
    },

    async fetchHistory(userId) {
      const { data, error } = await client
        .from('history_entries')
        .select('entry')
        .eq('user_id', userId)
        .order('at', { ascending: false })
        .limit(500)
      if (error) throw new Error(`[cloud] ${error.message}`)
      const rows = historyRowsSchema.parse(data ?? [])
      return (
        parsePart(
          historySchema,
          rows.map((r) => r.entry)
        ) ?? []
      )
    },

    async upsertHistory(userId, entries) {
      if (entries.length === 0) return
      await check(
        client
          .from('history_entries')
          .upsert(entries.map((entry) => ({ user_id: userId, id: entry.id, at: entry.at, entry })))
      )
    },

    async clearHistory(userId) {
      await check(client.from('history_entries').delete().eq('user_id', userId))
    }
  }
}
