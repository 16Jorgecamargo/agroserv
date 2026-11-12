import { describe, expect, it } from 'vitest'
import type { Paginated } from '../../../types/api'
import type { AdminAction } from '../../../types/entities'
import { getTodayInBrasilia } from '../../../utils/date'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

function list(query: Record<string, string | number> = {}) {
  return call<Paginated<AdminAction>>('GET', '/admin/actions', { token: tokens.admin, query })
}

describe('GET /admin/actions', () => {
  it('records every admin write and lists the newest first', () => {
    call('POST', '/admin/users/usr-1/suspend', { token: tokens.admin, body: { reason: 'Teste de histórico.' } })
    call('POST', '/admin/users/usr-1/reactivate', { token: tokens.admin })

    const result = list()
    expect(result.data.slice(0, 2).map((action) => action.action)).toEqual(['reactivate_user', 'suspend_user'])
    expect(result.data[1]).toMatchObject({ adminId: 'adm-1', targetType: 'user', targetId: 'usr-1', reason: 'Teste de histórico.' })
  })

  it('filters by admin, action and inclusive Brasília period', () => {
    call('POST', '/admin/users/usr-1/suspend', { token: tokens.admin, body: { reason: 'Teste de histórico.' } })
    const today = getTodayInBrasilia()

    expect(list({ action: 'suspend_user' }).data.every((action) => action.action === 'suspend_user')).toBe(true)
    expect(list({ adminId: 'nobody' }).data).toEqual([])
    expect(list({ from: today, to: today }).data.map((action) => action.action)).toContain('suspend_user')
    expect(list({ to: '2000-01-01' }).data).toEqual([])
  })

  it('paginates and is read only', () => {
    const database = getMockDatabase()
    for (let index = 0; index < 25; index += 1) {
      database.adminActions.push({ ...database.adminActions[0], id: `act-x${index}`, createdAt: new Date(Date.now() - index * 1000).toISOString() })
    }

    const firstPage = list({ pageSize: 10 })
    expect(firstPage.data).toHaveLength(10)
    expect(firstPage.meta.totalPages).toBeGreaterThanOrEqual(3)
    expect(captureError(() => call('DELETE', '/admin/actions/act-1', { token: tokens.admin })).status).toBe(404)
  })
})
