import { useCallback, useRef, useState } from 'react'
import { isApiError, type ApiError } from '../services/api/apiError'

type Action<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult | Promise<TResult>

interface UseActionResult<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | undefined>
  isPending: boolean
  error?: string
  fields?: Record<string, string>
  reset: () => void
}

function getFieldErrors(error: ApiError): Record<string, string> | undefined {
  if (error.status !== 422 || !('fields' in error)) return undefined

  const candidate = (error as ApiError & { fields?: unknown }).fields
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return undefined

  const fields: Record<string, string> = {}

  for (const [key, value] of Object.entries(candidate)) {
    if (typeof value === 'string') fields[key] = value
  }

  return Object.keys(fields).length > 0 ? fields : undefined
}

export function useAction<TArgs extends unknown[], TResult>(
  action: Action<TArgs, TResult>,
): UseActionResult<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()
  const [fields, setFields] = useState<Record<string, string>>()
  const pendingRef = useRef(false)

  const reset = useCallback(() => {
    setError(undefined)
    setFields(undefined)
  }, [])

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (pendingRef.current) return undefined

      pendingRef.current = true
      setIsPending(true)
      setError(undefined)
      setFields(undefined)

      try {
        return await action(...args)
      } catch (caughtError) {
        if (isApiError(caughtError)) {
          setError(caughtError.message)
          setFields(getFieldErrors(caughtError))
        } else {
          setError('Não foi possível concluir a ação.')
          setFields(undefined)
        }

        throw caughtError
      } finally {
        pendingRef.current = false
        setIsPending(false)
      }
    },
    [action],
  )

  return { execute, isPending, error, fields, reset }
}