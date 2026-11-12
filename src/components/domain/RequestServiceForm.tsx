import { CalendarCheck, CircleCheck, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { paths } from '../../routes/paths'
import { isApiError } from '../../services/apiError'
import { propertyService } from '../../services/propertyService'
import { requestService } from '../../services/requestService'
import { serviceService } from '../../services/serviceService'
import type { PropertyPayload } from '../../types/api'
import type { Property, Provider, Service, ServiceRequestDetail } from '../../types/entities'
import { distanceBetweenCities } from '../../utils/cityCoordinates'
import { getTodayInBrasilia } from '../../utils/date'
import { ESTIMATE_NOTICE, formatDate, formatMoney, formatPrice, getQuantityUnitLabel } from '../../utils/format'
import { parseDecimal, validateRequestForm, type RequestFormErrors, type RequestFormValues } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { buttonClasses } from '../ui/buttonClasses'
import { DatePicker } from '../ui/DatePicker'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { PropertyForm } from './PropertyForm'

interface RequestServiceFormProps {
  service: Service
  onCancel: () => void
  initialPropertyId?: string
  provider?: Pick<Provider, 'city' | 'state' | 'serviceRadiusKm'>
}

const EMPTY_VALUES: RequestFormValues = { propertyId: '', scheduledDate: '', quantity: '', notes: '' }

export function RequestServiceForm({ service, onCancel, initialPropertyId, provider }: RequestServiceFormProps) {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [blockedDays, setBlockedDays] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string>()
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState<RequestFormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isCreatingProperty, setIsCreatingProperty] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [created, setCreated] = useState<ServiceRequestDetail | null>(null)
  const today = getTodayInBrasilia()

  useEffect(() => {
    let active = true
    Promise.all([propertyService.list(), serviceService.blockedDays(service.id)])
      .then(([loadedProperties, loadedBlockedDays]) => {
        if (!active) return
        setProperties(loadedProperties)
        setBlockedDays(loadedBlockedDays)
        setIsCreatingProperty(loadedProperties.length === 0)
        const preselected = loadedProperties.find((property) => property.id === initialPropertyId) ?? (loadedProperties.length === 1 ? loadedProperties[0] : undefined)
        if (preselected) setValues((current) => ({ ...current, propertyId: preselected.id }))
      })
      .catch((error: unknown) => {
        if (active) setLoadError(isApiError(error) ? error.message : 'Não foi possível carregar suas propriedades.')
      })
    return () => {
      active = false
    }
  }, [service.id, initialPropertyId])

  function update<K extends keyof RequestFormValues>(field: K, value: RequestFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(undefined)
  }

  async function createProperty(payload: PropertyPayload) {
    const property = await propertyService.create(payload)
    setProperties((current) => [...(current ?? []), property])
    update('propertyId', property.id)
    setIsCreatingProperty(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) return

    const validation = validateRequestForm(values, today, blockedDays)
    setErrors(validation)
    if (Object.keys(validation).length) return

    setIsSending(true)
    try {
      const request = await requestService.create({
        serviceId: service.id,
        propertyId: values.propertyId,
        scheduledDate: values.scheduledDate,
        quantity: parseDecimal(values.quantity),
        ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
      })
      setCreated(request)
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as RequestFormErrors)
      setFormError(isApiError(error) ? error.message : 'Não foi possível enviar a solicitação.')
    } finally {
      setIsSending(false)
    }
  }

  if (created) {
    return (
      <div className="space-y-5 text-center" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold text-text">Solicitação enviada</p>
          <p className="mt-1 text-sm text-text-muted">
            {created.providerName} vai analisar o pedido para {formatDate(created.scheduledDate)}. Você recebe uma notificação quando ele responder.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="secondary" onClick={onCancel}>
            Fechar
          </Button>
          <Link to={paths.requestDetail(created.id)} className={buttonClasses('primary', 'md')}>
            Ver solicitação
          </Link>
        </div>
      </div>
    )
  }

  if (loadError) return <Alert tone="danger">{loadError}</Alert>

  if (!properties) {
    return (
      <p role="status" className="text-sm text-text-muted">
        Carregando suas propriedades…
      </p>
    )
  }

  if (isCreatingProperty) {
    return (
      <div className="space-y-4">
        <Alert tone="info">
          {properties.length === 0
            ? 'Cadastre a propriedade onde o serviço será feito. Ela fica salva para os próximos pedidos.'
            : 'Cadastre uma nova propriedade sem sair do pedido.'}
        </Alert>
        <PropertyForm
          defaultCity={user?.city}
          defaultState={user?.state}
          submitLabel="Salvar propriedade"
          onSubmit={createProperty}
          onCancel={properties.length ? () => setIsCreatingProperty(false) : onCancel}
        />
      </div>
    )
  }

  const quantity = parseDecimal(values.quantity)
  const estimate = Number.isFinite(quantity) && quantity > 0 ? service.price * quantity : 0
  const unitLabel = getQuantityUnitLabel(service.priceUnit)
  const selectedProperty = properties.find((property) => property.id === values.propertyId)
  const distance = provider && selectedProperty ? distanceBetweenCities(provider, selectedProperty) : null
  const isOutsideArea = Boolean(provider && distance !== null && distance > provider.serviceRadiusKm)

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="space-y-2">
        <Select label="Propriedade" value={values.propertyId} onChange={(event) => update('propertyId', event.target.value)} error={errors.propertyId}>
          <option value="">Selecione a propriedade</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name} · {property.city} - {property.state}
            </option>
          ))}
        </Select>
        <button type="button" onClick={() => setIsCreatingProperty(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <Plus className="size-4" aria-hidden />
          Cadastrar nova propriedade
        </button>
        {isOutsideArea && provider && selectedProperty && distance !== null && (
          <Alert tone="warning">
            <span className="font-semibold">Sua propriedade pode estar fora da área de atendimento</span>. {selectedProperty.city} fica a cerca de{' '}
            {Math.round(distance)} km de {provider.city} e o prestador atende até {provider.serviceRadiusKm} km. Você ainda pode enviar o pedido.
          </Alert>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <DatePicker
            label="Data desejada"
            minDate={today}
            disabledDates={blockedDays}
            value={values.scheduledDate}
            onChange={(event) => update('scheduledDate', event.target.value)}
            error={errors.scheduledDate}
          />
          {blockedDays.length > 0 && (
            <p className="mt-1.5 text-xs text-text-muted">
              Dias sem atendimento: {blockedDays.slice(0, 4).map(formatDate).join(', ')}
              {blockedDays.length > 4 ? '…' : ''}
            </p>
          )}
        </div>
        <Input
          label={`Quantidade (${unitLabel})`}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={values.quantity}
          onChange={(event) => update('quantity', event.target.value)}
          error={errors.quantity}
        />
      </div>
      <Textarea
        label="Observações (opcional)"
        rows={3}
        maxLength={1000}
        value={values.notes}
        onChange={(event) => update('notes', event.target.value)}
        error={errors.notes}
      />
      <div className="rounded-lg bg-surface-muted p-4" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-text-muted">{formatPrice(service.price, service.priceUnit)} × quantidade</span>
          <span className="text-xl font-bold text-text tabular-nums">{formatMoney(estimate)}</span>
        </div>
        <p className="mt-1 text-xs text-text-muted">{ESTIMATE_NOTICE}</p>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSending}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSending}>
          <CalendarCheck className="size-4" aria-hidden />
          Enviar solicitação
        </Button>
      </div>
    </form>
  )
}
