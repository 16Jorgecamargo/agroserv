import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/api/apiError'
import { useAction } from './useAction'

describe('useAction', () => {
  it('ignores a second invocation while the first action is pending', async () => {
    let resolveAction: (() => void) | undefined
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve
        }),
    )

    const { result } = renderHook(() => useAction(action))
    let firstExecution: Promise<void | undefined> | undefined
    let secondExecution: Promise<void | undefined> | undefined

    act(() => {
      firstExecution = result.current.execute()
    })

    expect(result.current.isPending).toBe(true)

    act(() => {
      secondExecution = result.current.execute()
    })

    expect(action).toHaveBeenCalledTimes(1)
    await expect(secondExecution).resolves.toBeUndefined()

    await act(async () => {
      resolveAction?.()
      await firstExecution
    })

    expect(result.current.isPending).toBe(false)
  })

  it('exposes field errors from a 422 ApiError', async () => {
    const validationError = Object.assign(
      new ApiError({
        status: 422,
        code: 'validation_error',
        message: 'Revise os campos destacados.',
      }),
      {
        fields: {
          email: 'Este e-mail já está cadastrado.',
        },
      },
    )
    const action = vi.fn().mockRejectedValue(validationError)
    const { result } = renderHook(() => useAction(action))

    await act(async () => {
      await expect(result.current.execute()).rejects.toBe(validationError)
    })

    expect(result.current.error).toBe('Revise os campos destacados.')
    expect(result.current.fields).toEqual({
      email: 'Este e-mail já está cadastrado.',
    })
    expect(result.current.isPending).toBe(false)
  })
})