import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Share, Clipboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { api } from '@/lib/api'

type Claim = { id: string; amount: number; bonusCount: number; status: string; createdAt: string }
type Summary = {
  referralCode: string
  registeredReferrals: number
  requiredReferrals: number
  remainingReferrals: number
  referralBalance: number
  walletBalance: number
  eligibleAmount: number
  eligibleBonusCount: number
  canWithdrawReferralRewards: boolean
  claims: Claim[]
}

export default function ReferralsScreen() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('referrals')
      setSummary(data.data)
    } catch {
      Alert.alert('Error', 'Unable to load referral rewards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const referralLink = summary
    ? `https://my-project-server-xo9x.onrender.com/register?ref=${encodeURIComponent(summary.referralCode)}`
    : ''

  const copyLink = async () => {
    Clipboard.setString(referralLink)
    Alert.alert('Copied', 'Your referral link is ready to share!')
  }

  const shareLink = async () => {
    const text = `Join EcoCash with my link and help me reach 20 completed registrations to unlock my $100 referral bonus! ${referralLink}`
    try {
      await Share.share({ title: 'Join EcoCash', message: text })
    } catch {
      copyLink()
    }
  }

  const claim = async () => {
    setClaiming(true)
    try {
      const { data } = await api.post('referrals/claim')
      Alert.alert('Success', data.message)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Unable to submit your claim')
    } finally {
      setClaiming(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading || !summary) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your referral rewards…</Text>
      </View>
    )
  }

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return { bg: '#d1fae5', text: '#065f46' }
    if (status === 'REJECTED') return { bg: '#fee2e2', text: '#991b1b' }
    return { bg: '#fef3c7', text: '#92400e' }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <FontAwesome name="gift" size={16} color="#fff" />
              <Text style={styles.heroBadgeText}>Referral rewards</Text>
            </View>
            <Text style={styles.heroTitle}>Share your link. Grow together.</Text>
            <Text style={styles.heroText}>
              Each completed registration adds $5 to your referral balance. Fill all 20 slots to reach $100, then submit your claim for review by our team.
            </Text>
          </View>
          <View style={styles.heroAmount}>
            <Text style={styles.heroAmountLabel}>Available to claim</Text>
            <Text style={styles.heroAmountValue}>${summary.eligibleAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>Registration progress</Text>
                <Text style={styles.progressSubtitle}>{summary.registeredReferrals} of {summary.requiredReferrals} friends registered</Text>
              </View>
              <FontAwesome name="users" size={28} color="#0045a0" />
            </View>
            <View style={styles.progressBars}>
              {Array.from({ length: summary.requiredReferrals }, (_, index) => (
                <View
                  key={index}
                  style={[styles.progressBar, index < summary.registeredReferrals ? styles.progressBarActive : styles.progressBarInactive]}
                />
              ))}
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressBalance}>${summary.referralBalance.toFixed(2)} referral balance</Text>
              <Text style={styles.progressMeta}>{summary.registeredReferrals} / {summary.requiredReferrals} · $5 each</Text>
            </View>
            <Text style={styles.progressNote}>
              {summary.remainingReferrals ? `${summary.remainingReferrals} more registration${summary.remainingReferrals === 1 ? '' : 's'} to reach $100.` : 'Your referral balance is full — claim $100 now.'}
            </Text>
          </View>

          <View style={styles.walletCard}>
            <FontAwesome name="credit-card" size={26} color="#059669" />
            <Text style={styles.walletTitle}>${summary.walletBalance.toFixed(2)} dashboard rewards</Text>
            <Text style={styles.walletSubtitle}>
              {summary.canWithdrawReferralRewards ? 'Withdrawable: you have a confirmed package deposit.' : 'Complete a confirmed package deposit before these rewards can be withdrawn.'}
            </Text>
          </View>
        </View>

        <View style={styles.linkCard}>
          <Text style={styles.linkTitle}>Your personal invite link</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkUrl}>{referralLink}</Text>
            <TouchableOpacity onPress={copyLink} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={shareLink} style={styles.shareBtn}>
            <FontAwesome name="share-alt" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share your link & earn $100</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.claimCard}>
          <View style={styles.claimHeader}>
            <View>
              <Text style={styles.claimTitle}>Claim your unlocked rewards</Text>
              <Text style={styles.claimSubtitle}>An approval request is sent to the administrator immediately.</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                if (!summary.eligibleAmount || claiming) return
                await claim()
              }}
              style={[styles.claimBtn, (!summary.eligibleAmount || claiming) && styles.claimBtnDisabled]}
            >
              <FontAwesome name="check-circle" size={17} color="#fff" />
              <Text style={styles.claimBtnText}>{claiming ? 'Submitting…' : `Claim $${summary.eligibleAmount.toFixed(2)}`}</Text>
            </TouchableOpacity>
          </View>

          {summary.claims.length > 0 && (
            <View style={styles.claimsSection}>
              <Text style={styles.claimsTitle}>Recent claims</Text>
              {summary.claims.map((claimItem) => (
                <View key={claimItem.id} style={styles.claimItem}>
                  <Text style={styles.claimItemText}>${claimItem.amount.toFixed(2)} · {claimItem.bonusCount} rewards</Text>
                  <View style={[styles.claimStatus, { backgroundColor: statusColor(claimItem.status).bg }]}>
                    <Text style={[styles.claimStatusText, { color: statusColor(claimItem.status).text }]}>
                      {claimItem.status.replace('_', ' ')}
                    </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#0045a0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heroContent: {
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    gap: 6,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  heroAmount: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
  },
  heroAmountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmountValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  grid: {
    gap: 12,
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 24,
    borderRadius: 3,
  },
  progressBarActive: {
    backgroundColor: '#0045a0',
  },
  progressBarInactive: {
    backgroundColor: '#f3f4f6',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBalance: {
    color: '#0045a0',
    fontSize: 13,
    fontWeight: '500',
  },
  progressMeta: {
    color: '#6b7280',
    fontSize: 11,
  },
  progressNote: {
    color: '#6b7280',
    fontSize: 11,
  },
  walletCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  walletTitle: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  walletSubtitle: {
    color: '#047857',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  linkTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkUrl: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
  },
  copyBtn: {
    backgroundColor: '#0045a0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0045a0',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  claimHeader: {
    flexDirection: 'column',
    gap: 10,
  },
  claimTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  claimSubtitle: {
    color: '#6b7280',
    fontSize: 12,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  claimBtnDisabled: {
    opacity: 0.5,
  },
  claimBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  claimsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  claimsTitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  claimItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  claimItemText: {
    color: '#374151',
    fontSize: 13,
  },
  claimStatus: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  claimStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
