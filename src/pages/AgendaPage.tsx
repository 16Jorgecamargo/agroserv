import { CalendarDays, ChevronLeft, ChevronRight, Lock, LockOpen } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { agendaService } from '../services/agendaService'
import type { RequestStatus } from '../types/entities'
import { cn } from '../utils/cn'
import { getTodayInBrasilia } from '../utils/date'
import { formatDate } from '../utils/format'
import { requestStatusLabels } from '../utils/requestStatus'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const statusClasses: Partial<Record<RequestStatus, string>> = {
  accepted: 'bg-primary-soft text-primary',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-primary-strong/10 text-primary-strong',
}

function shiftMonth(month: string, offset: number): string {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1))
  return date.toISOString().slice(0, 7)
}

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthIndex - 1, 1)))
}

function buildDays(month: string): (string | null)[] {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, monthIndex - 1, 1))
  const total = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null)
  for (let day = 1; day <= total; day += 1) cells.push(`${month}-${String(day).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}

export function AgendaPage() {
  usePageTitle('Agenda')
  const today = getTodayInBrasilia()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('mes')
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : today.slice(0, 7)
  const fetcher = useCallback(() => agendaService.get(month), [month])
  const { data, error, refetch } = useAsync(fetcher)
  const { run, isRunning } = useRequestAction(refetch)
  const agenda = data?.month === month ? data : null

  function goTo(next: string) {
    setSearchParams(next === today.slice(0, 7) ? {} : { mes: next })
  }

  return (
    <div className="space-y-8">
      <PageHeader icon={CalendarDays} title="Agenda" description="Veja seus serviços por dia e bloqueie os dias em que não atende." />

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="sm" onClick={() => goTo(shiftMonth(month, -1))} aria-label="Mês anterior">
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <h2 className="text-lg font-semibold text-text capitalize" aria-live="polite">
          {monthLabel(month)}
        </h2>
        <Button variant="secondary" size="sm" onClick={() => goTo(shiftMonth(month, 1))} aria-label="Próximo mês">
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {error && !agenda ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !agenda ? (
        <Skeleton className="h-[32rem] rounded-card" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
          <div role="grid" aria-label={`Agenda de ${monthLabel(month)}`} className="grid min-w-[44rem] grid-cols-7">
            <div role="row" className="contents">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} role="columnheader" className="border-b border-border bg-surface-muted/60 px-2 py-2 text-center text-xs font-semibold text-text-muted uppercase">
                  {weekday}
                </div>
              ))}
            </div>
            {buildDays(month).map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="min-h-28 border-b border-r border-border bg-surface-muted/30" aria-hidden />
              const isBlocked = agenda.blockedDays.includes(day)
              const items = agenda.requests.filter((request) => request.scheduledDate === day)
              const isPast = day < today
              return (
                <div
                  key={day}
                  role="gridcell"
                  aria-label={`${formatDate(day)}${isBlocked ? ', bloqueado' : ''}${items.length ? `, ${items.length} serviços` : ''}`}
                  className={cn('flex min-h-28 flex-col gap-1 border-b border-r border-border p-2', isBlocked && 'bg-danger/5', day === today && 'ring-2 ring-primary ring-inset')}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn('text-sm font-semibold tabular-nums', isPast ? 'text-text-muted' : 'text-text')}>{Number(day.slice(8))}</span>
                    {!isPast && (
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() =>
                          void run(
                            () => (isBlocked ? agendaService.unblock(day) : agendaService.block(day)),
                            isBlocked ? `${formatDate(day)} desbloqueado.` : `${formatDate(day)} bloqueado para novas solicitações.`,
                          )
                        }
                        aria-label={`${isBlocked ? 'Desbloquear' : 'Bloquear'} ${formatDate(day)}`}
                        className={cn('grid size-6 place-items-center rounded-md transition-colors', isBlocked ? 'text-danger hover:bg-danger/10' : 'text-text-muted hover:bg-surface-muted hover:text-text')}
                      >
                        {isBlocked ? <Lock className="size-3.5" aria-hidden /> : <LockOpen className="size-3.5" aria-hidden />}
                      </button>
                    )}
                  </div>
                  {isBlocked && <span className="text-[11px] font-semibold text-danger">Bloqueado</span>}
                  {items.map((request) => (
                    <Link
                      key={request.id}
                      to={paths.providerRequestDetail(request.id)}
                      title={`${request.serviceTitle} · ${request.producerName} · ${requestStatusLabels[request.status]}`}
                      className={cn('truncate rounded px-1.5 py-0.5 text-[11px] font-medium hover:underline', statusClasses[request.status])}
                    >
                      {request.serviceTitle}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ul className="flex flex-wrap gap-4 text-xs text-text-muted" aria-label="Legenda">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary-soft" aria-hidden />Agendado</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-info/20" aria-hidden />Em andamento</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary-strong/20" aria-hidden />Concluído</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-danger/20" aria-hidden />Dia bloqueado (não cancela o que já está agendado)</li>
      </ul>
    </div>
  )
}
