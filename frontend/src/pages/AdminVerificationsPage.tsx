import { BadgeCheck, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { VerificationDocumentCard } from '../components/admin/VerificationDocumentCard'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import type { PendingVerification } from '../types/api'
import { formatCount, formatDateTime, formatLocation } from '../utils/format'

export function AdminVerificationsPage() {
  usePageTitle('Verificações')
  const { data, error, refetch } = useAsync(adminService.listVerifications)
  const { run, isRunning } = useRequestAction(refetch)
  const [rejecting, setRejecting] = useState<PendingVerification | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Verificações</h1>
        <p className="mt-1 text-text-muted">Confira os documentos dos prestadores, dos envios mais antigos para os mais novos.</p>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Carregando verificações…</span>
          <Skeleton className="h-72 rounded-card" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="Nenhuma verificação pendente" description="Quando um prestador enviar documentos, eles aparecem aqui." />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(data.length, 'verificação pendente', 'verificações pendentes')}
          </p>
          <ol className="space-y-6">
            {data.map((item) => (
              <li key={item.provider.id}>
                <article aria-labelledby={`verification-${item.provider.id}`} className="space-y-5 rounded-card border border-border bg-surface p-6 shadow-card">
                  <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={item.provider.name} src={item.provider.avatarUrl} />
                      <div>
                        <h2 id={`verification-${item.provider.id}`} className="text-lg font-semibold text-text">
                          <Link to={paths.adminUserDetail(item.provider.id)} className="hover:text-primary">
                            {item.provider.name}
                          </Link>
                        </h2>
                        <p className="text-sm text-text-muted">
                          {item.email} · {formatLocation(item.provider.city, item.provider.state)}
                        </p>
                      </div>
                    </div>
                    {item.verification.submittedAt && (
                      <p className="text-sm text-text-muted">
                        Enviado em <time dateTime={item.verification.submittedAt}>{formatDateTime(item.verification.submittedAt)}</time>
                      </p>
                    )}
                  </header>
                  <dl className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-text-muted">CPF ou CNPJ</dt>
                      <dd className="font-medium text-text tabular-nums">{item.document || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Experiência</dt>
                      <dd className="font-medium text-text">{formatCount(item.provider.yearsOfExperience, 'ano', 'anos')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-muted">Raio de atendimento</dt>
                      <dd className="font-medium text-text">{item.provider.serviceRadiusKm} km</dd>
                    </div>
                  </dl>
                  <div className="grid gap-4 sm:grid-cols-2" aria-label={`Documentos de ${item.provider.name}`} role="group">
                    {item.verification.documents.map((document) => (
                      <VerificationDocumentCard key={document.uploadId} document={document} />
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="secondary" onClick={() => setRejecting(item)} disabled={isRunning}>
                      <X className="size-4" aria-hidden />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => run(() => adminService.approveVerification(item.provider.id), `${item.provider.name} agora é verificado.`)}
                      disabled={isRunning}
                    >
                      <Check className="size-4" aria-hidden />
                      Aprovar
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      )}

      <ConfirmDialog
        isOpen={rejecting !== null}
        onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          if (rejecting) await run(() => adminService.rejectVerification(rejecting.provider.id, reason), 'Verificação rejeitada.')
        }}
        title={rejecting ? `Rejeitar ${rejecting.provider.name}?` : 'Rejeitar verificação?'}
        description="O prestador recebe o motivo e pode corrigir e enviar de novo."
        confirmLabel="Rejeitar verificação"
        reasonLabel="Motivo da rejeição"
        reasonRequired
        isLoading={isRunning}
      />
    </div>
  )
}
