import { ArrowLeft, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Logo } from '../components/layout/Logo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import { authService } from '../services/authService'
import { validateResetPasswordForm, type ResetPasswordFormErrors } from '../utils/validators'

export function ResetPasswordPage() {
  usePageTitle('Redefinir senha')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')?.trim() ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFormErrors>({})
  const [formError, setFormError] = useState<string>()
  const [tokenError, setTokenError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !token) return

    const errors = validateResetPasswordForm({ password, confirmPassword })
    setFieldErrors(errors)
    setFormError(undefined)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await authService.resetPassword({ token, password })
      navigate(paths.login, { replace: true, state: { notice: 'passwordReset' } })
    } catch (error) {
      if (isApiError(error) && error.fields?.token) {
        setTokenError(error.fields.token)
      } else if (isApiError(error) && error.fields) {
        setFieldErrors(error.fields as ResetPasswordFormErrors)
      } else {
        setFormError(isApiError(error) ? error.message : 'Não foi possível redefinir sua senha. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="grid min-h-dvh place-items-center bg-bg px-4 py-10 sm:px-6">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link to={paths.login} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
            <ArrowLeft className="size-4" aria-hidden />
            Entrar
          </Link>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Defina uma nova senha</h1>
          <p className="mt-2 text-text-muted">Use uma senha com pelo menos 8 caracteres.</p>

          {!token || tokenError ? (
            <div className="mt-6 space-y-4">
              <Alert tone="danger">{tokenError ?? 'Link inválido ou expirado.'}</Alert>
              <Link to={paths.forgotPassword} className="inline-flex font-semibold text-primary hover:text-primary-strong">
                Solicitar outro link
              </Link>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
              {formError && <Alert tone="danger">{formError}</Alert>}
              <Input
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                icon={Lock}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, password: undefined }))
                  setFormError(undefined)
                }}
                error={fieldErrors.password}
              />
              <Input
                label="Confirme a nova senha"
                type="password"
                autoComplete="new-password"
                icon={Lock}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))
                  setFormError(undefined)
                }}
                error={fieldErrors.confirmPassword}
              />
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Redefinir senha
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-muted">
            <Link to={paths.login} className="font-semibold text-primary hover:text-primary-strong">
              Voltar para entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
