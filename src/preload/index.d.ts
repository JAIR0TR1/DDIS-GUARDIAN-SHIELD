import type { GuardianApi } from '../shared/api'

declare global {
  interface Window {
    guardian: GuardianApi
  }
}
