import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Textarea } from './Textarea'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  reasonLabel?: string
  reasonRequired?: boolean
  showReason?: boolean
  isLoading?: boolean
}

type ConfirmDialogBodyProps = Required<
  Pick<
    ConfirmDialogProps,
    'onClose' | 'onConfirm' | 'confirmLabel' | 'cancelLabel' | 'reasonLabel' | 'reasonRequired' | 'showReason' | 'isLoading'
  >
>

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
  showReason = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <ConfirmDialogBody
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        reasonLabel={reasonLabel}
        reasonRequired={reasonRequired}
        showReason={showReason}
        isLoading={isLoading}
      />
    </Modal>
  )
}

function ConfirmDialogBody({
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  reasonLabel,
  reasonRequired,
  showReason,
  isLoading,
}: ConfirmDialogBodyProps) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string>()

  async function handleConfirm() {
    if (showReason && reasonRequired && !reason.trim()) {
      setReasonError('Informe o motivo.')
      return
    }

    await onConfirm(reason.trim())
    onClose()
  }

  return (
    <div className="space-y-5">
      {showReason && (
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
      )}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading || (showReason && reasonRequired && !reason.trim())}
          isLoading={isLoading}
          className="bg-danger hover:bg-danger/90"
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
