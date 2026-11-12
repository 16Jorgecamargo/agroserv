import { render } from '@testing-library/react'
import { MemoryRouter, type InitialEntry } from 'react-router'
import { AuthProvider } from '../contexts/AuthProvider'
import { ToastProvider } from '../components/ui/ToastProvider'
import { AppRoutes } from '../routes/AppRoutes'

export function renderApp(entry: InitialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}
