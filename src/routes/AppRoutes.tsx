import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProviderProfilePage } from '../pages/ProviderProfilePage'
import { DemoRestoreAction } from '../components/domain/DemoRestoreAction'
import type { ReactNode } from 'react'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RequestsPage } from '../pages/RequestsPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

interface RoleDashboardPlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

function RoleDashboardPlaceholder({ title, description, children }: RoleDashboardPlaceholderProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      <p className="mt-3 text-text-muted">{description}</p>
      {children}
    </section>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path={paths.login} element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['producer']} />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.requests} element={<RequestsPage />} />
          <Route path={paths.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
        <Route path={paths.providerRoot} element={<PrivateLayout />}>
          <Route
            path="dashboard"
            element={
              <RoleDashboardPlaceholder
                title="Painel do prestador"
                description="O painel completo do prestador será disponibilizado em uma próxima etapa."
              />
            }
          />
          <Route path="perfil" element={<ProviderProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path={paths.adminDashboard} element={<PrivateLayout />}>
          <Route
            index
            element={
              <RoleDashboardPlaceholder
                title="Painel do administrador"
                description="O painel completo do administrador será disponibilizado em uma próxima etapa."
              >
                <DemoRestoreAction />
              </RoleDashboardPlaceholder>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
