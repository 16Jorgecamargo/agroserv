import type { PaginationMeta } from '../../types/api'
import { Button } from './Button'

interface PaginationProps {
  meta: PaginationMeta
  onChange: (page: number) => void
}

export function Pagination({ meta, onChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>
        Anterior
      </Button>
      <p className="text-sm text-text-muted">
        Página {meta.page} de {meta.totalPages}
      </p>
      <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onChange(meta.page + 1)}>
        Próxima
      </Button>
    </nav>
  )
}
