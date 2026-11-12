import { Pencil, Plus, Power, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CategoryFormDialog } from '../components/admin/CategoryFormDialog'
import { CategoryIcon } from '../components/domain/CategoryIcon'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { adminService } from '../services/adminService'
import type { AdminCategory } from '../types/api'
import { formatCount } from '../utils/format'

type Dialog = { kind: 'form'; category?: AdminCategory } | { kind: 'delete'; category: AdminCategory } | null

export function AdminCategoriesPage() {
  usePageTitle('Categorias')
  const { data, error, refetch } = useAsync(adminService.listCategories)
  const { run, isRunning } = useRequestAction(refetch)
  const [dialog, setDialog] = useState<Dialog>(null)

  function toggle(category: AdminCategory) {
    void run(
      () => adminService.updateCategory(category.id, { active: !category.active }),
      category.active ? `${category.name} desativada. Os serviços publicados continuam visíveis.` : `${category.name} ativada.`,
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Categorias</h1>
          <p className="mt-1 text-text-muted">Categoria desativada sai dos filtros e do cadastro de serviços.</p>
        </div>
        <Button onClick={() => setDialog({ kind: 'form' })}>
          <Plus className="size-4" aria-hidden />
          Nova categoria
        </Button>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando categorias…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-card" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhuma categoria" description="Crie a primeira categoria de serviços." />
      ) : (
        <ul aria-label="Lista de categorias" className="divide-y divide-border rounded-card border border-border bg-surface shadow-card">
          {data.map((category) => (
            <li key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <CategoryIcon name={category.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text">{category.name}</p>
                  <Badge tone={category.active ? 'success' : 'neutral'}>{category.active ? 'Ativa' : 'Desativada'}</Badge>
                </div>
                <p className="text-sm text-text-muted">
                  /{category.slug} · {formatCount(category.serviceCount, 'serviço', 'serviços')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: 'form', category })} aria-label={`Editar ${category.name}`}>
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggle(category)} disabled={isRunning} aria-label={`${category.active ? 'Desativar' : 'Ativar'} ${category.name}`}>
                  <Power className="size-4" aria-hidden />
                  {category.active ? 'Desativar' : 'Ativar'}
                </Button>
                {category.serviceCount === 0 && (
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDialog({ kind: 'delete', category })} aria-label={`Apagar ${category.name}`}>
                    <Trash2 className="size-4" aria-hidden />
                    Apagar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog
        isOpen={dialog?.kind === 'form'}
        category={dialog?.kind === 'form' ? dialog.category : undefined}
        onClose={() => setDialog(null)}
        onSaved={refetch}
      />
      <ConfirmDialog
        isOpen={dialog?.kind === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          if (dialog?.kind === 'delete') await run(() => adminService.deleteCategory(dialog.category.id), 'Categoria apagada.')
        }}
        title={dialog?.kind === 'delete' ? `Apagar ${dialog.category.name}?` : 'Apagar categoria?'}
        description="Só categorias sem serviços podem ser apagadas."
        confirmLabel="Apagar categoria"
        showReason={false}
        isLoading={isRunning}
      />
    </div>
  )
}
