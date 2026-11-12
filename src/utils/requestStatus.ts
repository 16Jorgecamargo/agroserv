import type { RequestEventType, RequestStatus } from '../types/entities'

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

export const openRequestStatuses: RequestStatus[] = ['pending', 'counter_offer', 'accepted', 'in_progress']

export function isOpenRequestStatus(status: RequestStatus): boolean {
  return openRequestStatuses.includes(status)
}

export const requestEventLabels: Record<RequestEventType, string> = {
  created: 'Solicitação criada',
  accepted: 'Solicitação aceita e agendada',
  rejected: 'Solicitação recusada',
  counter_offer: 'Contraproposta enviada',
  counter_offer_accepted: 'Contraproposta aceita',
  counter_offer_declined: 'Contraproposta recusada',
  started: 'Serviço iniciado',
  completed: 'Serviço concluído',
  cancelled: 'Solicitação cancelada',
}
