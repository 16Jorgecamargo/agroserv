import { ShieldCheck } from 'lucide-react'
import { AccountSettings } from '../components/domain/AccountSettings'
import { Alert } from '../components/ui/Alert'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

export function AdminAccountPage() {
  usePageTitle('Conta do administrador')
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Minha conta</h1>
          <p className="mt-1 text-text-muted">Dados pessoais e senha de acesso.</p>
        </div>
      </div>
      {user?.mustChangePassword && <Alert tone="warning">Troque sua senha provisória para continuar.</Alert>}
      <AccountSettings />
    </div>
  )
}
