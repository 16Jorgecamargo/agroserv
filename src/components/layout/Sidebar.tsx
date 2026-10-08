import { ClipboardList, LayoutDashboard, LogOut, Search } from 'lucide-react'
import { NavLink } from 'react-router'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Logo } from './Logo'

const sidebarItems = [
  { label: 'Dashboard', to: paths.dashboard, icon: LayoutDashboard },
  { label: 'Solicitações', to: paths.requests, icon: ClipboardList },
  { label: 'Ver serviços', to: paths.services, icon: Search },
]

const itemClasses = 'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="border-b border-border bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Logo />
      </div>
      <nav aria-label="Área do produtor" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:px-3 lg:pt-4 lg:pb-4">
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
