import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { api, resolveApiAssetUrl } from '@/lib/api'
import { FontAwesome } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setPhone(user.phone || '')
      const avatar = user.avatar || user.profileImage
      if (avatar) {
        setAvatarPreview(avatar)
      }
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile')
      const userData = data.data
      updateUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        avatar: userData.avatar,
        isVerified: userData.isVerified,
        role: userData.role,
        kycStatus: userData.kycStatus,
        fullNameLegal: userData.fullNameLegal,
        dateOfBirth: userData.dateOfBirth,
        residentialAddress: userData.residentialAddress,
        country: userData.country,
        idDocumentType: userData.idDocumentType,
        idDocumentNumber: userData.idDocumentNumber,
      })
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: { uri: string; name?: string; mimeType?: string }) => {
    if (!user?.id) return
    try {
      const form = new FormData()
      form.append('avatar', {
        uri: file.uri,
        name: file.name || 'avatar.jpg',
        type: file.mimeType || 'image/jpeg',
      } as any)

      const res = await api.post('auth/avatar', form)

      const avatar = res.data?.data?.avatar || res.data?.avatar
      if (avatar) {
        updateUser({ ...user, avatar, profileImage: avatar } as any)
        setAvatarPreview(avatar)
      }
      Alert.alert('Success', 'Profile image updated')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload image')
    }
  }

  const handleImagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload your profile image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0]
      uploadAvatar(file)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', {
        firstName,
        lastName,
        phone,
      })
      updateUser({ ...user, ...data.data, firstName: data.data.firstName, lastName: data.data.lastName } as any)
      Alert.alert('Success', 'Profile updated successfully')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0045a0" />
      </SafeAreaView>
    )
  }

  const kycStatus = user?.kycStatus

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Profile</Text>
            {kycStatus === 'APPROVED' && (
              <View style={styles.verifiedBadge}>
                <FontAwesome name="check" size={10} color="#065f46" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarPreview ? (
              <Image source={{ uri: resolveApiAssetUrl(avatarPreview) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={32} color="#64748b" />
              </View>
            )}
            <TouchableOpacity onPress={handleImagePick} style={styles.avatarEdit}>
              <FontAwesome name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.firstName || ''} {user?.lastName || ''}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <FontAwesome name="phone" size={20} color="#0045a0" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <FontAwesome name="shield" size={20} color="#0045a0" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>KYC Status</Text>
              <Text style={styles.infoValue}>{kycStatus || 'Not verified'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <View style={styles.editRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          {kycStatus !== 'APPROVED' && (
            <View style={styles.infoCard}>
              <FontAwesome name="info-circle" size={16} color="#3b82f6" />
              <Text style={styles.infoText}>Complete KYC verification to unlock all features</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleUpdate} disabled={saving} style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <FontAwesome name="sign-out" size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065f46',
    marginLeft: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0045a0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    alignItems: 'center',
    marginTop: -12,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
})