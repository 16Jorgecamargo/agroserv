import { Pencil, Plus, Tractor, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EquipmentForm } from '../components/domain/EquipmentForm'
import { ServiceImage } from '../components/domain/ServiceImage'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { isApiError } from '../services/apiError'
import { equipmentService } from '../services/equipmentService'
import type { EquipmentPayload } from '../types/api'
import type { Equipment } from '../types/entities'
import { equipmentTypeLabels } from '../utils/serviceStatus'

type EditorState = { mode: 'create' } | { mode: 'edit'; item: Equipment } | null

export function EquipmentPage() {
  usePageTitle('Equipamentos')
  const toast = useToast()
  const { data, error, refetch } = useAsync(equipmentService.list)
  const [editor, setEditor] = useState<EditorState>(null)
  const [removing, setRemoving] = useState<Equipment | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  async function save(payload: EquipmentPayload) {
    if (editor?.mode === 'edit') {
      await equipmentService.update(editor.item.id, payload)
      toast.success('Equipamento atualizado.')
    } else {
      await equipmentService.create(payload)
      toast.success('Equipamento cadastrado.')
    }
    setEditor(null)
    refetch()
  }

  async function remove() {
    if (!removing) return
    setIsRemoving(true)
    try {
      await equipmentService.remove(removing.id)
      toast.success('Equipamento removido dos seus serviços.')
      refetch()
    } catch (caught) {
      toast.error(isApiError(caught) ? caught.message : 'Não foi possível remover o equipamento.')
    } finally {
      setIsRemoving(false)
    }
  }

  const createButton = (
    <Button onClick={() => setEditor({ mode: 'create' })}>
      <Plus className="size-4" aria-hidden />
      Cadastrar equipamento
    </Button>
  )

  return (
    <div className="space-y-8">
      <PageHeader icon={Tractor} title="Equipamentos" description="Mostre aos produtores as máquinas que você usa." action={data && data.length > 0 ? createButton : undefined} />

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" aria-label="Carregando equipamentos" className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-40 rounded-card" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Tractor} title="Nenhum equipamento cadastrado" description="Cadastre tratores, pulverizadores, drones e outras máquinas para vincular aos seus serviços." action={createButton} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Lista de equipamentos">
          {data.map((item) => (
            <li key={item.id} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="primary">{equipmentTypeLabels[item.type]}</Badge>
                  <h2 className="mt-2 text-lg font-semibold text-text">{item.model}</h2>
                  <p className="text-sm text-text-muted">Ano {item.year}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Editar ${item.model}`} onClick={() => setEditor({ mode: 'edit', item })}>
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-danger" aria-label={`Remover ${item.model}`} onClick={() => setRemoving(item)}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
              {item.specs && <p className="text-sm text-text">{item.specs}</p>}
              {item.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {item.photos.map((photo, index) => (
                    <ServiceImage key={photo} src={photo} alt={`${item.model}, foto ${index + 1}`} className="h-16 w-24 shrink-0 rounded-md object-cover" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={editor !== null} onClose={() => setEditor(null)} title={editor?.mode === 'edit' ? 'Editar equipamento' : 'Cadastrar equipamento'}>
        {editor && <EquipmentForm initial={editor.mode === 'edit' ? editor.item : undefined} onSubmit={save} onCancel={() => setEditor(null)} />}
      </Modal>
      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remover equipamento?"
        description="Ele também sai dos serviços em que estava vinculado."
        confirmLabel="Remover"
        cancelLabel="Voltar"
        showReason={false}
        isLoading={isRemoving}
      />
    </div>
  )
}
