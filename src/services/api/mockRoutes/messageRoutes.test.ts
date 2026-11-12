import { describe, expect, it } from 'vitest'
import type { NotificationList } from '../../../types/api'
import type { Message } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

function unreadMessages(token: string) {
  return call<NotificationList>('GET', '/me/notifications', { token }).data.filter((notification) => notification.type === 'message' && !notification.read)
}

describe('request messages', () => {
  it('lists the conversation in chronological order for both parties', () => {
    const producerView = call<Message[]>('GET', '/requests/req-10/messages', { token: tokens.producer })
    const providerView = call<Message[]>('GET', '/requests/req-10/messages', { token: tokens.provider })

    expect(producerView.length).toBeGreaterThan(0)
    expect(providerView).toEqual(producerView)
    expect([...producerView].sort((a, b) => a.createdAt.localeCompare(b.createdAt))).toEqual(producerView)
  })

  it('sends a message and notifies the other party once until it is read', () => {
    const message = call<Message>('POST', '/requests/req-10/messages', { token: tokens.producer, body: { text: '  Chego às 7h.  ' } })
    call('POST', '/requests/req-10/messages', { token: tokens.producer, body: { text: 'Pode ser?' } })

    expect(message).toMatchObject({ text: 'Chego às 7h.', senderRole: 'producer', senderName: 'Carlos Henrique Souza' })
    const unread = unreadMessages(tokens.provider)
    expect(unread).toHaveLength(1)
    expect(unread[0]).toMatchObject({ title: 'Nova mensagem de Carlos Henrique Souza', link: '/prestador/solicitacoes/req-10' })

    call('POST', `/me/notifications/${unread[0].id}/read`, { token: tokens.provider })
    call('POST', '/requests/req-10/messages', { token: tokens.producer, body: { text: 'Confirmado.' } })
    expect(unreadMessages(tokens.provider)).toHaveLength(1)
  })

  it('validates the text and blocks closed conversations', () => {
    expect(captureError(() => call('POST', '/requests/req-10/messages', { token: tokens.producer, body: { text: ' ' } })).fields).toEqual({
      text: 'Escreva uma mensagem de até 2000 caracteres.',
    })
    expect(captureError(() => call('POST', '/requests/req-12/messages', { token: tokens.producer, body: { text: 'Oi' } }))).toMatchObject({
      status: 409,
      message: 'Esta conversa está encerrada.',
    })
  })

  it('hides the conversation from others and lets admins read only reported requests', () => {
    expect(captureError(() => call('GET', '/requests/req-10/messages', { token: tokens.otherProvider })).status).toBe(404)
    expect(captureError(() => call('GET', '/requests/req-10/messages', { token: tokens.admin })).status).toBe(404)

    getMockDatabase().reports.push({
      id: 'rep-x',
      reporterId: 'usr-1',
      reporterName: 'Carlos Henrique Souza',
      reporterRole: 'producer',
      targetType: 'request',
      targetId: 'req-10',
      targetLabel: 'req-10',
      reason: 'other',
      description: 'Problema no atendimento.',
      status: 'open',
      createdAt: new Date().toISOString(),
    })
    expect(call<Message[]>('GET', '/requests/req-10/messages', { token: tokens.admin }).length).toBeGreaterThan(0)
    expect(captureError(() => call('POST', '/requests/req-10/messages', { token: tokens.admin, body: { text: 'Oi' } })).status).toBe(404)
  })
})
