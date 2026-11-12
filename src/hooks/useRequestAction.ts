import { useCallback, useRef, useState } from 'react'
import { isApiError } from '../services/apiError'
import { useToast } from './useToast'

export function useRequestAction(onSettled: () => void) {
  const toast = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const runningRef = useRef(false)

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
      if (runningRef.current) return false
      runningRef.current = true
      setIsRunning(true)
      try {
        await action()
        toast.success(successMessage)
        onSettled()
        return true
      } catch (error) {
        const fieldMessage = isApiError(error) && error.fields ? Object.values(error.fields)[0] : undefined
        toast.error(fieldMessage ?? (isApiError(error) ? error.message : 'Não foi possível concluir a ação.'))
        if (isApiError(error) && (error.status === 409 || error.status === 404)) onSettled()
        return false
      } finally {
        runningRef.current = false
        setIsRunning(false)
      }
    },
    [onSettled, toast],
  )

  return { run, isRunning }
}
