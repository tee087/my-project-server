'use client'

import Link from 'next/link'
import { TrendingUp, Zap, Shield, Clock, Bitcoin, DollarSign, ArrowRight } from 'lucide-react'

export default function CryptocurrenciesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <img src="/images/ecocash-logo.svg" alt="EcoCash" className="h-7 w-auto" />
            <span className="ml-2 text-lg font-bold"><span className="text-brand-blue">ECO</span><span className="text-red-500">CASH</span></span>
          </Link>
          <nav className="hidden md:flex space-x-4 text-xs">
            <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link href="/forex" className="text-gray-400 hover:text-white">Forex</Link>
            <Link href="/shares" className="text-gray-400 hover:text-white">Shares</Link>
            <Link href="/commodities" className="text-gray-400 hover:text-white">Commodities</Link>
            <Link href="/indices" className="text-gray-400 hover:text-white">Indices</Link>
          </nav>
        </div>
      </header>

      <main className="pt-20 pb-20">
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-2xs font-medium text-brand-blue bg-brand-blue/10 rounded-full border border-brand-blue/20">
                <Bitcoin className="h-3 w-3" />
                Crypto Trading
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-cyan-400 to-green-400">Cryptocurrency Investment</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm">Trade Bitcoin, Ethereum, Litecoin and other major cryptocurrencies with our advanced platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-yellow-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-orange-400/50 transition-all">
                    <Bitcoin className="h-7 w-7 text-orange-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Bitcoin</h3>
                    <p className="text-gray-400 text-2xs">BTC/USD - Digital gold</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-indigo-400/50 transition-all">
                    <Zap className="h-7 w-7 text-indigo-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Ethereum</h3>
                    <p className="text-gray-400 text-2xs">ETH/USD - Smart contracts</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-blue-400/50 transition-all">
                    <DollarSign className="h-7 w-7 text-blue-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Litecoin</h3>
                    <p className="text-gray-400 text-2xs">LTC/USD - Fast payments</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-rose-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-pink-400/50 transition-all">
                    <TrendingUp className="h-7 w-7 text-pink-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Ripple</h3>
                    <p className="text-gray-400 text-2xs">XRP/USD - Borderless payments</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-dark-300/80 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-blue" />
                  Secure Cold Storage
                </h3>
                <p className="text-gray-400 text-2xs">98% of assets stored offline for maximum security</p>
              </div>
              <div className="bg-dark-300/80 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Fast Execution
                </h3>
                <p className="text-gray-400 text-2xs">Lightning-fast order matching with 0.1 second average</p>
              </div>
              <div className="bg-dark-300/80 rounded-2xl p-6 border border-gray-800">
                <h3 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  24/7 Trading
                </h3>
                <p className="text-gray-400 text-2xs">Never miss an opportunity with round-the-clock markets</p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/dashboard/investments" className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-black bg-gradient-to-r from-brand-blue to-cyan-400 rounded-xl hover:opacity-90 transition-all">
                Start Trading Crypto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}