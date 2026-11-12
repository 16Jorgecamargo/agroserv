export function getTodayInBrasilia(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) throw new Error('Unable to determine the date in Brasília.')

  return `${year}-${month}-${day}`
}

const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(day: string, offset: number): string {
  return new Date(Date.parse(`${day}T12:00:00.000Z`) + offset * DAY_MS).toISOString().slice(0, 10)
}

export function daysAgoIso(days: number, hour = 12, now: Date = new Date()): string {
  return `${addDays(getTodayInBrasilia(now), -days)}T${String(hour).padStart(2, '0')}:00:00.000Z`
}

export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
