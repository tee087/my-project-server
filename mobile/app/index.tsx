import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebViewNavigation } from 'react-native-webview/lib/WebViewTypes'

const appUrl = process.env.EXPO_PUBLIC_APP_URL

function SetupRequired() {
  return (
    <SafeAreaView style={styles.setup}>
      <Text style={styles.title}>EcoCash Investment</Text>
      <Text style={styles.copy}>
        Set EXPO_PUBLIC_APP_URL in mobile/.env to the HTTPS address of the deployed web application, then restart Expo.
      </Text>
    </SafeAreaView>
  )
}

export default function HomeScreen() {
  const webView = useRef<WebView>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false
      webView.current?.goBack()
      return true
    })
    return () => subscription.remove()
  }, [canGoBack])

  if (!appUrl) return <SetupRequired />

  const isInternalUrl = (url: string) => url.startsWith(appUrl)

  const handleNavigation = (request: WebViewNavigation) => {
    if (isInternalUrl(request.url)) return true
    void Linking.openURL(request.url)
    return false
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webView}
        source={{ uri: appUrl }}
        originWhitelist={['https://*', 'http://*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={handleNavigation}
        onNavigationStateChange={(navigation) => setCanGoBack(navigation.canGoBack)}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color="#007a3d" size="large" />
        </View>
      )}
      {canGoBack && (
        <Pressable style={styles.back} onPress={() => webView.current?.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  back: { position: 'absolute', right: 16, bottom: 18, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007a3d', elevation: 5 },
  backText: { color: '#ffffff', fontSize: 36, lineHeight: 40, marginTop: -4 },
  setup: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#ffffff' },
  title: { color: '#007a3d', fontSize: 27, fontWeight: '700', marginBottom: 16 },
  copy: { color: '#334155', fontSize: 16, lineHeight: 24 },
})
