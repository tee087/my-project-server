import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '@/lib/api'
import { FontAwesome } from '@expo/vector-icons'
import { useToast } from '@/components/ToastProvider'

type Notification = {
  id: string
  type: string
  title?: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

type MarketNews = {
  title: string
  link: string
  source: string
  publishedAt: string
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [marketNews, setMarketNews] = useState<MarketNews[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'news'>('notifications')
  const { showError } = useToast()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.data || [])
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load notifications')
    }
  }, [showError])

  const fetchMarketNews = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/market-news')
      setMarketNews(data.data || [])
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load market news')
    }
  }, [showError])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchNotifications(), fetchMarketNews()])
      .finally(() => setLoading(false))
  }, [fetchNotifications, fetchMarketNews])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchNotifications(), fetchMarketNews()])
    setRefreshing(false)
  }

  const markAsRead = async (id: string) => {
    try {
      await api.put('/notifications/mark-read', { ids: [id] })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {
      showError('Failed to mark as read')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REFERRAL':
        return 'users'
      case 'PROFIT':
        return 'signal'
      case 'SYSTEM':
        return 'bell'
      default:
        return 'info-circle'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0045a0" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            My Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'news' && styles.tabActive]}
          onPress={() => setActiveTab('news')}
        >
          <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>
            Market News
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {activeTab === 'notifications' ? (
          notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="bell-slash" size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You have no unread notifications at this time.</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadItem
                ]}
                onPress={() => {
                  if (!notification.isRead) markAsRead(notification.id)
                  if (notification.link) {
                    Linking.openURL(notification.link)
                  }
                }}
              >
                <View style={styles.notificationIcon}>
                  <FontAwesome name={getNotificationIcon(notification.type)} size={16} color="#2563eb" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title || notification.message}</Text>
                  <Text style={styles.notificationDate}>
                    {formatDate(notification.createdAt)}
                  </Text>
                </View>
                {!notification.isRead && <View style={styles.badge} />}
              </TouchableOpacity>
            ))
          )
        ) : (
          marketNews.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="newspaper-o" size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No market news</Text>
              <Text style={styles.emptyText}>Market news will appear here daily.</Text>
            </View>
          ) : (
            marketNews.map((news, index) => (
              <TouchableOpacity
                key={index}
                style={styles.newsItem}
                onPress={() => Linking.openURL(news.link)}
              >
                <View style={styles.newsHeader}>
                  <Text style={styles.newsSource}>{news.source}</Text>
                  <Text style={styles.newsDate}>
                    {formatDate(news.publishedAt)}
                  </Text>
                </View>
                <Text style={styles.newsTitle}>{news.title}</Text>
                <Text style={styles.newsLink}>{news.link}</Text>
              </TouchableOpacity>
            ))
          )
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0045a0',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0045a0',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
  },
  unreadItem: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 3,
    borderLeftColor: '#0045a0',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748b',
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0045a0',
    marginLeft: 12,
  },
  newsItem: {
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 8,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  newsDate: {
    fontSize: 12,
    color: '#64748b',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsLink: {
    fontSize: 12,
    color: '#3b82f6',
  },
})
