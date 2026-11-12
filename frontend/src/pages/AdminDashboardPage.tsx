import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Flag, Megaphone, ShieldCheck, Sprout, Tractor, UserPlus, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DemoRestoreAction } from '../components/domain/DemoRestoreAction'
import { StatsCard } from '../components/domain/StatsCard'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { accountService } from '../services/accountService'
import { adminService } from '../services/adminService'
import type { AdminDashboard } from '../types/api'
import { formatCount } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'
import { requestStatuses, requestStatusLabels } from '../utils/requestStatus'

interface StatItem {
  label: string
  value: number
  description: string
  icon: LucideIcon
}

function buildStatItems(data: AdminDashboard): StatItem[] {
  return [
    { label: 'Produtores', value: data.users.producers, description: 'Contas de produtor', icon: Sprout },
    { label: 'Prestadores', value: data.users.providers, description: 'Contas de prestador', icon: Tractor },
    { label: 'Administradores', value: data.users.admins, description: 'Contas de administrador', icon: ShieldCheck },
    { label: 'Novos cadastros', value: data.newUsersLast7Days, description: 'Últimos 7 dias', icon: UserPlus },
    { label: 'Serviços ativos', value: data.activeServices, description: 'Visíveis na busca', icon: Megaphone },
  ]
}

function QueueLink({ to, label, count, icon: Icon }: { to: string; label: string; count: number; icon: LucideIcon }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-medium text-text-muted">{label}</span>
          <span className="block text-3xl font-bold tabular-nums text-text">{count}</span>
        </span>
      </span>
      <ArrowRight className="size-5 text-text-muted transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  )
}

function BarList({ items, caption }: { items: { label: string; value: number }[]; caption: string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul aria-label={caption} className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-text">{item.label}</span>
          <span className="h-2 rounded-full bg-surface-muted" aria-hidden>
            <span className="block h-2 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="tabular-nums font-semibold text-text">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Carregando painel…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-32 rounded-card" />
      ))}
    </div>
  )
}

export function AdminDashboardPage() {
  usePageTitle('Painel do administrador')
  const { data, error, refetch } = useAsync(adminService.dashboard)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Painel do administrador</h1>
        <p className="mt-1 text-text-muted">Números da plataforma e filas que precisam de atenção.</p>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section aria-labelledby="queues-heading" className="space-y-4">
            <h2 id="queues-heading" className="text-xl font-semibold text-text">
              Filas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <QueueLink to={paths.adminVerifications} label="Verificações pendentes" count={data.pendingVerifications} icon={BadgeCheck} />
              <QueueLink to={paths.adminReports} label="Denúncias abertas" count={data.openReports} icon={Flag} />
            </div>
          </section>

          <section aria-labelledby="summary-heading" className="space-y-4">
            <h2 id="summary-heading" className="text-xl font-semibold text-text">
              Resumo
            </h2>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {buildStatItems(data).map((item) => (
                <motion.div key={item.label} variants={fadeUp}>
                  <StatsCard label={item.label} value={String(item.value)} description={item.description} icon={item.icon} />
                </motion.div>
              ))}
            </motion.div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="status-heading" className="rounded-card border border-border bg-surface p-6 shadow-card">
              <h2 id="status-heading" className="mb-4 text-lg font-semibold text-text">
                Solicitações por status
              </h2>
              <BarList
                caption="Solicitações por status"
                items={requestStatuses.map((status) => ({ label: requestStatusLabels[status], value: data.requestsByStatus[status] ?? 0 }))}
              />
            </section>
            <section aria-labelledby="categories-heading" className="rounded-card border border-border bg-surface p-6 shadow-card">
              <h2 id="categories-heading" className="mb-4 text-lg font-semibold text-text">
                Categorias mais solicitadas
              </h2>
              {data.topCategories.length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma solicitação registrada ainda.</p>
              ) : (
                <BarList caption="Categorias mais solicitadas" items={data.topCategories.map((category) => ({ label: category.name, value: category.requests }))} />
              )}
              <p className="mt-4 text-xs text-text-muted">
                {formatCount(data.topCategories.reduce((total, category) => total + category.requests, 0), 'solicitação', 'solicitações')} nas 5 primeiras
              </p>
            </section>
          </div>

          {accountService.canRestoreDemoData && (
          <section aria-labelledby="demo-heading" className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 id="demo-heading" className="text-lg font-semibold text-text">
              Dados demo
            </h2>
            <p className="mt-1 text-sm text-text-muted">Volta todas as contas e registros ao estado inicial da demonstração.</p>
            <DemoRestoreAction />
          </section>
          )}
        </>
      )}
    </div>
  )
}
