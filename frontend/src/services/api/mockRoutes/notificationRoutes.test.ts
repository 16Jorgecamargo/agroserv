import { describe, expect, it } from 'vitest'
import type { NotificationList } from '../../../types/api'
import { call, captureError, tokens } from '../../../test/mockApi'
import { notify } from './shared'

describe('notifications', () => {
  it('lists own notifications newest first with the unread count', () => {
    const list = call<NotificationList>('GET', '/me/notifications', { token: tokens.producer })

    expect(list.data.map((notification) => notification.id)).toEqual(['ntf-2', 'ntf-3'])
    expect(list.unreadCount).toBe(1)
    expect(list.data[0]).not.toHaveProperty('userId')
    expect(call<NotificationList>('GET', '/me/notifications', { token: tokens.producer, query: { unreadOnly: 'true' } }).data).toHaveLength(1)
  })

  it('paginates with at most 50 per page', () => {
    for (let index = 0; index < 60; index += 1) notify('usr-1', 'warning', `Aviso ${index}`, '/notificacoes')

    const page = call<NotificationList>('GET', '/me/notifications', { token: tokens.producer, query: { pageSize: 100, page: 2 } })
    expect(page.meta).toMatchObject({ pageSize: 50, page: 2, total: 62, totalPages: 2 })
    expect(page.data).toHaveLength(12)
  })

  it('marks one or all as read and hides notifications from other users', () => {
    expect(captureError(() => call('POST', '/me/notifications/ntf-1/read', { token: tokens.producer })).code).toBe('notification_not_found')

    call('POST', '/me/notifications/ntf-2/read', { token: tokens.producer })
    expect(call<NotificationList>('GET', '/me/notifications', { token: tokens.producer }).unreadCount).toBe(0)

    call('POST', '/me/notifications/read-all', { token: tokens.admin })
    expect(call<NotificationList>('GET', '/me/notifications', { token: tokens.admin }).unreadCount).toBe(0)
  })

  it('notifies the producer when the provider accepts a request', () => {
    call('POST', '/provider/requests/req-14/accept', { token: tokens.provider })

    const latest = call<NotificationList>('GET', '/me/notifications', { token: tokens.producer }).data[0]
    expect(latest).toMatchObject({ type: 'request_status', title: 'Sua solicitação foi agendada', link: '/solicitacoes/req-14', read: false })
  })
})
