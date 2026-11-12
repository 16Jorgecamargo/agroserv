import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refetch: () => void
}

interface SettledResult<T> {
  fetcher: () => Promise<T>
  reloadToken: number
  data: T | null
  error: Error | null
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Erro inesperado.')
}

export function useAsync<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState<SettledResult<T> | null>(null)

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active) setSettled({ fetcher, reloadToken, data, error: null })
      })
      .catch((error: unknown) => {
        if (active) setSettled({ fetcher, reloadToken, data: null, error: toError(error) })
      })
    return () => {
      active = false
    }
  }, [fetcher, reloadToken])

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])
  const isCurrent = settled !== null && settled.fetcher === fetcher && settled.reloadToken === reloadToken

  return {
    data: settled?.data ?? null,
    error: isCurrent ? settled.error : null,
    isLoading: !isCurrent,
    refetch,
  }
}
