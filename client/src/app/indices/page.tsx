'use client'

import Link from 'next/link'
import { TrendingUp, BarChart3, Shield, Clock, ArrowRight } from 'lucide-react'

export default function IndicesPage() {
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
            <Link href="/cryptocurrencies" className="text-gray-400 hover:text-white">Cryptocurrencies</Link>
            <Link href="/forex" className="text-gray-400 hover:text-white">Forex</Link>
            <Link href="/shares" className="text-gray-400 hover:text-white">Shares</Link>
            <Link href="/commodities" className="text-gray-400 hover:text-white">Commodities</Link>
          </nav>
        </div>
      </header>

      <main className="pt-20 pb-20">
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-2xs font-medium text-indigo-400 bg-indigo-400/10 rounded-full border border-indigo-400/20">
                <BarChart3 className="h-3 w-3" />
                Indices Trading
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Indices Investment</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm">Trade major global indices including S&P 500, Dow Jones, FTSE and DAX with instant execution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/30 to-cyan-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-brand-blue/50 transition-all">
                    <BarChart3 className="h-7 w-7 text-brand-blue mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">US Indices</h3>
                    <p className="text-gray-400 text-2xs">S&P 500, Dow Jones, Nasdaq - track US economy</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-indigo-400/50 transition-all">
                    <TrendingUp className="h-7 w-7 text-indigo-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Global Indices</h3>
                    <p className="text-gray-400 text-2xs">FTSE 100, DAX, CAC 40 - diversify markets</p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative p-px rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-400/30 rounded-2xl" />
                  <div className="relative bg-dark-300 rounded-2xl p-5 border border-gray-800 group-hover:border-green-400/50 transition-all">
                    <Shield className="h-7 w-7 text-green-400 mb-3" />
                    <h3 className="font-bold text-white mb-1 text-sm">Index CFDs</h3>
                    <p className="text-gray-400 text-2xs">Up to 10x leverage with tight spreads</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/dashboard/investments" className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-black bg-gradient-to-r from-indigo-600 to-purple-500 rounded-xl hover:opacity-90 transition-all">
                Start Indices Trading
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}