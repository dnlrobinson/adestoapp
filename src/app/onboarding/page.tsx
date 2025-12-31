"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, User as UserIcon, FileText, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !location || !bio) return

    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        alert('You must be logged in to complete onboarding')
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          full_name: fullName.trim(),
          location: location.trim(),
          bio: bio.trim()
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      router.push('/explore')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      alert('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const isValid = fullName.trim() && location.trim() && bio.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-3 text-gray-900">Tell us about yourself</h1>
          <p className="text-gray-600">
            Help others find and connect with you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              User Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your user name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Chicago, IL"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {bio.length}/150 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <span>{saving ? 'Saving...' : 'Continue'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can update this information later in your profile
          </p>
        </div>
      </div>
    </div>
  )
}

