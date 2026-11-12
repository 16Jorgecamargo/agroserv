import { useState, type FormEvent } from 'react'
import { brazilianStates } from '../../data/states'
import { useToast } from '../../hooks/useToast'
import { adminService } from '../../services/adminService'
import { isApiError } from '../../services/apiError'
import type { CreateAdminPayload } from '../../types/api'
import { isValidEmail } from '../../utils/validators'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

type FormErrors = Partial<Record<keyof CreateAdminPayload, string>>

const emptyForm: CreateAdminPayload = { name: '', email: '', password: '', city: '', state: '' }

function validate(values: CreateAdminPayload): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim().length < 2) errors.name = 'Informe seu nome.'
  if (!isValidEmail(values.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (values.password.length < 8) errors.password = 'A senha precisa ter pelo menos 8 caracteres.'
  if (values.city.trim().length < 2) errors.city = 'Informe sua cidade.'
  if (!values.state) errors.state = 'Selecione a UF.'
  return errors
}

interface CreateAdminDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function CreateAdminForm({ onClose, onCreated }: Omit<CreateAdminDialogProps, 'isOpen'>) {
  const toast = useToast()
  const [values, setValues] = useState<CreateAdminPayload>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  function update(field: keyof CreateAdminPayload, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError(undefined)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await adminService.createAdmin({ ...values, name: values.name.trim(), email: values.email.trim(), city: values.city.trim() })
      toast.success('Administrador criado. A senha provisória deve ser trocada no primeiro acesso.')
      onCreated()
      onClose()
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as FormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível criar o administrador.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Input label="Nome" value={values.name} maxLength={120} onChange={(event) => update('name', event.target.value)} error={errors.name} />
      <Input label="E-mail" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} error={errors.email} />
      <Input
        label="Senha provisória"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => update('password', event.target.value)}
        error={errors.password}
      />
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
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Criar administrador
        </Button>
      </div>
    </form>
  )
}

export function CreateAdminDialog({ isOpen, onClose, onCreated }: CreateAdminDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo administrador" description="A pessoa entra com a senha provisória e troca no primeiro acesso.">
      <CreateAdminForm onClose={onClose} onCreated={onCreated} />
    </Modal>
  )
}
