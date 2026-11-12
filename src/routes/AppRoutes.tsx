import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ProviderProfilePage } from '../pages/ProviderProfilePage'
import { EquipmentPage } from '../pages/EquipmentPage'
import { ProviderReviewsPage } from '../pages/ProviderReviewsPage'
import { ProviderDashboardPage } from '../pages/ProviderDashboardPage'
import { MyServicesPage } from '../pages/MyServicesPage'
import { ProviderRequestDetailPage } from '../pages/ProviderRequestDetailPage'
import { ProviderRequestsPage } from '../pages/ProviderRequestsPage'
import { ServiceFormPage } from '../pages/ServiceFormPage'
import { DemoRestoreAction } from '../components/domain/DemoRestoreAction'
import type { ReactNode } from 'react'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { PrivacyPage, TermsPage } from '../pages/LegalPages'
import { PropertiesPage } from '../pages/PropertiesPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { RequestDetailPage } from '../pages/RequestDetailPage'
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
        <Route path={paths.terms} element={<TermsPage />} />
        <Route path={paths.privacy} element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.register} element={<RegisterPage />} />
      <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={paths.resetPassword} element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute allowedRoles={['producer']} />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.requests} element={<RequestsPage />} />
          <Route path={routePatterns.requestDetail} element={<RequestDetailPage />} />
          <Route path={paths.properties} element={<PropertiesPage />} />
          <Route path={paths.profile} element={<ProfilePage />} />
          <Route path={paths.notifications} element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
        <Route path={paths.providerRoot} element={<PrivateLayout />}>
          <Route path="dashboard" element={<ProviderDashboardPage />} />
          <Route path="servicos" element={<MyServicesPage />} />
          <Route path="servicos/novo" element={<ServiceFormPage />} />
          <Route path="servicos/:id/editar" element={<ServiceFormPage />} />
          <Route path="solicitacoes" element={<ProviderRequestsPage />} />
          <Route path="solicitacoes/:id" element={<ProviderRequestDetailPage />} />
          <Route path="avaliacoes" element={<ProviderReviewsPage />} />
          <Route path="equipamentos" element={<EquipmentPage />} />
          <Route path="perfil" element={<ProviderProfilePage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
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
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
