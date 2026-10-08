import { useCallback } from 'react'
import { requestService } from '../services/requestService'
import type { RequestStatusFilter } from '../types/api'
import { useAsync } from './useAsync'

export function useRequests(status: RequestStatusFilter) {
  const fetcher = useCallback(() => requestService.list(status), [status])
  return useAsync(fetcher)
}

export function useDashboard() {
  return useAsync(requestService.getDashboard)
}
