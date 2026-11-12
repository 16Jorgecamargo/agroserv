import type { Message } from '../types/entities'
import { apiClient } from './api/apiClient'

export const messageService = {
  list(requestId: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`/requests/${encodeURIComponent(requestId)}/messages`)
  },
  send(requestId: string, text: string): Promise<Message> {
    return apiClient.post<Message>(`/requests/${encodeURIComponent(requestId)}/messages`, { text })
  },
}
