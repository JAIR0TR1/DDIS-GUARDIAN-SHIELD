import { ipcMain } from 'electron'
import { credentialsSchema, type AuthResult, type AuthState } from '../shared/auth'
import { IPC } from '../shared/ipc'
import type { Cloud } from './cloud/cloud'
import type { GuardianController } from './guardianController'
import type { AccountData } from './storage/accountData'

interface AuthIpcDeps {
  cloud: Cloud | null
  data: AccountData
  controller: GuardianController
  /** Termina cuando la cuenta guardada (si había) ya se abrió y sincronizó al arrancar. */
  ready: Promise<void>
}

/**
 * Cuentas: el renderer solo envía correo y contraseña y recibe la cuenta (id y correo).
 * Los tokens de sesión nunca salen del proceso principal.
 */
export function registerAuthIpc({ cloud, data, controller, ready }: AuthIpcDeps): void {
  ipcMain.handle(IPC.auth.state, async (): Promise<AuthState> => {
    await ready
    return { cloud: cloud !== null, account: cloud ? await cloud.account() : null }
  })

  const enter = async (value: unknown, mode: 'signUp' | 'signIn'): Promise<AuthResult> => {
    if (!cloud) return { ok: false, code: 'not-configured' }
    const parsed = credentialsSchema.safeParse(value)
    if (!parsed.success) {
      const emailIssue = parsed.error.issues.some((issue) => issue.path[0] === 'email')
      return { ok: false, code: emailIssue ? 'invalid-email' : 'weak-password' }
    }
    const result = await cloud[mode](parsed.data)
    if (result.ok) {
      await data.open(result.account)
      await controller.onAccountChanged()
    }
    return result
  }

  ipcMain.handle(IPC.auth.signUp, (_e, value: unknown) => enter(value, 'signUp'))
  ipcMain.handle(IPC.auth.signIn, (_e, value: unknown) => enter(value, 'signIn'))
  ipcMain.handle(IPC.auth.signOut, async () => {
    if (!cloud) return
    await cloud.signOut()
    await data.open(null)
    await controller.onAccountChanged()
  })
}
