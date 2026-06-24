import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'react-toastify'
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon, LanguageIcon } from '@heroicons/react/24/outline'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.username, data.password)
      router.push('/dashboard')
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className={`rounded-2xl p-8 ${
          theme === 'dark' 
            ? 'glass bg-gray-800/50 backdrop-blur-xl' 
            : 'bg-white/80 backdrop-blur-xl shadow-xl'
        }`}>
          {/* Header with Logo and Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-600 to-purple-700'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('login')}
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('welcome_message') || 'به پنل مدیریت ایمیل خوش آمدید'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-200/50 text-gray-600 hover:text-gray-900'
                }`}
                title={language === 'fa' ? 'English' : 'فارسی'}
              >
                <LanguageIcon className="w-5 h-5" />
                <span className="text-xs mr-1 hidden sm:inline">
                  {language === 'fa' ? 'FA' : 'EN'}
                </span>
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-200/50 text-gray-600 hover:text-gray-900'
                }`}
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('username')}
              </label>
              <input
                {...register('username', { required: t('username_required') || 'Username is required' })}
                className={`w-full border rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                placeholder={t('username_placeholder')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('password')}
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: t('password_required') || 'Password is required', 
                    minLength: { value: 8, message: t('password_min_length') } 
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full border rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder={t('password_placeholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <input type="checkbox" className="rounded border-gray-600" />
                {t('remember_me')}
              </label>
              <Link href="/forgot-password" className={`text-sm ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } transition-colors`}>
                {t('forgot_password')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800'
              }`}
            >
              {isLoading ? '⏳ ' + t('loading') : t('sign_in')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('dont_have_account')}{' '}
              <Link href="/register" className={`${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } transition-colors`}>
                {t('sign_up')}
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700/30 text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Email Panel v1.0 | {t('welcome')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}