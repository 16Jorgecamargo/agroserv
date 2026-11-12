import { useState, type FormEvent, type ReactNode } from 'react'
import { brazilianStates } from '../../data/states'
import { isApiError } from '../../services/apiError'
import type { ServicePayload } from '../../types/api'
import type { Category, Service } from '../../types/entities'
import { priceUnitOptions } from '../../utils/serviceStatus'
import { parseDecimal, validateServiceForm, type ServiceFormErrors, type ServiceFormValues } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { PhotoListField } from '../ui/PhotoListField'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

interface ServiceFormProps {
  categories: Category[]
  initial?: Service
  defaultCity?: string
  defaultState?: string
  submitLabel: string
  onSubmit: (payload: ServicePayload) => Promise<unknown>
  onCancel: () => void
  extraFields?: (values: ServiceFormValues, update: <K extends keyof ServiceFormValues>(field: K, value: ServiceFormValues[K]) => void) => ReactNode
}

function toValues(service: Service | undefined, city = '', state = ''): ServiceFormValues {
  return {
    title: service?.title ?? '',
    categoryId: service?.categoryId ?? '',
    description: service?.description ?? '',
    price: service ? String(service.price) : '',
    priceUnit: service?.priceUnit ?? 'hectare',
    city: service?.city ?? city,
    state: service?.state ?? state,
    photos: service?.photos ?? [],
    equipmentIds: service?.equipmentIds ?? [],
    available: service?.available ?? true,
  }
}

export function ServiceForm({ categories, initial, defaultCity, defaultState, submitLabel, onSubmit, onCancel, extraFields }: ServiceFormProps) {
  const [values, setValues] = useState(() => toValues(initial, defaultCity, defaultState))
  const [errors, setErrors] = useState<ServiceFormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  function update<K extends keyof ServiceFormValues>(field: K, value: ServiceFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const validation = validateServiceForm(values)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setFormError('Revise os campos destacados.')
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        categoryId: values.categoryId,
        description: values.description.trim(),
        price: parseDecimal(values.price),
        priceUnit: values.priceUnit as ServicePayload['priceUnit'],
        city: values.city.trim(),
        state: values.state,
        photos: values.photos,
        equipmentIds: values.equipmentIds,
        available: values.available,
      })
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as ServiceFormErrors)
      setFormError(isApiError(error) ? error.message : 'Não foi possível salvar o anúncio.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <section aria-labelledby="service-basics-heading" className="space-y-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 id="service-basics-heading" className="text-lg font-semibold text-text">
          Sobre o serviço
        </h2>
        <Input label="Título" value={values.title} maxLength={80} onChange={(event) => update('title', event.target.value)} error={errors.title} />
        <Select label="Categoria" value={values.categoryId} onChange={(event) => update('categoryId', event.target.value)} error={errors.categoryId}>
          <option value="">Selecione a categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Textarea
          label="Descrição"
          rows={5}
          maxLength={2000}
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
          error={errors.description}
        />
        <p className="-mt-3 text-xs text-text-muted tabular-nums">{values.description.trim().length}/2000 caracteres. Mínimo de 20.</p>
      </section>

      <section aria-labelledby="service-price-heading" className="space-y-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 id="service-price-heading" className="text-lg font-semibold text-text">
          Preço e local
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Preço (R$)"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={values.price}
            onChange={(event) => update('price', event.target.value)}
            error={errors.price}
          />
          <Select label="Unidade" value={values.priceUnit} onChange={(event) => update('priceUnit', event.target.value)} error={errors.priceUnit}>
            {priceUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
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
      </section>

      <section aria-labelledby="service-photos-heading" className="space-y-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <h2 id="service-photos-heading" className="text-lg font-semibold text-text">
          Fotos e disponibilidade
        </h2>
        <PhotoListField
          label="Fotos"
          photos={values.photos}
          onChange={(photos) => update('photos', photos)}
          error={errors.photos}
          description="Até 8 fotos JPG, PNG ou WEBP. A primeira é a capa do anúncio."
        />
        {extraFields?.(values, update)}
        <Checkbox
          label="Disponível para novas solicitações"
          checked={values.available}
          onChange={(event) => update('available', event.target.checked)}
          description="Desmarque para manter o anúncio na busca sem receber pedidos novos."
        />
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
