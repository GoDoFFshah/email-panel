import React from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useRouter } from 'next/router'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CategoriesPage() {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t('categories')}</h1>
          <button
            onClick={() => alert('افزودن دسته جدید')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
          >
            + {t('add_category')}
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-gray-400 text-center py-12">
            {t('no_categories') || 'هنوز هیچ دسته‌بندی ایجاد نشده است.'}
          </p>
        </div>
      </div>
    </MainLayout>
  )
}