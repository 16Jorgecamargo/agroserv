import { MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PropertyForm } from '../components/domain/PropertyForm'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { isApiError } from '../services/apiError'
import { propertyService } from '../services/propertyService'
import type { PropertyPayload } from '../types/api'
import type { Property } from '../types/entities'
import { formatArea, formatLocation } from '../utils/format'

type EditorState = { mode: 'create' } | { mode: 'edit'; property: Property } | null

export function PropertiesPage() {
  usePageTitle('Propriedades')
  const { user } = useAuth()
  const toast = useToast()
  const { data, error, refetch } = useAsync(propertyService.list)
  const [editor, setEditor] = useState<EditorState>(null)
  const [removing, setRemoving] = useState<Property | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  async function save(payload: PropertyPayload) {
    if (editor?.mode === 'edit') {
      await propertyService.update(editor.property.id, payload)
      toast.success('Propriedade atualizada.')
    } else {
      await propertyService.create(payload)
      toast.success('Propriedade cadastrada.')
    }
    setEditor(null)
    refetch()
  }

  async function remove() {
    if (!removing) return
    setIsRemoving(true)
    try {
      await propertyService.remove(removing.id)
      toast.success('Propriedade removida.')
      refetch()
    } catch (caught) {
      toast.error(isApiError(caught) ? caught.message : 'Não foi possível remover a propriedade.')
    } finally {
      setIsRemoving(false)
    }
  }

  const createButton = (
    <Button onClick={() => setEditor({ mode: 'create' })}>
      <Plus className="size-4" aria-hidden />
      Cadastrar propriedade
    </Button>
  )

  return (
    <div className="space-y-8">
      <PageHeader
        icon={MapPinned}
        title="Propriedades"
        description="Cadastre as áreas onde os serviços serão prestados."
        action={data && data.length > 0 ? createButton : undefined}
      />

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" aria-label="Carregando propriedades" className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-44 rounded-card" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="Nenhuma propriedade cadastrada"
          description="Cadastre sua primeira propriedade para solicitar serviços."
          action={createButton}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Lista de propriedades">
          {data.map((property) => (
            <li key={property.id} className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text">{property.name}</h2>
                  <p className="text-sm text-text-muted">{formatLocation(property.city, property.state)}</p>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-text tabular-nums">
                  {formatArea(property.areaHectares)}
                </span>
              </div>
              {property.crops.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Culturas de ${property.name}`}>
                  {property.crops.map((crop) => (
                    <li key={crop} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                      {crop}
                    </li>
                  ))}
                </ul>
              )}
              {property.accessNotes && <p className="mt-4 text-sm text-text-muted">{property.accessNotes}</p>}
              <div className="mt-5 flex gap-2 border-t border-border pt-4">
                <Button variant="secondary" size="sm" onClick={() => setEditor({ mode: 'edit', property })} aria-label={`Editar ${property.name}`}>
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRemoving(property)} aria-label={`Remover ${property.name}`} className="text-danger hover:bg-danger/5 hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Editar propriedade' : 'Cadastrar propriedade'}
      >
        {editor && (
          <PropertyForm
            key={editor.mode === 'edit' ? editor.property.id : 'new'}
            initial={editor.mode === 'edit' ? editor.property : undefined}
            defaultCity={user?.city}
            defaultState={user?.state}
            submitLabel={editor.mode === 'edit' ? 'Salvar alterações' : 'Cadastrar propriedade'}
            onSubmit={save}
            onCancel={() => setEditor(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remover propriedade?"
        description={removing ? `${removing.name} deixa de aparecer na lista e no formulário de solicitação. As solicitações antigas continuam com os dados dela.` : ''}
        confirmLabel="Remover"
        showReason={false}
        isLoading={isRemoving}
      />
    </div>
  )
}
