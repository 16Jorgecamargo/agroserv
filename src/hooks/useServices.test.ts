import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { serviceService } from '../services/serviceService'
import { useServicePages } from './useServices'

describe('useServicePages', () => {
  it('requests each page with a fixed page size and merges the results', async () => {
    const list = vi.spyOn(serviceService, 'list')
    const { result } = renderHook(() => useServicePages({ category: undefined }, 9, 2))
    await waitFor(() => expect(result.current.data?.data).toHaveLength(12))
    expect(result.current.data?.meta.total).toBe(12)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 9 }))
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 9 }))
    list.mockRestore()
  })
})
