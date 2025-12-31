"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Edit, Mail, Calendar, Users, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/Avatar'

interface UserSpace {
  id: string
  name: string
  location: string
  members: number
  color: string
  role: 'Creator' | 'Member'
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setProfileLoading(false)
          return
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name, location, bio, avatar_url, created_at')
          .eq('id', authUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        if (profileData) {
          setProfileData(profileData)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  useEffect(() => {
    async function fetchUserSpaces() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setLoading(false)
          return
        }

        const { data: membersData, error: membersError } = await supabase
          .from('space_members')
          .select('space_id, role')
          .eq('user_id', authUser.id)

        if (membersError) {
          console.error('Error fetching user spaces:', membersError)
          setLoading(false)
          return
        }

        if (!membersData || membersData.length === 0) {
          setUserSpaces([])
          setLoading(false)
          return
        }

        const spaceIds = membersData.map(m => m.space_id).filter(Boolean)
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name, location, creator_id')
          .in('id', spaceIds)

        if (spacesError) {
          console.error('Error fetching spaces:', spacesError)
          setLoading(false)
          return
        }

        const mappedSpaces: UserSpace[] = (spacesData || []).map(space => {
          const isCreator = space.creator_id === authUser.id
          
          return {
            id: space.id,
            name: space.name,
            location: space.location || 'Unknown',
            members: 0,
            color: 'from-gray-400 to-gray-600',
            role: isCreator ? 'Creator' : 'Member'
          }
        })

        mappedSpaces.sort((a, b) => {
          if (a.role === 'Creator' && b.role !== 'Creator') return -1
          if (a.role !== 'Creator' && b.role === 'Creator') return 1
          return a.name.localeCompare(b.name)
        })

        setUserSpaces(mappedSpaces)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserSpaces()
  }, [])

  const displayUser = profileData ? {
    fullName: profileData.full_name || user?.fullName || 'User',
    location: profileData.location || '',
    bio: profileData.bio || '',
    email: user?.email,
    avatar: profileData.avatar_url || user?.avatar || ''
  } : (user || {
    fullName: 'User',
    location: '',
    bio: '',
    email: ''
  })

  const joinedDate = profileData?.created_at 
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-32"></div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="relative -mt-16 mb-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <Avatar 
                    src={displayUser.avatar} 
                    name={displayUser.fullName}
                    size="xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-2xl text-gray-900 truncate">{displayUser.fullName}</h1>
                      <button 
                        onClick={() => router.push('/profile/edit')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{displayUser.location || 'No location set'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        <Users className="w-4 h-4" />
                        <span>{userSpaces.length} Spaces</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {joinedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">About</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {displayUser.bio || 'No bio yet. Click Edit to add one!'}
                    </p>
                  </div>

                  {displayUser.email && (
                    <div>
                      <h3 className="text-sm text-gray-500 mb-2">Contact</h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{displayUser.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-gray-900">My Spaces</h2>
            <button
              onClick={() => router.push('/create')}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm"
            >
              Create New
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : userSpaces.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No spaces yet</h3>
              <p className="text-gray-500 text-sm mb-4">Join spaces from the explore page to see them here</p>
              <button
                onClick={() => router.push('/explore')}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm"
              >
                Explore Spaces
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userSpaces.map(space => (
                <div
                  key={space.id}
                  onClick={() => router.push(`/space/${space.id}`)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${space.color} rounded-xl flex-shrink-0`} />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg text-gray-900 truncate flex-shrink">{space.name}</h3>
                        {space.role === 'Creator' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs whitespace-nowrap flex-shrink-0">
                            Creator
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{space.location}</span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                          <Users className="w-4 h-4" />
                          <span>{space.members}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl text-gray-900 mb-4">Account Settings</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              Notification Preferences
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              Privacy Settings
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              Help & Support
            </button>
            <button 
              onClick={signOut}
              className="w-full text-left px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

