import { useCallback } from 'react'
import { categoryService } from '../services/categoryService'
import { serviceService } from '../services/serviceService'
import type { ServiceFilters } from '../types/api'
import { useAsync } from './useAsync'

export function useServices({ q, location, category, page, pageSize }: ServiceFilters) {
  const fetcher = useCallback(
    () => serviceService.list({ q, location, category, page, pageSize }),
    [q, location, category, page, pageSize],
  )
  return useAsync(fetcher)
}

export function useFeaturedServices(limit: number) {
  const fetcher = useCallback(() => serviceService.featured(limit), [limit])
  return useAsync(fetcher)
}

export function useService(id: string) {
  const fetcher = useCallback(() => serviceService.getById(id), [id])
  return useAsync(fetcher)
}

export function useCategories() {
  return useAsync(categoryService.list)
}
