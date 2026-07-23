import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  isVerified: boolean
  isActive: boolean
  kycStatus: string
  avatar?: string
  profileImage?: string
  fullNameLegal?: string
  dateOfBirth?: string
  residentialAddress?: string
  country?: string
  idDocumentType?: string
  idDocumentNumber?: string
}

type AuthContextType = {
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

type RegisterData = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  referralCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadToken()
  }, [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common.Authorization
    }
  }, [token])

  const loadToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token')
      const savedUser = await AsyncStorage.getItem('user')
      if (savedToken) setToken(savedToken)
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        const userWithImage = { ...parsedUser, profileImage: parsedUser.avatar || parsedUser.profileImage }
        setUser(userWithImage)
      }
    } catch (error) {
      console.error('Failed to load auth data:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data.data
      const userWithImage = { ...user, profileImage: user.avatar }
      setToken(token)
      setUser(userWithImage)
      await AsyncStorage.setItem('token', token)
      await AsyncStorage.setItem('user', JSON.stringify(userWithImage))
      return userWithImage
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data)
      const { user, token } = response.data.data
      const userWithImage = { ...user, profileImage: user.avatar }
      setToken(token)
      setUser(userWithImage)
      await AsyncStorage.setItem('token', token)
      await AsyncStorage.setItem('user', JSON.stringify(userWithImage))
      return userWithImage
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null
      const nextUser = { ...prev, ...userData }
      void AsyncStorage.setItem('user', JSON.stringify(nextUser))
      return nextUser
    })
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
