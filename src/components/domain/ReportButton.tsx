import { Flag } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '../../hooks/useToast'
import { isApiError } from '../../services/apiError'
import { reportService } from '../../services/reportService'
import type { ReportReason, ReportTargetType } from '../../types/entities'
import { reportReasonLabels, reportReasons } from '../../utils/reportLabels'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

export interface ReportTarget {
  type: ReportTargetType
  id: string
  label: string
}

interface ReportButtonProps {
  targets: ReportTarget[]
  title: string
  buttonLabel?: string
  className?: string
}

interface FormErrors {
  reason?: string
  description?: string
}

function ReportForm({ targets, onClose }: { targets: ReportTarget[]; onClose: () => void }) {
  const toast = useToast()
  const [targetIndex, setTargetIndex] = useState(0)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSending, setIsSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) return
    const nextErrors: FormErrors = {}
    if (!reason) nextErrors.reason = 'Selecione o motivo.'
    if (description.trim().length < 10) nextErrors.description = 'Descreva o problema com pelo menos 10 caracteres.'
    setErrors(nextErrors)
    setFormError(undefined)
    if (Object.keys(nextErrors).length || !reason) return

    const target = targets[targetIndex]
    setIsSending(true)
    try {
      await reportService.create({ targetType: target.type, targetId: target.id, reason, description: description.trim() })
      toast.success('Denúncia enviada. A administração vai analisar.')
      onClose()
    } catch (error) {
      if (isApiError(error) && error.fields?.targetType) setFormError(error.fields.targetType)
      else if (isApiError(error) && error.fields) setErrors(error.fields as FormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível enviar a denúncia.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      {targets.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-text">O que você quer denunciar?</legend>
          {targets.map((target, index) => (
            <label key={`${target.type}-${target.id}`} className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="report-target"
                checked={targetIndex === index}
                onChange={() => setTargetIndex(index)}
                className="size-4 accent-primary"
              />
              {target.label}
            </label>
          ))}
        </fieldset>
      )}
      <Select label="Motivo" value={reason} onChange={(event) => setReason(event.target.value as ReportReason | '')} error={errors.reason}>
        <option value="">Selecione</option>
        {reportReasons.map((option) => (
          <option key={option} value={option}>
            {reportReasonLabels[option]}
          </option>
        ))}
      </Select>
      <Textarea
        label="Descrição"
        value={description}
        maxLength={1000}
        rows={4}
        onChange={(event) => setDescription(event.target.value)}
        error={errors.description}
      />
      <p className="text-xs text-text-muted">A administração recebe a denúncia e avisa você quando ela for analisada.</p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSending}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSending}>
          Enviar denúncia
        </Button>
      </div>
    </form>
  )
}

export function ReportButton({ targets, title, buttonLabel = 'Denunciar', className }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="sm" className={className} onClick={() => setIsOpen(true)}>
        <Flag className="size-4" aria-hidden />
        {buttonLabel}
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        <ReportForm targets={targets} onClose={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}
