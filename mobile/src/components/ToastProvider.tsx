import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Animated, StyleSheet, View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type ToastType = 'success' | 'error' | 'info' | 'default'

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const GRADIENT_COLORS: Record<ToastType, readonly [string, string]> = {
  success: ['#065f46', '#059669'],
  error: ['#7f1d1d', '#dc2626'],
  info: ['#1e40af', '#3b82f6'],
  default: ['#374151', '#4b5563'],
}

const TOAST_ICON_COLORS: Record<ToastType, string> = {
  success: '#10b981',
  error: '#ef4444',
  info: '#3b82f6',
  default: '#6b7280',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'default', duration: number = 1500) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  const showSuccess = (message: string, duration?: number) => showToast(message, 'success', duration)
  const showError = (message: string, duration?: number) => showToast(message, 'error', duration)
  const showInfo = (message: string, duration?: number) => showToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map(toast => (
          <Animated.View key={toast.id} style={styles.toastWrapper}>
            <LinearGradient
              colors={GRADIENT_COLORS[toast.type]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toast}
            >
              <View style={styles.toastContent}>
                <View style={[styles.toastIcon, { backgroundColor: TOAST_ICON_COLORS[toast.type] }]} />
                <Text style={styles.toastText}>{toast.message}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastWrapper: {
    marginBottom: 8,
  },
  toast: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
})