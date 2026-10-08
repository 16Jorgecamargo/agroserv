import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ClipboardList, Inbox, Search, Timer, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { StatsCard } from '../components/domain/StatsCard'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useDashboard } from '../hooks/useRequests'
import { paths } from '../routes/paths'
import type { ProducerDashboardStats } from '../types/api'
import { formatCurrency, getFirstName } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

interface StatItem {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

function buildStatItems(stats: ProducerDashboardStats): StatItem[] {
  return [
    { label: 'Solicitações abertas', value: String(stats.open), description: 'Pendentes ou aceitas', icon: ClipboardList },
    { label: 'Em andamento', value: String(stats.inProgress), description: 'Serviços em execução', icon: Timer },
    { label: 'Concluídos', value: String(stats.completed), description: 'Finalizados com sucesso', icon: CheckCircle2 },
    {
      label: 'Total contratado',
      value: formatCurrency(stats.totalSpent),
      description: 'Aceitos, em andamento e concluídos',
      icon: Wallet,
    },
  ]
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const { user } = useAuth()
  const { data, error, refetch } = useDashboard()

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">
            Olá, {user ? getFirstName(user.name) : 'produtor'}
          </h1>
          <p className="mt-1 text-text-muted">Acompanhe suas solicitações e serviços contratados.</p>
        </div>
        <Link to={paths.services} className={buttonClasses('primary', 'md', 'self-start sm:self-auto')}>
          <Search className="size-4" aria-hidden />
          Buscar serviços
        </Link>
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
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                {buildStatItems(data.stats).map((item) => (
                  <motion.div key={item.label} variants={fadeUp}>
                    <StatsCard {...item} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <span className="sr-only">Carregando resumo…</span>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-32 rounded-card" />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="recent-heading" className="text-xl font-semibold text-text">
                Solicitações recentes
              </h2>
              <Link to={paths.requests} className={buttonClasses('ghost', 'sm')}>
                Ver todas
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {!data ? (
              <RequestsTableSkeleton />
            ) : data.recentRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nenhuma solicitação ainda"
                description="Encontre um serviço e acompanhe tudo por aqui."
                action={
                  <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                    Buscar serviços
                  </Link>
                }
              />
            ) : (
              <RequestsTable requests={data.recentRequests} caption="Solicitações recentes" />
            )}
          </section>
        </>
      )}
    </div>
  )
}
