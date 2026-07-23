import { Tabs, useRouter } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { getThemeColors } from '@/utils/themeColors'

const TAB_ICON_COLORS = {
  dashboard: '#10b981',
  investments: '#3b82f6',
  trades: '#8b5cf6',
  referrals: '#ec4899',
  profile: '#6366f1',
  settings: '#8b5cf6',
  withdrawals: '#f59e0b',
  transactions: '#10b981',
}

export default function TabsLayout() {
  const router = useRouter()
  const { token, user, loading } = useAuth()
  const { theme } = useTheme()
  const colors = getThemeColors(theme)

  useEffect(() => {
    if (loading) return
    if (!token) router.replace('/login')
    else if (user?.kycStatus !== 'APPROVED') router.replace('/waiting-approval')
  }, [loading, token, user?.kycStatus, router])

  if (loading || !token || user?.kycStatus !== 'APPROVED') return null

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 70,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          width: '12.5%',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="home" size={22} color={TAB_ICON_COLORS.dashboard} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="line-chart" size={22} color={TAB_ICON_COLORS.investments} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trades',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="bar-chart" size={22} color={TAB_ICON_COLORS.trades} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          title: 'Referrals',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="gift" size={22} color={TAB_ICON_COLORS.referrals} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="user" size={22} color={TAB_ICON_COLORS.profile} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Trans',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="credit-card" size={22} color={TAB_ICON_COLORS.transactions} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="withdrawals"
        options={{
          title: 'Withdraw',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="arrow-down" size={22} color={TAB_ICON_COLORS.withdrawals} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <FontAwesome name="cog" size={22} color={TAB_ICON_COLORS.settings} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})