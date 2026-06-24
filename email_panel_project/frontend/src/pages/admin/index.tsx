import React from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminPage() {
  const { t } = useLanguage()

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t('admin_panel') || 'پنل مدیریت'}</h1>

        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-center py-12">
            {t('admin_panel_description') || 'پنل مدیریت - آمار و گزارشات'}
          </p>
        </div>
      </div>
    </MainLayout>
  )
}