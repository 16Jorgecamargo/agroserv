import { describe, expect, it } from 'vitest'
import { isRequestStatus, requestStatuses, requestStatusLabels } from './requestStatus'

describe('request statuses', () => {
  it('includes every lifecycle status and its Portuguese label', () => {
    expect(requestStatuses).toEqual([
      'pending',
      'counter_offer',
      'accepted',
      'in_progress',
      'completed',
      'rejected',
      'cancelled',
    ])
    expect(requestStatusLabels).toEqual({
      pending: 'Pendente',
      counter_offer: 'Contraproposta',
      accepted: 'Agendada',
      in_progress: 'Em andamento',
      completed: 'Concluída',
      rejected: 'Recusada',
      cancelled: 'Cancelada',
    })
  })

  it('recognizes new and invalid statuses', () => {
    expect(isRequestStatus('counter_offer')).toBe(true)
    expect(isRequestStatus('rejected')).toBe(true)
    expect(isRequestStatus('invalid')).toBe(false)
  })
})
