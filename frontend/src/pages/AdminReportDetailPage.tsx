import { SearchX } from 'lucide-react'
import { useCallback, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ReportResolutionForm } from '../components/admin/ReportResolutionForm'
import { ReviewItem } from '../components/domain/ReviewItem'
import { ServiceImage } from '../components/domain/ServiceImage'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import { isApiError } from '../services/apiError'
import type { ReportDetail } from '../types/api'
import type { Review, Service, ServiceRequestDetail, User } from '../types/entities'
import { roleLabels, userStatusLabels, userStatusTones } from '../utils/adminLabels'
import { formatDateTime } from '../utils/format'
import { reportActionLabels, reportReasonLabels, reportStatusLabels, reportStatusTones, reportTargetLabels } from '../utils/reportLabels'
import { serviceStatusLabels, serviceStatusTones } from '../utils/serviceStatus'

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 id={id} className="text-lg font-semibold text-text">
        {title}
      </h2>
      {children}
    </section>
  )
}

function ServiceTarget({ service }: { service: Service }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ServiceImage src={service.imageUrl} alt={service.title} className="h-24 w-full rounded-lg object-cover sm:w-36" />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={paths.serviceDetail(service.id)} className="font-semibold text-text hover:text-primary">
            {service.title}
          </Link>
          <Badge tone={serviceStatusTones[service.status]}>{serviceStatusLabels[service.status]}</Badge>
        </div>
        <Link to={paths.adminUserDetail(service.providerId)} className="text-sm text-text-muted hover:text-primary">
          {service.providerName}
        </Link>
        {service.hiddenReason && <p className="text-sm text-danger">Motivo: {service.hiddenReason}</p>}
      </div>
    </div>
  )
}

function UserTarget({ user }: { user: User }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={paths.adminUserDetail(user.id)} className="font-semibold text-text hover:text-primary">
        {user.name}
      </Link>
      <Badge tone="primary">{roleLabels[user.role]}</Badge>
      <Badge tone={userStatusTones[user.status]}>{userStatusLabels[user.status]}</Badge>
    </div>
  )
}

function RequestTarget({ request, messages }: { request: ServiceRequestDetail; messages: ReportDetail['messages'] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to={paths.adminRequestDetail(request.id)} className="font-semibold text-text hover:text-primary">
          {request.serviceTitle}
        </Link>
        <StatusBadge status={request.status} />
      </div>
      <p className="text-sm text-text-muted">
        <Link to={paths.adminUserDetail(request.producerId)} className="hover:text-primary">
          {request.producerName}
        </Link>{' '}
        →{' '}
        <Link to={paths.adminUserDetail(request.providerId)} className="hover:text-primary">
          {request.providerName}
        </Link>
      </p>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-text">Conversa</h3>
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhuma mensagem trocada.</p>
        ) : (
          <ol aria-label="Mensagens da solicitação" className="space-y-2">
            {messages.map((message) => (
              <li key={message.id} className="rounded-lg bg-surface-muted p-3">
                <p className="text-xs text-text-muted">
                  {message.senderName} · <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                </p>
                <p className="mt-1 text-sm whitespace-pre-line text-text">{message.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function TargetView({ detail }: { detail: ReportDetail }) {
  const { report, target } = detail
  if (report.targetType === 'service') return <ServiceTarget service={target as Service} />
  if (report.targetType === 'review') return <ReviewItem review={target as Review} showService />
  if (report.targetType === 'request') return <RequestTarget request={target as ServiceRequestDetail} messages={detail.messages} />
  return <UserTarget user={target as User} />
}

export function AdminReportDetailPage() {
  const { id = '' } = useParams()
  const fetcher = useCallback(() => adminService.getReport(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  usePageTitle(data ? `Denúncia: ${data.report.targetLabel}` : 'Denúncia')

  if (!data) {
    if (error && isApiError(error) && error.status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="Denúncia não encontrada"
          description="Ela pode ter sido removida."
          action={
            <Link to={paths.adminReports} className="font-semibold text-primary hover:underline">
              Voltar para denúncias
            </Link>
          }
        />
      )
    }
    if (error) return <ErrorState message={error.message} onRetry={refetch} />
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Carregando denúncia…</span>
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    )
  }

  const { report } = data

  return (
    <div className="space-y-6">
      <Link to={paths.adminReports} className="text-sm font-semibold text-primary hover:underline">
        ← Voltar para denúncias
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{reportTargetLabels[report.targetType]}</Badge>
          <Badge tone={reportStatusTones[report.status]}>{reportStatusLabels[report.status]}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-text">{report.targetLabel}</h1>
        <p className="text-sm text-text-muted">
          {reportReasonLabels[report.reason]} · por {report.reporterName} ({roleLabels[report.reporterRole].toLowerCase()}) ·{' '}
          <time dateTime={report.createdAt}>{formatDateTime(report.createdAt)}</time>
        </p>
      </header>

      <Card id="report-description-heading" title="Relato">
        <p className="text-sm whitespace-pre-line text-text">{report.description}</p>
      </Card>

      <Card id="report-target-heading" title="Alvo atual">
        <TargetView detail={data} />
      </Card>

      {report.status === 'open' ? (
        <Card id="report-resolve-heading" title="Analisar">
          <ReportResolutionForm detail={data} onResolved={refetch} />
        </Card>
      ) : (
        report.resolution && (
          <Card id="report-resolution-heading" title="Resultado">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-muted">Ação</dt>
                <dd className="font-medium text-text">{reportActionLabels[report.resolution.action]}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Analisada por</dt>
                <dd className="text-text">
                  {report.resolution.adminName} · <time dateTime={report.resolution.resolvedAt}>{formatDateTime(report.resolution.resolvedAt)}</time>
                </dd>
              </div>
              {report.resolution.message && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-text-muted">Mensagem enviada ao usuário</dt>
                  <dd className="text-text">{report.resolution.message}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-xs text-text-muted">Nota interna (só administradores)</dt>
                <dd className="text-text">{report.resolution.internalNote}</dd>
              </div>
            </dl>
          </Card>
        )
      )}
    </div>
  )
}
