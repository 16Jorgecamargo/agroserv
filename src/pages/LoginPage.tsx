import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import loginImage from '../assets/images/login-field.jpg'
import { Logo } from '../components/layout/Logo'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths, type LoginLocationState } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import { demoAccount } from '../services/authService'
import { validateLoginForm, type LoginFormErrors } from '../utils/validators'

const loginHighlights = [
  { value: '120+', label: 'prestadores' },
  { value: '4,8', label: 'avaliação média' },
  { value: '35', label: 'cidades' },
]

export function LoginPage() {
  usePageTitle('Entrar')
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const state = (location.state ?? null) as LoginLocationState | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    const redirectTo = state?.from ? `${state.from.pathname}${state.from.search}` : paths.dashboard
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    const errors = validateLoginForm({ email, password })
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) return
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function fillDemoAccount() {
    if (!demoAccount) return
    setEmail(demoAccount.email)
    setPassword(demoAccount.password)
    setFieldErrors({})
    setFormError(null)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={loginImage} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-primary-strong/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo tone="light" />
          <div className="max-w-md">
            <p className="text-3xl/[40px] font-bold tracking-[-0.01em]">
              Contrate serviços agrícolas com a segurança de quem entende do campo.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/20 pt-6">
              {loginHighlights.map((highlight) => (
                <div key={highlight.label} className="flex flex-col-reverse">
                  <dt className="text-xs text-white/70">{highlight.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums">{highlight.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>

      <main id="main-content" className="flex items-center justify-center bg-bg px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Link to={paths.home} className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar para o site
          </Link>
          <h1 className="mt-6 text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Bem-vindo de volta</h1>
          <p className="mt-2 text-text-muted">Entre para acompanhar suas solicitações de serviço.</p>

          {state?.reason === 'protected' && (
            <Alert tone="warning" className="mt-6">
              Faça login para acessar esta área.
            </Alert>
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
          >
            {formError && <Alert tone="danger">{formError}</Alert>}
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              icon={Mail}
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              icon={Lock}
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="grid size-9 place-items-center rounded-md text-text-muted transition-colors hover:text-text"
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              }
            />
            <p className="flex items-center justify-end gap-2 text-sm text-text-muted">
              Esqueci minha senha
              <Badge>Em breve</Badge>
            </p>
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Entrar
            </Button>
            {demoAccount && (
              <>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="h-px flex-1 bg-border" />
                  ou
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button variant="secondary" size="lg" className="w-full" onClick={fillDemoAccount}>
                  Usar conta demo
                </Button>
                <p className="text-center text-xs text-text-muted">
                  {demoAccount.email} · {demoAccount.password}
                </p>
              </>
            )}
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
            Ainda não tem conta?
            <span className="font-medium text-text">Criar conta</span>
            <Badge>Em breve</Badge>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
