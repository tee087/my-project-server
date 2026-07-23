import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { getThemeColors } from '@/utils/themeColors'

const SECURITY_OPTIONS = [
  {
    id: 'two_factor',
    title: 'Two-Factor Authentication',
    description: 'Add an extra layer of security to your account',
    icon: 'shield',
  },
  {
    id: 'password_change',
    title: 'Change Password',
    description: 'Update your account password regularly',
    icon: 'lock',
  },
  {
    id: 'active_sessions',
    title: 'Active Sessions',
    description: 'View and manage your active login sessions',
    icon: 'laptop',
  },
  {
    id: 'login_alerts',
    title: 'Login Alerts',
    description: 'Get notified of new login attempts',
    icon: 'bell',
  },
  {
    id: 'trusted_devices',
    title: 'Trusted Devices',
    description: 'Manage devices that don\'t require verification',
    icon: 'mobile',
  },
  {
    id: 'account_recovery',
    title: 'Account Recovery',
    description: 'Set up recovery options for account access',
    icon: 'key',
  },
]

export default function SecuritySettingsScreen() {
  const { theme } = useTheme()
  const colors = getThemeColors(theme)
  const router = useRouter()

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [showActiveSessions, setShowActiveSessions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long')
      return
    }

    try {
      setIsLoading(true)
      // API call would go here
      // await api.security.changePassword(passwordForm)
      
      Alert.alert('Success', 'Your password has been changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            setShowPasswordModal(false)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
          },
        },
      ])
    } catch (error) {
      Alert.alert('Error', 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableTwoFactor = async () => {
    try {
      setIsLoading(true)
      // API call would go here
      // const response = await api.security.enableTwoFactor()
      
      setTwoFactorEnabled(true)
      Alert.alert('Success', 'Two-factor authentication has been enabled')
      setShowTwoFactorModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to enable two-factor authentication')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableTwoFactor = () => {
    Alert.alert(
      'Disable Two-Factor Authentication',
      'Are you sure? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true)
              // API call would go here
              setTwoFactorEnabled(false)
              Alert.alert('Success', 'Two-factor authentication has been disabled')
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Security Status */}
        <View style={[styles.securityStatus, { backgroundColor: colors.surface }]}>
          <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
            <FontAwesome name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Account Secure</Text>
          </View>
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            Your account has good security settings enabled
          </Text>
        </View>

        {/* Two-Factor Authentication */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="shield" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {twoFactorEnabled ? 'Enabled via authenticator app' : 'Add extra security'}
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={(value) => {
                if (value) {
                  setShowTwoFactorModal(true)
                } else {
                  handleDisableTwoFactor()
                }
              }}
              trackColor={{ false: colors.borderLight, true: colors.success }}
              thumbColor={twoFactorEnabled ? colors.success : colors.textTertiary}
            />
          </View>
        </View>

        {/* Password & Login */}
        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.borderLight }]} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.settingInfo}>
              <FontAwesome name="lock" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Last changed 30 days ago</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.borderLight }]} onPress={() => setShowActiveSessions(true)}>
            <View style={styles.settingInfo}>
              <FontAwesome name="laptop" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Active Sessions</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>1 active session</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <FontAwesome name="bell" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Login Alerts</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Get notified on new logins</Text>
              </View>
            </View>
            <Switch
              value={loginAlertsEnabled}
              onValueChange={setLoginAlertsEnabled}
              trackColor={{ false: colors.borderLight, true: colors.success }}
              thumbColor={loginAlertsEnabled ? colors.success : colors.textTertiary}
            />
          </View>
        </View>

        {/* Device Management */}
        <View style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.borderLight }]} onPress={() => Alert.alert('Trusted Devices', 'This is your current trusted device')}>
            <View style={styles.settingInfo}>
              <FontAwesome name="mobile" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Trusted Devices</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage your devices</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Account Recovery', 'Set up recovery options to regain access to your account if you lose access')}>
            <View style={styles.settingInfo}>
              <FontAwesome name="key" size={20} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Account Recovery</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Recovery phone and email</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={[styles.tips, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
          <FontAwesome name="lightbulb-o" size={20} color={colors.info} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Security Tips</Text>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
              • Use a strong, unique password{'\n'}
              • Enable two-factor authentication{'\n'}
              • Keep your recovery options updated{'\n'}
              • Review active sessions regularly
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent={true}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <FontAwesome name="times" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter current password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
              editable={!isLoading}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter new password (min. 8 characters)"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
              editable={!isLoading}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Two-Factor Authentication Modal */}
      <Modal visible={showTwoFactorModal} animationType="slide" transparent={true}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTwoFactorModal(false)}>
              <FontAwesome name="times" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enable 2FA</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.infoBox, { backgroundColor: colors.infoLight }]}>
              <FontAwesome name="info-circle" size={20} color={colors.info} />
              <Text style={[styles.infoText, { color: colors.text, marginLeft: 12 }]}>
                Two-factor authentication adds an extra layer of security to your account by requiring an additional verification code when you login.
              </Text>
            </View>

            <Text style={[styles.stepTitle, { color: colors.text, marginTop: 20 }]}>Step 1: Download an Authenticator App</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Download Google Authenticator, Microsoft Authenticator, or Authy from your app store.
            </Text>

            <Text style={[styles.stepTitle, { color: colors.text, marginTop: 16 }]}>Step 2: Scan QR Code</Text>
            <View style={[styles.qrCodePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FontAwesome name="qrcode" size={48} color={colors.textTertiary} />
              <Text style={[styles.qrCodeText, { color: colors.textSecondary }]}>QR Code would appear here</Text>
            </View>

            <Text style={[styles.stepTitle, { color: colors.text, marginTop: 16 }]}>Step 3: Verify Code</Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="000000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleEnableTwoFactor}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enable 2FA</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Active Sessions Modal */}
      <Modal visible={showActiveSessions} animationType="slide" transparent={true}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowActiveSessions(false)}>
              <FontAwesome name="times" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Active Sessions</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sessionInfo}>
                <FontAwesome name="mobile" size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.sessionName, { color: colors.text }]}>Android Phone</Text>
                  <Text style={[styles.sessionDetails, { color: colors.textSecondary }]}>Current Session • Active now</Text>
                  <Text style={[styles.sessionIP, { color: colors.textTertiary }]}>IP: 192.168.1.100</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  securityStatus: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  tips: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  qrCodePlaceholder: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  qrCodeText: {
    fontSize: 12,
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionIP: {
    fontSize: 11,
    marginTop: 2,
  },
})
