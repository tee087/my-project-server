import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function Index() {
  const { token, user, loading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.8)).current
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (loading) return

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]).start()

    const timer = setTimeout(() => {
      setShowSplash(false)
      if (token) {
        if (user?.kycStatus === 'APPROVED') {
          router.replace('/(tabs)/dashboard')
        } else {
          router.replace('/waiting-approval')
        }
      } else {
        router.replace('/login')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [loading, token, user?.kycStatus, router, opacity, scale, progress])

  const backgroundColor = theme === 'dark' ? '#111827' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#111827'

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#0045a0" size="large" />
      </SafeAreaView>
    )
  }

  if (!showSplash) return null

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoBrand, { color: backgroundColor === '#111827' ? '#0045a0' : '#0045a0' }]}>ECO</Text>
              <Text style={[styles.logoAccent, { color: backgroundColor === '#111827' ? '#ef4444' : '#ef4444' }]}>CASH</Text>
            </View>
            <Text style={[styles.tagline, { color: backgroundColor === '#111827' ? '#94a3b8' : '#64748b' }]}>Premium Investment Platform</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
          <Text style={[styles.loadingText, { color: backgroundColor === '#111827' ? '#64748b' : '#64748b' }]}>Loading...</Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBrand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0045a0',
  },
  logoAccent: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ef4444',
  },
  tagline: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 150,
    height: 3,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0045a0',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
  },
})
