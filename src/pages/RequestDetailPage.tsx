import { SearchX } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { RequestConversation } from '../components/domain/RequestConversation'
import { ReportButton } from '../components/domain/ReportButton'
import { RequestDetailView } from '../components/domain/RequestDetailView'
import { RequestReviewSection } from '../components/domain/RequestReviewSection'
import { Button } from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonClasses'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { isOpenRequestStatus } from '../utils/requestStatus'
import { isApiError } from '../services/apiError'
import { requestService } from '../services/requestService'

type Dialog = 'cancel' | 'decline' | null

export function RequestDetailSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Carregando solicitação…</span>
      <Skeleton className="h-10 w-2/3 rounded-md" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    </div>
  )
}

export function RequestNotFound({ backTo }: { backTo: string }) {
  return (
    <EmptyState
      icon={SearchX}
      titleAs="h1"
      title="Solicitação não encontrada"
      description="Ela pode não existir ou não pertencer à sua conta."
      action={
        <Link to={backTo} className={buttonClasses('primary', 'md')}>
          Voltar para solicitações
        </Link>
      }
    />
  )
}

export function RequestDetailPage() {
  const { id = '' } = useParams()
  const fetcher = useCallback(() => requestService.getById(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  const request = data?.id === id ? data : null
  const [dialog, setDialog] = useState<Dialog>(null)
  const { run, isRunning } = useRequestAction(refetch)
  usePageTitle(request ? `Solicitação ${request.id}` : 'Solicitação')

  if (!request) {
    if (isApiError(error) && error.status === 404) return <RequestNotFound backTo={paths.requests} />
    if (error) return <ErrorState titleAs="h1" message={error.message} onRetry={refetch} />
    return <RequestDetailSkeleton />
  }

  const can = (action: string) => request.allowedActions.includes(action as never)
  const cancelRequiresReason = request.status === 'accepted'

  return (
    <>
      <RequestDetailView
        request={request}
        viewer="producer"
        backTo={paths.requests}
        backLabel="Minhas solicitações"
        counterOfferActions={
          (can('accept_counter_offer') || can('decline_counter_offer')) && (
            <>
              {can('accept_counter_offer') && (
                <Button
                  isLoading={isRunning}
                  onClick={() => void run(() => requestService.acceptCounterOffer(request.id), 'Contraproposta aceita. Serviço agendado.')}
                >
                  Aceitar contraproposta
                </Button>
              )}
              {can('decline_counter_offer') && (
                <Button variant="secondary" disabled={isRunning} onClick={() => setDialog('decline')}>
                  Recusar contraproposta
                </Button>
              )}
            </>
          )
        }
        actions={
          can('cancel') || can('report') ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text">Ações</p>
              {can('cancel') && (
                <Button variant="secondary" className="w-full text-danger" disabled={isRunning} onClick={() => setDialog('cancel')}>
                  Cancelar solicitação
                </Button>
              )}
              {can('report') && (
                <ReportButton
                  className="w-full"
                  title="Denunciar"
                  targets={[
                    { type: 'request', id: request.id, label: 'Esta solicitação' },
                    { type: 'user', id: request.providerId, label: `O prestador ${request.providerName}` },
                  ]}
                />
              )}
            </div>
          ) : undefined
        }
      >
        <RequestReviewSection
          key={`${request.review?.id ?? 'new'}-${request.review?.updatedAt ?? ''}`}
          requestId={request.id}
          review={request.review}
          canReview={can('review')}
          onSaved={refetch}
        />
        <RequestConversation requestId={request.id} isOpen={isOpenRequestStatus(request.status)} onClosedConflict={refetch} />
      </RequestDetailView>

      <ConfirmDialog
        isOpen={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await run(() => requestService.cancel(request.id, reason || undefined), 'Solicitação cancelada.')
        }}
        title="Cancelar solicitação?"
        description={
          cancelRequiresReason
            ? 'O serviço já está agendado. Conte ao prestador o motivo do cancelamento.'
            : 'O prestador será avisado do cancelamento.'
        }
        confirmLabel="Cancelar solicitação"
        cancelLabel="Voltar"
        reasonLabel="Motivo do cancelamento"
        reasonRequired={cancelRequiresReason}
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={dialog === 'decline'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await run(() => requestService.declineCounterOffer(request.id), 'Contraproposta recusada.')
        }}
        title="Recusar contraproposta?"
        description="Recusar encerra a solicitação. Se quiser, faça um novo pedido depois."
        confirmLabel="Recusar"
        cancelLabel="Voltar"
        showReason={false}
        isLoading={isRunning}
      />
    </>
  )
}
