import { UserRound } from 'lucide-react'
import { AccountSettings } from '../components/domain/AccountSettings'
import { usePageTitle } from '../hooks/usePageTitle'

export function ProfilePage() {
  usePageTitle('Perfil e conta')
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><UserRound className="size-5" aria-hidden /></span>
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Perfil e conta</h1>
          <p className="mt-1 text-text-muted">Atualize seus dados pessoais e as opções de acesso.</p>
        </div>
      </div>
      <AccountSettings />
    </div>
  )
}
