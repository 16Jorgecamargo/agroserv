import { useState, type FormEvent } from 'react'
import { isApiError } from '../../services/apiError'
import type { EquipmentPayload } from '../../types/api'
import type { Equipment, EquipmentType } from '../../types/entities'
import { equipmentTypeLabels } from '../../utils/serviceStatus'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PhotoListField } from '../ui/PhotoListField'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

interface EquipmentFormProps {
  initial?: Equipment
  onSubmit: (payload: EquipmentPayload) => Promise<unknown>
  onCancel: () => void
}

type Errors = Partial<Record<'type' | 'model' | 'year' | 'specs' | 'photos', string>>

export function EquipmentForm({ initial, onSubmit, onCancel }: EquipmentFormProps) {
  const [type, setType] = useState<string>(initial?.type ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState(initial ? String(initial.year) : '')
  const [specs, setSpecs] = useState(initial?.specs ?? '')
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (isSaving) return
    const parsedYear = Number(year)
    const next: Errors = {}
    if (!type) next.type = 'Selecione o tipo.'
    if (model.trim().length < 2 || model.trim().length > 80) next.model = 'Informe marca e modelo.'
    if (!Number.isInteger(parsedYear) || parsedYear < 1950 || parsedYear > new Date().getFullYear() + 1) next.year = 'Informe um ano válido.'
    if (specs.trim().length > 500) next.specs = 'Use no máximo 500 caracteres.'
    setErrors(next)
    if (Object.keys(next).length) return

    setIsSaving(true)
    try {
      await onSubmit({ type: type as EquipmentType, model: model.trim(), year: parsedYear, specs: specs.trim(), photos })
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as Errors)
      setFormError(isApiError(error) ? error.message : 'Não foi possível salvar o equipamento.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Tipo" value={type} onChange={(event) => setType(event.target.value)} error={errors.type}>
          <option value="">Selecione</option>
          {Object.entries(equipmentTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="Ano" type="number" inputMode="numeric" min="1950" value={year} onChange={(event) => setYear(event.target.value)} error={errors.year} />
      </div>
      <Input label="Marca e modelo" value={model} maxLength={80} onChange={(event) => setModel(event.target.value)} error={errors.model} />
      <Textarea label="Descrição técnica (opcional)" rows={3} maxLength={500} value={specs} onChange={(event) => setSpecs(event.target.value)} error={errors.specs} />
      <PhotoListField label="Fotos" photos={photos} onChange={setPhotos} max={6} error={errors.photos} description="Até 6 fotos JPG, PNG ou WEBP." />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {initial ? 'Salvar equipamento' : 'Cadastrar equipamento'}
        </Button>
      </div>
    </form>
  )
}
