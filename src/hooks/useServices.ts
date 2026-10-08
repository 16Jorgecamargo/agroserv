import { useCallback } from 'react'
import { categoryService } from '../services/categoryService'
import { serviceService } from '../services/serviceService'
import type { Paginated, ServiceFilters } from '../types/api'
import type { Service } from '../types/entities'
import { useAsync } from './useAsync'

type ServicePageFilters = Omit<ServiceFilters, 'page' | 'pageSize'>

export function useServicePages({ q, location, category }: ServicePageFilters, pageSize: number, pageCount: number) {
  const fetcher = useCallback(async (): Promise<Paginated<Service>> => {
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, index) =>
        serviceService.list({ q, location, category, page: index + 1, pageSize }),
      ),
    )
    const last = pages[pages.length - 1]
    return { data: pages.flatMap((page) => page.data), meta: last.meta }
  }, [q, location, category, pageSize, pageCount])
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
