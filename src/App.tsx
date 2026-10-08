import { MotionConfig } from 'framer-motion'
import { BrowserRouter } from 'react-router'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthProvider } from './contexts/AuthProvider'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ScrollToTop />
          <AppRoutes />
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  )
}
