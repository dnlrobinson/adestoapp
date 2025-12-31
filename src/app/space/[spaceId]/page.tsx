"use client"

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, ArrowLeft, Send, Loader2, Users, Lock, Globe, Shield } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/Avatar'

const HOURS = [
  '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
  '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'
]

const DAYS_WINDOW = 7

interface WeekDay {
  date: Date
  dayName: string
  dayLetter: string
  monthName: string
  dayNumber: number
  fullDate: string
  isToday: boolean
}

const getDaysWindow = (): WeekDay[] => {
  const days: WeekDay[] = []
  const start = new Date()
  start.setDate(start.getDate() - 1)

  for (let i = 0; i < DAYS_WINDOW; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayLetter: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      dayNumber: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      isToday: new Date().toDateString() === d.toDateString()
    })
  }
  return days
}

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params.spaceId as string
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'signal' | 'chat'>('signal')
  const [spaceName, setSpaceName] = useState('Loading...')
  const [spaceLocation, setSpaceLocation] = useState('')
  const [spaceDescription, setSpaceDescription] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [isPrivate, setIsPrivate] = useState(false)
  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const daysWindow = useMemo(() => getDaysWindow(), [])

  useEffect(() => {
    let isMounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return
      setCurrentUserId(user?.id || null)
    })
    return () => { isMounted = false }
  }, [])

  useLayoutEffect(() => {
    if (activeTab === 'signal' && scrollRef.current) {
      const eightAmRow = document.getElementById('hour-8AM')
      if (eightAmRow) {
        eightAmRow.scrollIntoView({ behavior: 'auto', block: 'center' })
      }
    }
  }, [activeTab])

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const [signals, setSignals] = useState<{ [key: string]: number }>({})
  const [userSignals, setUserSignals] = useState<Set<string>>(new Set())
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [signalsLoading, setSignalsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [spaceLoading, setSpaceLoading] = useState(true)
  const userSignalsRef = useRef(userSignals)

  const weekDatesSet = useMemo(
    () => new Set(daysWindow.map(d => d.fullDate)),
    [daysWindow]
  )

  useEffect(() => {
    userSignalsRef.current = userSignals
  }, [userSignals])

  // Fetch space details
  useEffect(() => {
    let isMounted = true
    async function fetchSpace() {
      const { data } = await supabase
        .from('spaces')
        .select('name, location, description, members_count, is_private, creator_id')
        .eq('id', spaceId)
        .single()

      if (!isMounted) return

      if (data) {
        setSpaceName(data.name)
        setSpaceLocation(data.location || '')
        setSpaceDescription(data.description || '')
        setMemberCount(data.members_count || 0)
        setIsPrivate(data.is_private || false)
        setCreatorId(data.creator_id || null)
      }
      setSpaceLoading(false)
    }

    fetchSpace()
    return () => { isMounted = false }
  }, [spaceId])

  // Realtime updates
  useEffect(() => {
    const channel = supabase.channel(`space-realtime-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          const record = (payload.new || payload.old) as { date?: string; hour?: string; user_id?: string } | null
          if (!record) return
          const key = `${record.date}-${record.hour}`
          if (!weekDatesSet.has(record.date)) return

          if (payload.eventType === 'INSERT' && record.user_id === currentUserId && userSignalsRef.current.has(key)) {
            return
          }
          if (payload.eventType === 'DELETE' && record.user_id === currentUserId && !userSignalsRef.current.has(key)) {
            return
          }

          setSignals(prev => {
            const next = { ...prev }
            if (payload.eventType === 'INSERT') {
              next[key] = (next[key] || 0) + 1
            }
            if (payload.eventType === 'DELETE') {
              next[key] = Math.max(0, (next[key] || 1) - 1)
            }
            return next
          })

          setUserSignals(prev => {
            if (!currentUserId) return prev
            const next = new Set(prev)
            if (payload.eventType === 'INSERT' && record.user_id === currentUserId) {
              next.add(key)
            }
            if (payload.eventType === 'DELETE' && record.user_id === currentUserId) {
              next.delete(key)
            }
            return next
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          const message = payload.new
          if (!message) return
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev
            return [...prev, message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId, currentUserId, weekDatesSet])

  // Fetch signals
  useEffect(() => {
    let isMounted = true
    async function fetchSignals() {
      setSignalsLoading(true)
      const currentWeekDates = Array.from(weekDatesSet)
      const { data } = await supabase
        .from('signals')
        .select('date, hour, user_id')
        .eq('space_id', spaceId)
        .in('date', currentWeekDates)

      if (!isMounted) return

      if (data) {
        const signalMap: { [key: string]: number } = {}
        const mySignals = new Set<string>()
        data.forEach((sig: any) => {
          const key = `${sig.date}-${sig.hour}`
          signalMap[key] = (signalMap[key] || 0) + 1
          if (currentUserId && sig.user_id === currentUserId) {
            mySignals.add(key)
          }
        })
        setSignals(signalMap)
        setUserSignals(mySignals)
      } else {
        setSignals({})
        setUserSignals(new Set())
      }
      setSignalsLoading(false)
    }
    fetchSignals()
    return () => { isMounted = false }
  }, [spaceId, currentUserId, weekDatesSet])

  // Fetch messages
  useEffect(() => {
    let isMounted = true
    async function fetchMessages() {
      setMessagesLoading(true)
      const { data: messagesResult } = await supabase
        .from('messages')
        .select('id, content, created_at, user_id, sender_name')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!isMounted) return

      if (messagesResult) {
        const msgs = messagesResult.reverse()
        const userIds = [...new Set(msgs.map((m: any) => m.user_id).filter(Boolean))]

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, avatar_url, full_name')
            .in('id', userIds)

          const messagesWithAvatars = msgs.map((msg: any) => {
            const profile = profiles?.find((p: any) => p.id === msg.user_id)
            return {
              ...msg,
              avatar_url: profile?.avatar_url || null,
              sender_name: profile?.full_name || msg.sender_name || 'User'
            }
          })
          setMessages(messagesWithAvatars)
        } else {
          setMessages(msgs)
        }
      } else {
        setMessages([])
      }
      setMessagesLoading(false)
    }
    fetchMessages()
    return () => { isMounted = false }
  }, [spaceId])

  const handleAddSignal = async (fullDate: string, hour: string) => {
    if (!user || !currentUserId) return alert('Please log in to signal')
    
    const key = `${fullDate}-${hour}`
    const hasSignaled = userSignals.has(key)

    if (hasSignaled) {
      setSignals(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 1) - 1) }))
      setUserSignals(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })

      await supabase.from('signals').delete().match({
        space_id: spaceId,
        user_id: currentUserId,
        date: fullDate,
        hour
      })
    } else {
      setSignals(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
      setUserSignals(prev => {
        const next = new Set(prev)
        next.add(key)
        return next
      })

      await supabase.from('signals').insert({
        space_id: spaceId,
        user_id: currentUserId,
        date: fullDate,
        hour
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !currentUserId) return

    const msgContent = newMessage
    setNewMessage('')

    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', currentUserId)
      .single()

    const fakeMsg = { 
      id: Date.now(), 
      sender_name: profile?.full_name || user.fullName, 
      content: msgContent, 
      created_at: new Date().toISOString(),
      avatar_url: profile?.avatar_url || user.avatar || null,
      user_id: currentUserId
    }
    setMessages(prev => [...prev, fakeMsg])

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        space_id: spaceId,
        user_id: currentUserId,
        sender_name: profile?.full_name || user.fullName,
        content: msgContent
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return
    }

    if (inserted) {
      const withAvatar = {
        ...inserted,
        avatar_url: profile?.avatar_url || user.avatar || null,
        sender_name: profile?.full_name || inserted.sender_name || user.fullName
      }
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== fakeMsg.id)
        if (filtered.some(m => m.id === inserted.id)) return filtered
        return [...filtered, withAvatar]
      })
    }
  }

  const getHeatmapColor = (count: number, hasMySignal: boolean) => {
    if (count === 0) return 'bg-gray-50 hover:bg-gray-100'
    
    const baseColor = count <= 2 ? 'bg-emerald-100 text-emerald-800' :
                     count <= 5 ? 'bg-emerald-300 text-emerald-900' :
                     'bg-emerald-500 text-white'
                     
    return `${baseColor} ${hasMySignal ? 'ring-2 ring-emerald-600 ring-inset' : ''}`
  }

  if (spaceLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push('/explore')} className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            {creatorId && currentUserId === creatorId && (
              <button
                onClick={() => router.push(`/space/${spaceId}/admin`)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin Tools</span>
              </button>
            )}
          </div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{spaceName}</h1>
            
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                {isPrivate ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <MapPin className="w-4 h-4" /> {spaceLocation}
            </div>
            
            {spaceDescription && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                {spaceDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex border-b border-gray-100 mb-0">
          <button
            onClick={() => setActiveTab('signal')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'signal' ? 'text-black' : 'text-gray-400'
            }`}
          >
            Calendar
            {activeTab === 'signal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black mx-12 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'chat' ? 'text-black' : 'text-gray-400'
            }`}
          >
            Chat
            {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black mx-12 rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === 'signal' && (
          <div className="bg-white" ref={scrollRef}>
            {signalsLoading && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading calendar...
              </div>
            )}
            <div className="flex justify-center py-2 border-b border-gray-100">
              <button
                onClick={handleToday}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Today
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 w-14 sticky left-0 bg-white z-10 border-r border-gray-100"></th>
                      {daysWindow.map(day => (
                        <th key={day.fullDate} className={`p-2 min-w-[100px] text-center border-b border-gray-100 ${
                          selectedDate === day.fullDate ? 'bg-gray-50/50' : ''
                        }`}>
                          <div className="flex flex-col items-center justify-center gap-1 py-1">
                            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{day.dayName}</span>
                            <span className={`text-base font-semibold ${selectedDate === day.fullDate ? 'text-black' : 'text-gray-900'}`}>
                              {day.dayNumber}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => (
                      <tr key={hour} id={`hour-${hour}`}>
                        <td className="p-2 border-r border-gray-100 text-[10px] text-gray-400 font-medium text-center sticky left-0 bg-white z-10">
                          {hour}
                        </td>
                        {daysWindow.map(day => {
                          const key = `${day.fullDate}-${hour}`
                          const count = signals[key] || 0
                          const hasMySignal = userSignals.has(key)
                          const isSelectedDay = selectedDate === day.fullDate
                          
                          return (
                            <td key={`${day.fullDate}-${hour}`} className={`p-0.5 border-b border-r border-gray-50 ${
                              isSelectedDay ? 'bg-gray-50/50' : ''
                            }`}>
                              <button
                                onClick={() => handleAddSignal(day.fullDate, hour)}
                                className={`w-full h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all active:scale-95 ${getHeatmapColor(count, hasMySignal)}`}
                              >
                                {count > 0 && count}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-220px)] bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-400 mt-10 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.sender_name === user?.fullName
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar 
                        src={msg.avatar_url} 
                        name={msg.sender_name || 'User'}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isMe ? 'bg-black text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {isMe ? 'You' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-3 bg-white border-t border-gray-100 sticky bottom-14">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button type="submit" className="p-3 bg-black text-white rounded-full hover:bg-gray-800 shadow-lg active:scale-95 transition-transform">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

