import { MotionConfig } from 'framer-motion'
import { BrowserRouter, HashRouter } from 'react-router'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthProvider } from './contexts/AuthProvider'
import { AppRoutes } from './routes/AppRoutes'

const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ScrollToTop />
          <AppRoutes />
        </AuthProvider>
      </MotionConfig>
    </Router>
  )
}
