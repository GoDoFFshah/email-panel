import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 ثانیه تایم اوت
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('access_token', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    // اضافه کردن خطاهای خاص برای دیباگ
    if (error.response?.status === 404) {
      console.error('❌ API endpoint not found:', error.config?.url)
    }
    if (error.response?.status === 500) {
      console.error('❌ Server error:', error.response?.data)
    }
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network error - backend is not running or unreachable')
    }

    return Promise.reject(error)
  }
)

export const endpoints = {
  auth: {
    login: '/auth/login/',
    register: '/auth/register/',
    logout: '/auth/logout/',
    profile: '/auth/profile/',
    changePassword: '/auth/change-password/',
    refresh: '/auth/token/refresh/',
  },
  senders: {
    list: '/senders/',
    create: '/senders/',
    detail: (id: string) => `/senders/${id}/`,
    toggle: (id: string) => `/senders/${id}/toggle/`,
    test: (id: string) => `/senders/${id}/test/`,
    quota: '/senders/quota_status/',
  },
  categories: {
    list: '/categories/',
    create: '/categories/',
    detail: (id: string) => `/categories/${id}/`,
    addEmails: (id: string) => `/categories/${id}/add_emails/`,
    export: (id: string) => `/categories/${id}/export/`,
  },
  emails: {
    campaigns: '/emails/campaigns/',
    campaignDetail: (id: string) => `/emails/campaigns/${id}/`,
    send: (id: string) => `/emails/campaigns/${id}/send/`,
    pause: (id: string) => `/emails/campaigns/${id}/pause/`,
    resume: (id: string) => `/emails/campaigns/${id}/resume/`,
    status: (id: string) => `/emails/campaigns/${id}/status/`,
    sends: (id: string) => `/emails/campaigns/${id}/sends/`,
    tracking: '/emails/tracking/',
  },
  admin: {
    stats: '/admin-panel/stats/',
    users: '/admin-panel/users/',
    block: (id: string) => `/admin-panel/users/${id}/block/`,
    unblock: (id: string) => `/admin-panel/users/${id}/unblock/`,
    activities: '/admin-panel/activities/',
    security: '/admin-panel/security_report/',
    health: '/admin-panel/system_health/',
  },
  dashboard: {
    stats: '/dashboard/stats/',
    activities: '/dashboard/activities/',
  },
}

export const getAuthToken = () => localStorage.getItem('access_token')

export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token)
  api.defaults.headers.Authorization = `Bearer ${token}`
}

export const removeAuthToken = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  delete api.defaults.headers.Authorization
}

// ==================== توابع اضافی مفید ====================

// تابع برای لاگین
export const loginUser = async (username: string, password: string) => {
  try {
    const response = await api.post('/auth/login/', { username, password })
    const { access, refresh, user } = response.data
    setAuthToken(access)
    localStorage.setItem('refresh_token', refresh)
    return { user, access, refresh }
  } catch (error) {
    throw error
  }
}

// تابع برای خروج
export const logoutUser = () => {
  removeAuthToken()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// تابع برای گرفتن اطلاعات کاربر فعلی
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/profile/')
    return response.data
  } catch (error) {
    throw error
  }
}

// تابع برای بررسی اینکه آیا کاربر لاگین است
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token')
}