import type { NotificationList } from '../types/api'
import { apiClient } from './api/apiClient'

export const notificationService = {
  list(page = 1, pageSize = 20, unreadOnly = false): Promise<NotificationList> {
    return apiClient.get<NotificationList>('/me/notifications', { page, pageSize, ...(unreadOnly ? { unreadOnly: true } : {}) })
  },
  markRead(id: string): Promise<void> {
    return apiClient.post<void>(`/me/notifications/${encodeURIComponent(id)}/read`)
  },
  markAllRead(): Promise<void> {
    return apiClient.post<void>('/me/notifications/read-all')
  },
}
