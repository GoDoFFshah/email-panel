import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pathname, setPathname] = useState('')
  const router = useRouter()

  useEffect(() => {
    setPathname(router.pathname)
  }, [router.pathname])

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-20'}`}>
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname || 'page'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}