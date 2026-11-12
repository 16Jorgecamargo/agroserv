import { beforeEach, describe, expect, it } from 'vitest'
import type { ProviderDashboard } from '../../../types/api'
import { call, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('GET /provider/dashboard', () => {
  beforeEach(() => {
    const database = getMockDatabase()
    database.requestRecords = database.requestRecords.filter((record) => Number(record.request.id.replace('req-', '')) >= 9)
  })

  it('counts new, upcoming and in progress requests with the acceptance rate', () => {
    const dashboard = call<ProviderDashboard>('GET', '/provider/dashboard', { token: tokens.provider })

    expect(dashboard.stats).toMatchObject({ newRequests: 1, upcoming: 1, inProgress: 1, acceptanceRate: 0.6, monthEstimatedValue: 0 })
    expect(dashboard.stats.averageRating).toBeGreaterThan(0)
    expect(dashboard.pendingRequests.map((request) => request.id)).toEqual(['req-14'])
    expect(dashboard.upcomingRequests.map((request) => request.id)).toEqual(['req-10'])
  })

  it('sums the estimated value of services completed this month', () => {
    call('POST', '/provider/requests/req-11/complete', { token: tokens.provider })

    expect(call<ProviderDashboard>('GET', '/provider/dashboard', { token: tokens.provider }).stats.monthEstimatedValue).toBe(1800)
  })

  it('returns null acceptance rate without responses', () => {
    getMockDatabase().requestRecords = []

    expect(call<ProviderDashboard>('GET', '/provider/dashboard', { token: tokens.provider }).stats.acceptanceRate).toBeNull()
  })
})
