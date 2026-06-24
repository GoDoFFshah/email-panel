import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { 
  HomeIcon, 
  EnvelopeIcon, 
  UserGroupIcon, 
  FolderIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'super_admin'

  const menuItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'dashboard' },
    { path: '/campaigns', icon: EnvelopeIcon, label: 'campaigns' },
    { path: '/senders', icon: UserGroupIcon, label: 'senders' },
    { path: '/categories', icon: FolderIcon, label: 'categories' },
    { path: '/analytics', icon: ChartBarIcon, label: 'analytics' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'settings' },
  ]

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: open ? 256 : 80,
          transition: { duration: 0.3, ease: 'easeInOut' }
        }}
        className={`fixed right-0 top-0 h-full bg-gray-800/90 backdrop-blur-xl border-l border-gray-700/50 z-50 overflow-hidden ${
          open ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-700/50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <EnvelopeIcon className="w-5 h-5 text-white" />
            </div>
            <motion.span
              animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
              className="text-white font-bold text-lg mr-3 whitespace-nowrap"
            >
              Email Panel
            </motion.span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.path || 
                               (item.path !== '/' && router.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  <motion.span
                    animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                    className="mr-3 whitespace-nowrap"
                  >
                    {t(item.label)}
                  </motion.span>
                </Link>
              )
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
                  router.pathname.startsWith('/admin')
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
                onClick={() => setOpen(false)}
              >
                <ShieldCheckIcon className={`w-5 h-5 flex-shrink-0 ${router.pathname.startsWith('/admin') ? 'text-purple-400' : ''}`} />
                <motion.span
                  animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                  className="mr-3 whitespace-nowrap"
                >
                  {t('admin_panel')}
                </motion.span>
              </Link>
            )}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-gray-700/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <motion.div
                animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                className="overflow-hidden"
              >
                <p className="text-white text-sm font-medium truncate">
                  {user?.first_name || user?.username}
                </p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </motion.div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{ opacity: open ? 1 : 0, width: open ? 'auto' : 0 }}
                className="mr-3 whitespace-nowrap"
              >
                {t('logout')}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}