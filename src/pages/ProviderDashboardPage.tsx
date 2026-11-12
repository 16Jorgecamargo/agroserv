import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck, CalendarDays, Inbox, Percent, Star, Timer, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { StatsCard } from '../components/domain/StatsCard'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { providerRequestService } from '../services/providerRequestService'
import type { ProviderDashboard } from '../types/api'
import type { ServiceRequest } from '../types/entities'
import { ESTIMATE_NOTICE, formatCurrency, formatRating, getFirstName } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

interface StatItem {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

function buildStatItems(stats: ProviderDashboard['stats']): StatItem[] {
  return [
    { label: 'Novas solicitações', value: String(stats.newRequests), description: 'Aguardando sua resposta', icon: Inbox },
    { label: 'Próximos 7 dias', value: String(stats.upcoming), description: 'Serviços agendados', icon: CalendarCheck },
    { label: 'Em andamento', value: String(stats.inProgress), description: 'Serviços em execução', icon: Timer },
    {
      label: 'Taxa de aceite',
      value: stats.acceptanceRate === null ? '—' : `${Math.round(stats.acceptanceRate * 100)}%`,
      description: 'Respostas dos últimos 90 dias',
      icon: Percent,
    },
    { label: 'Avaliação média', value: stats.averageRating ? formatRating(stats.averageRating) : '—', description: 'Nota do seu perfil', icon: Star },
    { label: 'Concluído no mês', value: formatCurrency(stats.monthEstimatedValue), description: ESTIMATE_NOTICE, icon: Wallet },
  ]
}

function RequestList({ title, id, requests, empty }: { title: string; id: string; requests?: ServiceRequest[]; empty: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 text-xl font-semibold text-text">
        {title}
      </h2>
      {!requests ? (
        <RequestsTableSkeleton />
      ) : requests.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-text-muted">{empty}</p>
      ) : (
        <RequestsTable requests={requests} caption={title} viewer="provider" />
      )}
    </section>
  )
}

export function ProviderDashboardPage() {
  usePageTitle('Painel do prestador')
  const { user } = useAuth()
  const { data, error, refetch } = useAsync(providerRequestService.dashboard)

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Olá, {user ? getFirstName(user.name) : 'prestador'}</h1>
          <p className="mt-1 text-text-muted">Veja o que precisa da sua atenção hoje.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={paths.providerRequests} className={buttonClasses('primary', 'md')}>
            <Inbox className="size-4" aria-hidden />
            Solicitações
          </Link>
          <Link to={paths.providerAgenda} className={buttonClasses('secondary', 'md')}>
            <CalendarDays className="size-4" aria-hidden />
            Agenda
          </Link>
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="sr-only">
              Resumo
            </h2>
            {data ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {buildStatItems(data.stats).map((item) => (
                  <motion.div key={item.label} variants={fadeUp}>
                    <StatsCard {...item} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <span className="sr-only">Carregando resumo…</span>
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-32 rounded-card" />
                ))}
              </div>
            )}
          </section>

          {data && data.pendingRequests.length === 0 && data.upcomingRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Tudo em dia"
              description="Nenhum pedido aguardando resposta e nada agendado para os próximos 7 dias."
              action={
                <Link to={paths.providerServices} className={buttonClasses('secondary', 'md')}>
                  Ver meus serviços
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-10">
              <RequestList id="pending-heading" title="Aguardando resposta" requests={data?.pendingRequests} empty="Nenhum pedido novo." />
              <RequestList id="upcoming-heading" title="Próximos agendados" requests={data?.upcomingRequests} empty="Nada agendado para os próximos 7 dias." />
            </div>
          )}
        </>
      )}
    </div>
  )
}
