'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, Wallet, FileText, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/investments', label: 'Investments', icon: TrendingUp },
  { href: '/admin/deposits', label: 'Deposits', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!token || user?.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [token, loading, router, user])

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (!token || user?.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-blue" />
            <span className="text-lg font-bold text-brand-blue">Admin Panel</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
               className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${pathname === item.href ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="text-sm text-gray-500">
            Admin: {user?.firstName} {user?.lastName}
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
