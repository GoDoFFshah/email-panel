import React, { createContext, useContext, useState, useEffect } from 'react'

interface LanguageContextType {
  language: 'fa' | 'en'
  toggleLanguage: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  fa: {
    'welcome': 'خوش آمدید',
    'dashboard': 'داشبورد',
    'campaigns': 'کمپین‌ها',
    'senders': 'فرستنده‌ها',
    'categories': 'دسته‌بندی‌ها',
    'settings': 'تنظیمات',
    'logout': 'خروج',
    'login': 'ورود',
    'register': 'ثبت‌نام',
    'total_sends': 'کل ارسال‌ها',
    'active_recipients': 'گیرنده‌های فعال',
    'success_rate': 'نرخ موفقیت',
    'quota_remaining': 'سهمیه باقیمانده',
    'recent_activity': 'فعالیت‌های اخیر',
  },
  en: {
    'welcome': 'Welcome',
    'dashboard': 'Dashboard',
    'campaigns': 'Campaigns',
    'senders': 'Senders',
    'categories': 'Categories',
    'settings': 'Settings',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    'total_sends': 'Total Sends',
    'active_recipients': 'Active Recipients',
    'success_rate': 'Success Rate',
    'quota_remaining': 'Quota Remaining',
    'recent_activity': 'Recent Activity',
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'fa' | 'en'>('fa')

  useEffect(() => {
    const stored = localStorage.getItem('language') as 'fa' | 'en'
    if (stored) {
      setLanguage(stored)
      document.dir = stored === 'fa' ? 'rtl' : 'ltr'
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = language === 'fa' ? 'en' : 'fa'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
    document.dir = newLang === 'fa' ? 'rtl' : 'ltr'
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.fa] || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}