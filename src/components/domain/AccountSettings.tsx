import { startTransition, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '../ui/Alert'
import { AvatarSettings } from './AvatarSettings'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { accountService } from '../../services/accountService'
import { authService } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { paths } from '../../routes/paths'
import { brazilianStates } from '../../data/states'
import { isApiError } from '../../services/apiError'
import {
  validateAccountProfileForm,
  validateChangePasswordForm,
  type AccountProfileFormErrors,
  type ChangePasswordFormErrors,
} from '../../utils/validators'

export function AccountSettings({ onDemoRestored }: { onDemoRestored?: () => void | Promise<void> }) {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [state, setState] = useState(user?.state ?? '')
  const [profileErrors, setProfileErrors] = useState<AccountProfileFormErrors>({})
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordFormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || isSavingProfile) return
    const errors = validateAccountProfileForm({ name, phone, city, state })
    setProfileErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length) return

    setIsSavingProfile(true)
    try {
      const updatedUser = await accountService.updateProfile({ name, phone, city, state })
      updateUser(updatedUser)
      toast.success('Dados pessoais atualizados.')
    } catch (error) {
      if (isApiError(error) && error.fields) setProfileErrors(error.fields as AccountProfileFormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível salvar seus dados.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSavingPassword) return
    const errors = validateChangePasswordForm({ currentPassword, newPassword, confirmPassword })
    setPasswordErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length) return

    setIsSavingPassword(true)
    try {
      const response = await accountService.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordErrors({})
      toast.success(response.message)
    } catch (error) {
      if (isApiError(error) && error.fields) setPasswordErrors(error.fields as ChangePasswordFormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível alterar sua senha.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function deleteAccount() {
    if (isDeleting) return
    setIsDeleting(true)
    setFormError(undefined)
    try {
      await accountService.deleteAccount()
      startTransition(() => {
        navigate(paths.home, { replace: true })
        logout()
      })
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Não foi possível excluir sua conta.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function restoreDemoData() {
    if (isRestoring) return
    setIsRestoring(true)
    setFormError(undefined)
    try {
      const response = await accountService.restoreDemoData()
      const restoredUser = await authService.me()
      updateUser(restoredUser)
      setName(restoredUser.name)
      setPhone(restoredUser.phone ?? '')
      setCity(restoredUser.city)
      setState(restoredUser.state)
      await onDemoRestored?.()
      toast.success(response.message)
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Não foi possível restaurar os dados demo.')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="space-y-8">
      {formError && <Alert tone="danger">{formError}</Alert>}

      <AvatarSettings />

      <section aria-labelledby="personal-details-heading" className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <h2 id="personal-details-heading" className="text-xl font-semibold text-text">Dados pessoais</h2>
          <p className="mt-1 text-sm text-text-muted">Seu e-mail não pode ser alterado nesta versão.</p>
        </div>
        <form noValidate onSubmit={saveProfile} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Nome completo" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={profileErrors.name} />
            <Input label="E-mail" type="email" autoComplete="email" value={user?.email ?? ''} disabled />
            <Input label="Telefone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} error={profileErrors.phone} />
            <Input label="Cidade" autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} error={profileErrors.city} />
            <Select label="Estado" autoComplete="address-level1" value={state} onChange={(event) => setState(event.target.value)} error={profileErrors.state}>
              <option value="">Selecione a UF</option>
              {brazilianStates.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </div>
          <Button type="submit" isLoading={isSavingProfile}>Salvar dados pessoais</Button>
        </form>
      </section>

      <section aria-labelledby="password-heading" className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <h2 id="password-heading" className="text-xl font-semibold text-text">Segurança</h2>
          <p className="mt-1 text-sm text-text-muted">Escolha uma senha nova com pelo menos 8 caracteres.</p>
        </div>
        <form noValidate onSubmit={changePassword} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Senha atual" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} error={passwordErrors.currentPassword} />
            <div />
            <Input label="Nova senha" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} error={passwordErrors.newPassword} />
            <Input label="Confirme a nova senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={passwordErrors.confirmPassword} />
          </div>
          <Button type="submit" variant="secondary" isLoading={isSavingPassword}>Alterar senha</Button>
        </form>
      </section>

      <section aria-labelledby="account-actions-heading" className="rounded-card border border-danger/25 bg-surface p-6 shadow-card sm:p-8">
        <h2 id="account-actions-heading" className="text-xl font-semibold text-text">Ações da conta</h2>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">A exclusão encerra sua sessão e libera seu e-mail. Solicitações em andamento precisam ser concluídas ou canceladas antes.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {accountService.canRestoreDemoData && <Button variant="secondary" onClick={() => setIsRestoreDialogOpen(true)}>Restaurar dados demo</Button>}
          {user?.role !== 'admin' && <Button className="bg-danger hover:bg-danger/90" onClick={() => setIsDeleteDialogOpen(true)}>Excluir conta</Button>}
        </div>
      </section>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={deleteAccount}
        title="Excluir sua conta?"
        description="Essa ação remove seu acesso ao AgroServ. Solicitações em andamento impedem a exclusão."
        confirmLabel="Excluir conta"
        cancelLabel="Manter conta"
        isLoading={isDeleting}
        showReason={false}
      />
      <ConfirmDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={restoreDemoData}
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
