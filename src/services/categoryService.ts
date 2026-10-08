import type { Category } from '../types/entities'
import { apiClient } from './api/apiClient'

export const categoryService = {
  list(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories')
  },
}
