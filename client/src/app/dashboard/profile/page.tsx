'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Mail, Phone, Save, Camera, LogOut, Shield, User as UserIcon, FileText, Calendar, MapPin, CreditCard } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showKycConfirmed, setShowKycConfirmed] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Set form data when user is available or after fetching
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      })
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
      if (!initialized) setInitialized(true)
    }
  }, [user])

  useEffect(() => {
    if (!user && typeof window !== 'undefined' && localStorage.getItem('token')) {
      fetchProfile()
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('auth/profile')
      const userData = response.data.data || response.data
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
        idDocumentFrontUrl: userData.idDocumentFrontUrl,
        idDocumentBackUrl: userData.idDocumentBackUrl,
        selfieUrl: userData.selfieUrl,
      } as any)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  useEffect(() => {
    if (user?.kycStatus === 'APPROVED' && !showKycConfirmed) {
      setShowKycConfirmed(true)
      toast.success('KYC Verified! Your account is now fully activated.', {
        duration: 5000,
        position: 'top-center',
      })
    }
  }, [user?.kycStatus, showKycConfirmed])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
        uploadAvatar(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      console.log('Uploading avatar:', file.name, file.size, file.type)
      const form = new FormData()
      form.append('avatar', file)
      
      const res = await api.post('auth/avatar', form)
      console.log('Avatar upload response:', res.data)
      
      if (res.data?.avatar) {
        updateUser({ ...user, avatar: res.data.avatar } as any)
        setAvatarPreview(res.data.avatar)
      }
      toast.success('Profile image updated')
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      const msg = err.response?.data?.message || err.message || err.response?.data?.error || 'Failed to upload image'
      console.error('Error details:', err.response?.data)
      toast.error(msg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.put('auth/profile', formData)
      const userData = response.data.data || response.data
      updateUser({ ...user, ...userData, firstName: userData.firstName, lastName: userData.lastName } as any)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        Profile Settings
        {user?.kycStatus === 'APPROVED' && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
            <Shield className="h-3 w-3" />
            KYC Verified
          </span>
        )}
        {user?.kycStatus === 'SUBMITTED' && (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            <Shield className="h-3 w-3" />
            Pending Review
          </span>
        )}
      </h1>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {user?.kycStatus === 'SUBMITTED' && (
          <div className="mb-4 rounded-xl bg-yellow-50 p-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">Your KYC is under review. You will receive a notification once approved.</p>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-sky flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {avatarPreview || user?.avatar ? (
                <img src={avatarPreview || user?.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 rounded-full bg-white p-1.5 shadow cursor-pointer hover:bg-gray-50 border border-gray-200">
              <Camera className="h-3.5 w-3.5 text-brand-blue" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.firstName || ''} {user?.lastName || ''}
            </h2>
            <p className="text-sm text-gray-600">{user?.email || '-'}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-brand-blue/10 text-brand-blue'}`}>
                {user?.role}
              </span>
              {user?.kycStatus === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 py-2.5 text-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                placeholder="+263..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky px-5 py-2.5 text-sm font-medium text-white hover:from-brand-blue/90 hover:to-brand-sky/90 disabled:opacity-50 transition-all duration-200"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </form>
      </div>

      {user?.kycStatus && user.kycStatus !== 'PENDING' && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-blue" />
            KYC Verification Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500">Full Legal Name</label>
              <p className="mt-1 text-sm text-gray-900">{user.fullNameLegal || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="mt-1 text-sm text-gray-900">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-500">Residential Address</label>
              <p className="mt-1 text-sm text-gray-900">{user.residentialAddress || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Country</label>
              <p className="mt-1 text-sm text-gray-900">{user.country || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">ID Document Type</label>
              <p className="mt-1 text-sm text-gray-900">{user.idDocumentType || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">ID Document Number</label>
              <p className="mt-1 text-sm text-gray-900">{user.idDocumentNumber || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}