'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { TrendingUp, Check, Zap, Shield, Clock, X } from 'lucide-react'
import ActiveTradeSimulator from '@/components/ActiveTradeSimulator'

type InvestmentStatus = 'PENDING' | 'PAYMENT_RECEIVED' | 'ACTIVE_TRADE' | 'CLOSED' | 'WITHDRAWN'

type PendingPayment = {
  depositId: string | null
  ecocashNumber: string | null
  ecocashAccountName: string | null
  ecocashReference: string | null
}

type PaymentDetailsUpdate = Partial<PendingPayment> & {
  depositId?: string | null
}

export default function InvestmentsPage() {
  const router = useRouter()
  const [view, setView] = useState<'packages' | 'history' | 'form' | 'pending' | 'simulation' | 'learning'>('packages')
  const [plans, setPlans] = useState<any[]>([])
  const [learningPackages, setLearningPackages] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [formData, setFormData] = useState({ amount: '', paymentMethod: 'ECOCASH', planId: '' })
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)
  const [simulationInvestment, setSimulationInvestment] = useState<any | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingPaymentRef = useRef<PendingPayment | null>(null)
  const toastShownRef = useRef({ details: false, approved: false })

  useEffect(() => {
    fetchPlans()
    fetchInvestments()
    checkPendingDeposit()
  }, [])

  useEffect(() => {
    pendingPaymentRef.current = pendingPayment
  }, [pendingPayment])

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('investments/plans')
      setPlans(data.data)
    } catch (err: any) {
      console.error('Failed to load plans:', err.response?.data || err.message)
      toast.error('Failed to load packages: ' + (err.response?.data?.message || err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const fetchInvestments = async () => {
    try {
      const { data } = await api.get('investments')
      setInvestments(data.data)
    } catch (err) {
      console.log(err)
    }
  }

  const applyPaymentDetails = useCallback((details: PaymentDetailsUpdate) => {
    setPendingPayment((prev) => {
      if (details.depositId && prev?.depositId && details.depositId !== prev.depositId) {
        return prev
      }

      if (!details.ecocashNumber) {
        return prev
      }

      const next: PendingPayment = {
        depositId: details.depositId ?? prev?.depositId ?? null,
        ecocashNumber: details.ecocashNumber,
        ecocashAccountName: details.ecocashAccountName ?? prev?.ecocashAccountName ?? null,
        ecocashReference: details.ecocashReference ?? prev?.ecocashReference ?? null,
      }
      pendingPaymentRef.current = next
      return next
    })
    setView('pending')
  }, [])

  const notifyPaymentDetailsReceived = useCallback(() => {
    if (!toastShownRef.current.details) {
      toastShownRef.current.details = true
      toast.success('Payment details received!')
    }
  }, [])

  const checkPendingDeposit = async () => {
    try {
      const { data } = await api.get('deposits')
      const latest = data.data?.[0]
      if (latest && (latest.status === 'WAITING_FOR_PAYMENT_DETAILS' || latest.status === 'PAYMENT_DETAILS_SENT' || latest.status === 'PAYMENT_SUBMITTED')) {
        const payment = {
          depositId: latest.id,
          ecocashNumber: null,
          ecocashAccountName: null,
          ecocashReference: null,
        }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        setView('pending')
        startPaymentPolling()
      }
    } catch (err) {
      console.error('Check pending error:', err)
    }
  }

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan)
    setFormData({ amount: String(plan.minAmount), paymentMethod: 'ECOCASH', planId: plan.id })
    setView('form')
  }

  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toastShownRef.current = { details: false, approved: false }
    
    const isLearningPackage = selectedPlan?.id?.startsWith('learning-')
    
    try {
      if (isLearningPackage) {
        const response = await api.post('investments', {
          amount: Number(selectedPlan.minAmount),
          paymentMethod: 'ECOCASH',
          isLearning: true,
          learningLevel: selectedPlan.id.replace('learning-', ''),
        })
        console.log('Learning enrollment response:', response.data)
        const { investment, depositId } = response.data.data
        
        const payment = {
          depositId: depositId,
          ecocashNumber: null,
          ecocashAccountName: null,
          ecocashReference: null,
        }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        
        startPaymentPolling()
        
        toast.success('Enrollment request submitted! Waiting for payment details...')
        setView('pending')
        fetchInvestments()
      } else {
        const { data } = await api.post('investments', {
          ...formData,
          amount: Number(formData.amount),
        })
        const { investment, depositId } = data.data
        
        const payment = {
          depositId: depositId,
          ecocashNumber: null,
          ecocashAccountName: null,
          ecocashReference: null,
        }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        
        startPaymentPolling()
        
        toast.success('Investment request submitted! Waiting for payment details...')
        setView('pending')
        fetchInvestments()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed'
      console.error('Submit error:', err.response?.data)
      if (err.response?.status === 401) {
        toast.error('Please log in to continue')
        router.push('/login')
      } else if (err.response?.status === 403) {
        toast.error('Access denied. Please check your session.')
      } else if (err.response?.status === 400 && msg.includes('KYC')) {
        toast.error('Please complete KYC verification before investing')
      } else {
        toast.error(msg)
      }
    }
  }

  const startPaymentPolling = () => {
    if (pollIntervalRef.current) return

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('deposits')
        const latest = data.data?.[0]
        const current = pendingPaymentRef.current
        
        if (!current?.depositId && latest) {
          if (latest.status === 'WAITING_FOR_PAYMENT_DETAILS' || latest.status === 'PAYMENT_DETAILS_SENT' || latest.status === 'PAYMENT_SUBMITTED') {
            setPendingPayment({
              depositId: latest.id,
              ecocashNumber: null,
              ecocashAccountName: null,
              ecocashReference: null,
            })
            setView('pending')
          }
        }
        
        if (latest && current?.depositId === latest?.id) {
          if (latest?.ecocashNumber && !current?.ecocashNumber) {
            applyPaymentDetails({
              depositId: latest.id,
              ecocashNumber: latest.ecocashNumber,
              ecocashAccountName: latest.ecocashAccountName,
              ecocashReference: latest.ecocashReference,
            })
            notifyPaymentDetailsReceived()
          }
          if (latest?.status === 'PAYMENT_RECEIVED') {
            if (!toastShownRef.current.approved) {
              toastShownRef.current.approved = true
              toast.success('Payment approved! Your investment is now active.')
            }
            setView('packages')
            setPendingPayment(null)
            pendingPaymentRef.current = null
            fetchInvestments()
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5_000)
  }

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  const statusColors: Record<InvestmentStatus, string> = {
    PENDING: 'bg-gray-100 text-gray-800 border border-gray-200',
    PAYMENT_RECEIVED: 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20',
    ACTIVE_TRADE: 'bg-green-100 text-green-800 border border-green-200',
    CLOSED: 'bg-purple-100 text-purple-800 border border-purple-200',
    WITHDRAWN: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  }

  const getBrandGradient = (index: number) => {
    const gradients = [
      'from-brand-blue to-brand-sky',
      'from-brand-sky to-brand-blue',
      'from-brand-blue to-brand-light',
      'from-brand-light to-brand-blue',
      'from-brand-sky to-brand-light',
    ]
    return gradients[index % gradients.length] || gradients[0]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('packages')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${view === 'packages' ? 'bg-gradient-to-r from-brand-blue to-brand-sky text-white shadow-md glow-pulse animate-fade-in-out' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Packages
          </button>
          <button
            onClick={() => setView('learning')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${view === 'learning' ? 'bg-gradient-to-r from-brand-blue to-brand-sky text-white shadow-md glow-pulse animate-fade-in-out' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Become a Trader
          </button>
          <button
            onClick={() => setView('history')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${view === 'history' ? 'bg-gradient-to-r from-brand-blue to-brand-sky text-white shadow-md glow-pulse animate-fade-in-out' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            My Investments
          </button>
        </div>
      </div>

      {view === 'learning' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-brand-blue via-brand-sky to-brand-light p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_70%,white,transparent_70%)]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold">Trading Education Packages</h2>
              <p className="mt-2 text-white/90">
                Master Forex and Cryptocurrency trading with our expert-led courses.
                Choose your knowledge level and start your trading journey with professional guidance.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Live market sessions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                level: 'Beginner', 
                price: 500, 
                features: ['Forex basics', 'Crypto fundamentals', 'Risk management 101', 'Market analysis intro'], 
                color: 'from-amber-500 to-orange-500',
                enrolled: 1247,
                performance: '85% avg win rate',
              },
              { 
                level: 'Intermediate', 
                price: 1200, 
                features: ['Technical analysis', 'Trading strategies', 'Chart patterns', 'Volume analysis'], 
                color: 'from-blue-500 to-indigo-500',
                enrolled: 892,
                performance: '89% avg win rate',
              },
              { 
                level: 'Advanced', 
                price: 2500, 
                features: ['Algorithmic trading', 'Market psychology', 'Portfolio management', 'Live trade execution'], 
                color: 'from-purple-500 to-violet-500',
                enrolled: 423,
                performance: '92% avg win rate',
              },
            ].map((pkg) => (
              <div key={pkg.level} className="relative rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:border-brand-sky/30 transition-all group">
                <div className="text-center">
                  <div className={`mx-auto mb-4 inline-flex h-14 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${pkg.color} text-white shadow-lg group-hover:scale-105 transition-transform`}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{pkg.level} Trading</h3>
                  <p className="mt-2 text-3xl font-bold text-brand-blue">${pkg.price.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">full program</p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                    <span>{pkg.enrolled.toLocaleString()}+ students enrolled</span>
                    <span className="text-brand-blue font-medium">{pkg.performance}</span>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

<button 
                  onClick={() => {
                    const mockPlan = {
                      id: `learning-${pkg.level.toLowerCase()}`,
                      name: `${pkg.level} Trading`,
                      minAmount: pkg.price,
                      slug: `learning-${pkg.level.toLowerCase()}`,
                    }
                    handleSelectPlan(mockPlan)
                  }}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky py-2.5 text-sm font-semibold text-white hover:from-brand-blue/90 hover:to-brand-sky/90 transition-all"
                >
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'packages' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-brand-blue to-brand-sky p-6 text-white shadow-xl">
            <h2 className="text-xl font-bold">EcoCash Investment Platform</h2>
            <p className="mt-2 text-white/90">
              Our advanced mining technology locks in all incoming profits and maintains stable trade signals,
              protecting your investment from negative market volatility.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>6 Hour Trade Cycle</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Guaranteed Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Market Protection</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, idx) => {
              const isPopular = plan.slug === 'professional'
              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`relative cursor-pointer rounded-2xl border-2 bg-white p-6 shadow-lg transition-all hover:shadow-xl ${
                    isPopular ? 'border-brand-blue/20 ring-2 ring-brand-blue/10' : 'border-gray-100 hover:border-brand-blue/20'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-brand-blue to-brand-sky px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${getBrandGradient(idx)} text-white shadow-lg`}>
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Investment Range</span>
                      <span className="font-semibold text-gray-900">{plan.maxAmount ? `$${Number(plan.minAmount).toFixed(0)} - $${Number(plan.maxAmount).toFixed(0)}` : `${Number(plan.minAmount).toFixed(0)}+`}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Return</span>
                      <span className="font-semibold text-brand-blue">{plan.returnMultiplier}x</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">{plan.tradeDurationHours || 6}h</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Auto-profit locking system</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Stable trade signal protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Market volatility shield</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>Instant payout after trade</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPlan(plan)
                    }}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky py-2.5 text-sm font-semibold text-white hover:from-brand-blue/90 hover:to-brand-sky/90 transition-all"
                  >
                    Invest Now
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'form' && selectedPlan && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPlan.id?.startsWith('learning-') ? 'Complete Learning Package Enrollment' : 'Complete Your Investment'}
            </h3>
            <button onClick={() => setView('packages')} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to packages
            </button>
          </div>

          <div className="mb-5 rounded-xl bg-gradient-to-r from-brand-blue/10 to-brand-sky/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {selectedPlan.id?.startsWith('learning-') ? 'Selected Course' : 'Selected Package'}
                </p>
                <p className="text-base font-bold text-gray-900">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">
                  {selectedPlan.id?.startsWith('learning-') ? 'Course Fee' : 'Investment Range'}
                </p>
                <p className="text-base font-bold text-brand-blue">
                  ${Number(selectedPlan.minAmount).toLocaleString()}{selectedPlan.maxAmount ? ` - $${Number(selectedPlan.maxAmount).toLocaleString()}` : ''}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleInvestmentSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {selectedPlan.id?.startsWith('learning-') ? 'Payment Amount (USD)' : 'Investment Amount (USD)'}
                </label>
                <input
                  type="number"
                  min={Number(selectedPlan.minAmount)}
                  max={selectedPlan.maxAmount ? Number(selectedPlan.maxAmount) : undefined}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                  placeholder={`${Number(selectedPlan.minAmount).toLocaleString()}${selectedPlan.maxAmount ? ` - $${Number(selectedPlan.maxAmount).toLocaleString()}` : ''}`}
                  disabled={selectedPlan.id?.startsWith('learning-')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <input
                  type="text"
                  value="EcoCash"
                  disabled
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700"
                />
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p>
                <strong>
                  {selectedPlan.id?.startsWith('learning-') 
                    ? 'Course Access: ' 
                    : 'How it works: '}
                </strong>
                {selectedPlan.id?.startsWith('learning-') 
                  ? 'After payment, you will receive lifetime access to course materials and live sessions. Certificate awarded upon completion.'
                  : `EcoCash will trade on your behalf for ${selectedPlan.tradeDurationHours || 6} hours. After the trade closes, you receive ${selectedPlan.returnMultiplier}x your investment as profit.`}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky px-5 py-2 text-sm font-medium text-white hover:from-brand-blue/90 hover:to-brand-sky/90 transition-all">
                {selectedPlan.id?.startsWith('learning-') ? 'Request Enrollment' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setView('packages')} className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'pending' && pendingPayment && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {pendingPayment.ecocashNumber ? 'Payment Details Received!' : 'Waiting for Payment Details'}
            </h3>
            {!pendingPayment.ecocashNumber && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            Your investment request has been submitted. Payment details will be sent shortly.
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 font-medium text-brand-blue hover:text-brand-sky transition-colors"
            >
              REFRESH
            </button>
          </p>
          
          {pendingPayment.ecocashNumber && (
            <div className="rounded-xl bg-green-50 p-4 mt-4 space-y-2">
              <div>
                <span className="text-xs text-gray-600">EcoCash Number:</span>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold text-gray-900">{pendingPayment.ecocashNumber}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pendingPayment.ecocashNumber || '')
                      toast.success('Copied!')
                    }}
                    className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-blue hover:bg-gray-100 transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Account Name:</span>
                <p className="font-semibold text-gray-900">{pendingPayment.ecocashAccountName}</p>
              </div>
              {pendingPayment.ecocashReference && (
                <div>
                  <span className="text-xs text-gray-600">Reference:</span>
                  <p className="font-semibold text-gray-900">{pendingPayment.ecocashReference}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const allDetails = `EcoCash: ${pendingPayment.ecocashNumber}\nAccount: ${pendingPayment.ecocashAccountName}\nReference: ${pendingPayment.ecocashReference || 'N/A'}`
                    navigator.clipboard.writeText(allDetails)
                    toast.success('All details copied!')
                  }}
                  className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-brand-blue border border-brand-blue/20 hover:bg-gray-50 transition-all"
                >
                  Copy All Details
                </button>
                <input
                  type="file"
                  id="receipt-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const form = new FormData()
                      form.append('depositId', pendingPayment.depositId || '')
                      form.append('receipt', file)
                      try {
                        await api.post('deposits/upload-receipt', form)
                        toast.success('Payment proof submitted!')
                        setView('packages')
                        fetchInvestments()
                      } catch (err: any) {
                        console.error('Upload error:', err)
                        toast.error(err.response?.data?.message || 'Failed to upload proof')
                      }
                    }
                  }}
                />
                <label
                  htmlFor="receipt-upload"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky px-4 py-2 text-sm font-medium text-white hover:from-brand-blue/90 hover:to-brand-sky/90 cursor-pointer transition-all"
                >
                  Have you paid? &gt; Upload Payment Proof
                </label>
                <button
                  onClick={() => setView('packages')}
                  className="ml-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {!pendingPayment.ecocashNumber && (
            <div className="rounded-xl bg-yellow-50 p-4 mt-4">
              <p className="text-sm text-yellow-800">Waiting for payment details...</p>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="overflow-x-auto rounded-3xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b text-left text-sm font-medium text-gray-600">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Profit</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {investments.map((inv) => {
                const plan = inv.plan || {}
                const minAmt = plan.minAmount
                const profitReturn = minAmt ? minAmt * (plan.returnMultiplier || 1) : inv.depositAmount || 0
                return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.investmentId}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{plan.name || '-'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">${Number(inv.depositAmount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">${Number(inv.currentBalance || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-mono whitespace-nowrap">${(
                        inv.profitAmount ?? Number(inv.depositAmount) * (inv.plan?.returnMultiplier || 1)
                      ).toLocaleString()}</span>
                      <button
                        onClick={() => {
                          api.post('notifications/profit-request', { investmentId: inv.investmentId })
                            .then(() => toast.success('Profit request sent to admin!'))
                            .catch((err) => toast.error(err.response?.data?.message || 'Failed to send request'))
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-all text-[10px] font-medium"
                        title="Request profit update from admin"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Track
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[inv.status as InvestmentStatus]}`}>
                      {inv.status?.replace(/_/g, ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.status === 'ACTIVE_TRADE' && (
                      <button
                        onClick={() => {
                          setSimulationInvestment(inv)
                          setView('simulation')
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#F0B90B]/10 text-[#F0B90B] hover:bg-[#F0B90B]/20 transition-all text-[10px] font-medium"
                        title="View live trade execution"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Live Trade
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
          {investments.length === 0 && <div className="p-8 text-center text-gray-500">No investments yet. Choose a package to get started!</div>}
        </div>
      )}

      {view === 'simulation' && simulationInvestment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Trade Session</h3>
              <p className="text-sm text-gray-500">
                Investment #{simulationInvestment.investmentId} | {simulationInvestment.plan?.name || 'Plan'} | ${Number(simulationInvestment.depositAmount).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => {
                setView('history')
                setSimulationInvestment(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to History
            </button>
          </div>
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <ActiveTradeSimulator
              investmentId={simulationInvestment.investmentId}
              depositAmount={Number(simulationInvestment.depositAmount)}
              currentProfit={Number(simulationInvestment.profitAmount || 0)}
              status={simulationInvestment.status}
            />
          </div>
        </div>
      )}
    </div>
  )
}
