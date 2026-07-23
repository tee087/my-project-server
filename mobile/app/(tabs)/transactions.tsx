import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { FontAwesome } from '@expo/vector-icons'

type Transaction = {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PROFIT' | 'REFERRAL'
  status: string
  amount: number
  createdAt: string
  investment?: {
    investmentId: string
    plan?: { name: string }
  }
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/investments')
      const investments = res.data.data || []
      
      const allTransactions: Transaction[] = []
      
      investments.forEach((inv: any) => {
        if (inv.deposits) {
          inv.deposits.forEach((dep: any) => {
            allTransactions.push({
              id: dep.id,
              type: 'DEPOSIT',
              status: dep.status,
              amount: dep.amount,
              createdAt: dep.createdAt,
              investment: inv,
            })
          })
        }
        if (inv.withdrawals) {
          inv.withdrawals.forEach((w: any) => {
            allTransactions.push({
              id: w.id,
              type: 'WITHDRAWAL',
              status: w.status,
              amount: w.amount,
              createdAt: w.createdAt,
              investment: inv,
            })
          })
        }
        if (inv.profitAmount && inv.profitAmount > 0) {
          allTransactions.push({
            id: `profit-${inv.id}`,
            type: 'PROFIT',
            status: inv.status,
            amount: inv.profitAmount,
            createdAt: inv.updatedAt || inv.createdAt,
            investment: inv,
          })
        }
      })
      
      setTransactions(allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return '$' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DEPOSIT: '#10b981',
      WITHDRAWAL: '#ef4444',
      PROFIT: '#3b82f6',
      REFERRAL: '#ec4899',
    }
    return colors[type] || '#6b7280'
  }

  const getTypeStyle = (type: string) => {
    const colors: Record<string, { color: string; bg: string }> = {
      DEPOSIT: { color: '#10b981', bg: '#065f46' },
      WITHDRAWAL: { color: '#ef4444', bg: '#7f1d1d' },
      PROFIT: { color: '#3b82f6', bg: '#1e40af' },
      REFERRAL: { color: '#ec4899', bg: '#be185d' },
    }
    return colors[type] || { color: '#6b7280', bg: '#374151' }
  }

  const getStatusDisplay = (status: string, type: string) => {
    if (type === 'WITHDRAWAL') {
      const statusMap: Record<string, string> = {
        'REQUESTED': 'Requested',
        'PROCESSING': 'Processing',
        'WITHDRAWAL_PENDING': 'Pending Approval',
        'WITHDRAWAL_APPROVED': 'Approved',
        'COMPLETED': 'Completed',
      }
      return statusMap[status] || status
    }
    if (type === 'DEPOSIT') {
      const statusMap: Record<string, string> = {
        'WAITING_FOR_PAYMENT_DETAILS': 'Awaiting Details',
        'PAYMENT_DETAILS_SENT': 'Details Sent',
        'PAYMENT_RECEIVED': 'Payment Received',
        'REJECTED': 'Rejected',
      }
      return statusMap[status] || status
    }
    return status
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="list" size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>Your transaction history will appear here.</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(transaction.type) }]}>
                  <FontAwesome name={transaction.type === 'DEPOSIT' ? 'arrow-down' : 
                    transaction.type === 'WITHDRAWAL' ? 'arrow-up' : 
                    transaction.type === 'PROFIT' ? 'signal' : 'gift'} 
                    size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.transactionType}>
                    {transaction.type === 'DEPOSIT' ? 'Deposit' :
                     transaction.type === 'WITHDRAWAL' ? 'Withdrawal' :
                     transaction.type === 'PROFIT' ? 'Profit' : 'Referral Bonus'}
                  </Text>
                  <Text style={styles.transactionInvestment}>
                    {transaction.investment?.investmentId || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={{ color: getTypeStyle(transaction.type).color, fontWeight: '600', fontSize: 16 }}>
                  {transaction.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                <Text style={styles.transactionStatus}>
                  {getStatusDisplay(transaction.status, transaction.type)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  transactionInvestment: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  transactionStatus: {
    fontSize: 12,
    color: '#647480',
    marginTop: 2,
  },
})