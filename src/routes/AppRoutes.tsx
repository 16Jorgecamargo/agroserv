import { Route, Routes, useLocation } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RequestsPage } from '../pages/RequestsPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { Alert } from '../components/ui/Alert'
import { paths, routePatterns, type LoginLocationState } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

interface RoleDashboardPlaceholderProps {
  title: string
  description: string
}

function RoleDashboardPlaceholder({ title, description }: RoleDashboardPlaceholderProps) {
  const location = useLocation()
  const state = (location.state ?? null) as LoginLocationState | null

  return (
    <main className="min-h-dvh bg-bg px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-card border border-border bg-surface p-6 shadow-card">
        {state?.reason === 'forbidden' && (
          <Alert tone="warning" className="mb-6">
            Você não tem acesso a esta área.
          </Alert>
        )}
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        <p className="mt-3 text-text-muted">{description}</p>
      </div>
    </main>
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
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
        <Route
          path={paths.providerDashboard}
          element={
            <RoleDashboardPlaceholder
              title="Painel do prestador"
              description="O painel completo do prestador será disponibilizado na próxima etapa."
            />
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route
          path={paths.adminDashboard}
          element={
            <RoleDashboardPlaceholder
              title="Painel do administrador"
              description="O painel completo do administrador será disponibilizado na próxima etapa."
            />
          }
        />
      </Route>
    </Routes>
  )
}