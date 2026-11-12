import { BriefcaseBusiness } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { AccountSettings } from '../components/domain/AccountSettings'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { accountService } from '../services/accountService'
import { isApiError } from '../services/apiError'
import type { ProviderProfile } from '../types/entities'
import {
  validateProviderProfileForm,
  type ProviderProfileFormErrors,
  type ProviderProfileFormValues,
} from '../utils/validators'

const EMPTY_FORM: ProviderProfileFormValues = { document: '', serviceRadiusKm: '100', yearsOfExperience: '0', description: '' }

export function ProviderProfilePage() {
  usePageTitle('Perfil do prestador')
  const toast = useToast()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [values, setValues] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<ProviderProfileFormErrors>({})
  const [loadError, setLoadError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    accountService.getProviderProfile().then((result) => {
      if (!active) return
      setProfile(result)
      setValues({
        document: result.document,
        serviceRadiusKm: String(result.serviceRadiusKm),
        yearsOfExperience: String(result.yearsOfExperience),
        description: result.description,
      })
    }).catch((error: unknown) => {
      if (active) setLoadError(isApiError(error) ? error.message : 'Não foi possível carregar o perfil profissional.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [])

  function updateField<K extends keyof ProviderProfileFormValues>(field: K, value: ProviderProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(undefined)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    const validation = validateProviderProfileForm(values)
    setErrors(validation)
    setFormError(undefined)
    if (Object.keys(validation).length) return

    setIsSaving(true)
    try {
      const updated = await accountService.updateProviderProfile({
        document: values.document,
        serviceRadiusKm: Number(values.serviceRadiusKm),
        yearsOfExperience: Number(values.yearsOfExperience),
        description: values.description,
      })
      setProfile(updated)
      toast.success('Perfil profissional atualizado.')
    } catch (error) {
      if (isApiError(error) && error.fields) setErrors(error.fields as ProviderProfileFormErrors)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível salvar o perfil profissional.')
    } finally {
      setIsSaving(false)
    }
  }

  async function refreshProviderProfile() {
    const refreshed = await accountService.getProviderProfile()
    setProfile(refreshed)
    setValues({
      document: refreshed.document,
      serviceRadiusKm: String(refreshed.serviceRadiusKm),
      yearsOfExperience: String(refreshed.yearsOfExperience),
      description: refreshed.description,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><BriefcaseBusiness className="size-5" aria-hidden /></span>
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Perfil e conta</h1>
          <p className="mt-1 text-text-muted">Gerencie seus dados pessoais e profissionais.</p>
        </div>
      </div>

      <section aria-labelledby="provider-profile-heading" className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <h2 id="provider-profile-heading" className="text-xl font-semibold text-text">Perfil profissional</h2>
          <p className="mt-1 text-sm text-text-muted">Estes dados ajudam produtores a conhecer sua experiência e área de atendimento.</p>
        </div>
        {loadError ? <Alert tone="danger">{loadError}</Alert> : isLoading ? (
          <div role="status" className="text-sm text-text-muted">Carregando perfil profissional…</div>
        ) : profile && (
          <form noValidate onSubmit={saveProfile} className="space-y-5">
            {formError && <Alert tone="danger">{formError}</Alert>}
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="CPF ou CNPJ" inputMode="numeric" autoComplete="off" value={values.document} onChange={(event) => updateField('document', event.target.value)} error={errors.document} />
              <Input label="Raio de atendimento (km)" type="number" min="1" max="500" step="1" value={values.serviceRadiusKm} onChange={(event) => updateField('serviceRadiusKm', event.target.value)} error={errors.serviceRadiusKm} />
              <Input label="Anos de experiência" type="number" min="0" max="80" step="1" value={values.yearsOfExperience} onChange={(event) => updateField('yearsOfExperience', event.target.value)} error={errors.yearsOfExperience} />
            </div>
            <Textarea label="Descrição profissional" maxLength={1000} value={values.description} onChange={(event) => updateField('description', event.target.value)} error={errors.description} />
            <p className="text-right text-xs text-text-muted">{values.description.length}/1000 caracteres</p>
            <p className="text-sm text-text-muted">Verificação: {profile.verificationStatus === 'approved' ? 'Aprovada' : profile.verificationStatus === 'under_review' ? 'Em análise' : profile.verificationStatus === 'rejected' ? 'Rejeitada' : 'Não enviada'}</p>
            <Button type="submit" isLoading={isSaving}>Salvar perfil profissional</Button>
          </form>
        )}
      </section>

      <AccountSettings onDemoRestored={refreshProviderProfile} />
    </div>
  )
}
