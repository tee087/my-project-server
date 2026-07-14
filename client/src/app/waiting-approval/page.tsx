'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Shield, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

export default function WaitingApprovalPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const checkApproval = async () => {
      setChecking(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }
        const { data } = await api.get('auth/profile')
        const user = data.data
        if (user.kycStatus === 'APPROVED') {
          localStorage.removeItem('token')
          router.push(`/login?email=${encodeURIComponent(user.email || '')}&message=Your account has been approved! Please log in.`)
        }
      } catch (err) {
        console.error('Check approval error:', err)
        router.push('/login')
      } finally {
        setChecking(false)
      }
    }

    const interval = setInterval(checkApproval, 5000)
    checkApproval()
    
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-brand-blue/5 p-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-sky">
            <Clock className="h-8 w-8 text-white animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">WAIT WHILE WE APPROVE YOUR ACCOUNT</h1>
          <p className="text-gray-600 mb-6">
            Your account is being reviewed by our team. This usually takes a few minutes.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-brand-blue mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">KYC Verification</p>
                <p className="text-sm text-gray-600">Your identity documents are being verified</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
              <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-500">Ready to Invest</p>
                <p className="text-sm text-gray-400">You can start investing once approved</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-blue to-brand-sky rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Checking approval status every 5 seconds...</p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="mt-6 text-sm text-brand-blue hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  )
}