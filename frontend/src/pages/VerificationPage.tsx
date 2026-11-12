import { BadgeCheck, Clock, FileText, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ServiceImage } from '../components/domain/ServiceImage'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { FileUploadField, type UploadedFile } from '../components/ui/FileUploadField'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { paths } from '../routes/paths'
import { accountService } from '../services/accountService'
import { isApiError } from '../services/apiError'
import { verificationService } from '../services/verificationService'
import type { ProviderProfile, Verification, VerificationStatus } from '../types/entities'
import { formatDateTime } from '../utils/format'

const statusContent: Record<VerificationStatus, { label: string; description: string; icon: typeof BadgeCheck }> = {
  not_sent: { label: 'Não enviada', description: 'Envie seus documentos para ganhar o selo Verificado.', icon: ShieldAlert },
  under_review: { label: 'Em análise', description: 'A administração está conferindo seus documentos.', icon: Clock },
  approved: { label: 'Aprovada', description: 'O selo Verificado aparece nos seus anúncios e no seu perfil.', icon: ShieldCheck },
  rejected: { label: 'Rejeitada', description: 'Corrija o problema e envie os documentos de novo.', icon: ShieldAlert },
}

function loadPage(): Promise<[Verification, ProviderProfile]> {
  return Promise.all([verificationService.get(), accountService.getProviderProfile()])
}

export function VerificationPage() {
  usePageTitle('Verificação')
  const toast = useToast()
  const { data, error, refetch } = useAsync(loadPage)
  const [identity, setIdentity] = useState<UploadedFile | null>(null)
  const [address, setAddress] = useState<UploadedFile | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSending, setIsSending] = useState(false)

  if (error && !data) return <ErrorState titleAs="h1" message={error.message} onRetry={refetch} />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) return
    const next: Record<string, string> = {}
    if (!identity) next.identityUploadId = 'Envie o documento de identidade.'
    if (!address) next.addressUploadId = 'Envie o comprovante de endereço.'
    setErrors(next)
    if (Object.keys(next).length || !identity || !address) return

    setIsSending(true)
    try {
      await verificationService.submit({ identityUploadId: identity.id, addressUploadId: address.id })
      toast.success('Documentos enviados. Avisaremos quando a análise terminar.')
      setIdentity(null)
      setAddress(null)
      refetch()
    } catch (caught) {
      if (isApiError(caught) && caught.fields) setErrors(caught.fields)
      else toast.error(isApiError(caught) ? caught.message : 'Não foi possível enviar os documentos.')
      if (isApiError(caught) && caught.status === 409) refetch()
    } finally {
      setIsSending(false)
    }
  }

  const header = <PageHeader icon={BadgeCheck} title="Verificação" description="Documentos conferidos pela administração dão o selo Verificado." />

  if (!data) {
    return (
      <div className="space-y-8">
        {header}
        <Skeleton className="h-40 rounded-card" />
      </div>
    )
  }

  const [verification, profile] = data
  const status = statusContent[verification.status]
  const StatusIcon = status.icon
  const canSubmit = verification.status === 'not_sent' || verification.status === 'rejected'
  const missingDocument = !profile.document?.trim()

  return (
    <div className="space-y-8">
      {header}

      <section aria-labelledby="verification-status-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <StatusIcon className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-sm text-text-muted">Situação</p>
            <h2 id="verification-status-heading" className="text-xl font-semibold text-text">
              {status.label}
            </h2>
            <p className="text-sm text-text-muted">{status.description}</p>
            {verification.submittedAt && <p className="text-xs text-text-muted">Enviada em {formatDateTime(verification.submittedAt)}</p>}
          </div>
        </div>
        {verification.status === 'rejected' && verification.rejectionReason && (
          <Alert tone="danger" className="mt-4">
            Motivo: {verification.rejectionReason}
          </Alert>
        )}
        {verification.documents.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Documentos enviados">
            {verification.documents.map((document) => (
              <li key={document.uploadId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                {document.url.startsWith('data:application/pdf') || document.name.toLowerCase().endsWith('.pdf') ? (
                  <span className="grid size-12 place-items-center rounded-md bg-surface-muted text-text-muted">
                    <FileText className="size-5" aria-hidden />
                  </span>
                ) : (
                  <ServiceImage src={document.url} alt={document.name} className="size-12 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{document.kind === 'identity' ? 'Documento de identidade' : 'Comprovante de endereço'}</p>
                  <p className="truncate text-sm font-medium text-text">{document.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canSubmit && (
        <section aria-labelledby="verification-form-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
          <h2 id="verification-form-heading" className="text-xl font-semibold text-text">
            {verification.status === 'rejected' ? 'Enviar de novo' : 'Enviar documentos'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">Imagem ou PDF até 5 MB. Só você e a administração conseguem abrir esses arquivos.</p>
          {missingDocument || errors.document ? (
            <Alert tone="warning" className="mt-4">
              {errors.document ?? 'Preencha o CPF ou CNPJ no seu perfil antes de enviar.'}{' '}
              <Link to={paths.providerProfile} className="font-semibold underline">
                Ir para o perfil
              </Link>
            </Alert>
          ) : (
            <form noValidate onSubmit={submit} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FileUploadField label="Documento de identidade" purpose="verification" value={identity} onChange={setIdentity} error={errors.identityUploadId} description="RG, CNH ou cartão CNPJ." />
                <FileUploadField label="Comprovante de endereço" purpose="verification" value={address} onChange={setAddress} error={errors.addressUploadId} description="Conta recente de água, luz ou telefone." />
              </div>
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSending}>
                  Enviar para análise
                </Button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
