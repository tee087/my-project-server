'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CheckCircle, XCircle, Play, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    try {
        const { data } = await api.get('admin/investments')
      setInvestments(data.data)
    } catch (err) {
      toast.error('Failed to fetch investments')
    } finally {
      setLoading(false)
    }
  }

  const startTrade = async (id: string) => {
    try {
        await api.put(`investments/${id}/start-trade`)
      toast.success('Trade started')
      fetchInvestments()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Investment Management</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3">Profit</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {investments.map((inv) => {
                const plan = inv.plan || {}
                const profit = (inv.depositAmount || 0) * (plan.returnMultiplier || 1)
                return (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.investmentId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.user?.firstName} {inv.user?.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">${Number(inv.depositAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">${Number(inv.currentBalance || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">+${Number(profit).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.status?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    {inv.status === 'PENDING' || inv.status === 'PAYMENT_RECEIVED' ? (
                      <button onClick={() => startTrade(inv.id)} className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
                        <Play size={14} /> Start Trade
                      </button>
                    ) : null}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}