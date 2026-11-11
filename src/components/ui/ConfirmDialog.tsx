import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Textarea } from './Textarea'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  reasonLabel?: string
  reasonRequired?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  reasonLabel = 'Motivo',
  reasonRequired = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string>()

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setReasonError(undefined)
    }
  }, [isOpen])

  function handleConfirm() {
    if (reasonRequired && !reason.trim()) {
      setReasonError('Informe o motivo.')
      return
    }

    onConfirm(reason.trim())
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="space-y-5">
        <Textarea
          label={reasonRequired ? `${reasonLabel} (obrigatório)` : `${reasonLabel} (opcional)`}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            if (event.target.value.trim()) setReasonError(undefined)
          }}
          error={reasonError}
          required={reasonRequired}
          rows={3}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (reasonRequired && !reason.trim())}
            isLoading={isLoading}
            className="bg-danger hover:bg-danger/90"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}