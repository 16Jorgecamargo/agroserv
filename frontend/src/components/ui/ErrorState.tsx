import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  titleAs?: 'h1' | 'h2' | 'h3'
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar as informações.',
  onRetry,
  titleAs,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      tone="danger"
      role="alert"
      title={title}
      description={message}
      titleAs={titleAs}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Tentar novamente
          </Button>
        )
      }
    />
  )
}
