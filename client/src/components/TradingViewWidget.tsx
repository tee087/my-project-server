'use client'

import { useEffect, useRef } from 'react'

type MarketWidgetProps = {
  symbol?: string
  width?: string
  height?: number
  locale?: string
  timezone?: string
}

export default function TradingViewWidget({ symbol = 'NASDAQ:AAPL', width = '100%', height = 400, locale = 'en', timezone = 'Etc/UTC' }: MarketWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: false,
          width: width,
          height: height,
          symbol: symbol,
          interval: 'D',
          timezone: timezone,
          theme: 'dark',
          style: '1',
          locale: locale,
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: true,
          hide_bottom_toolbar: false,
          save_image: false,
          container_id: containerRef.current?.id,
        })
      }
    }

    const widgetId = `tradingview-widget-${Math.random().toString(36).substr(2, 9)}`
    containerRef.current.id = widgetId
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, locale, timezone])

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  )
}