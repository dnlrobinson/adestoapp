"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/Avatar'

export default function EditProfilePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    fullName: '',
    bio: '',
    location: '',
    avatar: ''
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, location, bio, avatar_url, email')
          .eq('id', authUser.id)
          .single()

        if (profileData) {
          setProfile({
            fullName: profileData.full_name || user?.fullName || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
            avatar: profileData.avatar_url || user?.avatar || ''
          })
        } else if (user) {
          setProfile({
            fullName: user.fullName,
            bio: user.bio,
            location: user.location,
            avatar: user.avatar || ''
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        alert('You must be logged in to upload an avatar')
        setUploadingAvatar(false)
        return
      }

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${authUser.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        setProfile({ ...profile, avatar: publicUrl })
      } catch (storageError: any) {
        if (storageError.message?.includes('Bucket not found') || storageError.message?.includes('not found')) {
          alert('Avatar storage not set up. You can paste an image URL in the avatar URL field instead.')
        } else {
          throw storageError
        }
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading avatar: ' + error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!profile.fullName.trim()) {
      alert('Please enter your name')
      return
    }

    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        alert('You must be logged in to update your profile')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          full_name: profile.fullName.trim(),
          bio: profile.bio.trim(),
          location: profile.location.trim(),
          avatar_url: profile.avatar
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      if (refreshUser) {
        await refreshUser()
      }

      router.push('/profile')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      alert('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Cancel</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex flex-col items-center">
            <Avatar 
              src={profile.avatar} 
              name={profile.fullName || 'User'}
              size="xl"
              className="mb-4"
            />
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">{profile.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                  </>
                )}
              </div>
            </label>
            <div className="mt-2 w-full max-w-md">
              <label className="block text-xs text-gray-500 mb-1">Or paste image URL:</label>
              <input
                type="url"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {profile.avatar && (
              <button
                onClick={() => setProfile({ ...profile, avatar: '' })}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove Photo
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="e.g., Building A, Floor 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              rows={6}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-500 mt-2">
              {profile.bio.length}/500 characters
            </p>
          </div>

          {user?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-2">
                Email cannot be changed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

