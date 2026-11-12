import { useState, type FormEvent } from 'react'
import { useToast } from '../../hooks/useToast'
import { adminService } from '../../services/adminService'
import { isApiError } from '../../services/apiError'
import type { ReportDetail } from '../../types/api'
import type { ReportResolutionAction, ServiceRequestDetail } from '../../types/entities'
import { reportActionLabels, reportActionsNeedingMessage, reportAllowedActions } from '../../utils/reportLabels'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const messageLabels: Partial<Record<ReportResolutionAction, string>> = {
  hide_service: 'Motivo enviado ao prestador',
  warn: 'Texto da advertência',
  suspend: 'Motivo da suspensão',
}

interface FormErrors {
  action?: string
  targetUserId?: string
  message?: string
  internalNote?: string
}

export function ReportResolutionForm({ detail, onResolved }: { detail: ReportDetail; onResolved: () => void }) {
  const toast = useToast()
  const { report } = detail
  const actions = reportAllowedActions[report.targetType]
  const [action, setAction] = useState<ReportResolutionAction | ''>('')
  const [targetUserId, setTargetUserId] = useState('')
  const [message, setMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)
  const needsMessage = action !== '' && reportActionsNeedingMessage.includes(action)
  const needsTargetUser = report.targetType === 'request' && (action === 'warn' || action === 'suspend')
  const request = report.targetType === 'request' ? (detail.target as ServiceRequestDetail) : null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    const nextErrors: FormErrors = {}
    if (!action) nextErrors.action = 'Escolha uma ação.'
    if (needsTargetUser && !targetUserId) nextErrors.targetUserId = 'Escolha o produtor ou o prestador da solicitação.'
    if (needsMessage && message.trim().length < 5) nextErrors.message = 'Escreva a mensagem para o usuário.'
    if (internalNote.trim().length < 5) nextErrors.internalNote = 'Escreva a nota interna com pelo menos 5 caracteres.'
    setErrors(nextErrors)
    setFormError(undefined)
    if (Object.keys(nextErrors).length || !action) return

    setIsSaving(true)
    try {
      await adminService.resolveReport(report.id, {
        action,
        ...(needsTargetUser ? { targetUserId } : {}),
        ...(needsMessage ? { message: message.trim() } : {}),
        internalNote: internalNote.trim(),
      })
      toast.success(action === 'archive' ? 'Denúncia arquivada.' : 'Denúncia resolvida.')
      onResolved()
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as FormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível concluir a análise.')
      if (isApiError(error) && error.status === 409) onResolved()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <fieldset aria-describedby={errors.action ? 'report-action-error' : undefined}>
        <legend className="mb-2 text-sm font-medium text-text">Ação</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input type="radio" name="report-action" value={option} checked={action === option} onChange={() => setAction(option)} className="size-4 accent-primary" />
              {reportActionLabels[option]}
            </label>
          ))}
        </div>
        {errors.action && (
          <p id="report-action-error" className="mt-1.5 text-sm text-danger">
            {errors.action}
          </p>
        )}
      </fieldset>
      {needsTargetUser && request && (
        <Select label="Usuário afetado" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} error={errors.targetUserId}>
          <option value="">Selecione</option>
          <option value={request.producerId}>Produtor: {request.producerName}</option>
          <option value={request.providerId}>Prestador: {request.providerName}</option>
        </Select>
      )}
      {needsMessage && action && (
        <Textarea
          label={messageLabels[action] ?? 'Mensagem ao usuário'}
          value={message}
          maxLength={500}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
          error={errors.message}
        />
      )}
      <div>
        <Textarea
          label="Nota interna"
          value={internalNote}
          maxLength={1000}
          rows={3}
          onChange={(event) => setInternalNote(event.target.value)}
          error={errors.internalNote}
          aria-describedby="internal-note-hint"
        />
        <p id="internal-note-hint" className="mt-1.5 text-xs text-text-muted">
          Só administradores veem. Nunca é enviada a usuários.
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          Concluir análise
        </Button>
      </div>
    </form>
  )
}
