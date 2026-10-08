import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
