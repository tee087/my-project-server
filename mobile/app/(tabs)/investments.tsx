import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAlert } from '@/components/AlertProvider'

type InvestmentStatus = 'PENDING' | 'PAYMENT_RECEIVED' | 'ACTIVE_TRADE' | 'TRADE_ENDED' | 'CLOSED' | 'WITHDRAWN'

type PendingPayment = {
  depositId: string | null
  ecocashNumber: string | null
  ecocashAccountName: string | null
  ecocashReference: string | null
}

export default function InvestmentsScreen() {
  const router = useRouter()
  const [view, setView] = useState<'packages' | 'history' | 'form' | 'pending' | 'learning'>('packages')
  const [plans, setPlans] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [formData, setFormData] = useState({ amount: '', paymentMethod: 'ECOCASH', planId: '' })
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingPaymentRef = useRef<PendingPayment | null>(null)
  const notificationShownRef = useRef({ details: false, approved: false })
  const { showSuccess, showError, showInfo } = useAlert()

  useEffect(() => {
    fetchPlans()
    fetchInvestments()
    checkPendingDeposit()
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('investments/plans')
      setPlans(data.data)
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Failed to load plans')
    }
  }

  const fetchInvestments = async () => {
    try {
      const { data } = await api.get('investments')
      setInvestments(data.data)
    } catch (err) {
      console.log(err)
    }
  }

  const checkPendingDeposit = async () => {
    try {
      const { data } = await api.get('deposits')
      const latest = data.data?.[0]
      if (latest && (latest.status === 'WAITING_FOR_PAYMENT_DETAILS' || latest.status === 'PAYMENT_DETAILS_SENT' || latest.status === 'PAYMENT_SUBMITTED')) {
        notificationShownRef.current = { details: false, approved: false }
        const payment: PendingPayment = {
          depositId: latest.id,
          ecocashNumber: null,
          ecocashAccountName: null,
          ecocashReference: null,
        }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        setView('pending')
        startPaymentPolling()
      }
    } catch (err) {
      console.error('Check pending error:', err)
    }
  }

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan)
    setFormData({ amount: String(plan.minAmount), paymentMethod: 'ECOCASH', planId: plan.id })
    setView('form')
  }

  const handleInvestmentSubmit = async () => {
    if (!selectedPlan) return
    notificationShownRef.current = { details: false, approved: false }
    try {
      const isLearningPackage = selectedPlan.id?.startsWith('learning-')
      if (isLearningPackage) {
        const response = await api.post('investments', {
          amount: Number(selectedPlan.minAmount),
          paymentMethod: 'ECOCASH',
          isLearning: true,
          learningLevel: selectedPlan.id.replace('learning-', ''),
        })
        const { depositId } = response.data.data
        const payment: PendingPayment = { depositId, ecocashNumber: null, ecocashAccountName: null, ecocashReference: null }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        startPaymentPolling()
        showSuccess('Success', 'Enrollment request submitted! Waiting for payment details...')
        setView('pending')
        fetchInvestments()
      } else {
        const { data } = await api.post('investments', {
          ...formData,
          amount: Number(formData.amount),
        })
        const { depositId } = data.data
        const payment: PendingPayment = { depositId, ecocashNumber: null, ecocashAccountName: null, ecocashReference: null }
        setPendingPayment(payment)
        pendingPaymentRef.current = payment
        startPaymentPolling()
        showSuccess('Success', 'Investment request submitted! Waiting for payment details...')
        setView('pending')
        fetchInvestments()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed'
      if (err.response?.status === 401) router.replace('/login')
      else if (err.response?.status === 400 && msg.includes('KYC')) {
        showError('Error', 'Complete KYC first')
      } else {
        showError('Error', msg)
      }
    }
  }

  const startPaymentPolling = () => {
    if (pollIntervalRef.current) return
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('deposits')
        const latest = data.data?.[0]
        const current = pendingPaymentRef.current
        if (latest && current?.depositId === latest?.id) {
          if (latest?.ecocashNumber && !current?.ecocashNumber && !notificationShownRef.current.details) {
            notificationShownRef.current.details = true
            setPendingPayment({ ...latest })
            showSuccess('Success', 'Payment details received!')
          }
          if (latest?.status === 'PAYMENT_RECEIVED' && !notificationShownRef.current.approved) {
            notificationShownRef.current.approved = true
            showSuccess('Success', 'Payment approved! Your investment is now active.')
            setView('packages')
            setPendingPayment(null)
            pendingPaymentRef.current = null
            fetchInvestments()
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchInvestments()
    setRefreshing(false)
  }

  const uploadReceipt = async () => {
    const depositId = pendingPayment?.depositId || pendingPaymentRef.current?.depositId
    if (!depositId) {
      showError('Error', 'No pending payment to upload receipt for')
      return
    }
    
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        showInfo('Permission needed', 'Allow photo library access to upload your payment proof.')
        return
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      })
      
      if (result.canceled || !result.assets[0]) return

      const file = result.assets[0]
      const form = new FormData()
      form.append('depositId', depositId)
      form.append('receipt', {
        uri: file.uri,
        name: file.fileName || `receipt-${Date.now()}.jpg`,
        type: file.mimeType || 'image/jpeg',
      } as any)
      
      showInfo('Uploading', 'Please wait while we upload your payment proof...')
      const res = await api.post('deposits/upload-receipt', form)
      
      showSuccess('Success', 'Payment proof submitted successfully! Admin will verify it shortly.')
      setView('packages')
      await fetchInvestments()
    } catch (err: any) {
      console.error('Receipt upload error:', err)
      showError('Error', err.response?.data?.message || 'Failed to upload payment proof. Please try again.')
    }
  }

  const formatCurrency = (amount: number) => '$' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatStatus = (status: InvestmentStatus) => {
    const statusMap: Record<InvestmentStatus, string> = {
      PENDING: 'Pending',
      PAYMENT_RECEIVED: 'Payment Received',
      ACTIVE_TRADE: 'Active Trade',
      TRADE_ENDED: 'Trade Ended',
      CLOSED: 'Closed',
      WITHDRAWN: 'Withdrawn',
    }
    return statusMap[status] || status
  }

  const statusColors: Record<InvestmentStatus, { bg: string; text: string }> = {
    PENDING: { bg: '#f3f4f6', text: '#374151' },
    PAYMENT_RECEIVED: { bg: '#dbeafe', text: '#1e40af' },
    ACTIVE_TRADE: { bg: '#d1fae5', text: '#065f46' },
    TRADE_ENDED: { bg: '#ede9fe', text: '#5b21b6' },
    CLOSED: { bg: '#ede9fe', text: '#5b21b6' },
    WITHDRAWN: { bg: '#ffedd5', text: '#9a3412' },
  }

  const learningPackages = [
    { level: 'Starter', price: 300, features: ['Market basics', 'Trading terminology', 'Risk management fundamentals', 'Demo trading intro'], enrolled: 2156, performance: '82% avg win rate' },
    { level: 'Basic', price: 750, features: ['Forex fundamentals', 'Crypto basics', 'Technical analysis intro', 'Strategy building'], enrolled: 1423, performance: '85% avg win rate' },
    { level: 'Intermediate', price: 1500, features: ['Advanced technical analysis', 'Trading psychology', 'Risk management strategies', 'Live session access'], enrolled: 892, performance: '89% avg win rate' },
    { level: 'Advanced', price: 3000, features: ['Algorithmic trading', 'Market psychology mastery', 'Portfolio optimization', 'Live trade execution'], enrolled: 423, performance: '92% avg win rate' },
  ]

  const getGradientColor = (index: number) => {
    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f97316']
    return colors[index % colors.length]
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Investments</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity onPress={() => setView('packages')} style={[styles.tab, view === 'packages' && styles.tabActive]}>
              <Text style={[styles.tabText, view === 'packages' && styles.tabTextActive]}>Packages</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setView('learning')} style={[styles.tab, view === 'learning' && styles.tabActive]}>
              <Text style={[styles.tabText, view === 'learning' && styles.tabTextActive]}>Trading Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setView('history')} style={[styles.tab, view === 'history' && styles.tabActive]}>
              <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>My Investments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {view === 'packages' && (
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>EcoCash Investment Platform</Text>
              <Text style={styles.heroText}>Our advanced mining technology locks in all incoming profits and maintains stable trade signals, protecting your investment from negative market volatility.</Text>
            </View>

            <View style={styles.grid}>
              {plans.map((plan, idx) => {
                const isPopular = plan.slug === 'professional'
                return (
                  <TouchableOpacity key={plan.id} onPress={() => handleSelectPlan(plan)} style={[styles.planCard, isPopular && styles.planCardPopular]}>
                    {isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View style={[styles.planIcon, { backgroundColor: getGradientColor(idx) }]}>
                        <FontAwesome name="line-chart" size={24} color="#fff" />
                      </View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planDesc}>{plan.description}</Text>
                    </View>

                    <View style={styles.planDetails}>
                      <View style={styles.investmentDetailRow}>
                        <Text style={styles.investmentDetailLabel}>Investment Range</Text>
                        <Text style={styles.investmentDetailValue}>
                          ${plan.maxAmount ? `${Number(plan.minAmount).toFixed(0)} - $${Number(plan.maxAmount).toFixed(0)}` : `${Number(plan.minAmount).toFixed(0)}+`}
                        </Text>
                      </View>
                      <View style={styles.investmentDetailRow}>
                        <Text style={styles.investmentDetailLabel}>Return</Text>
                        <Text style={styles.investmentDetailValueBrand}>{plan.returnMultiplier}x</Text>
                      </View>
                      <View style={styles.investmentDetailRow}>
                        <Text style={styles.investmentDetailLabel}>Duration</Text>
                        <Text style={styles.investmentDetailValue}>{plan.tradeDurationHours || 6}h</Text>
                      </View>
                    </View>

                    <View style={styles.benefitsList}>
                      <FontAwesome name="shield" size={12} color="#10b981" />
                      <Text style={styles.benefitText}>Auto-profit locking system</Text>
                    </View>
                    <View style={styles.benefitsList}>
                      <FontAwesome name="shield" size={12} color="#10b981" />
                      <Text style={styles.benefitText}>Stable trade signal protection</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleSelectPlan(plan)} style={styles.investBtn}>
                      <Text style={styles.investBtnText}>Invest Now</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {view === 'learning' && (
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Trading Education Packages</Text>
              <Text style={styles.heroText}>Master Forex and Cryptocurrency trading with our expert-led courses. Choose your knowledge level and start your trading journey with professional guidance.</Text>
              <View style={styles.heroFeatures}>
                <View style={styles.heroFeature}>
                  <FontAwesome name="clock-o" size={14} color="#fff" style={styles.heroIcon} />
                  <Text style={styles.heroFeatureText}>Self-paced learning</Text>
                </View>
                <View style={styles.heroFeature}>
                  <FontAwesome name="shield" size={14} color="#fff" style={styles.heroIcon} />
                  <Text style={styles.heroFeatureText}>Certificate of completion</Text>
                </View>
                <View style={styles.heroFeature}>
                  <FontAwesome name="bolt" size={14} color="#fff" style={styles.heroIcon} />
                  <Text style={styles.heroFeatureText}>Live market sessions</Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              {learningPackages.map((pkg, idx) => (
                <View key={pkg.level} style={styles.learningCard}>
                  <View style={styles.learningHeader}>
                    <View style={[styles.learningIcon, { backgroundColor: getGradientColor(idx) }]}>
                      <FontAwesome name="line-chart" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.learningTitle}>{pkg.level} Trading</Text>
                      <Text style={styles.learningPrice}>${pkg.price.toLocaleString()}</Text>
                      <Text style={styles.learningPriceLabel}>full program</Text>
                    </View>
                  </View>

                  <View style={styles.learningStats}>
                    <Text style={styles.learningStatLabel}>{pkg.enrolled.toLocaleString()}+ students enrolled</Text>
                    <Text style={styles.learningStatValue}>{pkg.performance}</Text>
                  </View>

                  <View style={styles.featuresList}>
                    {pkg.features.map((f) => (
                      <View key={f} style={styles.featureItem}>
                        <FontAwesome name="check" size={14} color="#10b981" style={{ marginRight: 6 }} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.enrollBtn} onPress={() => {
                    const mockPlan = { id: `learning-${pkg.level.toLowerCase()}`, name: `${pkg.level} Trading`, minAmount: pkg.price, slug: `learning-${pkg.level.toLowerCase()}` }
                    handleSelectPlan(mockPlan)
                  }}>
                    <Text style={styles.enrollBtnText}>Enroll Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {view === 'history' && (
          <View style={styles.historyContainer}>
            {investments.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyTitle}>No investments yet</Text>
                <Text style={styles.emptyText}>Choose a package to get started!</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {investments.map((inv) => (
                  <View key={inv.id} style={styles.historyItem}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyId}>{inv.investmentId}</Text>
                      <Text style={styles.historyPlan}>{inv.plan?.name || '-'}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>{formatCurrency(inv.depositAmount || 0)}</Text>
                      <View style={[styles.historyStatusBadge, { backgroundColor: statusColors[inv.status as InvestmentStatus].bg }]}>
                        <Text style={[styles.historyStatusText, { color: statusColors[inv.status as InvestmentStatus].text }]}>
                          {formatStatus(inv.status as InvestmentStatus) || '-'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {view === 'form' && selectedPlan && (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {selectedPlan.id?.startsWith('learning-') ? 'Complete Learning Package Enrollment' : 'Complete Your Investment'}
              </Text>
              <TouchableOpacity onPress={() => setView('packages')}>
                <Text style={styles.backLink}>← Back</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedPlanCard}>
              <View>
                <Text style={styles.selectedLabel}>
                  {selectedPlan.id?.startsWith('learning-') ? 'Selected Course' : 'Selected Package'}
                </Text>
                <Text style={styles.selectedName}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.selectedPriceRow}>
                <Text style={styles.selectedPriceLabel}>
                  {selectedPlan.id?.startsWith('learning-') ? 'Course Fee' : 'Investment Range'}
                </Text>
                <Text style={styles.selectedPrice}>${Number(selectedPlan.minAmount).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>
                {selectedPlan.id?.startsWith('learning-') ? 'Payment Amount (USD)' : 'Investment Amount (USD)'}
              </Text>
              <TextInput
                style={[styles.formInput, selectedPlan.id?.startsWith('learning-') && styles.formInputDisabled]}
                value={String(selectedPlan.minAmount)}
                editable={!selectedPlan.id?.startsWith('learning-')}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formInputLabel}>Payment Method</Text>
              <TextInput
                style={[styles.formInput, styles.formInputDisabled]}
                value="EcoCash"
                editable={false}
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {selectedPlan.id?.startsWith('learning-')
                  ? 'Course Access: After payment, you will receive lifetime access to course materials.'
                  : `EcoCash will trade on your behalf for ${selectedPlan.tradeDurationHours || 6} hours. After the trade closes, you receive ${selectedPlan.returnMultiplier}x your investment.`}
              </Text>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity onPress={handleInvestmentSubmit} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>
                  {selectedPlan.id?.startsWith('learning-') ? 'Request Enrollment' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setView('packages')} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {view === 'pending' && pendingPayment && (
          <View style={styles.pendingContainer}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingTitle}>
                {pendingPayment.ecocashNumber ? 'Payment Details Received!' : 'Waiting for Payment Details'}
              </Text>
            </View>

            <Text style={styles.pendingInfoText}>Your investment request has been submitted. Payment details will be sent shortly.</Text>

            {!pendingPayment.ecocashNumber ? (
              <View style={styles.pendingWaitingCard}>
                <Text style={styles.pendingWaitingText}>Waiting for payment details...</Text>
              </View>
            ) : (
              <>
                <View style={styles.pendingDetailsCard}>
                  <View style={styles.pendingDetailRow}>
                    <Text style={styles.pendingDetailLabel}>EcoCash Number:</Text>
                    <View style={styles.pendingCopyRow}>
                      <Text style={styles.pendingDetailValueMono}>{pendingPayment.ecocashNumber}</Text>
                      <TouchableOpacity style={styles.pendingCopyBtn} onPress={() => showInfo('Copied', pendingPayment.ecocashNumber || '')}>
                        <Text style={styles.pendingCopyBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {pendingPayment.ecocashAccountName && (
                    <View style={styles.pendingDetailRow}>
                      <Text style={styles.pendingDetailLabel}>Account Name:</Text>
                      <Text style={styles.pendingDetailValue}>{pendingPayment.ecocashAccountName}</Text>
                    </View>
                  )}
                  {pendingPayment.ecocashReference && (
                    <View style={styles.pendingDetailRow}>
                      <Text style={styles.pendingDetailLabel}>Reference:</Text>
                      <Text style={styles.pendingDetailValue}>{pendingPayment.ecocashReference}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.paymentInstructions}>
                  <Text style={styles.instructionsTitle}>How to Pay</Text>
                  <View style={styles.instructionItem}>
                    <FontAwesome name="copy" size={14} color="#64748b" style={{ marginRight: 8 }} />
                    <Text style={styles.instructionText}>Copy the EcoCash number above</Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <FontAwesome name="money" size={14} color="#64748b" style={{ marginRight: 8 }} />
                    <Text style={styles.instructionText}>Open EcoCash app and send payment to that number only</Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <FontAwesome name="clock-o" size={14} color="#64748b" style={{ marginRight: 8 }} />
                    <Text style={styles.instructionText}>Return here to upload your payment proof screenshot</Text>
                  </View>
                </View>

                <View style={styles.pendingUploadSection}>
                  <TouchableOpacity style={styles.pendingUploadBtn} onPress={uploadReceipt}>
                    <Text style={styles.pendingUploadBtnText}>Upload Payment Proof</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setView('packages')} style={styles.pendingCancelBtn}>
                    <Text style={styles.pendingCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const getGradientColor = (index: number) => {
  const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f97316']
  return colors[index % colors.length]
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  tabContainer: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#0045a0' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  tabTextActive: { color: '#fff' },
  content: { gap: 16 },
  heroCard: { backgroundColor: '#0045a0', borderRadius: 24, padding: 20 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  heroText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  grid: { flexDirection: 'column', gap: 16 },
  planCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  planCardPopular: { borderColor: '#0045a0', borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -60 }], backgroundColor: '#0045a0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  popularText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  planHeader: { alignItems: 'center', marginBottom: 16 },
  planIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#0045a0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  planDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  planDetails: { gap: 12, marginBottom: 16 },
  investmentDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  investmentDetailLabel: { fontSize: 14, color: '#6b7280' },
  investmentDetailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  investmentDetailValueBrand: { fontSize: 14, fontWeight: '600', color: '#0045a0' },
  benefitsList: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  benefitText: { fontSize: 12, color: '#4b5563', marginLeft: 6 },
  investBtn: { backgroundColor: '#0045a0', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
  investBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  learningCard: { backgroundColor: '#faf7ff', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#c4b5fd' },
  learningHeader: { alignItems: 'center', marginBottom: 16 },
  learningIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  learningTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  learningPrice: { fontSize: 24, fontWeight: '700', color: '#0045a0' },
  learningPriceLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  learningStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  learningStatLabel: { fontSize: 12, color: '#6b7280' },
  learningStatValue: { fontSize: 12, fontWeight: '600', color: '#0045a0' },
  featuresList: { gap: 8, marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 14, color: '#4b5563' },
  enrollBtn: { backgroundColor: '#0045a0', borderRadius: 12, padding: 12, alignItems: 'center' },
  enrollBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  heroFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  heroFeature: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  heroIcon: { marginRight: 4 },
  heroFeatureText: { color: '#fff', fontSize: 12 },
  formContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  backLink: { fontSize: 14, color: '#2563eb' },
  selectedPlanCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eff6ff', borderRadius: 12, padding: 16 },
  selectedPriceRow: { alignItems: 'flex-end' },
  selectedLabel: { fontSize: 12, color: '#6b7280' },
  selectedName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 4 },
  selectedPrice: { fontSize: 16, fontWeight: '600', color: '#0045a0' },
  selectedPriceLabel: { fontSize: 12, color: '#6b7280' },
  formGroup: { gap: 8 },
  formInputLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  formInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, height: 44, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  formInputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
  infoCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  infoText: { fontSize: 14, color: '#4b5563' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  submitBtn: { backgroundColor: '#0045a0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flex: 1, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cancelBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: '#d1d5db', flex: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  pendingContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pendingTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  pendingInfoText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  pendingDetailsCard: { backgroundColor: '#d1fae5', borderRadius: 12, padding: 16, gap: 12 },
  pendingDetailRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pendingDetailLabel: { fontSize: 12, color: '#6b7280' },
  pendingDetailValueMono: { fontSize: 14, fontWeight: '600', color: '#111827', fontFamily: 'monospace' },
  pendingDetailValue: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  pendingCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pendingCopyBtn: { backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pendingCopyBtnText: { fontSize: 12, color: '#0045a0', fontWeight: '500' },
  paymentInstructions: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#86efac' },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: '#166534', marginBottom: 12 },
  instructionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  instructionText: { fontSize: 13, color: '#166534', flex: 1, lineHeight: 18 },
  pendingUploadSection: { flexDirection: 'row', gap: 12, marginTop: 16 },
  pendingUploadBtn: { backgroundColor: '#0045a0', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  pendingUploadBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  pendingCancelBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', marginTop: 8 },
  pendingCancelBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  pendingWaitingCard: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, alignItems: 'center' },
  pendingWaitingText: { fontSize: 14, color: '#92400e' },
  historyContainer: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  emptyHistory: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280' },
  historyList: { gap: 1 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  historyInfo: {},
  historyId: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyPlan: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  historyStatusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  historyStatusText: { fontSize: 11, fontWeight: '500' },
})