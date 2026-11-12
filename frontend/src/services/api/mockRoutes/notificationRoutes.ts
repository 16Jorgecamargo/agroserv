import type { NotificationList } from '../../../types/api'
import type { Notification } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { findUserByToken, notFound, paginate, toPositiveInt } from './shared'
import type { MockRoute, RouteContext } from './types'

function ownNotifications(userId: string) {
  return getMockDatabase().notifications.filter((notification) => notification.userId === userId)
}

function listNotifications({ token, query }: RouteContext): NotificationList {
  const user = findUserByToken(token)
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, 20, 50)
  const unreadOnly = query.unreadOnly === true || query.unreadOnly === 'true'
  const own = ownNotifications(user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id, undefined, { numeric: true }))
  const items: Notification[] = (unreadOnly ? own.filter((notification) => !notification.read) : own).map(
    ({ userId: _userId, ...notification }) => notification,
  )

  return { ...paginate(items, page, pageSize), unreadCount: own.filter((notification) => !notification.read).length }
}

function markRead({ token, params }: RouteContext): undefined {
  const user = findUserByToken(token)
  const notification = ownNotifications(user.id).find((candidate) => candidate.id === params.id)
  if (!notification) notFound('notification_not_found', 'Notificação não encontrada.')
  notification.read = true
  persistMockDatabase()
  return undefined
}

function markAllRead({ token }: RouteContext): undefined {
  const user = findUserByToken(token)
  ownNotifications(user.id).forEach((notification) => {
    notification.read = true
  })
  persistMockDatabase()
  return undefined
}

export const notificationRoutes: MockRoute[] = [
  { method: 'GET', pattern: '/me/notifications', handle: listNotifications },
  { method: 'POST', pattern: '/me/notifications/read-all', handle: markAllRead },
  { method: 'POST', pattern: '/me/notifications/:id/read', handle: markRead },
]
