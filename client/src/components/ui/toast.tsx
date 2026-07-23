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
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -10px rgba(2,6,23,0.6)',
            fontWeight: 600,
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg,#06b6d4,#7c3aed)',
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            style: {
              background: '#ffffff',
              color: '#064e3b',
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg,#10b981,#06b6d4)',
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: {
              background: '#ffffff',
              color: '#7f1d1d',
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg,#ef4444,#f97316)',
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
            },
          },
        }}
      />
    </>
  )
}
