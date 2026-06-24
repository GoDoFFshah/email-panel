import React from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{t('language') || 'زبان'}</p>
              <p className="text-gray-400 text-sm">
                {language === 'fa' ? 'فارسی' : 'English'}
              </p>
            </div>
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
            >
              {language === 'fa' ? 'EN' : 'FA'}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
            <div>
              <p className="text-white font-medium">{t('theme') || 'تم'}</p>
              <p className="text-gray-400 text-sm">
                {theme === 'dark' ? 'دارک' : 'لایت'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}