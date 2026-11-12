import { ExternalLink, FileText } from 'lucide-react'
import { useFileUrl } from '../../hooks/useFileUrl'
import type { VerificationDocument } from '../../types/entities'
import { ServiceImage } from '../domain/ServiceImage'

const kindLabels: Record<VerificationDocument['kind'], string> = {
  identity: 'Documento de identidade',
  address: 'Comprovante de endereço',
}

function isPdf(document: VerificationDocument): boolean {
  return document.url.startsWith('data:application/pdf') || document.name.toLowerCase().endsWith('.pdf')
}

export function VerificationDocumentCard({ document }: { document: VerificationDocument }) {
  const { url } = useFileUrl(document.url)
  const label = kindLabels[document.kind]

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-surface">
      {isPdf(document) ? (
        <div className="grid h-40 place-items-center bg-surface-muted text-text-muted">
          <FileText className="size-10" aria-hidden />
        </div>
      ) : (
        <ServiceImage src={document.url} alt={`${label}: ${document.name}`} className="h-40 w-full object-contain bg-surface-muted" />
      )}
      <figcaption className="flex items-center justify-between gap-3 p-3">
        <span className="min-w-0">
          <span className="block text-xs text-text-muted">{label}</span>
          <span className="block truncate text-sm font-medium text-text">{document.name}</span>
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir ${label.toLowerCase()}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Abrir
            <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
      </figcaption>
    </figure>
  )
}
