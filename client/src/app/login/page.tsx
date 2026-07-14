'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Eye, EyeOff, LogIn } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const urlEmail = searchParams.get('email') || ''
  const initialName = searchParams.get('name') || ''
  const message = searchParams.get('message') || ''
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    const savedEmail = localStorage.getItem('lastEmail')
    if (savedEmail && !urlEmail) {
      setEmail(savedEmail)
    } else if (urlEmail) {
      setEmail(urlEmail)
    }
  }, [urlEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    localStorage.setItem('lastEmail', email)

    try {
      const { data } = await api.post('auth/login', { email, password })
      const userData = data.data.user
      const mappedUser = {
        ...userData,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        kycStatus: userData.kycStatus || '',
        phone: userData.phone,
      }
      login(data.data.token, mappedUser)
      if (mappedUser.kycStatus === 'APPROVED') {
        router.push('/dashboard')
      } else {
        router.push('/waiting-approval')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-dark-300 p-8 shadow-xl border border-gray-700">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500">
              <LogIn className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Welcome Back</h1>
            {message && (
              <p className="mt-1.5 text-2xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">{message}</p>
            )}
            {initialName && !message && (
              <p className="mt-1.5 text-sm font-medium text-brand-blue">Hi, {initialName}</p>
            )}
            {!initialName && !message && (
              <p className="mt-1.5 text-gray-400 text-xs">Sign in to your account</p>
            )}
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-red-900/20 p-2.5 text-2xs text-red-400 border border-red-400/20">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-2xs font-medium text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-dark-400 px-3 py-2 text-xs text-white focus:border-brand-blue focus:outline-none"
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-gray-400">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-dark-400 px-3 py-2 text-xs text-white focus:border-brand-blue focus:outline-none"
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-cyan-500 px-3 py-2 font-medium text-white text-xs hover:from-brand-blue/90 hover:to-cyan-500/90 disabled:opacity-50 transition-all"
            >
              <LogIn size={14} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-2xs text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-blue hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-dark-300 p-8 shadow-xl border border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}