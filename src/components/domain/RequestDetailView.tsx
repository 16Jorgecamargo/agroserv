import { AlertTriangle, ArrowRight, CalendarDays, MapPin, Phone, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { ServiceRequestDetail } from '../../types/entities'
import {
  ESTIMATE_NOTICE,
  formatArea,
  formatDate,
  formatDateTime,
  formatLocation,
  formatMoney,
  formatQuantity,
} from '../../utils/format'
import { isRequestDatePast, type RequestViewer } from '../../utils/requestDetail'
import { requestEventLabels } from '../../utils/requestStatus'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { StatusBadge } from '../ui/StatusBadge'

interface RequestDetailViewProps {
  request: ServiceRequestDetail
  viewer: RequestViewer
  backTo: string
  backLabel: string
  actions?: ReactNode
  counterOfferActions?: ReactNode
  children?: ReactNode
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-muted/70 p-3">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-text">{children}</dd>
    </div>
  )
}

function CounterOfferCard({ request, actions }: { request: ServiceRequestDetail; actions?: ReactNode }) {
  const offer = request.counterOffer
  if (!offer) return null

  return (
    <section aria-labelledby="counter-offer-heading" className="rounded-card border-2 border-warning/40 bg-warning/5 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Badge tone="warning">Contraproposta</Badge>
        <h2 id="counter-offer-heading" className="text-lg font-semibold text-text">
          Proposta do prestador
        </h2>
      </div>
      <p className="mt-3 text-text">“{offer.message}”</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {offer.date && (
          <div className="rounded-lg bg-surface p-3">
            <dt className="text-xs font-medium text-text-muted">Data</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-text tabular-nums">
              <span className="text-text-muted line-through">{formatDate(request.scheduledDate)}</span>
              <ArrowRight className="size-4 text-text-muted" aria-label="para" />
              <span>{formatDate(offer.date)}</span>
            </dd>
          </div>
        )}
        {offer.value !== undefined && (
          <div className="rounded-lg bg-surface p-3">
            <dt className="text-xs font-medium text-text-muted">Valor estimado</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-text tabular-nums">
              <span className="text-text-muted line-through">{formatMoney(request.value)}</span>
              <ArrowRight className="size-4 text-text-muted" aria-label="para" />
              <span>{formatMoney(offer.value)}</span>
            </dd>
          </div>
        )}
      </dl>
      {actions && <div className="mt-5 flex flex-col gap-3 sm:flex-row">{actions}</div>}
    </section>
  )
}

function Timeline({ request }: { request: ServiceRequestDetail }) {
  return (
    <section aria-labelledby="timeline-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 id="timeline-heading" className="text-xl font-semibold text-text">
        Linha do tempo
      </h2>
      <ol className="mt-5 space-y-5">
        {request.events.map((event, index) => (
          <li key={event.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 size-3 rounded-full bg-primary ring-4 ring-primary-soft" aria-hidden />
              {index < request.events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div className="pb-1">
              <p className="font-semibold text-text">{requestEventLabels[event.type]}</p>
              <p className="text-sm text-text-muted">
                {event.actorName} · <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
              </p>
              {event.note && <p className="mt-1 text-sm text-text">{event.note}</p>}
              {(event.previousDate || event.previousValue !== undefined) && (
                <p className="mt-1 text-xs text-text-muted">
                  Antes: {event.previousDate ? formatDate(event.previousDate) : ''}
                  {event.previousDate && event.previousValue !== undefined ? ' · ' : ''}
                  {event.previousValue !== undefined ? formatMoney(event.previousValue) : ''}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function RequestDetailView({
  request,
  viewer,
  backTo,
  backLabel,
  actions,
  counterOfferActions,
  children,
}: RequestDetailViewProps) {
  const party =
    viewer === 'provider'
      ? { label: 'Produtor', name: request.producer.name, avatarUrl: request.producer.avatarUrl, city: request.producer.city, state: request.producer.state, phone: request.producer.phone }
      : { label: 'Prestador', name: request.provider.name, avatarUrl: request.provider.avatarUrl, city: request.provider.city, state: request.provider.state, phone: request.provider.phone }
  const datePast = isRequestDatePast(request)
  const reason = request.status === 'rejected' ? request.rejectReason : request.status === 'cancelled' ? request.cancelReason : undefined

  return (
    <div className="space-y-6">
      <Link to={backTo} className="text-sm font-semibold text-primary hover:underline">
        ← {backLabel}
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-text-muted">Solicitação {request.id}</p>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">{request.serviceTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {request.serviceRemoved && <Badge tone="neutral">Anúncio removido</Badge>}
            {request.propertyRemoved && <Badge tone="neutral">Propriedade removida</Badge>}
          </div>
        </div>
        {!request.serviceRemoved && viewer !== 'admin' && (
          <Link to={paths.serviceDetail(request.serviceId)} className="text-sm font-semibold text-primary hover:underline">
            Ver anúncio
          </Link>
        )}
      </header>

      {datePast && (
        <div role="alert" className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-warning">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="font-medium">A data pedida já passou.</p>
        </div>
      )}

      {request.status === 'counter_offer' && <CounterOfferCard request={request} actions={counterOfferActions} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section aria-labelledby="summary-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
            <h2 id="summary-heading" className="text-xl font-semibold text-text">
              Resumo
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Data agendada">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <CalendarDays className="size-4 text-text-muted" aria-hidden />
                  {formatDate(request.scheduledDate)}
                </span>
              </Field>
              <Field label="Quantidade">{formatQuantity(request.quantity, request.priceUnit)}</Field>
              <Field label="Valor estimado">
                <span className="tabular-nums">{formatMoney(request.value)}</span>
              </Field>
              <Field label="Local">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-text-muted" aria-hidden />
                  {request.location}
                </span>
              </Field>
            </dl>
            <p className="mt-3 text-xs text-text-muted">{ESTIMATE_NOTICE}</p>
            {request.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-text">Observações</h3>
                <p className="mt-1 text-sm text-text-muted">{request.notes}</p>
              </div>
            )}
            {reason && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-3">
                <h3 className="text-sm font-semibold text-danger">{request.status === 'rejected' ? 'Motivo da recusa' : 'Motivo do cancelamento'}</h3>
                <p className="mt-1 text-sm text-text">{reason}</p>
              </div>
            )}
          </section>

          {viewer !== 'producer' && (
            <section aria-labelledby="property-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
              <h2 id="property-heading" className="flex items-center gap-2 text-xl font-semibold text-text">
                <Sprout className="size-5 text-primary" aria-hidden />
                Propriedade
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Nome">{request.property.name}</Field>
                <Field label="Área">{formatArea(request.property.areaHectares)}</Field>
                <Field label="Culturas">{request.property.crops.join(', ') || 'Não informadas'}</Field>
                <Field label="Acesso">{request.property.accessNotes || 'Sem observações'}</Field>
              </dl>
            </section>
          )}

          <Timeline request={request} />
          {children}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Partes e ações">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold tracking-[0.12em] text-text-muted uppercase">{party.label}</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={party.name} src={party.avatarUrl} />
              <div>
                <p className="font-semibold text-text">{party.name}</p>
                <p className="text-sm text-text-muted">{formatLocation(party.city, party.state)}</p>
              </div>
            </div>
            {party.phone ? (
              <a href={`tel:${party.phone.replace(/\D/g, '')}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Phone className="size-4" aria-hidden />
                {party.phone}
              </a>
            ) : (
              <p className="mt-4 text-xs text-text-muted">O telefone aparece depois que a solicitação é agendada.</p>
            )}
            {viewer === 'admin' && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-text-muted uppercase">Produtor</p>
                <p className="mt-1 font-semibold text-text">{request.producer.name}</p>
                {request.producer.phone && <p className="text-sm text-text-muted">{request.producer.phone}</p>}
              </div>
            )}
          </div>
          {actions && <div className="rounded-card border border-border bg-surface p-5 shadow-card">{actions}</div>}
        </aside>
      </div>
    </div>
  )
}
