import { useState, type FormEvent } from 'react'
import { brazilianStates } from '../../data/states'
import { isApiError } from '../../services/apiError'
import type { PropertyPayload } from '../../types/api'
import type { Property } from '../../types/entities'
import { parseDecimal, validatePropertyForm, type PropertyFormErrors, type PropertyFormValues } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { TagInput } from '../ui/TagInput'
import { Textarea } from '../ui/Textarea'

interface PropertyFormProps {
  initial?: Property
  defaultCity?: string
  defaultState?: string
  submitLabel: string
  onSubmit: (payload: PropertyPayload) => Promise<unknown>
  onCancel?: () => void
}

function toValues(property: Property | undefined, city = '', state = ''): PropertyFormValues {
  return {
    name: property?.name ?? '',
    city: property?.city ?? city,
    state: property?.state ?? state,
    accessNotes: property?.accessNotes ?? '',
    areaHectares: property ? String(property.areaHectares) : '',
    crops: property?.crops ?? [],
  }
}

export function PropertyForm({ initial, defaultCity, defaultState, submitLabel, onSubmit, onCancel }: PropertyFormProps) {
  const [values, setValues] = useState(() => toValues(initial, defaultCity, defaultState))
  const [errors, setErrors] = useState<PropertyFormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  function update<K extends keyof PropertyFormValues>(field: K, value: PropertyFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (isSaving) return

    const validation = validatePropertyForm(values)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setIsSaving(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        city: values.city.trim(),
        state: values.state,
        accessNotes: values.accessNotes.trim(),
        areaHectares: parseDecimal(values.areaHectares),
        crops: values.crops,
      })
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as PropertyFormErrors)
      setFormError(isApiError(error) ? error.message : 'Não foi possível salvar a propriedade.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Input label="Nome da propriedade" value={values.name} maxLength={80} onChange={(event) => update('name', event.target.value)} error={errors.name} />
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <Input label="Cidade" value={values.city} maxLength={80} onChange={(event) => update('city', event.target.value)} error={errors.city} />
        <Select label="UF" value={values.state} onChange={(event) => update('state', event.target.value)} error={errors.state}>
          <option value="">Selecione</option>
          {brazilianStates.map((state) => (
            <option key={state.value} value={state.value}>
              {state.value}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label="Área (hectares)"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={values.areaHectares}
        onChange={(event) => update('areaHectares', event.target.value)}
        error={errors.areaHectares}
      />
      <TagInput
        label="Culturas"
        values={values.crops}
        onChange={(crops) => update('crops', crops)}
        error={errors.crops}
        placeholder="Digite e pressione Enter"
        description="Até 10 culturas, por exemplo Soja, Milho, Café."
      />
      <Textarea
        label="Acesso (opcional)"
        rows={3}
        maxLength={500}
        value={values.accessNotes}
        onChange={(event) => update('accessNotes', event.target.value)}
        error={errors.accessNotes}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
