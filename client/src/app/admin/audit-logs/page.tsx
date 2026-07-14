'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { FileText } from 'lucide-react'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
        const { data } = await api.get('admin/audit-logs')
      setLogs(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Admin ID</th>
                <th className="px-6 py-3">Entity Type</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.adminId || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.entityType || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
