import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('starts loading and resolves data', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => useAsync(fetcher))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.data).toBe('ok'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('exposes errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('wraps non-Error rejections', async () => {
    const fetcher = vi.fn().mockRejectedValue('nope')
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.error?.message).toBe('Erro inesperado.'))
  })

  it('keeps previous data while refetching', async () => {
    let resolveSecond: (value: string) => void = () => {}
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(() => new Promise<string>((resolve) => (resolveSecond = resolve)))
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.data).toBe('first'))
    act(() => result.current.refetch())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe('first')
    await act(async () => resolveSecond('second'))
    expect(result.current.data).toBe('second')
    expect(result.current.isLoading).toBe(false)
  })
})
