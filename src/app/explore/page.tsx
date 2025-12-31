"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, MapPin, Users, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Space } from '@/lib/types'

const CATEGORIES = ['All', 'Health & Fitness', 'Education', 'Community', 'Entertainment']

export default function ExplorePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [joinedSpaceIds, setJoinedSpaceIds] = useState<Set<string>>(new Set())
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const mapSpaceRow = (item: any): Space => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    location: item.location || 'Unknown',
    category: item.category || 'Uncategorized',
    members: item.members_count || 0,
    rating: item.rating || 0,
    creator: item.creator_id,
    isPrivate: item.is_private,
    color: item.color || 'from-gray-400 to-gray-600'
  })

  useEffect(() => {
    let isMounted = true

    async function fetchSpaces() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setLoading(false)
          return
        }
        if (isMounted) setCurrentUserId(authUser.id)

        const [spacesResult, membersResult] = await Promise.all([
          supabase
            .from('spaces')
            .select('id, name, description, location, category, members_count, rating, creator_id, is_private, color'),
          supabase
            .from('space_members')
            .select('space_id')
            .eq('user_id', authUser.id)
        ])

        if (spacesResult.error) {
          console.error('Error fetching spaces:', spacesResult.error)
          setLoading(false)
          return
        }

        const joinedIds = new Set<string>()
        if (membersResult.data) {
          membersResult.data.forEach(member => {
            if (member.space_id) joinedIds.add(member.space_id)
          })
        }
        if (isMounted) setJoinedSpaceIds(joinedIds)

        if (spacesResult.data) {
          const mappedSpaces: Space[] = spacesResult.data.map(mapSpaceRow)
          if (isMounted) setSpaces(mappedSpaces)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSpaces()
    return () => {
      isMounted = false
    }
  }, [])

  // Realtime updates for spaces list
  useEffect(() => {
    const channel = supabase.channel('explore-spaces')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces' },
        (payload) => {
          setSpaces(prev => {
            if (payload.eventType === 'INSERT') {
              return [...prev, mapSpaceRow(payload.new)]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(space => space.id === payload.new.id ? mapSpaceRow(payload.new) : space)
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(space => space.id !== payload.old.id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Realtime updates for current user's memberships
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase.channel(`explore-members-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_members', filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJoinedSpaceIds(prev => new Set(prev).add(payload.new.space_id))
          }
          if (payload.eventType === 'DELETE') {
            setJoinedSpaceIds(prev => {
              const next = new Set(prev)
              next.delete(payload.old.space_id)
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const handleJoinSpace = async (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user || !currentUserId) {
      alert('Please log in to join a space')
      return
    }

    setJoiningSpaceId(spaceId)
    
    try {
      const isJoined = joinedSpaceIds.has(spaceId)

      if (isJoined) {
        const { error: deleteError } = await supabase
          .from('space_members')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', currentUserId)

        if (deleteError) throw deleteError

        setJoinedSpaceIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(spaceId)
          return newSet
        })

        setSpaces(prev => prev.map(s => 
          s.id === spaceId ? { ...s, members: Math.max(0, (s.members || 0) - 1) } : s
        ))
      } else {
        const { error: insertError } = await supabase
          .from('space_members')
          .insert({
            space_id: spaceId,
            user_id: currentUserId,
            role: 'member'
          })

        if (insertError) throw insertError

        setJoinedSpaceIds(prev => new Set(prev).add(spaceId))
        setSpaces(prev => prev.map(s => 
          s.id === spaceId ? { ...s, members: (s.members || 0) + 1 } : s
        ))
      }
    } catch (error: any) {
      console.error('Error joining/leaving space:', error)
      alert('Error: ' + (error.message || 'Failed to join/leave space'))
    } finally {
      setJoiningSpaceId(null)
    }
  }

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         space.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || space.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Loading Adesto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl mb-6 text-center text-gray-900">Adesto</h1>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search boards by location or interest"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => router.push('/create')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSpaces.map(space => (
            <div
              key={space.id}
              onClick={() => router.push(`/space/${space.id}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100"
            >
              <div className={`h-32 bg-gradient-to-br ${space.color}`} />
              
              <div className="p-5">
                <h3 className="text-xl text-gray-900 mb-2">{space.name}</h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{space.location}</span>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {space.description}
                </p>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{space.members}</span>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">
                      {space.category}
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => handleJoinSpace(space.id, e)}
                    disabled={joiningSpaceId === space.id}
                    className={`px-5 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                      joinedSpaceIds.has(space.id)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-black text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {joiningSpaceId === space.id ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : joinedSpaceIds.has(space.id) ? (
                      'Joined'
                    ) : (
                      'Join'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">No spaces found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

