import type { ProviderAgenda } from '../../../types/api'
import { getTodayInBrasilia, isDateOnly } from '../../../utils/date'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { getBody, requireUser, textField, toOptionalString, validationError } from './shared'
import type { MockRoute, RouteContext } from './types'

const AGENDA_STATUSES = new Set(['accepted', 'in_progress', 'completed'])

function getAgenda({ token, query }: RouteContext): ProviderAgenda {
  const user = requireUser(token, 'provider')
  const requested = toOptionalString(query.month)
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : getTodayInBrasilia().slice(0, 7)
  const database = getMockDatabase()

  return {
    month,
    blockedDays: database.blockedDays
      .filter((day) => day.providerId === user.id && day.date.startsWith(month))
      .map((day) => day.date)
      .sort(),
    requests: database.requestRecords
      .map((record) => record.request)
      .filter((request) => request.providerId === user.id && AGENDA_STATUSES.has(request.status) && request.scheduledDate.startsWith(month))
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
  }
}

function blockDay({ token, body }: RouteContext): { date: string } {
  const user = requireUser(token, 'provider')
  const date = textField(getBody(body).date)
  if (!isDateOnly(date) || date < getTodayInBrasilia()) validationError({ date: 'Escolha uma data a partir de hoje.' })

  const database = getMockDatabase()
  if (!database.blockedDays.some((day) => day.providerId === user.id && day.date === date)) {
    database.blockedDays.push({ providerId: user.id, date })
    persistMockDatabase()
  }
  return { date }
}

function unblockDay({ token, params }: RouteContext): undefined {
  const user = requireUser(token, 'provider')
  const database = getMockDatabase()
  database.blockedDays = database.blockedDays.filter((day) => !(day.providerId === user.id && day.date === params.date))
  persistMockDatabase()
  return undefined
}

export const agendaRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/provider/agenda', handle: getAgenda },
  { method: 'POST', pattern: '/provider/blocked-days', handle: blockDay },
  { method: 'DELETE', pattern: '/provider/blocked-days/:date', handle: unblockDay },
]
