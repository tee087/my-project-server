'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, MoreHorizontal, CheckCircle } from 'lucide-react'
import TradingViewWidget from '@/components/TradingViewWidget'

interface SimulatedTrade {
  id: string
  side: 'buy' | 'sell'
  price: number
  amount: number
  time: string
  profit: number
}

interface OrderBookLevel {
  price: number
  amount: number
  total: number
}

interface ActiveTradeSimulatorProps {
  investmentId: string
  depositAmount: number
  currentProfit: number
  status: string
  onClose?: () => void
}

export default function ActiveTradeSimulator({ investmentId, depositAmount, currentProfit, currentBalance, status, onClose }: ActiveTradeSimulatorProps & { currentBalance?: number }) {
  const [currentPrice, setCurrentPrice] = useState(107234.52)
  const [trades, setTrades] = useState<SimulatedTrade[]>([])
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }>({ bids: [], asks: [] })
  const [elapsed, setElapsed] = useState(0)
  const tradeIdRef = useRef(0)
  const entryPriceRef = useRef<number | null>(null)
  const [analysis, setAnalysis] = useState<{ entryPrice: number; entryTime: string; signal: string; reason: string } | null>(null)

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    return num.toFixed(decimals)
  }

  const generateOrderBook = (base: number) => {
    const bids: OrderBookLevel[] = []
    const asks: OrderBookLevel[] = []
    let bidTotal = 0
    let askTotal = 0
    for (let i = 0; i < 12; i++) {
      const bidPrice = +(base - (i + 1) * base * 0.0005).toFixed(2)
      const askPrice = +(base + (i + 1) * base * 0.0005).toFixed(2)
      const bidAmount = +(Math.random() * 2 + 0.01).toFixed(4)
      const askAmount = +(Math.random() * 2 + 0.01).toFixed(4)
      bidTotal += Number(bidAmount)
      askTotal += Number(askAmount)
      bids.push({ price: bidPrice, amount: Number(bidAmount), total: +bidTotal.toFixed(4) })
      asks.push({ price: askPrice, amount: Number(askAmount), total: +askTotal.toFixed(4) })
    }
    return { bids, asks }
  }

  const priceChange = +(Math.random() * 400 - 200).toFixed(2)
  const priceChangePercent = +((priceChange / currentPrice) * 100).toFixed(2)
  const isPositive = priceChange >= 0

  useEffect(() => {
    setOrderBook(generateOrderBook(currentPrice))
  }, [currentPrice])

  useEffect(() => {
    if (entryPriceRef.current === null && status === 'ACTIVE_TRADE') {
      entryPriceRef.current = currentPrice
      setAnalysis({
        entryPrice: currentPrice,
        entryTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        signal: currentPrice < 107234.52 ? 'LONG' : 'SHORT',
        reason: 'Entry triggered after admin approval and market liquidity confirmation.',
      })
    }
  }, [status])

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1)
      setCurrentPrice((p) => +(p + (Math.random() - 0.48) * p * 0.0008).toFixed(2))

      const side = Math.random() > 0.45 ? 'buy' : 'sell'
      const price = currentPrice
      const amount = +(Math.random() * depositAmount * 0.02 + depositAmount * 0.001).toFixed(4)
      const tradeProfit = side === 'buy' ? +(amount * 0.0015).toFixed(4) : +(-amount * 0.0015).toFixed(4)

      tradeIdRef.current += 1
      const newTrade: SimulatedTrade = {
        id: `trade-${tradeIdRef.current}`,
        side,
        price,
        amount: Number(amount),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        profit: Number(tradeProfit),
      }

      setTrades((prev) => [newTrade, ...prev].slice(0, 80))
      setOrderBook(generateOrderBook(currentPrice))
    }, 1500)
    return () => clearInterval(timer)
  }, [currentPrice, depositAmount])

  const totalSimulatedProfit = useMemo(() => {
    return trades.reduce((sum, t) => sum + t.profit, 0)
  }, [trades])

  const runningBalance = currentBalance ?? (depositAmount + (currentProfit || totalSimulatedProfit))
  const totalProfit = currentProfit || totalSimulatedProfit
  const profitFromEntry = entryPriceRef.current ? ((currentPrice - entryPriceRef.current) / entryPriceRef.current) * 100 : 0
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2B2F36] bg-[#181A20] px-4 lg:px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#EAECEF]">BTC/USDT</span>
            <span className="text-[10px] font-medium text-[#848E9C] border border-[#2B2F36] rounded px-1.5 py-0.5">Live</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0ECB81]/10 text-[#0ECB81] px-2.5 py-1 text-[10px] font-medium border border-[#0ECB81]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
              Running
            </span>
            <span className="text-[#848E9C] font-mono text-[10px] tracking-wider">ELAPSED {formatTime(elapsed)}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[10px] font-medium text-[#848E9C] hover:text-[#EAECEF] border border-[#2B2F36] rounded-md px-2.5 py-1.5 hover:bg-[#2B2F36] transition-colors">Close</button>
        )}
      </div>

      {/* Price Header */}
      <div className="border-b border-[#2B2F36] bg-[#181A20] px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold text-[#EAECEF] tracking-tight">
              {formatNumber(currentPrice)}
            </h2>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-mono">{isPositive ? '+' : ''}{formatNumber(Math.abs(priceChange))} ({isPositive ? '+' : ''}{formatNumber(Math.abs(priceChangePercent))}%)</span>
            </div>
          </div>
          {analysis && (
            <div className="flex items-center gap-6 text-xs">
              <div className="border-l-2 border-[#F0B90B] pl-3">
                <span className="text-[#848E9C] uppercase tracking-wider">ENTRY</span>
                <span className="ml-2 font-mono text-[#F0B90B] font-bold">{formatNumber(analysis.entryPrice, 2)}</span>
              </div>
              <div className="border-l-2 border-[#0ECB81] pl-3">
                <span className="text-[#848E9C] uppercase tracking-wider">SIGNAL</span>
                <span className="ml-2 font-mono text-[#0ECB81] font-bold">{analysis.signal}</span>
              </div>
              <div className="border-l-2 border-[#848E9C] pl-3">
                <span className="text-[#848E9C] uppercase tracking-wider">P&L</span>
                <span className={`ml-2 font-mono font-bold ${profitFromEntry >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>{profitFromEntry >= 0 ? '+' : ''}{formatNumber(profitFromEntry, 2)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Chart Area - TradingView */}
        <div className="flex-1 border-r border-[#2B2F36] bg-[#0B0E11] relative min-h-[420px] overflow-hidden">
          <TradingViewWidget symbol="BINANCE:BTCUSDT" height={400} />
          <div className="absolute top-2 left-2 right-48 bg-[#181A20]/85 backdrop-blur-sm rounded-lg border border-[#2B2F36] p-2.5 text-[10px] pointer-events-none max-w-md">
            {analysis && (
              <>
                <p className="text-[#F0B90B] font-semibold mb-0.5 uppercase tracking-wider text-[9px]">Analysis Used</p>
                <p className="text-[#B7BDC6]"><span className="text-[#848E9C]">Entry:</span> {analysis.entryTime} | <span className="text-[#848E9C]">Signal:</span> {analysis.signal} | <span className="text-[#848E9C]">Reason:</span> {analysis.reason}</p>
              </>
            )}
          </div>
          {analysis && (
            <div className="absolute top-2 right-2 bg-[#F0B90B]/10 border border-[#F0B90B]/30 rounded px-2.5 py-1.5 text-xs font-mono">
              <span className="text-[#848E9C] uppercase text-[9px]">Entry Price</span>
              <span className="ml-1.5 text-[#F0B90B] font-bold block">{formatNumber(analysis.entryPrice, 2)}</span>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col overflow-hidden">
          {/* Account Summary */}
          <div className="border-b border-[#2B2F36] bg-[#181A20] px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#0B0E11] border border-[#2B2F36] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-[#848E9C] font-medium mb-1">Deposit</p>
                <p className="text-sm font-bold text-[#EAECEF] font-mono">${formatNumber(depositAmount, 0)}</p>
              </div>
              <div className="rounded-lg bg-[#0B0E11] border border-[#2B2F36] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-[#848E9C] font-medium mb-1">Balance</p>
                <p className="text-sm font-bold text-[#EAECEF] font-mono">${formatNumber(runningBalance, 0)}</p>
              </div>
            </div>
          </div>

          {/* Order Book */}
          <div className="border-b border-[#2B2F36] bg-[#181A20] flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2B2F36]">
              <h3 className="text-xs font-semibold text-[#EAECEF] uppercase tracking-wider">Order Book</h3>
              <MoreHorizontal className="w-4 h-4 text-[#848E9C] cursor-pointer" />
            </div>
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 text-[10px] font-medium text-[#848E9C] uppercase tracking-wider mb-1.5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-0.5 mb-2">
                {[...orderBook.asks].reverse().map((ask, i) => (
                  <div key={`ask-${i}`} className="relative grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/10" style={{ width: `${Math.min((ask.total / orderBook.asks[orderBook.asks.length - 1].total) * 100, 100)}%` }} />
                    <span className="text-[#F6465D] relative z-10 pl-1">{formatNumber(ask.price)}</span>
                    <span className="text-right text-[#B7BDC6] relative z-10">{formatNumber(ask.amount, 4)}</span>
                    <span className="text-right text-[#848E9C] relative z-10 pr-1">{formatNumber(ask.total, 4)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-[#2B2F36] rounded-md px-3 py-2 mb-2 border border-[#2B2F36]">
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold font-mono ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>{formatNumber(currentPrice)}</span>
                  <span className={`text-xs font-mono ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                    {isPositive ? '+' : ''}{formatNumber(Math.abs(priceChange))} ({isPositive ? '+' : ''}{formatNumber(Math.abs(priceChangePercent))}%)
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B] font-medium border border-[#F0B90B]/20">Buy</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F6465D]/10 text-[#F6465D] font-medium border border-[#F6465D]/20">Sell</span>
                </div>
              </div>
              <div className="space-y-0.5">
                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <div className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/10" style={{ width: `${Math.min((bid.total / orderBook.bids[0].total) * 100, 100)}%` }} />
                    <span className="text-[#0ECB81] relative z-10 pl-1">{formatNumber(bid.price)}</span>
                    <span className="text-right text-[#B7BDC6] relative z-10">{formatNumber(bid.amount, 4)}</span>
                    <span className="text-right text-[#848E9C] relative z-10 pr-1">{formatNumber(bid.total, 4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-[#181A20] flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2B2F36] flex-shrink-0">
              <h3 className="text-xs font-semibold text-[#EAECEF] uppercase tracking-wider">Executed Trades</h3>
              <span className="text-[10px] text-[#0ECB81] font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
                Live
              </span>
            </div>
            <div className="px-3 py-2 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 text-[10px] font-medium text-[#848E9C] uppercase tracking-wider mb-1.5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Profit</span>
              </div>
              <div className="space-y-0.5">
                {trades.map((trade) => (
                  <div key={trade.id} className="grid grid-cols-3 text-xs py-0.5 hover:bg-[#2B2F36]/50 transition-colors">
                    <span className={trade.side === 'buy' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>{formatNumber(trade.price)}</span>
                    <span className="text-right text-[#B7BDC6]">{formatNumber(trade.amount, 4)}</span>
                    <span className={`text-right font-mono ${trade.profit >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {trade.profit >= 0 ? '+' : ''}{formatNumber(trade.profit, 4)}
                    </span>
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
