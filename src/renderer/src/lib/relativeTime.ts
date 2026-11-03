import type { Translate } from '@shared/i18n'

/** «Ahora», «Hace 3 min», «Hace 2 h», «Ayer», «Hace 4 d» (o su versión en inglés). */
export function relativeTime(iso: string, t: Translate, now: number = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return t('time.now')
  if (minutes < 60) return t('time.minutes', { n: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('time.hours', { n: hours })
  const days = Math.round(hours / 24)
  return days === 1 ? t('time.yesterday') : t('time.days', { n: days })
}
