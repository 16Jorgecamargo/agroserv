import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { CounterOfferForm } from '../components/domain/CounterOfferForm'
import { RequestConversation } from '../components/domain/RequestConversation'
import { ReportButton } from '../components/domain/ReportButton'
import { RequestDetailView } from '../components/domain/RequestDetailView'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { useToast } from '../hooks/useToast'
import { paths } from '../routes/paths'
import { isOpenRequestStatus } from '../utils/requestStatus'
import { isApiError } from '../services/apiError'
import { providerRequestService } from '../services/providerRequestService'
import type { CounterOfferPayload } from '../types/api'
import type { RequestAction } from '../types/entities'
import { formatDate } from '../utils/format'
import { isRequestDatePast } from '../utils/requestDetail'
import { RequestDetailSkeleton, RequestNotFound } from './RequestDetailPage'

type Dialog = 'reject' | 'cancel' | 'complete' | 'counter' | null

export function ProviderRequestDetailPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const fetcher = useCallback(() => providerRequestService.getById(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  const request = data?.id === id ? data : null
  const [dialog, setDialog] = useState<Dialog>(null)
  const { run, isRunning } = useRequestAction(refetch)
  usePageTitle(request ? `Solicitação ${request.id}` : 'Solicitação')

  if (!request) {
    if (isApiError(error) && error.status === 404) return <RequestNotFound backTo={paths.providerRequests} />
    if (error) return <ErrorState titleAs="h1" message={error.message} onRetry={refetch} />
    return <RequestDetailSkeleton />
  }

  const can = (action: RequestAction) => request.allowedActions.includes(action)
  const datePast = isRequestDatePast(request)
  const waitingStart = request.status === 'accepted' && !can('start')

  async function sendCounterOffer(payload: CounterOfferPayload) {
    try {
      await providerRequestService.counterOffer(id, payload)
    } catch (caught) {
      if (isApiError(caught) && caught.status === 409) {
        toast.error(caught.message)
        setDialog(null)
        refetch()
        return
      }
      throw caught
    }
    toast.success('Contraproposta enviada ao produtor.')
    setDialog(null)
    refetch()
  }

  const hasActions =
    can('accept') || can('reject') || can('counter_offer') || can('start') || can('complete') || can('cancel') || can('report') || waitingStart

  return (
    <>
      <RequestDetailView
        request={request}
        viewer="provider"
        backTo={paths.providerRequests}
        backLabel="Solicitações recebidas"
        actions={
          hasActions ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text">Ações</p>
              {can('accept') && (
                <Button className="w-full" isLoading={isRunning} onClick={() => void run(() => providerRequestService.accept(id), 'Solicitação aceita e agendada.')}>
                  Aceitar
                </Button>
              )}
              {can('counter_offer') && (
                <Button variant={datePast ? 'primary' : 'secondary'} className="w-full" disabled={isRunning} onClick={() => setDialog('counter')}>
                  {datePast ? 'Propor nova data' : 'Fazer contraproposta'}
                </Button>
              )}
              {can('reject') && (
                <Button variant="secondary" className="w-full text-danger" disabled={isRunning} onClick={() => setDialog('reject')}>
                  Recusar
                </Button>
              )}
              {can('start') && (
                <Button className="w-full" isLoading={isRunning} onClick={() => void run(() => providerRequestService.start(id), 'Serviço iniciado.')}>
                  Iniciar serviço
                </Button>
              )}
              {waitingStart && (
                <div>
                  <Button className="w-full" disabled aria-describedby="start-hint">
                    Iniciar serviço
                  </Button>
                  <p id="start-hint" className="mt-1.5 text-xs text-text-muted">
                    Disponível a partir de {formatDate(request.scheduledDate)}, a data agendada.
                  </p>
                </div>
              )}
              {can('complete') && (
                <Button className="w-full" disabled={isRunning} onClick={() => setDialog('complete')}>
                  Concluir serviço
                </Button>
              )}
              {can('cancel') && (
                <Button variant="ghost" className="w-full text-danger" disabled={isRunning} onClick={() => setDialog('cancel')}>
                  Cancelar agendamento
                </Button>
              )}
              {can('report') && (
                <ReportButton
                  className="w-full"
                  title="Denunciar"
                  targets={[
                    { type: 'request', id: request.id, label: 'Esta solicitação' },
                    { type: 'user', id: request.producerId, label: `O produtor ${request.producerName}` },
                  ]}
                />
              )}
            </div>
          ) : undefined
        }
      >
        <RequestConversation requestId={request.id} isOpen={isOpenRequestStatus(request.status)} onClosedConflict={refetch} />
      </RequestDetailView>

      <Modal isOpen={dialog === 'counter'} onClose={() => setDialog(null)} title="Fazer contraproposta" description="Proponha uma nova data, um novo valor total ou os dois.">
        <CounterOfferForm request={request} onSubmit={sendCounterOffer} onCancel={() => setDialog(null)} />
      </Modal>
      <ConfirmDialog
        isOpen={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await run(() => providerRequestService.reject(id, reason), 'Solicitação recusada.')
        }}
        title="Recusar solicitação?"
        description="O produtor recebe o motivo e pode pedir outro serviço."
        confirmLabel="Recusar"
        cancelLabel="Voltar"
        reasonLabel="Motivo da recusa"
        reasonRequired
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await run(() => providerRequestService.cancel(id, reason), 'Agendamento cancelado.')
        }}
        title="Cancelar agendamento?"
        description="O produtor será avisado com o motivo do cancelamento."
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        reasonLabel="Motivo do cancelamento"
        reasonRequired
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={dialog === 'complete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await run(() => providerRequestService.complete(id), 'Serviço concluído. O produtor pode avaliar agora.')
        }}
        title="Concluir serviço?"
        description="O produtor será convidado a avaliar o serviço."
        confirmLabel="Concluir"
        cancelLabel="Voltar"
        showReason={false}
        isLoading={isRunning}
      />
    </>
  )
}
