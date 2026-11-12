import { ArrowLeft, Sprout } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Logo } from '../components/layout/Logo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { getRoleHomePath, paths } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import type { RegisterPayload } from '../types/api'
import { brazilianStates, validateRegisterForm, type RegisterFormErrors, type RegisterFormValues } from '../utils/validators'

const initialValues: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  city: '',
  state: '',
  role: '',
  acceptedTerms: false,
}

export function RegisterPage() {
  usePageTitle('Criar conta')
  const { isAuthenticated, register, user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated && user) return <Navigate to={getRoleHomePath(user.role)} replace />

  function updateField(field: keyof RegisterFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const errors = validateRegisterForm(values)
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) return

    const payload: RegisterPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      phone: values.phone.replace(/\D/g, ''),
      city: values.city.trim(),
      state: values.state,
      role: values.role as RegisterPayload['role'],
      acceptedTerms: true,
    }

    setIsSubmitting(true)
    try {
      const account = await register(payload)
      navigate(getRoleHomePath(account.role), { replace: true })
    } catch (error) {
      if (isApiError(error) && error.fields) {
        setFieldErrors(error.fields as RegisterFormErrors)
      } else {
        setFormError(isApiError(error) ? error.message : 'Não foi possível criar sua conta. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="min-h-dvh bg-bg px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Link to={paths.home} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar para o site
          </Link>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-8">
          <div className="mb-7">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Sprout className="size-5" aria-hidden />
            </div>
            <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Crie sua conta</h1>
            <p className="mt-2 text-text-muted">Conecte-se à comunidade AgroServ para começar.</p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-6">
            {formError && <Alert tone="danger">{formError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nome completo"
                autoComplete="name"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={fieldErrors.name}
              />
              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
                error={fieldErrors.email}
              />
              <Input
                label="Senha"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => updateField('password', event.target.value)}
                error={fieldErrors.password}
              />
              <Input
                label="Confirme sua senha"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                error={fieldErrors.confirmPassword}
              />
              <Input
                label="Telefone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                value={values.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                error={fieldErrors.phone}
              />
              <Input
                label="Cidade"
                autoComplete="address-level2"
                value={values.city}
                onChange={(event) => updateField('city', event.target.value)}
                error={fieldErrors.city}
              />
              <Select
                label="Estado (UF)"
                autoComplete="address-level1"
                value={values.state}
                onChange={(event) => updateField('state', event.target.value)}
                error={fieldErrors.state}
              >
                <option value="">Selecione seu estado</option>
                {brazilianStates.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label} ({state.value})
                  </option>
                ))}
              </Select>
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-text">Como você vai usar o AgroServ?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'producer', label: 'Sou produtor rural' },
                  { value: 'provider', label: 'Sou prestador de serviços' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 text-sm font-medium text-text transition-colors has-checked:border-primary has-checked:bg-primary-soft"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={values.role === option.value}
                      onChange={(event) => updateField('role', event.target.value)}
                      className="size-4 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {fieldErrors.role && <p className="text-sm text-danger">{fieldErrors.role}</p>}
            </fieldset>

            <div className="space-y-2">
              <Checkbox
                label="Li e aceito os termos de uso e a política de privacidade."
                checked={values.acceptedTerms}
                onChange={(event) => updateField('acceptedTerms', event.target.checked)}
                error={fieldErrors.acceptedTerms}
              />
              <p className="ml-6 text-sm text-text-muted">
                Leia os{' '}
                <Link to={paths.terms} className="font-medium text-primary underline underline-offset-2">
                  Termos de uso
                </Link>{' '}
                e a{' '}
                <Link to={paths.privacy} className="font-medium text-primary underline underline-offset-2">
                  Política de privacidade
                </Link>
                .
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Já tem uma conta?{' '}
            <Link to={paths.login} className="font-semibold text-primary hover:text-primary-strong">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
