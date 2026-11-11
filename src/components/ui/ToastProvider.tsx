import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type ToastTone = 'success' | 'error'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const add = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, tone, message }])
      timers.current.set(id, setTimeout(() => dismiss(id), 4000))
    },
    [dismiss],
  )

  const success = useCallback((message: string) => add('success', message), [add])
  const error = useCallback((message: string) => add('error', message), [add])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => {
          const isError = toast.tone === 'error'
          const Icon = isError ? CircleAlert : CheckCircle2

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`flex items-start gap-3 rounded-card border bg-surface p-4 shadow-card ${
                isError ? 'border-danger' : 'border-primary/30'
              }`}
            >
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${isError ? 'text-danger' : 'text-primary'}`}
                aria-hidden="true"
              />
              <p className="flex-1 text-sm text-text">{toast.message}</p>
              <button
                type="button"
                aria-label="Fechar aviso"
                className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => dismiss(toast.id)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider')
  return context
}