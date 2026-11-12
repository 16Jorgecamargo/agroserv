import { Megaphone } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ServiceForm } from '../components/domain/ServiceForm'
import { PageHeader } from '../components/layout/PageHeader'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { paths } from '../routes/paths'
import { isApiError } from '../services/apiError'
import { categoryService } from '../services/categoryService'
import { equipmentService } from '../services/equipmentService'
import { myServicesService } from '../services/myServicesService'
import type { ServicePayload } from '../types/api'

export function ServiceFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  usePageTitle(isEditing ? 'Editar serviço' : 'Novo serviço')
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const loader = useCallback(
    () =>
      Promise.all([
        categoryService.list(),
        id ? myServicesService.getById(id) : Promise.resolve(undefined),
        equipmentService.list().catch(() => []),
      ]),
    [id],
  )
  const { data, error, refetch } = useAsync(loader)

  async function submit(payload: ServicePayload) {
    if (id) {
      await myServicesService.update(id, payload)
      toast.success('Anúncio atualizado.')
    } else {
      await myServicesService.create(payload)
      toast.success('Serviço publicado. Ele já aparece na busca.')
    }
    navigate(paths.providerServices)
  }

  const header = (
    <PageHeader
      icon={Megaphone}
      title={isEditing ? 'Editar serviço' : 'Novo serviço'}
      description={isEditing ? 'As mudanças aparecem no anúncio assim que você salvar.' : 'O anúncio vai para a busca assim que for publicado.'}
    />
  )

  if (error && !data) {
    if (isApiError(error) && error.status === 404) {
      return (
        <EmptyState
          icon={Megaphone}
          titleAs="h1"
          title="Serviço não encontrado"
          description="Ele pode ter sido excluído ou não pertencer à sua conta."
          action={
            <Link to={paths.providerServices} className={buttonClasses('primary', 'md')}>
              Voltar para meus serviços
            </Link>
          }
        />
      )
    }
    return <ErrorState titleAs="h1" message={error.message} onRetry={refetch} />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to={paths.providerServices} className="text-sm font-semibold text-primary hover:underline">
        ← Meus serviços
      </Link>
      {header}
      {!data ? (
        <div role="status" aria-label="Carregando formulário" className="space-y-4">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-48 rounded-card" />
        </div>
      ) : (
        <ServiceForm
          key={data[1]?.id ?? 'new'}
          categories={data[0]}
          equipment={data[2]}
          initial={data[1]}
          defaultCity={user?.city}
          defaultState={user?.state}
          submitLabel={isEditing ? 'Salvar alterações' : 'Publicar serviço'}
          onSubmit={submit}
          onCancel={() => navigate(paths.providerServices)}
        />
      )}
    </div>
  )
}
