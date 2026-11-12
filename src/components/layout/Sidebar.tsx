import { BadgeCheck, CalendarDays, ClipboardList, LayoutDashboard, LogOut, MapPinned, Megaphone, Search, Star, Tractor, UserRound, Users, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import type { Role } from '../../types/entities'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Logo } from './Logo'

interface SidebarItem {
  label: string
  to: string
  icon: LucideIcon
}

const sidebarItemsByRole: Record<Role, SidebarItem[]> = {
  producer: [
    { label: 'Dashboard', to: paths.dashboard, icon: LayoutDashboard },
    { label: 'Solicitações', to: paths.requests, icon: ClipboardList },
    { label: 'Propriedades', to: paths.properties, icon: MapPinned },
    { label: 'Ver serviços', to: paths.services, icon: Search },
    { label: 'Perfil', to: paths.profile, icon: UserRound },
  ],
  provider: [
    { label: 'Painel', to: paths.providerDashboard, icon: LayoutDashboard },
    { label: 'Solicitações', to: paths.providerRequests, icon: ClipboardList },
    { label: 'Agenda', to: paths.providerAgenda, icon: CalendarDays },
    { label: 'Meus serviços', to: paths.providerServices, icon: Megaphone },
    { label: 'Equipamentos', to: paths.providerEquipment, icon: Tractor },
    { label: 'Avaliações', to: paths.providerReviews, icon: Star },
    { label: 'Verificação', to: paths.providerVerification, icon: BadgeCheck },
    { label: 'Perfil', to: paths.providerProfile, icon: UserRound },
  ],
  admin: [
    { label: 'Painel', to: paths.adminDashboard, icon: LayoutDashboard },
    { label: 'Usuários', to: paths.adminUsers, icon: Users },
    { label: 'Verificações', to: paths.adminVerifications, icon: BadgeCheck },
    { label: 'Minha conta', to: paths.adminAccount, icon: UserRound },
  ],
}

const roleLabels: Record<Role, string> = {
  producer: 'produtor',
  provider: 'prestador',
  admin: 'administrador',
}

const itemClasses = 'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

export function Sidebar({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const sidebarItems = sidebarItemsByRole[role]

  return (
    <aside className="border-b border-border bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Logo />
      </div>
      <nav
        aria-label={`Área do ${roleLabels[role]}`}
        className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:px-3 lg:pt-4 lg:pb-4"
      >
        {sidebarItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(itemClasses, isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text')
            }
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className={cn(itemClasses, 'text-text-muted hover:bg-danger/5 hover:text-danger lg:mt-auto')}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </button>
      </nav>
    </aside>
  )
}
