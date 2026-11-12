import type { RequestStatus } from '../types/entities'

export const requestStatuses: RequestStatus[] = [
  'pending',
  'counter_offer',
  'accepted',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
]

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  counter_offer: 'Contraproposta',
  accepted: 'Agendada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
}

export function isRequestStatus(value: string): value is RequestStatus {
  return (requestStatuses as string[]).includes(value)
}
