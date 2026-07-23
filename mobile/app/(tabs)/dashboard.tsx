import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { api, resolveApiAssetUrl } from '@/lib/api'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { TradingViewChart } from '@/components/TradingViewChart'

export default function DashboardScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalDeposited: 0,
    activeInvestments: 0,
    currentBalance: 0,
    totalProfit: 0,
    walletBalance: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [activeInvestments, setActiveInvestments] = useState<any[]>([])
  const [requestingProfit, setRequestingProfit] = useState(false)
  const [showStopPopup, setShowStopPopup] = useState(false)
  const [popupInvestment, setPopupInvestment] = useState<any | null>(null)
  const [showWithdrawalPopup, setShowWithdrawalPopup] = useState(false)
  const [stoppedInvestments, setStoppedInvestments] = useState<Set<string>>(new Set())
  const [simulationInvestment, setSimulationInvestment] = useState<any | null>(null)
  const [showBalance, setShowBalance] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const router = useRouter()
  const profitDetectedRef = useRef<Set<string>>(new Set())

  const fetchData = async () => {
    try {
      const [investmentRes, referralRes] = await Promise.all([
        api.get('/investments'),
        api.get('/referrals'),
      ])
      const notificationsRes = await api.get('/notifications?unread=true').catch(() => null)
      const investments = investmentRes.data.data || []
      
      const activeInv = investments.filter((inv: any) =>
        inv.status === 'PAYMENT_RECEIVED' || inv.status === 'ACTIVE_TRADE' || inv.status === 'CLOSED' ||
        inv.deposits?.some((deposit: any) => deposit.status === 'PAYMENT_RECEIVED')
      )
      
      const activeCount = activeInv.filter((inv: any) => 
        inv.status === 'PAYMENT_RECEIVED' || inv.status === 'ACTIVE_TRADE'
      ).length
      const totalDeposited = activeInv.reduce((sum: number, inv: any) => sum + Number(inv.depositAmount), 0)
      const totalProfit = activeInv.reduce((sum: number, inv: any) => sum + Number(inv.profitAmount || 0), 0)
      const walletBalance = Number(referralRes.data.data?.walletBalance || 0)
      const unreadCount = notificationsRes?.data?.data?.length || 0
      
      activeInv.forEach((inv: any) => {
        if (inv.status === 'ACTIVE_TRADE' && inv.profitActionRequiredAt && 
            !profitDetectedRef.current.has(inv.investmentId) && 
            !stoppedInvestments.has(inv.investmentId)) {
          profitDetectedRef.current.add(inv.investmentId)
          setPopupInvestment(inv)
          setShowStopPopup(true)
        }
      })
      
      setStats({
        totalDeposited,
        activeInvestments: activeCount,
        currentBalance: activeInv.reduce((sum: number, inv: any) => sum + Number(inv.currentBalance), 0) + walletBalance,
        totalProfit,
        walletBalance,
      })
      setActiveInvestments(activeInv)
      setUnreadNotifications(unreadCount)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stoppedInvestments])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleTradeAction = async (action: 'stop' | 'continue') => {
    if (!popupInvestment) return
    try {
      await api.post(`/investments/${popupInvestment.investmentId}/user-action`, { action })
      if (action === 'stop') {
        setStoppedInvestments(prev => new Set(prev).add(popupInvestment.investmentId))
        if (simulationInvestment?.investmentId === popupInvestment.investmentId) {
          setSimulationInvestment(null)
        }
        setShowStopPopup(false)
        setShowWithdrawalPopup(true)
        Alert.alert('Success', 'Trade stop request sent to admin')
      } else {
        Alert.alert('Success', 'Trade will continue - admin notified')
        setShowStopPopup(false)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error'
      if (err.response?.status === 401) {
        Alert.alert('Error', 'Please log in to continue')
        router.push('/login')
      } else {
        Alert.alert('Error', 'Failed to send action: ' + msg)
      }
    }
  }

  

  const formatCurrency = (amount: number) => {
    return '$' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE_TRADE':
      case 'PAYMENT_RECEIVED':
        return { bg: '#d1fae5', text: '#065f46' }
      case 'PENDING':
      case 'WAITING_FOR_PAYMENT_DETAILS':
      case 'PAYMENT_DETAILS_SENT':
        return { bg: '#fef3c7', text: '#92400e' }
      case 'CLOSED':
      case 'WITHDRAWN':
        return { bg: '#dbeafe', text: '#1e40af' }
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#991b1b' }
      default:
        return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const handleTrackProfit = async () => {
    if (stats.activeInvestments === 0) {
      Alert.alert('Info', 'No active investments to track profit')
      return
    }
    setRequestingProfit(true)
    try {
      await api.post('notifications/profit-request')
      Alert.alert('Success', 'Profit update requested')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to request profit update')
    } finally {
      setRequestingProfit(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              {user?.profileImage || user?.avatar ? (
                <Image source={{ uri: resolveApiAssetUrl(user.profileImage || user.avatar) }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <FontAwesome name="user" size={20} color="#64748b" />
                </View>
              )}
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greeting}>Hello, {user?.firstName || 'User'}</Text>
                {user?.kycStatus === 'APPROVED' && (
                  <View style={styles.verifiedBadge}>
                    <FontAwesome name="check" size={10} color="#065f46" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.notificationIcon}>
                <FontAwesome name="bell" size={18} color="#2563eb" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Welcome back to your investment dashboard</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <View style={styles.balanceAmountRow}>
                <Text style={styles.balanceAmount}>
                  {showBalance ? formatCurrency(stats.currentBalance) : '********'}
                </Text>
                <TouchableOpacity
                  style={styles.balanceToggleBtn}
                  onPress={() => setShowBalance(!showBalance)}
                >
                  <FontAwesome name={showBalance ? "eye-slash" : "eye"} size={13} color="#fff" />
                </TouchableOpacity>
              </View>
              {stats.walletBalance > 0 && (
                <Text style={styles.walletBalance}>Includes {formatCurrency(stats.walletBalance)} in approved referral rewards</Text>
              )}
            </View>
            <View style={styles.walletIcon}>
              <FontAwesome name="credit-card" size={24} color="#fff" />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Invested</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalDeposited)}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.profitHeader}>
                <Text style={styles.statLabel}>Total Profit</Text>
                <Text style={[styles.statValue, stats.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                  {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.totalProfit))}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.trackButton, requestingProfit && styles.trackButtonDisabled]}
                onPress={async () => {
                if (!requestingProfit) await handleTrackProfit()
              }}
              >
                {requestingProfit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <FontAwesome name="line-chart" size={12} color="#fff" style={{ marginRight: 4 }} />
                )}
                <Text style={styles.trackButtonText}>Track Profit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(tabs)/investments')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}> 
              <FontAwesome name="line-chart" size={20} color="#2563eb" />
            </View>
            <Text style={styles.actionText}>Invest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}> 
              <FontAwesome name="list" size={20} color="#059669" />
            </View>
            <Text style={styles.actionText}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(tabs)/withdrawals')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}> 
              <FontAwesome name="arrow-up" size={20} color="#db2777" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.investmentsSection}>
          <View style={styles.investmentsHeader}>
            <Text style={styles.sectionTitle}>Active Investments</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/investments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {stats.activeInvestments === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="line-chart" size={32} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No active investments</Text>
              <Text style={styles.emptySubtitle}>Start investing to see your trades here</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push('/(tabs)/investments')}
              >
                <Text style={styles.startButtonText}>Start Investing</Text>
              </TouchableOpacity>
            </View>
          ) : simulationInvestment ? (
            <View style={styles.simulationContainer}>
              <View style={styles.simulationHeader}>
                <View>
                  <Text style={styles.simulationTitle}>Live Trade Session</Text>
                  <Text style={styles.simulationSubtitle}>
                    Investment #{simulationInvestment.investmentId} | {simulationInvestment.plan?.name || 'Plan'} | ${Number(simulationInvestment.depositAmount).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSimulationInvestment(null)}>
                  <FontAwesome name="times" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.chartContainer}><TradingViewChart symbol="BTCUSDT" height={220} /></View>
              <View style={styles.liveTradeInfo}>
                <Text style={styles.liveTradeLabel}>Current P&L</Text>
                <Text style={[
                  styles.liveTradeValue,
                  Number(simulationInvestment.profitAmount || 0) >= 0 ? styles.profitPositive : styles.profitNegative
                ]}>
                  {Number(simulationInvestment.profitAmount || 0) >= 0 ? '+' : ''}{formatCurrency(Math.abs(Number(simulationInvestment.profitAmount || 0)))}
                </Text>
              </View>
              <View style={styles.liveTradeButtons}>
                <TouchableOpacity
                  style={styles.liveTradeBtn}
                  onPress={() => {
                    handleTradeAction('stop')
                    setSimulationInvestment(null)
                  }}
                >
                  <Text style={styles.liveTradeBtnText}>Stop Trade</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.liveTradeBtn}
                  onPress={() => {
                    handleTradeAction('continue')
                    setSimulationInvestment(null)
                  }}
                >
                  <Text style={styles.liveTradeBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.investmentsList}>
              {activeInvestments.slice(0, 3).map((inv) => (
                <View key={inv.id} style={styles.investmentCard}>
                  <View style={styles.investmentInfo}>
                    <FontAwesome name="line-chart" size={16} color="#2563eb" style={styles.investmentIcon} />
                    <View>
                      <Text style={styles.investmentPlan}>{inv.plan?.name || 'Plan'}</Text>
                      <Text style={styles.investmentId}>#{inv.investmentId}</Text>
                    </View>
                  </View>
                  <View style={styles.investmentRight}>
                    <Text style={styles.investmentAmount}>{formatCurrency(inv.depositAmount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status).bg }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(inv.status).text }]}>
                        {inv.status.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    {inv.status === 'ACTIVE_TRADE' && !stoppedInvestments.has(inv.investmentId) && (
                      <TouchableOpacity
                        style={styles.liveTradeButton}
                        onPress={() => setSimulationInvestment(inv)}
                      >
                        <FontAwesome name="play" size={12} color="#fff" />
                        <Text style={styles.liveTradeButtonText}>Live Trade</Text>
                      </TouchableOpacity>
                    )}
                    {stoppedInvestments.has(inv.investmentId) && (
                      <View style={styles.tradeEndedBadge}>
                        <Text style={styles.tradeEndedText}>Trade Ended</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {showStopPopup && popupInvestment && (
          <Modal visible={showStopPopup} transparent animationType="fade">
            <View style={styles.stopModalOverlay}>
              <View style={styles.stopModal}>
                <View style={styles.stopModalHeader}>
                  <FontAwesome name="exclamation-triangle" size={20} color="#f59e0b" />
                  <Text style={styles.stopModalTitle}>Trade Action Required</Text>
                </View>
                <Text style={styles.stopModalText}>
                  Your investment #{popupInvestment.investmentId} has generated profit. Would you like to stop the trade or continue?
                </Text>
                <View style={styles.stopModalProfit}>
                  <Text style={styles.stopModalProfitLabel}>Current P&L:</Text>
                  <Text style={[
                    styles.stopModalProfitValue,
                    Number(popupInvestment.profitAmount || 0) >= 0 ? styles.profitPositive : styles.profitNegative
                  ]}>
                    {Number(popupInvestment.profitAmount || 0) >= 0 ? '+' : ''}{formatCurrency(Math.abs(Number(popupInvestment.profitAmount || 0)))}
                  </Text>
                </View>
                <View style={styles.stopModalButtons}>
                  <TouchableOpacity
                    style={styles.stopModalButton}
                    onPress={() => handleTradeAction('stop')}
                  >
                    <Text style={styles.stopModalButtonText}>Stop Trade</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stopModalButton, styles.continueModalButton]}
                    onPress={() => handleTradeAction('continue')}
                  >
                    <Text style={styles.stopModalButtonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {showWithdrawalPopup && (
          <Modal visible={showWithdrawalPopup} transparent animationType="fade">
            <View style={styles.withdrawalModalOverlay}>
              <View style={styles.withdrawalModal}>
                <FontAwesome name="check-circle" size={32} color="#10b981" />
                <Text style={styles.withdrawalModalTitle}>Trade Ended</Text>
                <Text style={styles.withdrawalModalText}>
                  You ended the trade. You can now withdraw your profits from the withdrawals page.
                </Text>
                <TouchableOpacity
                  style={styles.withdrawalModalButton}
                  onPress={() => {
                    setShowWithdrawalPopup(false)
                    router.push('/(tabs)/withdrawals')
                  }}
                >
                  <Text style={styles.withdrawalModalButtonText}>Go to Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  greetingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#065f46',
  },
  notificationBtn: {
    padding: 8,
    marginRight: 10,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 12,
  },
  balanceToggleBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginLeft: 6,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLeft: {
    flex: 1,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#0045a0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  walletBalance: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  walletIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  profitPositive: {
    color: '#a7f3d0',
  },
  profitNegative: {
    color: '#fca5a5',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  trackButtonDisabled: {
    opacity: 0.7,
  },
  trackButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
    flexBasis: '30%',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  investmentsSection: {
    marginHorizontal: 16,
  },
  investmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0045a0',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  simulationContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  simulationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  simulationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  simulationSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  chartPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
    zIndex: 1,
  },
  liveTradeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveTradeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  liveTradeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  liveTradeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  liveTradeBtn: {
    flex: 1,
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  liveTradeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  investmentsList: {
    gap: 12,
  },
  investmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  investmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  investmentIcon: {
    marginRight: 12,
  },
  investmentPlan: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  investmentId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  liveTradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  liveTradeButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 4,
  },
  tradeEndedBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tradeEndedText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  stopModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  stopModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stopModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  stopModalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  stopModalProfit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stopModalProfitLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stopModalProfitValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  stopModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  stopModalButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueModalButton: {
    backgroundColor: '#2563eb',
  },
  stopModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  withdrawalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawalModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 360,
  },
  withdrawalModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  withdrawalModalText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  withdrawalModalButton: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  withdrawalModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
})
