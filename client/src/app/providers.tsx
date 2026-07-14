import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/context/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
