import { ShieldOff, ShieldCheck, UserX } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { AdminActionList } from '../components/admin/AdminActionList'
import { RequestsTable } from '../components/domain/RequestsTable'
import { ReviewItem } from '../components/domain/ReviewItem'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import { isApiError } from '../services/apiError'
import { roleLabels, userStatusLabels, userStatusTones, verificationStatusLabels } from '../utils/adminLabels'
import { formatDate, formatLocation } from '../utils/format'
import { serviceStatusLabels, serviceStatusTones } from '../utils/serviceStatus'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 id={id} className="text-lg font-semibold text-text">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm text-text">{value}</dd>
    </div>
  )
}

export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const { user: viewer } = useAuth()
  const fetcher = useCallback(() => adminService.getUser(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  const { run, isRunning } = useRequestAction(refetch)
  const [dialog, setDialog] = useState<'suspend' | 'reactivate' | null>(null)
  usePageTitle(data ? data.user.name : 'Usuário')

  if (error && !data) {
    if (isApiError(error) && error.status === 404) {
      return (
        <EmptyState
          icon={UserX}
          title="Usuário não encontrado"
          description="A conta não existe ou foi excluída."
          action={
            <Link to={paths.adminUsers} className="font-semibold text-primary hover:underline">
              Voltar para usuários
            </Link>
          }
        />
      )
    }
    return <ErrorState message={error.message} onRetry={refetch} />
  }

  if (!data) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Carregando usuário…</span>
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    )
  }

  const { user, providerProfile, requests, services, reviews, actions } = data
  const isSelf = viewer?.id === user.id

  return (
    <div className="space-y-6">
      <Link to={paths.adminUsers} className="text-sm font-semibold text-primary hover:underline">
        ← Voltar para usuários
      </Link>

      <header className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-text">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{roleLabels[user.role]}</Badge>
              <Badge tone={userStatusTones[user.status]}>{userStatusLabels[user.status]}</Badge>
            </div>
          </div>
        </div>
        {!isSelf &&
          (user.status === 'suspended' ? (
            <Button variant="secondary" onClick={() => setDialog('reactivate')} disabled={isRunning}>
              <ShieldCheck className="size-4" aria-hidden />
              Reativar conta
            </Button>
          ) : (
            <Button className="bg-danger hover:bg-danger/90" onClick={() => setDialog('suspend')} disabled={isRunning}>
              <ShieldOff className="size-4" aria-hidden />
              Suspender conta
            </Button>
          ))}
      </header>

      <Section id="user-data-heading" title="Dados">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="E-mail" value={user.email} />
          <Field label="Telefone" value={user.phone ?? '—'} />
          <Field label="Cidade" value={formatLocation(user.city, user.state)} />
          <Field label="Cadastro" value={formatDate(user.createdAt)} />
          {providerProfile && (
            <>
              <Field label="Documento" value={providerProfile.document || '—'} />
              <Field label="Verificação" value={verificationStatusLabels[providerProfile.verificationStatus]} />
              <Field label="Raio de atendimento" value={`${providerProfile.serviceRadiusKm} km`} />
            </>
          )}
        </dl>
      </Section>

      <section aria-labelledby="user-requests-heading" className="space-y-4">
        <h2 id="user-requests-heading" className="text-lg font-semibold text-text">
          Solicitações recentes
        </h2>
        {requests.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-text-muted">Nenhuma solicitação.</p>
        ) : (
          <RequestsTable requests={requests} caption="Solicitações recentes" viewer="admin" />
        )}
      </section>

      {services && (
        <Section id="user-services-heading" title="Anúncios">
          {services.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum anúncio.</p>
          ) : (
            <ul className="divide-y divide-border">
              {services.map((service) => (
                <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link to={paths.serviceDetail(service.id)} className="font-semibold text-text hover:text-primary">
                      {service.title}
                    </Link>
                    {service.hiddenReason && <p className="text-xs text-text-muted">Motivo: {service.hiddenReason}</p>}
                  </div>
                  <Badge tone={serviceStatusTones[service.status]}>{serviceStatusLabels[service.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section id="user-reviews-heading" title={user.role === 'provider' ? 'Avaliações recebidas' : 'Avaliações escritas'}>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma avaliação.</p>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} showService />
            ))}
          </div>
        )}
      </Section>

      <Section id="user-actions-heading" title="Histórico administrativo">
        <AdminActionList actions={actions} empty="Nenhuma ação administrativa sobre esta conta." />
      </Section>

      <ConfirmDialog
        isOpen={dialog === 'suspend'}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await run(() => adminService.suspendUser(user.id, reason), 'Conta suspensa.')
        }}
        title={`Suspender ${user.name}?`}
        description="A conta perde o acesso, as solicitações em aberto são canceladas e a outra parte é avisada."
        confirmLabel="Suspender conta"
        reasonLabel="Motivo da suspensão"
        reasonRequired
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={dialog === 'reactivate'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await run(() => adminService.reactivateUser(user.id), 'Conta reativada.')
        }}
        title={`Reativar ${user.name}?`}
        description="O acesso volta e os anúncios aparecem como estavam. Solicitações canceladas não voltam."
        confirmLabel="Reativar conta"
        showReason={false}
        isLoading={isRunning}
      />
    </div>
  )
}
