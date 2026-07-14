'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Users, TrendingUp, Wallet, Clock } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    activeTrades: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDeposited: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard')
      setStats(data.data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3"><Users className="h-6 w-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Investments</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalInvestments}</p>
            </div>
            <div className="rounded-lg bg-brand-blue/10 p-3"><TrendingUp className="h-6 w-6 text-brand-blue" /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Trades</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.activeTrades}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3"><TrendingUp className="h-6 w-6 text-green-600" /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Deposits</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pendingDeposits}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3"><Clock className="h-6 w-6 text-yellow-600" /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Withdrawals</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3"><Wallet className="h-6 w-6 text-red-600" /></div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposited</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">${Number(stats.totalDeposited).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3"><Wallet className="h-6 w-6 text-purple-600" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
