import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { FontAwesome } from '@expo/vector-icons'

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

try {
       await register(formData)
       router.replace('/kyc')
     } catch (err: any) {
      const serverMessage = err.response?.data?.details || err.response?.data?.message || err.message || 'Registration failed'
      setError(serverMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <FontAwesome name="user-plus" size={20} color="#fff" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join EcoCash Investment Platform</Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor="#64748b"
                      value={formData.firstName}
                      onChangeText={(v) => handleChange('firstName', v)}
                    />
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#64748b"
                      value={formData.lastName}
                      onChangeText={(v) => handleChange('lastName', v)}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="envelope" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#64748b"
                    value={formData.email}
                    onChangeText={(v) => handleChange('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="phone" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+263..."
                    placeholderTextColor="#64748b"
                    value={formData.phone}
                    onChangeText={(v) => handleChange('phone', v)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="lock" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={formData.password}
                    onChangeText={(v) => handleChange('password', v)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={async () => {
              if (!loading) await handleSubmit()
            }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome name="user-plus" size={14} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.buttonText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
    marginVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0045a0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  referralNotice: {
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  referralText: {
    color: '#67e8f9',
    fontSize: 11,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f871b0',
    fontSize: 11,
  },
  form: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    gap: 4,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    height: 40,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    paddingVertical: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0045a0',
    borderRadius: 8,
    height: 40,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  linkText: {
    color: '#0045a0',
    fontSize: 11,
    fontWeight: '500',
  },
})
