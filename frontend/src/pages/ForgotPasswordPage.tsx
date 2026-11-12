import { ArrowLeft, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Logo } from '../components/layout/Logo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import { authService } from '../services/authService'
import { validateForgotPasswordEmail } from '../utils/validators'

export function ForgotPasswordPage() {
  usePageTitle('Recuperar senha')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [resetToken, setResetToken] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const validationMessage = validateForgotPasswordEmail(email)
    setEmailError(validationMessage)
    setFormError(undefined)
    setMessage(undefined)
    setResetToken(undefined)
    if (validationMessage) return

    setIsSubmitting(true)
    try {
      const response = await authService.forgotPassword(email.trim())
      setMessage(response.message)
      setResetToken(response.resetToken)
    } catch (error) {
      if (isApiError(error) && error.fields?.email) setEmailError(error.fields.email)
      else setFormError(isApiError(error) ? error.message : 'Não foi possível solicitar a redefinição. Tente novamente.')
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
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Recuperar senha</h1>
          <p className="mt-2 text-text-muted">Informe o e-mail da sua conta para receber as instruções.</p>

          <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}
            {message && <Alert tone="info">{message}</Alert>}

            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              icon={Mail}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError(undefined)
                setMessage(undefined)
                setResetToken(undefined)
              }}
              error={emailError}
            />

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Enviar link de redefinição
            </Button>
          </form>

          {resetToken && (
            <Link
              to={`${paths.resetPassword}?token=${encodeURIComponent(resetToken)}`}
              className="mt-4 inline-flex w-full justify-center rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Abrir link de redefinição
            </Link>
          )}

          <p className="mt-6 text-center text-sm text-text-muted">
            Lembrou sua senha?{' '}
            <Link to={paths.login} className="font-semibold text-primary hover:text-primary-strong">
              Voltar para entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
