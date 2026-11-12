import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { accountService } from '../../services/accountService'
import { authService } from '../../services/authService'
import { isApiError } from '../../services/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function DemoRestoreAction() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  async function restore() {
    if (isRestoring) return
    setIsRestoring(true)
    setError(undefined)
    try {
      const result = await accountService.restoreDemoData()
      updateUser(await authService.me())
      toast.success(result.message)
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'Não foi possível restaurar os dados demo.')
    } finally {
      setIsRestoring(false)
    }
  }

  if (!accountService.canRestoreDemoData) return null

  return (
    <div className="mt-6 space-y-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>Restaurar dados demo</Button>
      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={restore}
        title="Restaurar dados demo?"
        description="As alterações salvas neste navegador serão substituídas pelos dados de demonstração iniciais."
        confirmLabel="Restaurar dados"
        cancelLabel="Cancelar"
        isLoading={isRestoring}
        showReason={false}
      />
    </div>
  )
}
