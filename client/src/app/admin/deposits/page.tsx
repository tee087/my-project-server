'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CheckCircle, XCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
        const { data } = await api.get('admin/deposits')
      setDeposits(data.data)
    } catch (err) {
      toast.error('Failed to fetch deposits')
    } finally {
      setLoading(false)
    }
  }

  const approveDeposit = async (id: string) => {
    try {
      await api.put(`deposits/${id}/approve`)
      toast.success('Deposit approved')
      fetchDeposits()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const sendPaymentDetails = async (id: string) => {
    const ecocashNumber = prompt('Enter EcoCash Number:')
    const ecocashAccountName = prompt('Enter Account Name:')
    const ecocashReference = prompt('Enter Reference (optional):')
    if (!ecocashNumber || !ecocashAccountName) {
      toast.error('Payment details required')
      return
    }
    try {
      await api.put(`deposits/${id}/send-details`, { ecocashNumber, ecocashAccountName, ecocashReference })
      toast.success('Payment details sent to user')
      fetchDeposits()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const rejectDeposit = async (id: string) => {
    try {
      await api.put(`deposits/${id}/reject`)
      toast.success('Deposit rejected')
      fetchDeposits()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Deposit Management</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deposits.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(dep.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{dep.user?.firstName} {dep.user?.lastName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(dep.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dep.paymentMethod?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dep.status?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 flex gap-2">
                    {dep.status === 'PAYMENT_SUBMITTED' && (
                      <>
                        <button onClick={() => approveDeposit(dep.id)} className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button onClick={() => rejectDeposit(dep.id)} className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    {dep.status === 'WAITING_FOR_PAYMENT_DETAILS' && (
                      <button onClick={() => sendPaymentDetails(dep.id)} className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                        <Send size={14} /> Send Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}