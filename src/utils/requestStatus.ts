import type { RequestStatus } from '../types/entities'

export const requestStatuses: RequestStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export function isRequestStatus(value: string): value is RequestStatus {
  return (requestStatuses as string[]).includes(value)
}
