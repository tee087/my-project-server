import { Stack } from 'expo-router'
import { View, useColorScheme, UIManager } from 'react-native'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ToastProvider'
import { AlertProvider } from '@/components/AlertProvider'
import { getThemeColors } from '@/utils/themeColors'

function ThemedView({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </View>
  )
}

function RootLayoutContent() {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  
  return (
    <AuthProvider>
      <ToastProvider>
        <AlertProvider>
          <ThemedView>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animationEnabled: true,
              }} 
            />
          </ThemedView>
        </AlertProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  )
}