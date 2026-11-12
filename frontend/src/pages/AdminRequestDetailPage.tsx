import { useCallback } from 'react'
import { useParams } from 'react-router'
import { RequestDetailView } from '../components/domain/RequestDetailView'
import { ErrorState } from '../components/ui/ErrorState'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import { isApiError } from '../services/apiError'
import { RequestDetailSkeleton, RequestNotFound } from './RequestDetailPage'

export function AdminRequestDetailPage() {
  const { id = '' } = useParams()
  const fetcher = useCallback(() => adminService.getRequest(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  usePageTitle(data ? data.serviceTitle : 'Solicitação')

  if (!data) {
    if (error && isApiError(error) && error.status === 404) return <RequestNotFound backTo={paths.adminUsers} />
    if (error) return <ErrorState message={error.message} onRetry={refetch} />
    return <RequestDetailSkeleton />
  }

  return (
    <RequestDetailView
      request={data}
      viewer="admin"
      backTo={paths.adminUserDetail(data.producerId)}
      backLabel={`Voltar para ${data.producerName}`}
    />
  )
}
