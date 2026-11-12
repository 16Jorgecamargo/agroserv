import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router'
import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'
import { SkipLink } from '../components/layout/SkipLink'
import { pageTransition } from '../utils/motion'

export function PublicLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SkipLink />
      <Navbar />
      <motion.main id="main-content" key={location.pathname} {...pageTransition} className="flex-1">
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
