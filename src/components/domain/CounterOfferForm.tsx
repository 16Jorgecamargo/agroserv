import { useState, type FormEvent } from 'react'
import { isApiError } from '../../services/apiError'
import type { CounterOfferPayload } from '../../types/api'
import type { ServiceRequestDetail } from '../../types/entities'
import { getTodayInBrasilia } from '../../utils/date'
import { ESTIMATE_NOTICE, formatDate, formatMoney } from '../../utils/format'
import { parseDecimal } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { DatePicker } from '../ui/DatePicker'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

interface CounterOfferFormProps {
  request: ServiceRequestDetail
  onSubmit: (payload: CounterOfferPayload) => Promise<unknown>
  onCancel: () => void
}

type Errors = Partial<Record<'date' | 'value' | 'message' | 'form', string>>

export function CounterOfferForm({ request, onSubmit, onCancel }: CounterOfferFormProps) {
  const today = getTodayInBrasilia()
  const [date, setDate] = useState('')
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [isSending, setIsSending] = useState(false)

  function validate(): Errors {
    const next: Errors = {}
    const parsedValue = value.trim() ? parseDecimal(value) : undefined
    const changesDate = Boolean(date) && date !== request.scheduledDate
    const changesValue = parsedValue !== undefined && parsedValue !== request.value

    if (date && date < today) next.date = 'Escolha uma data a partir de hoje.'
    if (parsedValue !== undefined && (!Number.isFinite(parsedValue) || parsedValue <= 0)) next.value = 'Informe um valor válido.'
    if (!next.date && !next.value && !changesDate && !changesValue) next.form = 'Proponha uma nova data ou um novo valor.'
    if (message.trim().length < 5 || message.trim().length > 500) next.message = 'Explique a proposta ao produtor.'
    return next
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) return
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length) return

    setIsSending(true)
    try {
      await onSubmit({
        ...(date && date !== request.scheduledDate ? { date } : {}),
        ...(value.trim() && parseDecimal(value) !== request.value ? { value: parseDecimal(value) } : {}),
        message: message.trim(),
      })
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as Errors)
      else setErrors({ form: isApiError(error) ? error.message : 'Não foi possível enviar a contraproposta.' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <p className="text-sm text-text-muted">
        Pedido atual: {formatDate(request.scheduledDate)} · {formatMoney(request.value)}. A quantidade não muda.
      </p>
      {errors.form && <Alert tone="danger">{errors.form}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <DatePicker label="Nova data (opcional)" minDate={today} value={date} onChange={(event) => setDate(event.target.value)} error={errors.date} />
        <Input
          label="Novo valor total (R$, opcional)"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={errors.value}
        />
      </div>
      <Textarea label="Mensagem ao produtor" rows={3} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} error={errors.message} />
      <p className="text-xs text-text-muted">{ESTIMATE_NOTICE}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSending}>
          Voltar
        </Button>
        <Button type="submit" isLoading={isSending}>
          Enviar contraproposta
        </Button>
      </div>
    </form>
  )
}
