import { describe, expect, it } from 'vitest'
import type { Paginated, ReportDetail } from '../../../types/api'
import type { Report, Review, ServiceRequestDetail } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

const description = 'O prestador não apareceu na data combinada.'
const internalNote = 'Conferido com as mensagens.'

function report(token: string, targetType: string, targetId: string): Report {
  return call<Report>('POST', '/reports', { token, body: { targetType, targetId, reason: 'fraud', description } })
}

describe('POST /reports', () => {
  it('lets the producer report a visible service and notifies admins', () => {
    const created = report(tokens.producer, 'service', 'svc-1')
    const database = getMockDatabase()

    expect(created).toMatchObject({ status: 'open', reporterId: 'usr-1', targetLabel: database.services.find((service) => service.id === 'svc-1')!.title })
    expect(created.resolution).toBeUndefined()
    expect(database.notifications.at(-1)).toMatchObject({ userId: 'adm-1', type: 'report_created', title: 'Nova denúncia: Golpe ou fraude', link: '/admin/denuncias' })
  })

  it('blocks a repeated open report for the same target', () => {
    report(tokens.producer, 'request', 'req-10')
    expect(captureError(() => report(tokens.producer, 'request', 'req-10')).message).toBe('Você já denunciou este item. Aguarde a análise.')
  })

  it('applies the permission table', () => {
    const notAllowed = { targetType: 'Você não pode denunciar este item.' }
    expect(captureError(() => report(tokens.producer, 'review', 'rev-1')).fields).toEqual(notAllowed)
    expect(captureError(() => report(tokens.provider, 'service', 'svc-1')).fields).toEqual(notAllowed)
    expect(captureError(() => report(tokens.otherProvider, 'review', 'rev-1')).fields).toEqual(notAllowed)
    expect(captureError(() => report(tokens.producer, 'user', 'usr-1')).fields).toEqual(notAllowed)
    expect(captureError(() => report(tokens.otherProvider, 'request', 'req-10')).code).toBe('request_not_found')
    expect(captureError(() => report(tokens.producer, 'service', 'nope')).code).toBe('service_not_found')
    expect(captureError(() => report(tokens.admin, 'service', 'svc-1')).status).toBe(403)

    expect(report(tokens.provider, 'review', 'rev-1').targetLabel).toMatch(/^Avaliação de /)
    expect(report(tokens.provider, 'user', 'usr-1').targetLabel).toBe('Carlos Henrique Souza')
    expect(report(tokens.producer, 'user', 'prv-1').targetLabel).toBe('Agro Máquinas Paraná')
  })

  it('validates reason and description', () => {
    const error = captureError(() => call('POST', '/reports', { token: tokens.producer, body: { targetType: 'service', targetId: 'svc-1', description: 'curto' } }))
    expect(error.fields).toEqual({ reason: 'Selecione o motivo.', description: 'Descreva o problema com pelo menos 10 caracteres.' })
  })
})

describe('admin reports queue', () => {
  it('lists open reports oldest first and filters by target type', () => {
    report(tokens.producer, 'request', 'req-10')
    const open = call<Paginated<Report>>('GET', '/admin/reports', { token: tokens.admin })
    expect(open.data.map((item) => item.id)).toEqual(['rep-1', 'rep-2'])

    const requests = call<Paginated<Report>>('GET', '/admin/reports', { token: tokens.admin, query: { targetType: 'request' } })
    expect(requests.data.map((item) => item.id)).toEqual(['rep-2'])

    const all = call<Paginated<Report>>('GET', '/admin/reports', { token: tokens.admin, query: { status: 'all' } })
    expect(all.meta.total).toBe(2)
  })

  it('shows the request target with its conversation', () => {
    const created = report(tokens.producer, 'request', 'req-10')
    const detail = call<ReportDetail>('GET', `/admin/reports/${created.id}`, { token: tokens.admin })

    expect((detail.target as ServiceRequestDetail).id).toBe('req-10')
    expect(detail.messages?.length).toBeGreaterThan(0)
    expect(call<unknown[]>('GET', '/requests/req-10/messages', { token: tokens.admin }).length).toBe(detail.messages?.length)
  })

  it('returns 404 for unknown reports', () => {
    expect(captureError(() => call('GET', '/admin/reports/nope', { token: tokens.admin })).code).toBe('report_not_found')
  })
})

describe('POST /admin/reports/:id/resolve', () => {
  it('hides the reported service with the message and notifies the reporter without details', () => {
    const resolved = call<Report>('POST', '/admin/reports/rep-1/resolve', {
      token: tokens.admin,
      body: { action: 'hide_service', message: 'Área de atendimento falsa.', internalNote },
    })
    const database = getMockDatabase()

    expect(resolved).toMatchObject({ status: 'resolved', resolution: { action: 'hide_service', message: 'Área de atendimento falsa.', internalNote } })
    expect(database.services.find((service) => service.id === 'svc-12')).toMatchObject({ status: 'hidden', hiddenReason: 'Área de atendimento falsa.' })
    const reporterNotification = database.notifications.filter((notification) => notification.userId === 'usr-1').at(-1)
    expect(reporterNotification).toMatchObject({ type: 'report_resolved', title: 'Sua denúncia foi analisada.', link: '/notificacoes' })
    expect(reporterNotification?.body).toBeUndefined()
    expect(database.notifications.some((notification) => notification.body?.includes(internalNote))).toBe(false)
    expect(database.adminActions.slice(-2).map((action) => action.action)).toEqual(['hide_service', 'resolve_report'])
    expect(captureError(() => call('POST', '/admin/reports/rep-1/resolve', { token: tokens.admin, body: { action: 'archive', internalNote } })).code).toBe(
      'invalid_transition',
    )
  })

  it('hides a review and removes it from the averages', () => {
    const database = getMockDatabase()
    const review = database.reviews.find((candidate) => candidate.id === 'rev-1') as Review
    const service = database.services.find((candidate) => candidate.id === review.serviceId)!
    const before = { rating: service.rating, reviewCount: service.reviewCount }
    const created = report(tokens.provider, 'review', 'rev-1')

    call('POST', `/admin/reports/${created.id}/resolve`, { token: tokens.admin, body: { action: 'hide_review', internalNote } })

    expect(review.hidden).toBe(true)
    expect(service.reviewCount).toBe(before.reviewCount - 1)
    const expected = before.reviewCount - 1 === 0 ? 0 : (before.rating * before.reviewCount - review.rating) / (before.reviewCount - 1)
    expect(service.rating).toBeCloseTo(expected, 5)
  })

  it('warns the chosen party of a request', () => {
    const created = report(tokens.producer, 'request', 'req-10')
    expect(
      captureError(() => call('POST', `/admin/reports/${created.id}/resolve`, { token: tokens.admin, body: { action: 'warn', message: 'Cumpra o combinado.', internalNote } })).fields,
    ).toEqual({ targetUserId: 'Escolha o produtor ou o prestador da solicitação.' })

    const resolved = call<Report>('POST', `/admin/reports/${created.id}/resolve`, {
      token: tokens.admin,
      body: { action: 'warn', targetUserId: 'prv-1', message: 'Cumpra o combinado.', internalNote },
    })

    expect(resolved.resolution?.targetUserId).toBe('prv-1')
    expect(getMockDatabase().notifications.find((notification) => notification.userId === 'prv-1' && notification.type === 'warning')).toMatchObject({
      title: 'Aviso da administração',
      body: 'Cumpra o combinado.',
      link: '/prestador/notificacoes',
    })
  })

  it('suspends the reported user', () => {
    const created = report(tokens.producer, 'user', 'prv-1')
    call('POST', `/admin/reports/${created.id}/resolve`, { token: tokens.admin, body: { action: 'suspend', message: 'Golpes recorrentes.', internalNote } })

    expect(getMockDatabase().users.find((user) => user.id === 'prv-1')?.status).toBe('suspended')
  })

  it('archives without touching the target and validates the action', () => {
    expect(captureError(() => call('POST', '/admin/reports/rep-1/resolve', { token: tokens.admin, body: { action: 'hide_review', internalNote } })).fields).toEqual({
      action: 'Ação não permitida para esta denúncia.',
    })
    expect(captureError(() => call('POST', '/admin/reports/rep-1/resolve', { token: tokens.admin, body: { action: 'warn', internalNote } })).fields).toEqual({
      message: 'Escreva a mensagem para o usuário.',
    })
    expect(captureError(() => call('POST', '/admin/reports/rep-1/resolve', { token: tokens.admin, body: { action: 'archive' } })).fields).toEqual({
      internalNote: 'Escreva a nota interna com pelo menos 5 caracteres.',
    })

    const archived = call<Report>('POST', '/admin/reports/rep-1/resolve', { token: tokens.admin, body: { action: 'archive', internalNote } })
    expect(archived.status).toBe('dismissed')
    expect(getMockDatabase().services.find((service) => service.id === 'svc-12')?.status).toBe('active')
    expect(getMockDatabase().adminActions.at(-1)?.action).toBe('dismiss_report')
  })
})
