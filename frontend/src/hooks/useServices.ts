import { useCallback } from 'react'
import { categoryService } from '../services/categoryService'
import { serviceService } from '../services/serviceService'
import type { Paginated, ServiceFilters } from '../types/api'
import type { Service } from '../types/entities'
import { useAsync } from './useAsync'

type ServicePageFilters = Omit<ServiceFilters, 'page' | 'pageSize'>

export function useServicePages(filters: ServicePageFilters, pageSize: number, pageCount: number) {
  const filterKey = JSON.stringify(filters)
  const fetcher = useCallback(async (): Promise<Paginated<Service>> => {
    const parsed = JSON.parse(filterKey) as ServicePageFilters
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, index) => serviceService.list({ ...parsed, page: index + 1, pageSize })),
    )
    const last = pages[pages.length - 1]
    return { data: pages.flatMap((page) => page.data), meta: last.meta }
  }, [filterKey, pageSize, pageCount])
  return useAsync(fetcher)
}

const MAP_PAGE_SIZE = 60

export function useAllServices(filters: ServicePageFilters, isEnabled: boolean) {
  const filterKey = JSON.stringify(filters)
  const fetcher = useCallback(async (): Promise<Service[] | null> => {
    if (!isEnabled) return null
    const parsed = JSON.parse(filterKey) as ServicePageFilters
    const first = await serviceService.list({ ...parsed, page: 1, pageSize: MAP_PAGE_SIZE })
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, index) =>
        serviceService.list({ ...parsed, page: index + 2, pageSize: MAP_PAGE_SIZE }),
      ),
    )
    return [first, ...rest].flatMap((page) => page.data)
  }, [filterKey, isEnabled])
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
