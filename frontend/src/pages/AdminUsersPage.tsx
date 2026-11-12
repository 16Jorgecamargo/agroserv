import { Search, UserPlus, Users } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CreateAdminDialog } from '../components/admin/CreateAdminDialog'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Input } from '../components/ui/Input'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import type { Role, UserStatus } from '../types/entities'
import { roleLabels, userStatusLabels, userStatusTones } from '../utils/adminLabels'
import { cn } from '../utils/cn'
import { formatCount, formatDate } from '../utils/format'

const PAGE_SIZE = 20
const roles: Role[] = ['producer', 'provider', 'admin']
const statuses: Exclude<UserStatus, 'deleted'>[] = ['active', 'suspended']

function parseRole(value: string | null): Role | undefined {
  return roles.find((role) => role === value)
}

function parseStatus(value: string | null): Exclude<UserStatus, 'deleted'> | undefined {
  return statuses.find((status) => status === value)
}

export function AdminUsersPage() {
  usePageTitle('Usuários')
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const role = parseRole(searchParams.get('papel'))
  const status = parseStatus(searchParams.get('situacao'))
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)
  const [term, setTerm] = useState(q)
  const [isCreating, setIsCreating] = useState(false)
  const fetcher = useCallback(
    () => adminService.listUsers({ q: q || undefined, role, status, page, pageSize: PAGE_SIZE }),
    [q, role, status, page],
  )
  const { data, error, isLoading, refetch } = useAsync(fetcher)

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)))
    if (!('pagina' in next)) params.delete('pagina')
    setSearchParams(params)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParams({ q: term.trim() || undefined })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Usuários</h1>
          <p className="mt-1 text-text-muted">Busque contas, veja o histórico e suspenda quando preciso.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <UserPlus className="size-4" aria-hidden />
          Novo administrador
        </Button>
      </div>

      <div className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-[1fr_12rem_12rem]">
        <form role="search" onSubmit={submitSearch} className="flex items-end gap-2">
          <Input
            label="Buscar por nome ou e-mail"
            icon={Search}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            containerClassName="flex-1"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <Select label="Papel" value={role ?? ''} onChange={(event) => updateParams({ papel: event.target.value || undefined })}>
          <option value="">Todos</option>
          {roles.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </Select>
        <Select label="Situação" value={status ?? ''} onChange={(event) => updateParams({ situacao: event.target.value || undefined })}>
          <option value="">Todas</option>
          {statuses.map((option) => (
            <option key={option} value={option}>
              {userStatusLabels[option]}
            </option>
          ))}
        </Select>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando usuários…</span>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-card" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste a busca ou os filtros." />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-4 transition-opacity', isLoading && 'opacity-60')}>
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(data.meta.total, 'conta', 'contas')}
          </p>
          <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Lista de usuários</caption>
              <thead className="border-b border-border bg-surface-muted/60 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Nome</th>
                  <th scope="col" className="px-5 py-3">Papel</th>
                  <th scope="col" className="px-5 py-3">Situação</th>
                  <th scope="col" className="px-5 py-3">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface-muted/50">
                    <td className="px-5 py-4">
                      <Link to={paths.adminUserDetail(user.id)} className="font-semibold text-text hover:text-primary">
                        {user.name}
                      </Link>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-text-muted">{roleLabels[user.role]}</td>
                    <td className="px-5 py-4">
                      <Badge tone={userStatusTones[user.status]}>{userStatusLabels[user.status]}</Badge>
                    </td>
                    <td className="px-5 py-4 text-text-muted tabular-nums">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onChange={(next) => updateParams({ pagina: String(next) })} />
        </div>
      )}

      <CreateAdminDialog isOpen={isCreating} onClose={() => setIsCreating(false)} onCreated={refetch} />
    </div>
  )
}
