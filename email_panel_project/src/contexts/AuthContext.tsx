import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { jwtDecode } from 'jwt-decode'

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  account_status: string
  language: string
  theme: string
  daily_quota: number
  total_sent: number
  total_success: number
  total_failed: number
  is_suspicious: boolean
  joined_date: string
  last_activity: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  hasPermission: (requiredType: string) => boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

// ایجاد Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// هوک useAuth
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // تنظیم axios interceptor برای refresh token
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
                refresh: refreshToken
              })
              const { access } = response.data
              localStorage.setItem('access_token', access)
              axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
              originalRequest.headers['Authorization'] = `Bearer ${access}`
              return axios(originalRequest)
            }
          } catch (refreshError) {
            logout()
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  // بررسی توکن موجود در localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        try {
          const decoded = jwtDecode<{ exp: number }>(storedToken)
          if (decoded.exp * 1000 > Date.now()) {
            setToken(storedToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            await fetchUser(storedToken)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        } catch (error) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const fetchUser = async (token: string) => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', { username, password })
      const { access, refresh, user } = response.data
      
      setToken(access)
      setUser(user)
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      
      toast.success(`Welcome back, ${user.first_name || user.username}!`)
      router.push('/dashboard')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      await axios.post('http://localhost:8000/api/auth/register/', data)
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete axios.defaults.headers.common['Authorization']
    router.push('/login')
    toast.info('Logged out successfully')
  }, [router])

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  const hasPermission = (requiredType: string): boolean => {
    if (!user) return false
    if (user.user_type === 'super_admin') return true
    return user.user_type === requiredType
  }

  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'super_admin'
  const isSuperAdmin = user?.user_type === 'super_admin'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      hasPermission,
      isAdmin,
      isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}