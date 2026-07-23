import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, Linking, Clipboard, Alert, ActivityIndicator, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { getThemeColors } from '@/utils/themeColors'
import { useAuth } from '@/context/AuthContext'

const FAQ_DATA = [
  {
    question: 'How does the EcoCash investment platform work?',
    answer: 'You invest in various packages and learning courses. After payment, we trade on your behalf using advanced algorithms. Profits are automatically locked in and distributed to your account. You can track performance in real-time and end trades at any time.'
  },
  {
    question: 'What is the minimum investment amount?',
    answer: 'The minimum investment starts at $300 for basic packages. Learning courses range from $300 to $3,000 depending on the level.'
  },
  {
    question: 'How are profits calculated?',
    answer: 'Profits are calculated based on market performance during the trade duration. Our system locks in profits automatically to protect against market volatility. You receive returns based on your selected package multiplier (typically 1.5x to 3x).'
  },
  {
    question: 'Can I withdraw my profits?',
    answer: 'Yes! After a trade ends, you can withdraw profits through the Withdrawals section. Complete your first confirmed deposit to enable withdrawal of referral rewards as well.'
  },
  {
    question: 'Is my money safe?',
    answer: 'Your funds are protected by our auto-profit locking system that maintains stable trade signals. We never risk your principal during market downturns.'
  },
  {
    question: 'How long are the trades?',
    answer: 'Trade durations vary by package, typically ranging from 6 to 24 hours. Learning courses provide lifetime access to materials.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept EcoCash payments. Simply follow the payment instructions sent to you after submitting your investment request.'
  },
  {
    question: 'How do I track my investment?',
    answer: 'Use the Trades tab to monitor live performance, view order books, and check recent trades. You will receive notifications when profit opportunities arise.'
  }
]

const TERMS_DATA = `EcoCash Investment Platform - Terms of Service

1. AGREEMENT TO TERMS
By accessing or using the EcoCash Investment Platform (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and EcoCash Investment Platform.

2. ELIGIBILITY
You must be at least 18 years old and capable of forming a binding contract. You represent that you have the legal capacity to enter into this agreement.

3. ACCOUNT REGISTRATION
To use the Platform, you must register for an account and complete our KYC (Know Your Customer) verification process. You agree to provide accurate, current, and complete information.

4. INVESTMENT RISKS
Investing in cryptocurrency and forex trading involves significant risk of loss. You may lose some or all of your invested capital. The returns shown are not guaranteed and past performance is not indicative of future results.

5. TRADING AUTHORITY
By submitting an investment request, you authorize EcoCash to trade on your behalf using automated algorithms. You understand that trades are executed in real-time markets.

6. PROFIT LOCKING
Our platform uses an auto-profit locking system that secures profits during trade duration to protect against market volatility.

7. WITHDRAWALS
Withdrawals are processed within 24-48 hours after trade completion. Withdrawal requests require OTP verification for security.

8. PAYMENT TERMS
All payments are in USD equivalent. EcoCash payments must be sent to verified numbers provided in your deposit details. Do not send payments to unverified sources.

9. PROPRIETARY RIGHTS
All content, features, and functionality on the Platform are owned by EcoCash Investment Platform and protected by intellectual property laws.

10. LIMITATION OF LIABILITY
To the maximum extent permitted by law, EcoCash shall not be liable for any indirect, incidental, special, consequential or punitive damages.

11. TERMINATION
We may suspend or terminate your account for violation of these Terms or for fraudulently activity.

12. GOVERNING LAW
These Terms are governed by the laws of Zimbabwe.

13. CONTACT
For questions, contact: ecocashcryptocurrencyinvestmen@gmail.com

By continuing to use the Platform, you acknowledge that you have read, understood, and agree to these Terms.`

const PRIVACY_DATA = `EcoCash Investment Platform - Privacy Policy

1. INFORMATION WE COLLECT
• Personal Information: Name, email, phone number, date of birth, address
• Account Information: Investment history, transaction records, KYC documents
• Device Information: IP address, device type, operating system
• Usage Data: Pages visited, features used, interaction data

2. HOW WE USE YOUR INFORMATION
• To provide, maintain, and improve our services
• To process your investments and payments
• To communicate with you about your account and investments
• To comply with legal and regulatory requirements
• To prevent fraud and ensure security
• To send you marketing communications (you may opt out)

3. DATA PROTECTION
• Your personal data is encrypted both in transit and at rest
• KYC documents are stored securely and only accessible to authorized personnel
• We use industry-standard security measures to protect your information
• Access logs are maintained for security auditing

4. SHARING YOUR INFORMATION
We do not sell your personal data. We may share information with:
• Service providers who assist in operating our platform
• Legal authorities when required by law or court order
• Business partners with your explicit consent

5. YOUR RIGHTS
• Access your personal data
• Request correction of inaccurate data
• Request deletion of your data (subject to legal requirements)
• Object to or restrict processing
• Data portability
• Withdraw consent for marketing communications

6. DATA RETENTION
• Account data is retained for 7 years after account closure for legal compliance
• Transaction records are retained indefinitely for audit purposes
• Inactive accounts may be deleted after 3 years of inactivity

7. INTERNATIONAL TRANSFERS
Your data may be transferred to and processed in countries outside your residence, including the United States.

8. SECURITY BREACH NOTIFICATION
In case of a data breach, we will notify affected users within 72 hours.

9. CHILDREN'S PRIVACY
The Platform is not intended for users under 18 years of age.

10. UPDATES TO THIS PRIVACY POLICY
We may update this policy. Changes will be posted on this page with an updated date.

11. CONTACT US
For privacy questions, contact: ecocashcryptocurrencyinvestmen@gmail.com

Last Updated: July 2024`

const CONTACT_EMAIL = 'ecocashcryptocurrencyinvestmen@gmail.com'

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme()
  const colors = getThemeColors(theme)
  const { user } = useAuth()
  const router = useRouter()

  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('English')
  const [showFAQ, setShowFAQ] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('EcoCash')
  const [faqExpandedIndex, setFaqExpandedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text)
    Alert.alert('Success', 'Email address copied to clipboard')
  }

  const openEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`)
  }

  const handleOpenSecurity = () => {
    router.push('/security-settings')
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Account Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
            <FontAwesome name="user" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          </View>

          {/* Personal Information */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Personal Information</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>View and edit your profile</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Security */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}
            onPress={handleOpenSecurity}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Security</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Password, 2FA & sessions</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={() => setShowPaymentMethods(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Payment Method</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Default: {selectedPaymentMethod}</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
            <FontAwesome name="sliders" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          </View>

          {/* Dark Mode */}
          <View style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {theme === 'dark' ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderLight, true: colors.success }}
              thumbColor={theme === 'dark' ? colors.success : colors.textTertiary}
            />
          </View>

          {/* Push Notifications */}
          <View style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {notifications ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.borderLight, true: colors.success }}
              thumbColor={notifications ? colors.success : colors.textTertiary}
            />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{language}</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface, marginTop: 16 }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
            <FontAwesome name="question-circle" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          </View>

          {/* Help & FAQ */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}
            onPress={() => setShowFAQ(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Help & FAQ</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Common questions and answers</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={openEmail}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Support</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{CONTACT_EMAIL}</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface, marginTop: 16, marginBottom: 32 }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.borderLight }]}>
            <FontAwesome name="info-circle" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          </View>

          {/* Version */}
          <View style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>1.0.0 (Build 001)</Text>
            </View>
          </View>

          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}
            onPress={() => setShowTerms(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Terms of Service</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Read our terms</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={() => setShowPrivacy(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Data protection & privacy</Text>
            </View>
            <FontAwesome name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAQ Modal */}
      <Modal visible={showFAQ} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setShowFAQ(false); setFaqExpandedIndex(null); }}>
              <FontAwesome name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Help & FAQ</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {FAQ_DATA.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setFaqExpandedIndex(faqExpandedIndex === index ? null : index)}
              >
                <View style={styles.faqItemHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.text, flex: 1 }]}>{item.question}</Text>
                  <FontAwesome
                    name={faqExpandedIndex === index ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                {faqExpandedIndex === index && (
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal visible={showTerms} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <FontAwesome name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Terms of Service</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.termsText, { color: colors.text }]}>{TERMS_DATA}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <FontAwesome name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Policy</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.termsText, { color: colors.text }]}>{PRIVACY_DATA}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal visible={showPaymentMethods} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPaymentMethods(false)}>
              <FontAwesome name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Methods</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.paymentInfo, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
              <FontAwesome name="info-circle" size={20} color={colors.info} />
              <Text style={[styles.paymentInfoText, { color: colors.text, marginLeft: 12 }]}>
                EcoCash is our default and currently only supported payment method.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'EcoCash' && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => {
                setSelectedPaymentMethod('EcoCash')
                setShowPaymentMethods(false)
              }}
            >
              <FontAwesome
                name="money"
                size={24}
                color={selectedPaymentMethod === 'EcoCash' ? '#fff' : colors.primary}
              />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.paymentOptionTitle, { color: selectedPaymentMethod === 'EcoCash' ? '#fff' : colors.text }]}>
                  EcoCash
                </Text>
                <Text style={[styles.paymentOptionSubtitle, { color: selectedPaymentMethod === 'EcoCash' ? '#fff' : colors.textSecondary }]}>
                  Default payment method
                </Text>
              </View>
              {selectedPaymentMethod === 'EcoCash' && (
                <FontAwesome name="check-circle" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <FontAwesome name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'English' && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => {
                setLanguage('English')
                setShowLanguageModal(false)
              }}
            >
              <Text style={[styles.languageOptionText, { color: language === 'English' ? '#fff' : colors.text }]}>
                English
              </Text>
              {language === 'English' && (
                <FontAwesome name="check" size={18} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'Shona' && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border, backgroundColor: colors.surface, marginTop: 12 },
              ]}
              onPress={() => {
                setLanguage('Shona')
                setShowLanguageModal(false)
              }}
            >
              <Text style={[styles.languageOptionText, { color: language === 'Shona' ? '#fff' : colors.text }]}>
                Shona
              </Text>
              {language === 'Shona' && (
                <FontAwesome name="check" size={18} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'Ndebele' && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border, backgroundColor: colors.surface, marginTop: 12 },
              ]}
              onPress={() => {
                setLanguage('Ndebele')
                setShowLanguageModal(false)
              }}
            >
              <Text style={[styles.languageOptionText, { color: language === 'Ndebele' ? '#fff' : colors.text }]}>
                Ndebele
              </Text>
              {language === 'Ndebele' && (
                <FontAwesome name="check" size={18} color="#fff" />
              )}
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
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
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  faqItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 20,
  },
  paymentInfo: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
})