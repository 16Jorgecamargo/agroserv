import { Camera, Loader2 } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { accountService } from '../../services/accountService'
import { isApiError } from '../../services/apiError'
import { uploadService } from '../../services/uploadService'
import { cn } from '../../utils/cn'
import { ACCEPTED_IMAGE_TYPES } from '../../utils/validators'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { buttonClasses } from '../ui/buttonClasses'

export function AvatarSettings() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  if (!user) return null

  async function save(avatarUrl: string | null, successMessage: string) {
    const updated = await accountService.updateProfile({ avatarUrl })
    updateUser(updated)
    toast.success(successMessage)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isSaving) return

    setError(undefined)
    setIsSaving(true)
    try {
      const upload = await uploadService.upload(file, 'public', ACCEPTED_IMAGE_TYPES)
      await save(upload.url, 'Foto de perfil atualizada.')
    } catch (caught) {
      setError(isApiError(caught) ? (caught.fields?.file ?? caught.fields?.avatarUrl ?? caught.message) : 'Não foi possível trocar a foto.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeAvatar() {
    if (isSaving) return
    setError(undefined)
    setIsSaving(true)
    try {
      await save(null, 'Foto de perfil removida.')
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'Não foi possível remover a foto.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section aria-labelledby="avatar-heading" className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h2 id="avatar-heading" className="text-xl font-semibold text-text">
        Foto de perfil
      </h2>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user.name} src={user.avatarUrl} size="xl" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className={cn(buttonClasses('secondary', 'md'), 'cursor-pointer focus-within:ring-2 focus-within:ring-primary/40', isSaving && 'pointer-events-none opacity-60')}>
              {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
              {user.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
              <input
                type="file"
                className="sr-only"
                aria-label="Escolher foto de perfil"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                disabled={isSaving}
                onChange={handleFile}
              />
            </label>
            {user.avatarUrl && (
              <Button variant="ghost" onClick={removeAvatar} disabled={isSaving}>
                Remover foto
              </Button>
            )}
          </div>
          <p className="text-xs text-text-muted">JPG, PNG ou WEBP até 5 MB.</p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
