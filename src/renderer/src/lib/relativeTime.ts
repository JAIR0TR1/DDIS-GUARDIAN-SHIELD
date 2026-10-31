/** «Ahora», «Hace 3 min», «Hace 2 h», «Ayer», «Hace 4 d». */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Ayer' : `Hace ${days} d`
}
