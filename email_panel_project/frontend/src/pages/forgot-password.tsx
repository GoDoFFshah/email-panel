import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'react-toastify'
import { SunIcon, MoonIcon, LanguageIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      // TODO: Connect to backend API
      await axios.post('http://localhost:8000/api/auth/password-reset/', {
        email: data.email
      })
      setIsSent(true)
      toast.success('✅ لینک بازیابی رمز عبور به ایمیل شما ارسال شد')
    } catch (error) {
      toast.error('❌ خطا در ارسال لینک بازیابی')
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                  : 'bg-gradient-to-br from-yellow-600 to-orange-700'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('forgot_password')}
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('forgot_password_description') || 'لینک بازیابی به ایمیل شما ارسال می‌شود'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
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

          {isSent ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📧</div>
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('email_sent') || 'ایمیل ارسال شد'}
              </h3>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('check_email') || 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.'}
              </p>
              <Link href="/login" className={`mt-6 inline-block ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              } transition-colors`}>
                ← {t('back_to_login') || 'بازگشت به صفحه ورود'}
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {t('email')}
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { 
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
                        message: 'Invalid email address' 
                      }
                    })}
                    className={`w-full border rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder={t('email_placeholder')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800'
                  }`}
                >
                  {isLoading ? '⏳ ' + t('loading') : t('send_reset_link') || 'ارسال لینک بازیابی'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className={`text-sm ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                } transition-colors`}>
                  ← {t('back_to_login') || 'بازگشت به صفحه ورود'}
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/30 text-center">
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('dont_have_account')}{' '}
                  <Link href="/register" className={`${
                    theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  } transition-colors`}>
                    {t('sign_up')}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}