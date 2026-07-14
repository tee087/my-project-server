'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isVerified: boolean
  phone?: string
  avatar?: string
  kycStatus?: string
  telegramChatId?: string | null
  fullNameLegal?: string
  dateOfBirth?: string
  residentialAddress?: string
  country?: string
  idDocumentType?: string
  idDocumentNumber?: string
  idDocumentFrontUrl?: string
  idDocumentBackUrl?: string
  selfieUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User, telegramChatId?: string) => void
  logout: () => void
  updateUser: (updatedUser: User) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = (newToken: string, newUser: User, telegramChatId?: string) => {
    console.log('Login called with user:', newUser, 'telegramChatId:', telegramChatId)
    setToken(newToken)
    const userWithChatId = telegramChatId ? { ...newUser, telegramChatId } : newUser
    setUser(userWithChatId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userWithChatId))
      localStorage.setItem('authUser', JSON.stringify(userWithChatId))
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  const updateUser = (updatedUser: User) => {
    console.log('updateUser called:', updatedUser)
    setUser(updatedUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}