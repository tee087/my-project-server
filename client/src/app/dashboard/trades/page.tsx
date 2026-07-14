'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'

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
  { symbol: 'BTC/USDT', name: 'BTC', base: 'USDT' },
  { symbol: 'ETH/USDT', name: 'ETH', base: 'USDT' },
  { symbol: 'BNB/USDT', name: 'BNB', base: 'USDT' },
  { symbol: 'XRP/USDT', name: 'XRP', base: 'USDT' },
  { symbol: 'ADA/USDT', name: 'ADA', base: 'USDT' },
  { symbol: 'DOGE/USDT', name: 'DOGE', base: 'USDT' },
  { symbol: 'SOL/USDT', name: 'SOL', base: 'USDT' },
  { symbol: 'DOT/USDT', name: 'DOT', base: 'USDT' },
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

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.onload = () => {
      if (containerRef.current) {
        const config = {
          autosize: true,
          symbol: `BINANCE:${symbol.replace('/', '')}`,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          allow_symbol_change: true,
          calendar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          hide_volume: false,
          support_host: 'https://www.tradingview.com',
          withdateranges: true,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
          ],
        }
        const widgetContainer = document.createElement('div')
        widgetContainer.className = 'tradingview-widget-container__widget'
        containerRef.current.appendChild(widgetContainer)
        const widgetDiv = document.createElement('div')
        widgetDiv.className = 'tradingview-widget-copyright'
        widgetDiv.style.display = 'none'
        widgetContainer.appendChild(widgetDiv)
        if (typeof window !== 'undefined' && (window as any).TradingView) {
          new (window as any).TradingView.widget({
            ...config,
            container_id: widgetContainer.id || `tv-advanced-${symbol.replace('/', '-')}-${Date.now()}`,
          })
        }
      }
    }
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full h-full min-h-[500px]"
      style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
    />
  )
}

export default function TradesPage() {
  const [selectedPair, setSelectedPair] = useState(PAIRS[0])
  const [activeTab, setActiveTab] = useState<'spot' | 'futures' | 'margin'>('spot')
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(107234))
  const [recentTrades, setRecentTrades] = useState(() => generateTrades(107234))

  const currentPrice = orderBook.bids[0]?.price || 107234
  const priceChange = +(Math.random() * 2000 - 1000).toFixed(2)
  const priceChangePercent = +((priceChange / currentPrice) * 100).toFixed(2)
  const isPositive = priceChange >= 0

  useEffect(() => {
    setOrderBook(generateOrderBook(currentPrice))
    setRecentTrades(generateTrades(currentPrice))
  }, [selectedPair])

  const formatNumber = (num: number) => {
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return num.toFixed(4)
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans">
      {/* Market Type Tabs */}
      <div className="border-b border-[#2B2F36] bg-[#0B0E11]">
        <div className="flex items-center px-4 lg:px-6 gap-1 overflow-x-auto">
          {(['spot', 'futures', 'margin'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab ? 'text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#B7BDC6]'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0B90B]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Pair Selector */}
      <div className="border-b border-[#2B2F36] bg-[#181A20]">
        <div className="flex items-center gap-1 px-4 lg:px-6 overflow-x-auto py-2">
          {PAIRS.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedPair.symbol === pair.symbol
                  ? 'bg-[#F0B90B]/10 text-[#F0B90B]'
                  : 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B2F36]'
              }`}
            >
              {pair.name}
              <span className="text-[10px] ml-1 opacity-60">/{pair.base}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Header */}
      <div className="border-b border-[#2B2F36] bg-[#181A20] px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-[#EAECEF]">
              {formatNumber(currentPrice)}
            </h2>
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{formatNumber(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent}%)</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-[#848E9C]">
            <div><span className="text-[#B7BDC6] font-medium">24h High</span> <span className="ml-2 text-[#0ECB81]">{formatNumber(currentPrice * 1.015)}</span></div>
            <div><span className="text-[#B7BDC6] font-medium">24h Low</span> <span className="ml-2 text-[#F6465D]">{formatNumber(currentPrice * 0.985)}</span></div>
            <div><span className="text-[#B7BDC6] font-medium">24h Volume</span> <span className="ml-2 text-[#EAECEF]">{(Math.random() * 50000 + 10000).toFixed(0)}</span></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Chart Area */}
        <div className="flex-1 border-r border-[#2B2F36] bg-[#0B0E11]">
          <TradingViewChart symbol={selectedPair.symbol} />
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0">
          {/* Order Book */}
          <div className="border-b border-[#2B2F36] bg-[#181A20]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2F36]">
              <h3 className="text-sm font-semibold text-[#EAECEF]">Order Book</h3>
              <MoreHorizontal className="w-4 h-4 text-[#848E9C] cursor-pointer" />
            </div>
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 text-[10px] font-medium text-[#848E9C] uppercase tracking-wider mb-1.5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              {/* Asks */}
              <div className="space-y-0.5 mb-2">
                {[...orderBook.asks].reverse().map((ask, i) => (
                  <div key={`ask-${i}`} className="relative grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/10"
                      style={{ width: `${Math.min((ask.total / orderBook.asks[orderBook.asks.length - 1].total) * 100, 100)}%` }}
                    />
                    <span className="text-[#F6465D] relative z-10 pl-1">{formatNumber(ask.price)}</span>
                    <span className="text-right text-[#B7BDC6] relative z-10">{formatNumber(ask.amount)}</span>
                    <span className="text-right text-[#848E9C] relative z-10 pr-1">{formatNumber(ask.total)}</span>
                  </div>
                ))}
              </div>

              {/* Current Price Display */}
              <div className="flex items-center justify-between bg-[#2B2F36] rounded-md px-3 py-2 mb-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                    {formatNumber(currentPrice)}
                  </span>
                  <span className={`text-xs ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                    {isPositive ? '+' : ''}{formatNumber(priceChange)} ({isPositive ? '+' : ''}{priceChangePercent}%)
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B] font-medium">Buy</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F6465D]/10 text-[#F6465D] font-medium">Sell</span>
                </div>
              </div>

              {/* Bids */}
              <div className="space-y-0.5">
                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/10"
                      style={{ width: `${Math.min((bid.total / orderBook.bids[0].total) * 100, 100)}%` }}
                    />
                    <span className="text-[#0ECB81] relative z-10 pl-1">{formatNumber(bid.price)}</span>
                    <span className="text-right text-[#B7BDC6] relative z-10">{formatNumber(bid.amount)}</span>
                    <span className="text-right text-[#848E9C] relative z-10 pr-1">{formatNumber(bid.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-[#181A20]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2F36]">
              <h3 className="text-sm font-semibold text-[#EAECEF]">Recent Trades</h3>
              <MoreHorizontal className="w-4 h-4 text-[#848E9C] cursor-pointer" />
            </div>
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 text-[10px] font-medium text-[#848E9C] uppercase tracking-wider mb-1.5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
              </div>
              <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
                {recentTrades.map((trade, i) => (
                  <div key={i} className="grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <span className={trade.side === 'buy' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                      {formatNumber(trade.price)}
                    </span>
                    <span className="text-right text-[#B7BDC6]">{formatNumber(trade.amount)}</span>
                    <span className="text-right text-[#848E9C] font-mono text-[11px]">{trade.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
