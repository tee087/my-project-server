'use client'

import { Toaster as HotToaster } from 'react-hot-toast'
import { X } from 'lucide-react'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HotToaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}
