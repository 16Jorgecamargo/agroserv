import { Route, Routes } from 'react-router'
import { PublicLayout } from '../layouts/PublicLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths } from './paths'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
