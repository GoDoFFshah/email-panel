export const validators = {
  email: (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value)
  },

  phone: (value: string): boolean => {
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return regex.test(value)
  },

  url: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },

  password: (value: string): { valid: boolean; message?: string } => {
    if (value.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' }
    }
    if (!/[A-Z]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' }
    }
    if (!/[a-z]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' }
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one number' }
    }
    return { valid: true }
  },

  username: (value: string): { valid: boolean; message?: string } => {
    if (value.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' }
    }
    if (value.length > 30) {
      return { valid: false, message: 'Username must be less than 30 characters' }
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' }
    }
    return { valid: true }
  },
}

export const formatDate = (date: string | Date, locale: string = 'fa'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatTime = (date: string | Date, locale: string = 'fa'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateTime = (date: string | Date, locale: string = 'fa'): string => {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`
}

export const formatNumber = (num: number, locale: string = 'fa'): string => {
  return num.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}