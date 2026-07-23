import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

export function TradingViewChart({ symbol, height = 360 }: { symbol: string; height?: number }) {
  const html = useMemo(() => `<!doctype html><html><body style="margin:0;background:#0b0e11"><div id="tv" style="height:100vh"></div><script src="https://s3.tradingview.com/tv.js"></script><script>new TradingView.widget({autosize:true,symbol:'BINANCE:${symbol.replace('/', '')}',interval:'15',timezone:'Etc/UTC',theme:'dark',style:'1',locale:'en',enable_publishing:false,hide_top_toolbar:false,save_image:false,container_id:'tv'});</script></body></html>`, [symbol])
  return <View style={[styles.container, { height }]}><WebView source={{ html }} javaScriptEnabled domStorageEnabled /></View>
}

const styles = StyleSheet.create({ container: { overflow: 'hidden', borderRadius: 14, backgroundColor: '#0b0e11' } })
