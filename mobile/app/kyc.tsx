import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native'
import { api } from '@/lib/api'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/AuthContext'
import { FontAwesome } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

const ZIMBABWE_LOCATIONS = [
  'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Karoi',
  'Norton', 'Chegutu', 'Rusape', 'Nyanga', 'Marondera', 'Murehwa', 'Uzumba', 'Mudzi', 'Hwange', 'Victoria Falls',
  'Beitbridge', 'Plumtree', 'Gwanda', 'Esigodini', 'Kezi', 'Maphisa', 'Filabusi', 'Lupane', 'Nkayi', 'Tsholotsho'
]

type DocumentType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'RESIDENCE_PERMIT'

export default function KYCScreen() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    fullNameLegal: '',
    dateOfBirth: '',
    residentialAddress: '',
    idDocumentType: 'PASSPORT' as DocumentType,
    idDocumentNumber: '',
  })
  const [idDocumentFront, setIdDocumentFront] = useState<string | null>(null)
  const [idDocumentBack, setIdDocumentBack] = useState<string | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync()
      await ImagePicker.requestCameraPermissionsAsync()
    })()
  }, [])

  const handleAddressChange = (text: string) => {
    setAddressInput(text)
    setFormData({ ...formData, residentialAddress: text })
    if (text.length > 1) {
      const suggestions = ZIMBABWE_LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5)
      setAddressSuggestions(suggestions)
    } else {
      setAddressSuggestions([])
    }
  }

  const selectLocation = (location: string) => {
    setFormData({ ...formData, residentialAddress: location })
    setAddressInput(location)
    setAddressSuggestions([])
    setShowAddressModal(false)
  }

  const openCamera = () => {
    setShowCameraModal(true)
  }

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable photo library access to upload your documents.')
        return
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        aspect: type === 'selfie' ? [3, 4] : [4, 3],
        quality: 0.85,
      })

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri
        if (type === 'front') setIdDocumentFront(uri)
        if (type === 'back') setIdDocumentBack(uri)
        if (type === 'selfie') setSelfie(uri)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to select image. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (!formData.fullNameLegal || !formData.dateOfBirth || !formData.residentialAddress || !idDocumentFront || !selfie) {
      Alert.alert('Error', 'Please fill all required fields and upload documents')
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('fullNameLegal', formData.fullNameLegal)
      form.append('dateOfBirth', formData.dateOfBirth)
      form.append('residentialAddress', formData.residentialAddress)
      form.append('idDocumentType', formData.idDocumentType)
      form.append('idDocumentNumber', formData.idDocumentNumber)

      if (idDocumentFront) {
        const filename = idDocumentFront.split('/').pop() || 'front.jpg'
        form.append('idDocumentFront', {
          uri: idDocumentFront,
          name: filename,
          type: 'image/jpeg',
        } as any)
      }

      if (idDocumentBack) {
        const filename = idDocumentBack.split('/').pop() || 'back.jpg'
        form.append('idDocumentBack', {
          uri: idDocumentBack,
          name: filename,
          type: 'image/jpeg',
        } as any)
      }

      if (selfie) {
        const filename = selfie.split('/').pop() || 'selfie.jpg'
        form.append('selfie', {
          uri: selfie,
          name: filename,
          type: 'image/jpeg',
        } as any)
      }

      await api.post('/auth/kyc', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      Alert.alert('Success', 'KYC submitted for verification!')
      updateUser({ kycStatus: 'SUBMITTED' })
      router.replace('/waiting-approval')
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f9fafb' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <Text style={styles.title}>KYC Verification</Text>
          <Text style={styles.subtitle}>Complete identity verification</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Full Legal Name</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome name="user" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="As it appears on ID"
              placeholderTextColor="#64748b"
              value={formData.fullNameLegal}
              onChangeText={(text) => setFormData({ ...formData, fullNameLegal: text })}
            />
          </View>

          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome name="calendar" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            />
          </View>

          <Text style={styles.label}>Residential Address</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome name="map-marker" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Start typing location..."
              placeholderTextColor="#64748b"
              value={formData.residentialAddress}
              onChangeText={handleAddressChange}
              onFocus={() => setShowAddressModal(true)}
            />
          </View>

          {showAddressModal && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={showAddressModal}
              onRequestClose={() => setShowAddressModal(false)}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.addressModalOverlay}>
                  <View style={styles.addressModal}>
                    <Text style={styles.addressModalTitle}>Select Location</Text>
                    <TextInput
                      style={styles.addressSearchInput}
                      placeholder="Search locations..."
                      placeholderTextColor="#64748b"
                      value={addressInput}
                      onChangeText={setAddressInput}
                    />
                    <ScrollView style={styles.addressList}>
                      {addressSuggestions.length > 0 ? (
                        addressSuggestions.map((loc, idx) => (
                          <TouchableOpacity key={idx} style={styles.addressItem} onPress={() => selectLocation(loc)}>
                            <Text style={styles.addressItemText}>{loc}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.noResults}>
                          <Text style={styles.noResultsText}>No locations found. Type a city name in Zimbabwe.</Text>
                        </View>
                      )}
                    </ScrollView>
                    <TouchableOpacity style={styles.addressCloseBtn} onPress={() => setShowAddressModal(false)}>
                      <Text style={styles.addressCloseText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Upload</Text>

          <Text style={styles.uploadLabel}>ID Document Type</Text>
          <View style={styles.pickerContainer}>
            {(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'] as DocumentType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, formData.idDocumentType === type && styles.pickerOptionSelected]}
                onPress={() => setFormData({ ...formData, idDocumentType: type })}
              >
                <Text style={[styles.pickerText, formData.idDocumentType === type && styles.pickerTextSelected]}>
                  {type.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.uploadLabel}>Document Number</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome name="credit-card" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ID or Passport number"
              placeholderTextColor="#64748b"
              value={formData.idDocumentNumber}
              onChangeText={(text) => setFormData({ ...formData, idDocumentNumber: text })}
            />
          </View>

          <Text style={styles.uploadLabel}>Front Document</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('front')}>
            <FontAwesome name={idDocumentFront ? 'check-circle' : 'camera'} size={20} color={idDocumentFront ? '#10b981' : '#0ea5e9'} />
            <Text style={[styles.uploadButtonText, idDocumentFront && styles.uploadTextSuccess]}>
              {idDocumentFront ? 'Front Document Uploaded' : 'Upload Front Document'}
            </Text>
          </TouchableOpacity>

          {idDocumentFront && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <View style={styles.previewThumbnail}>
                <FontAwesome name="image" size={32} color="#9ca3af" />
              </View>
            </View>
          )}

          <Text style={styles.uploadLabel}>Back Document (Optional)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('back')}>
            <FontAwesome name={idDocumentBack ? 'check-circle' : 'camera'} size={20} color={idDocumentBack ? '#10b981' : '#0ea5e9'} />
            <Text style={[styles.uploadButtonText, idDocumentBack && styles.uploadTextSuccess]}>
              {idDocumentBack ? 'Back Document Uploaded' : 'Upload Back Document'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.uploadLabel}>Selfie</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={openCamera}>
            <FontAwesome name={selfie ? 'check-circle' : 'camera'} size={20} color={selfie ? '#10b981' : '#0ea5e9'} />
            <Text style={[styles.uploadButtonText, selfie && styles.uploadTextSuccess]}>
              {selfie ? 'Selfie Uploaded' : 'Capture Selfie with Camera'}
            </Text>
          </TouchableOpacity>

          {selfie && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <View style={styles.previewThumbnail}>
                <FontAwesome name="image" size={32} color="#9ca3af" />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={async () => {
              if (!loading) await handleSubmit()
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit KYC</Text>
                <FontAwesome name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCameraModal}
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraModalOverlay}>
          <View style={styles.cameraModal}>
            <View style={styles.cameraModalHeader}>
              <Text style={styles.cameraModalTitle}>Capture Selfie</Text>
              <TouchableOpacity onPress={() => setShowCameraModal(false)}>
                <FontAwesome name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraPlaceholder}>
              <FontAwesome name="camera" size={48} color="#0ea5e9" />
              <Text style={styles.cameraPlaceholderText}>
                Camera requires expo-camera package
              </Text>
              <Text style={styles.cameraPlaceholderSubtext}>
                Opening gallery instead...
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cameraModalBtn}
              onPress={() => {
                setShowCameraModal(false)
                pickImage('selfie')
              }}
            >
              <Text style={styles.cameraModalBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 24,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 56,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 0,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pickerOption: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#0ea5e9',
  },
  pickerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  pickerTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  uploadTextSuccess: {
    color: '#10b981',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  previewThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addressModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '60%',
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 20,
    paddingBottom: 12,
  },
  addressSearchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 14,
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  addressList: {
    maxHeight: 200,
  },
  addressItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressItemText: {
    fontSize: 14,
    color: '#111827',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  addressCloseBtn: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  addressCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cameraModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  cameraModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  cameraModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cameraPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  cameraPlaceholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cameraModalBtn: {
    backgroundColor: '#0045a0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cameraModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})