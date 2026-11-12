import { describe, expect, it } from 'vitest'
import type { AdminDashboard } from '../../../types/api'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('GET /admin/dashboard', () => {
  it('summarizes accounts, requests, services and queues', () => {
    const database = getMockDatabase()
    const dashboard = call<AdminDashboard>('GET', '/admin/dashboard', { token: tokens.admin })

    expect(dashboard.users).toEqual({
      producers: database.users.filter((user) => user.role === 'producer').length,
      providers: database.users.filter((user) => user.role === 'provider').length,
      admins: database.users.filter((user) => user.role === 'admin').length,
    })
    expect(Object.keys(dashboard.requestsByStatus).sort()).toEqual(
      ['accepted', 'cancelled', 'completed', 'counter_offer', 'in_progress', 'pending', 'rejected'],
    )
    expect(Object.values(dashboard.requestsByStatus).reduce((total, count) => total + count, 0)).toBe(database.requestRecords.length)
    expect(dashboard.pendingVerifications).toBe(1)
    expect(dashboard.openReports).toBe(database.reports.filter((report) => report.status === 'open').length)
    expect(dashboard.openReports).toBeGreaterThan(0)
    expect(dashboard.topCategories.length).toBeLessThanOrEqual(5)
    expect(dashboard.topCategories.map((category) => category.requests)).toEqual(
      [...dashboard.topCategories.map((category) => category.requests)].sort((a, b) => b - a),
    )
  })

  it('counts recent sign ups, ignores deleted accounts and drops hidden services', () => {
    const database = getMockDatabase()
    const before = call<AdminDashboard>('GET', '/admin/dashboard', { token: tokens.admin })
    const producer = database.users.find((user) => user.id === 'usr-1')
    if (!producer) throw new Error('missing producer')
    producer.createdAt = new Date().toISOString()
    const provider = database.users.find((user) => user.id === 'prv-2')
    if (!provider) throw new Error('missing provider')
    provider.status = 'deleted'
    const service = database.services.find((candidate) => candidate.providerId === 'prv-1' && candidate.status === 'active')
    if (!service) throw new Error('missing service')
    service.status = 'hidden'

    const after = call<AdminDashboard>('GET', '/admin/dashboard', { token: tokens.admin })

    expect(after.newUsersLast7Days).toBeGreaterThanOrEqual(1)
    expect(after.users.providers).toBe(before.users.providers - 1)
    expect(after.activeServices).toBeLessThan(before.activeServices)
  })

  it('is restricted to administrators', () => {
    expect(captureError(() => call('GET', '/admin/dashboard', { token: tokens.producer })).status).toBe(403)
    expect(captureError(() => call('GET', '/admin/dashboard')).status).toBe(401)
  })
})
