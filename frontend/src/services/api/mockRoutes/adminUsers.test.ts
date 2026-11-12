import { describe, expect, it } from 'vitest'
import type { AdminUserDetail, LoginResponse, Paginated } from '../../../types/api'
import type { Service, ServiceRequestDetail, User } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

const reason = 'Conta usada para golpes.'

describe('GET /admin/users', () => {
  it('searches by name or email ignoring accents and filters by role and status', () => {
    const byName = call<Paginated<User>>('GET', '/admin/users', { token: tokens.admin, query: { q: 'carlos henrique' } })
    expect(byName.data.map((user) => user.id)).toEqual(['usr-1'])

    const byEmail = call<Paginated<User>>('GET', '/admin/users', { token: tokens.admin, query: { q: 'PRESTADOR@agroserv' } })
    expect(byEmail.data.map((user) => user.id)).toContain('prv-1')

    const providers = call<Paginated<User>>('GET', '/admin/users', { token: tokens.admin, query: { role: 'provider', pageSize: 2 } })
    expect(providers.data).toHaveLength(2)
    expect(providers.data.every((user) => user.role === 'provider')).toBe(true)
    expect(providers.meta.totalPages).toBeGreaterThan(1)

    getMockDatabase().users.find((user) => user.id === 'prv-2')!.status = 'deleted'
    const all = call<Paginated<User>>('GET', '/admin/users', { token: tokens.admin, query: { pageSize: 100 } })
    expect(all.data.map((user) => user.id)).not.toContain('prv-2')
  })

  it('rejects other roles', () => {
    expect(captureError(() => call('GET', '/admin/users', { token: tokens.provider })).status).toBe(403)
  })
})

describe('POST /admin/users', () => {
  it('creates an administrator with a temporary password', () => {
    const created = call<User>('POST', '/admin/users', {
      token: tokens.admin,
      body: { name: 'Ana Moderadora', email: 'Ana@AgroServ.com', password: 'provisoria1', city: 'Cascavel', state: 'PR' },
    })

    expect(created).toMatchObject({ role: 'admin', email: 'ana@agroserv.com', mustChangePassword: true, status: 'active' })
    const login = call<LoginResponse>('POST', '/auth/login', { body: { email: 'ana@agroserv.com', password: 'provisoria1' } })
    expect(login.user.mustChangePassword).toBe(true)
    expect(getMockDatabase().adminActions.at(-1)).toMatchObject({ action: 'create_admin', targetId: created.id })
  })

  it('validates the fields like the sign up', () => {
    const error = captureError(() =>
      call('POST', '/admin/users', { token: tokens.admin, body: { name: 'A', email: 'admin@agroserv.com', password: '123', city: '', state: 'XX' } }),
    )

    expect(error.fields).toEqual({
      name: 'Informe seu nome.',
      email: 'Este e-mail já está cadastrado.',
      password: 'A senha precisa ter pelo menos 8 caracteres.',
      city: 'Informe sua cidade.',
      state: 'Selecione a UF.',
    })
  })
})

describe('GET /admin/users/:id', () => {
  it('returns the provider with requests, services in any status, reviews and actions', () => {
    getMockDatabase().services.find((service) => service.id === 'svc-5')!.status = 'paused'
    const detail = call<AdminUserDetail>('GET', '/admin/users/prv-1', { token: tokens.admin })

    expect(detail.user.id).toBe('prv-1')
    expect(detail.providerProfile?.userId).toBe('prv-1')
    expect(detail.requests.length).toBeGreaterThan(0)
    expect(detail.requests.length).toBeLessThanOrEqual(20)
    expect(detail.services?.map((service: Service) => service.id)).toEqual(expect.arrayContaining(['svc-1', 'svc-5']))
    expect(detail.reviews.every((review) => review.providerId === 'prv-1')).toBe(true)
    expect(Array.isArray(detail.actions)).toBe(true)
  })

  it('returns the producer without services', () => {
    const detail = call<AdminUserDetail>('GET', '/admin/users/usr-1', { token: tokens.admin })
    expect(detail.services).toBeUndefined()
    expect(detail.providerProfile).toBeUndefined()
    expect(detail.reviews.every((review) => review.producerId === 'usr-1')).toBe(true)
  })

  it('returns 404 for unknown or deleted accounts', () => {
    expect(captureError(() => call('GET', '/admin/users/nope', { token: tokens.admin })).code).toBe('user_not_found')
  })
})

describe('GET /admin/requests/:id', () => {
  it('returns a read only detail with both phones', () => {
    const detail = call<ServiceRequestDetail>('GET', '/admin/requests/req-14', { token: tokens.admin })

    expect(detail.allowedActions).toEqual([])
    expect(detail.producer.phone).toBeTruthy()
    expect(detail.provider.phone).toBeTruthy()
  })
})

describe('POST /admin/users/:id/suspend', () => {
  it('suspends the provider, cancels open requests and notifies the producer', () => {
    const suspended = call<User>('POST', '/admin/users/prv-1/suspend', { token: tokens.admin, body: { reason } })
    const database = getMockDatabase()

    expect(suspended.status).toBe('suspended')
    const request = database.requestRecords.find((record) => record.request.id === 'req-10')!.request
    expect(request).toMatchObject({ status: 'cancelled', cancelledBy: 'system', cancelReason: 'Conta suspensa pela administração' })
    expect(database.notifications.some((notification) => notification.userId === 'usr-1' && notification.title === 'Solicitação cancelada pela administração')).toBe(true)
    expect(captureError(() => call('GET', '/provider/dashboard', { token: tokens.provider })).status).toBe(401)
    const visible = call<Paginated<Service>>('GET', '/services', { query: { pageSize: 50 } })
    expect(visible.data.some((service) => service.providerId === 'prv-1')).toBe(false)
    expect(database.adminActions.at(-1)).toMatchObject({ action: 'suspend_user', targetId: 'prv-1', reason })
  })

  it('blocks self suspension, the last admin and repeated suspension', () => {
    expect(captureError(() => call('POST', '/admin/users/adm-1/suspend', { token: tokens.admin, body: { reason } })).message).toBe(
      'Você não pode suspender a sua própria conta.',
    )
    const other = call<User>('POST', '/admin/users', {
      token: tokens.admin,
      body: { name: 'Bia Admin', email: 'bia@agroserv.com', password: 'provisoria1', city: 'Toledo', state: 'PR' },
    })
    call('POST', `/admin/users/${other.id}/suspend`, { token: tokens.admin, body: { reason } })
    expect(captureError(() => call('POST', `/admin/users/${other.id}/suspend`, { token: tokens.admin, body: { reason } })).message).toBe(
      'Esta conta já está suspensa.',
    )
    expect(captureError(() => call('GET', '/auth/me', { token: `mock.${other.id}` })).status).toBe(401)
  })

  it('requires a reason', () => {
    expect(captureError(() => call('POST', '/admin/users/usr-1/suspend', { token: tokens.admin, body: { reason: 'oi' } })).fields).toEqual({
      reason: 'Informe o motivo com pelo menos 5 caracteres.',
    })
  })
})

describe('POST /admin/users/:id/reactivate', () => {
  it('restores access and services as they were', () => {
    call('POST', '/admin/users/prv-1/suspend', { token: tokens.admin, body: { reason } })
    const active = call<User>('POST', '/admin/users/prv-1/reactivate', { token: tokens.admin })

    expect(active.status).toBe('active')
    const visible = call<Paginated<Service>>('GET', '/services', { query: { pageSize: 50 } })
    expect(visible.data.some((service) => service.providerId === 'prv-1')).toBe(true)
    expect(captureError(() => call('POST', '/admin/users/prv-1/reactivate', { token: tokens.admin })).message).toBe('Esta conta já está ativa.')
  })

  it('refuses deleted accounts', () => {
    getMockDatabase().users.find((user) => user.id === 'usr-1')!.status = 'deleted'
    expect(captureError(() => call('POST', '/admin/users/usr-1/reactivate', { token: tokens.admin })).message).toBe(
      'Contas excluídas não podem ser reativadas.',
    )
  })
})
