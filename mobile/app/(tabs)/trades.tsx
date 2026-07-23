import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { TradingViewChart } from '@/components/TradingViewChart'

type OrderSide = 'buy' | 'sell'

interface OrderBookLevel {
  price: number
  amount: number
  total: number
}

interface Trade {
  price: number
  amount: number
  time: string
  side: OrderSide
}

const PAIRS = [
  { symbol: 'BTC/USDT', name: 'BTC', base: 'USDT', price: 107234 },
  { symbol: 'ETH/USDT', name: 'ETH', base: 'USDT', price: 3456 },
  { symbol: 'BNB/USDT', name: 'BNB', base: 'USDT', price: 456 },
  { symbol: 'XRP/USDT', name: 'XRP', base: 'USDT', price: 0.56 },
  { symbol: 'ADA/USDT', name: 'ADA', base: 'USDT', price: 0.45 },
  { symbol: 'DOGE/USDT', name: 'DOGE', base: 'USDT', price: 0.08 },
  { symbol: 'SOL/USDT', name: 'SOL', base: 'USDT', price: 123 },
  { symbol: 'DOT/USDT', name: 'DOT', base: 'USDT', price: 6.78 },
]

const generateOrderBook = (basePrice: number): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } => {
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []
  let bidTotal = 0
  let askTotal = 0
  for (let i = 0; i < 12; i++) {
    const bidPrice = +(basePrice - (i + 1) * basePrice * 0.0005).toFixed(2)
    const askPrice = +(basePrice + (i + 1) * basePrice * 0.0005).toFixed(2)
    const bidAmount = +(Math.random() * 2 + 0.01).toFixed(4)
    const askAmount = +(Math.random() * 2 + 0.01).toFixed(4)
    bidTotal += bidAmount
    askTotal += askAmount
    bids.push({ price: bidPrice, amount: bidAmount, total: +bidTotal.toFixed(4) })
    asks.push({ price: askPrice, amount: askAmount, total: +askTotal.toFixed(4) })
  }
  return { bids, asks }
}

const generateTrades = (basePrice: number): Trade[] => {
  const trades: Trade[] = []
  for (let i = 0; i < 15; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const price = +(basePrice + (Math.random() - 0.5) * basePrice * 0.001).toFixed(2)
    const amount = +(Math.random() * 0.5 + 0.001).toFixed(4)
    const time = new Date(Date.now() - i * 30000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    trades.push({ price, amount, time, side })
  }
  return trades
}

export default function TradesScreen() {
  const [selectedPair, setSelectedPair] = useState(PAIRS[0])
  const [activeTab, setActiveTab] = useState<'spot' | 'futures' | 'margin'>('spot')
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(107234))
  const [recentTrades, setRecentTrades] = useState(() => generateTrades(107234))
  const [refreshing, setRefreshing] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(107234)
  const [elapsedTime, setElapsedTime] = useState(0)
  const priceAnimation = useRef(new Animated.Value(107234)).current

  const priceChange = +(Math.random() * 2000 - 1000).toFixed(2)
  const priceChangePercent = +((priceChange / currentPrice) * 100).toFixed(2)
  const isPositive = priceChange >= 0

  useEffect(() => {
    const basePrice = selectedPair.price
    setCurrentPrice(basePrice)
    setOrderBook(generateOrderBook(basePrice))
    setRecentTrades(generateTrades(basePrice))
    setElapsedTime(0)

    Animated.timing(priceAnimation, {
      toValue: basePrice,
      duration: 500,
      useNativeDriver: false,
    }).start()

    const interval = setInterval(() => {
      setElapsedTime(t => t + 1)
      const change = (Math.random() - 0.48) * basePrice * 0.0008
      const newPrice = +(basePrice + change).toFixed(2)
      setCurrentPrice(newPrice)
      setOrderBook(generateOrderBook(newPrice))
      setRecentTrades(generateTrades(newPrice))
    }, 1500)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair])

  const onRefresh = async () => {
    setRefreshing(true)
    setOrderBook(generateOrderBook(selectedPair.price))
    setRecentTrades(generateTrades(selectedPair.price))
    setRefreshing(false)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return num.toFixed(4)
  }

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.tabsContainer}>
          {(['spot', 'futures', 'margin'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pairsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PAIRS.map((pair) => (
              <TouchableOpacity
                key={pair.symbol}
                onPress={() => setSelectedPair(pair)}
                style={[styles.pairButton, selectedPair.symbol === pair.symbol && styles.pairButtonActive]}
              >
                <Text style={[styles.pairText, selectedPair.symbol === pair.symbol && styles.pairTextActive]}>
                  {pair.name}<Text style={styles.pairBase}>/{pair.base}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.priceHeader}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatNumber(currentPrice)}</Text>
            <View style={styles.changeRow}>
              {isPositive ? (
                <FontAwesome name="arrow-up" size={16} color="#10b981" />
              ) : (
                <FontAwesome name="arrow-down" size={16} color="#ef4444" />
              )}
              <Text style={[styles.changeText, isPositive ? styles.changePositive : styles.changeNegative]}>
                {isPositive ? '+' : ''}{formatNumber(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent}%)
              </Text>
            </View>
          </View>
          <View style={styles.elapsedContainer}>
            <FontAwesome name="clock-o" size={12} color="#6b7280" style={{ marginRight: 4 }} />
            <Text style={styles.elapsedText}>Elapsed: {formatElapsed(elapsedTime)}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h High</Text>
              <Text style={[styles.statValue, styles.statPositive]}>{formatNumber(currentPrice * 1.015)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Low</Text>
              <Text style={[styles.statValue, styles.statNegative]}>{formatNumber(currentPrice * 0.985)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Volume</Text>
              <Text style={styles.statValue}>{(Math.random() * 50000 + 10000).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{selectedPair.symbol} Chart</Text>
            <Text style={styles.chartSubtitle}>Live Price Simulation</Text>
          </View>
          {/* TradingView provides live market data; the order book below remains an educational display. */}
          <TradingViewChart symbol={selectedPair.symbol} height={300} />
          {/* <View style={styles.chartPlaceholder}>
            {chartData.length > 0 && (
              <View style={styles.chartPlot}>
                {chartData.map((price, i) => {
                  const normalizedPrice = (price - currentPrice * 0.99) / (currentPrice * 0.02)
                  const x = (i / chartData.length) * (screenWidth - 48)
                  const y = 200 - (normalizedPrice * 50)
                  return (
                    <View
                      key={i}
                      style={[
                        styles.chartPoint,
                        {
                          left: x,
                          top: Math.max(20, Math.min(180, y)),
                          backgroundColor: isPositive ? '#10b981' : '#ef4444',
                        },
                      ]}
                    />
                  )
                })}
              </View>
            )}
            <FontAwesome name="line-chart" size={48} color="#0045a0" />
            <Text style={styles.chartText}>Live price: {formatNumber(currentPrice)} {selectedPair.base}</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={styles.legendGreen} />
                <Text style={styles.legendText}>Up</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendRed} />
                <Text style={styles.legendText}>Down</Text>
              </View>
            </View>
          </View> */}
        </View>

        <View style={styles.orderBookContainer}>
          <View style={styles.orderBookHeader}>
            <Text style={styles.sectionTitle}>Order Book</Text>
          </View>
          <View style={styles.orderHeader}>
            <Text style={styles.orderHeaderText}>Price ({selectedPair.base})</Text>
            <Text style={styles.orderHeaderTextRight}>Amount</Text>
            <Text style={styles.orderHeaderTextRight}>Total</Text>
          </View>

          {[...orderBook.asks].reverse().map((ask, i) => (
            <View key={`ask-${i}`} style={styles.orderRow}>
              <Text style={[styles.orderPrice, styles.orderSell]}>{formatNumber(ask.price)}</Text>
              <Text style={styles.orderAmount}>{formatNumber(ask.amount)}</Text>
              <Text style={styles.orderTotal}>{formatNumber(ask.total)}</Text>
            </View>
          ))}

          <View style={styles.currentPriceDisplay}>
            <Animated.Text style={[styles.currentPriceLabel, isPositive ? styles.pricePositive : styles.priceNegative]}>
              {formatNumber(currentPrice)}
            </Animated.Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.buyBadge]}>
                <Text style={styles.badgeText}>Buy</Text>
              </View>
              <View style={[styles.badge, styles.sellBadge]}>
                <Text style={styles.badgeText}>Sell</Text>
              </View>
            </View>
          </View>

          {orderBook.bids.map((bid, i) => (
            <View key={`bid-${i}`} style={styles.orderRow}>
              <Text style={[styles.orderPrice, styles.orderBuy]}>{formatNumber(bid.price)}</Text>
              <Text style={styles.orderAmount}>{formatNumber(bid.amount)}</Text>
              <Text style={styles.orderTotal}>{formatNumber(bid.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tradesContainer}>
          <View style={styles.tradesHeader}>
            <Text style={styles.tradesHeaderTitle}>Recent Trades</Text>
            <Text style={styles.liveIndicator}>
              <FontAwesome name="circle" size={8} color="#10b981" style={{ marginRight: 4 }} />
              Live
            </Text>
          </View>
          <View style={styles.tradesHeaderRow}>
            <Text style={styles.tradesHeaderText}>Price ({selectedPair.base})</Text>
            <Text style={styles.tradesHeaderTextRight}>Amount</Text>
            <Text style={styles.tradesHeaderTextRight}>Time</Text>
          </View>
          {recentTrades.map((trade, i) => (
            <View key={i} style={styles.tradeRow}>
              <Text style={[styles.tradePrice, trade.side === 'buy' ? styles.orderBuy : styles.orderSell]}>
                {formatNumber(trade.price)}
              </Text>
              <Text style={styles.tradeAmount}>{formatNumber(trade.amount)}</Text>
              <Text style={styles.tradeTime}>{trade.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0045a0',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#0045a0',
  },
  pairsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  pairButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  pairButtonActive: {
    backgroundColor: '#0045a0',
  },
  pairText: {
    color: '#6b7280',
    fontSize: 12,
  },
  pairTextActive: {
    color: '#fff',
  },
  pairBase: {
    fontSize: 10,
    opacity: 0.6,
  },
  priceHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changePositive: {
    color: '#10b981',
  },
  changeNegative: {
    color: '#ef4444',
  },
  elapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  elapsedText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginTop: 4,
  },
  statPositive: {
    color: '#10b981',
  },
  statNegative: {
    color: '#ef4444',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  chartHeader: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0E11',
    position: 'relative',
  },
  chartPlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    zIndex: 1,
  },
  chartLegend: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  legendRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  legendText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  orderBookContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  orderBookHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orderHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  orderHeaderText: {
    flex: 1,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  orderHeaderTextRight: {
    flex: 1,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'right',
  },
  orderRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderPrice: {
    flex: 1,
    fontSize: 12,
  },
  orderBuy: {
    color: '#10b981',
  },
  orderSell: {
    color: '#ef4444',
  },
  orderAmount: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  orderTotal: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  currentPriceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 8,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  currentPriceLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  pricePositive: {
    color: '#10b981',
  },
  priceNegative: {
    color: '#ef4444',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sellBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10b981',
  },
  tradesContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tradesHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  tradesHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tradesHeaderText: {
    flex: 1,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  tradesHeaderTextRight: {
    flex: 1,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'right',
  },
  tradeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tradePrice: {
    flex: 1,
    fontSize: 12,
  },
  tradeAmount: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  tradeTime: {
    flex: 1,
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },
})
