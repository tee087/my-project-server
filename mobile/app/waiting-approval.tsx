import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function WaitingApprovalScreen() {
  const router = useRouter()
  const { updateUser, logout } = useAuth()
  const [checking, setChecking] = useState(false)

  const checkApproval = async () => {
    setChecking(true)
    try {
      const { data } = await api.get('auth/profile')
      console.log('Profile response:', data)
      updateUser(data.data)
      if (data.data?.kycStatus === 'APPROVED') {
        router.replace('/(tabs)/dashboard')
      }
    } catch (error) {
      console.error('Check approval error:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void checkApproval()
    const interval = setInterval(() => void checkApproval(), 10000)
    return () => clearInterval(interval)
    // The interval intentionally starts once for this screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your account has been created successfully. Please wait for verification to access your dashboard.
        </Text>
        <Text style={styles.note}>
          You will be notified once your account is approved.
        </Text>
        <TouchableOpacity
            style={[styles.button, checking && styles.buttonDisabled]}
            onPress={async () => {
              if (!checking) await checkApproval()
            }}
          >
          {checking ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Check Approval Status</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { void logout(); router.replace('/login') }} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  note: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: { marginTop: 16, padding: 12 },
  logoutText: { color: '#94a3b8', fontSize: 14 },
})
