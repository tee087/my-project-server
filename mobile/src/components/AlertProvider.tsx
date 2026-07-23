import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Animated, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome } from '@expo/vector-icons'

type AlertType = 'success' | 'error' | 'info' | 'default'

type AlertContextType = {
  showAlert: (title: string, message: string, type?: AlertType) => void
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showInfo: (title: string, message: string) => void
}

const AlertContext = createContext<AlertContextType | null>(null)

const ALERT_COLORS: Record<AlertType, [string, string]> = {
  success: ['#065f46', '#059669'],
  error: ['#7f1d1d', '#dc2626'],
  info: ['#1e40af', '#3b82f6'],
  default: ['#374151', '#4b5563'],
}

const ALERT_ICONS: Record<AlertType, 'check' | 'exclamation-circle' | 'info-circle' | 'circle'> = {
  success: 'check',
  error: 'exclamation-circle',
  info: 'info-circle',
  default: 'circle',
}

const AUTO_DISMISS_MS = 3000

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{
    visible: boolean
    title: string
    message: string
    type: AlertType
    id: number
  }>({ visible: false, title: '', message: '', type: 'default', id: 0 })

  useEffect(() => {
    if (alert.visible && alert.id !== 0) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, visible: false }))
      }, AUTO_DISMISS_MS)
      return () => clearTimeout(timer)
    }
  }, [alert.visible, alert.id])

  const showAlert = (title: string, message: string, type: AlertType = 'default') => {
    setAlert({ visible: true, title, message, type, id: Date.now() })
  }

  const showSuccess = (title: string, message: string) => showAlert(title, message, 'success')
  const showError = (title: string, message: string) => showAlert(title, message, 'error')
  const showInfo = (title: string, message: string) => showAlert(title, message, 'info')

  const hideAlert = () => setAlert(prev => ({ ...prev, visible: false }))

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showInfo }}>
      {children}
      {alert.visible && (
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View style={styles.modal}>
            <LinearGradient
              colors={ALERT_COLORS[alert.type]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <View style={styles.content}>
                <FontAwesome name={ALERT_ICONS[alert.type]} size={24} color="#fff" />
                <Text style={styles.title}>{alert.title}</Text>
                <Text style={styles.message}>{alert.message}</Text>
                <TouchableOpacity onPress={hideAlert} style={styles.button}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>OK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
    </AlertContext.Provider>
  )
}

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  modal: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#f3f4f6',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
  },
  buttonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})