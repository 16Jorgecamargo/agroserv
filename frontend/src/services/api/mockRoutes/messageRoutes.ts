import type { Message, User } from '../../../types/entities'
import { isOpenRequestStatus } from '../../../utils/requestStatus'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { conflict, findUserByToken, getBody, nextId, notify, requestLinkFor, validationError } from './shared'
import type { MockRoute, RouteContext } from './types'

function requestNotFound(): never {
  throw new ApiError({ status: 404, code: 'request_not_found', message: 'Solicitação não encontrada.' })
}

function loadRequest(user: User, requestId: string, allowAdmin: boolean) {
  const database = getMockDatabase()
  const record = database.requestRecords.find((candidate) => candidate.request.id === requestId)
  if (!record) requestNotFound()
  const request = record.request
  const isParty = (user.role === 'producer' && request.producerId === user.id) || (user.role === 'provider' && request.providerId === user.id)
  const adminCanRead =
    allowAdmin &&
    user.role === 'admin' &&
    database.reports.some((report) => report.targetType === 'request' && report.targetId === request.id)
  if (!isParty && !adminCanRead) requestNotFound()
  return request
}

function listMessages({ token, params }: RouteContext): Message[] {
  const user = findUserByToken(token)
  const request = loadRequest(user, params.id, true)
  return getMockDatabase()
    .messages.filter((message) => message.requestId === request.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id, undefined, { numeric: true }))
}

function sendMessage({ token, params, body }: RouteContext): Message {
  const user = findUserByToken(token)
  const request = loadRequest(user, params.id, false)
  const raw = getBody(body).text
  const text = typeof raw === 'string' ? raw.trim() : ''

  if (!isOpenRequestStatus(request.status)) conflict('Esta conversa está encerrada.')
  if (!text || text.length > 2000) validationError({ text: 'Escreva uma mensagem de até 2000 caracteres.' })

  const database = getMockDatabase()
  const message: Message = {
    id: nextId('msg', database.messages.map((candidate) => candidate.id)),
    requestId: request.id,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text,
    createdAt: new Date().toISOString(),
  }
  database.messages.push(message)

  const recipientRole = user.role === 'producer' ? 'provider' : 'producer'
  const recipientId = recipientRole === 'producer' ? request.producerId : request.providerId
  const link = requestLinkFor(recipientRole, request.id)
  const title = `Nova mensagem de ${user.name}`
  const pending = database.notifications.some(
    (notification) => notification.userId === recipientId && notification.type === 'message' && notification.link === link && notification.title === title && !notification.read,
  )
  if (!pending) notify(recipientId, 'message', title, link)

  persistMockDatabase()
  return message
}

export const messageRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/requests/:id/messages', handle: listMessages },
  { method: 'POST', pattern: '/requests/:id/messages', handle: sendMessage },
]
