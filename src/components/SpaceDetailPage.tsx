import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { MapPin, ArrowLeft, MessageCircle, Calendar, Send, Loader2, ChevronRight, ChevronLeft, Users, Lock, Globe, Shield } from 'lucide-react';
import { Page, User } from '../App';
import { BottomNav } from './BottomNav';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SpaceDetailPageProps {
  spaceId: string;
  onNavigate: (page: Page, spaceId?: string) => void;
  user: User | null;
}

const HOURS = [
  '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
  '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'
];

// Helper to get the current week's dates
interface WeekDay {
  date: Date;
  dayName: string;
  dayLetter: string;
  monthName: string;
  dayNumber: number;
  fullDate: string;
  isToday: boolean;
}

const getDaysOfWeek = (startFromDate: Date = new Date()): WeekDay[] => {
  const days: WeekDay[] = [];
  // Start from the most recent Sunday (or Monday if you prefer)
  const start = new Date(startFromDate);
  start.setDate(start.getDate() - start.getDay()); // Go back to Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), // "Mon"
      dayLetter: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // "M"
      monthName: d.toLocaleDateString('en-US', { month: 'short' }), // "Dec"
      dayNumber: d.getDate(), // 29
      fullDate: d.toISOString().split('T')[0], // "2023-11-29"
      isToday: new Date().toDateString() === d.toDateString()
    });
  }
  return days;
};

export function SpaceDetailPage({ spaceId, onNavigate, user }: SpaceDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'signal' | 'chat'>('signal');
  const [spaceName, setSpaceName] = useState('Loading...');
  const [spaceLocation, setSpaceLocation] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number>(0);
  const touchEnd = useRef<number>(0);
  const navigate = useNavigate();

  // Update weekDays when currentWeekStart changes
  useEffect(() => {
    setWeekDays(getDaysOfWeek(currentWeekStart));
  }, [currentWeekStart]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Auto-scroll to 8AM
  useLayoutEffect(() => {
    if (activeTab === 'signal' && scrollRef.current) {
      // 8AM is the 9th item (index 8) in HOURS array
      // Row height is roughly 40px + padding, header is ~40px
      // A safe estimate is just to find the element or scroll to a fixed offset
      // But simpler: scroll to "8AM" row if we can identify it
      const eightAmRow = document.getElementById('hour-8AM');
      if (eightAmRow) {
        eightAmRow.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
  }, [activeTab]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Next Week
      const next = new Date(currentWeekStart);
      next.setDate(next.getDate() + 7);
      setCurrentWeekStart(next);
    }

    if (isRightSwipe) {
      // Prev Week
      const prev = new Date(currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      setCurrentWeekStart(prev);
    }
    
    // Reset
    touchStart.current = 0;
    touchEnd.current = 0;
  };


  // Data State
  const [signals, setSignals] = useState<{ [key: string]: number }>({});
  const [userSignals, setUserSignals] = useState<Set<string>>(new Set()); // Track which cells current user has clicked
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch Data on Load
  useEffect(() => {
    async function fetchData() {
      // 1. Get Space Details
      const { data: space } = await supabase.from('spaces').select('*').eq('id', spaceId).single();
      if (space) {
        setSpaceName(space.name);
        setSpaceLocation(space.location || '');
        setSpaceDescription(space.description || '');
        setMemberCount(space.members_count || 0);
        setIsPrivate(space.is_private || false);
        setCreatorId(space.creator_id || null);
      }

      // 2. Get Signals (Heatmap)
      const { data: rawSignals } = await supabase.from('signals').select('day, hour, user_id').eq('space_id', spaceId);
      
      if (rawSignals) {
        const signalMap: { [key: string]: number } = {};
        const mySignals = new Set<string>();
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;

        rawSignals.forEach((sig: any) => {
          // Map database 'Mon' to local layout
          const key = `${sig.day}-${sig.hour}`;
          signalMap[key] = (signalMap[key] || 0) + 1;
          
          if (currentUserId && sig.user_id === currentUserId) {
            mySignals.add(key);
          }
        });
        setSignals(signalMap);
        setUserSignals(mySignals);
      }

      // 3. Get Messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true });
      
      if (msgs) setMessages(msgs);
      
      setLoading(false);
    }
    fetchData();
  }, [spaceId]);

  // --- ACTIONS ---

  const handleAddSignal = async (dayName: string, hour: string) => {
    if (!user) return alert('Please log in to signal');
    
    const key = `${dayName}-${hour}`;
    const hasSignaled = userSignals.has(key);
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) return;

    // Optimistic Update
    if (hasSignaled) {
      // Remove signal ONLY if I have signaled
      setSignals(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 1) - 1) }));
      setUserSignals(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      await supabase.from('signals').delete().match({
        space_id: spaceId,
        user_id: userId,
        day: dayName,
        hour
      });

    } else {
      // Add signal if I haven't already
      setSignals(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      setUserSignals(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      await supabase.from('signals').insert({
        space_id: spaceId,
        user_id: userId,
        day: dayName,
        hour
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgContent = newMessage;
    setNewMessage(''); 

    const fakeMsg = { 
      id: Date.now(), 
      sender_name: user.fullName, 
      content: msgContent, 
      created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, fakeMsg]);

    await supabase.from('messages').insert({
      space_id: spaceId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      sender_name: user.fullName,
      content: msgContent
    });
  };

  const getHeatmapColor = (count: number, hasMySignal: boolean) => {
    if (count === 0) return 'bg-gray-50 hover:bg-gray-100'; // Empty state
    
    // If I have signaled, make it distinctly "active" (e.g. darker border or specific shade)
    // For now just sticking to density colors, but you could add a border:
    const baseColor = count <= 2 ? 'bg-emerald-100 text-emerald-800' :
                     count <= 5 ? 'bg-emerald-300 text-emerald-900' :
                     'bg-emerald-500 text-white';
                     
    return `${baseColor} ${hasMySignal ? 'ring-2 ring-emerald-600 ring-inset' : ''}`;
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
          <button onClick={() => onNavigate('explore')} className="flex items-center gap-2 text-gray-600 mb-4">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{spaceName}</h1>
              
              {/* Meta Info Row */}
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

            {creatorId && currentUserId === creatorId && (
              <button
                onClick={() => onNavigate('admin', spaceId)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin Tools</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        
        {/* Tab Switcher (Subtle) */}
        <div className="flex border-b border-gray-100 mb-0">
          <button
            onClick={() => setActiveTab('signal')}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'signal' ? 'text-black' : 'text-gray-400'
            }`}
          >
            Schedule
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

        {/* --- SIGNAL TAB (HEATMAP) --- */}
        {activeTab === 'signal' && (
          <div 
            className="bg-white" 
            ref={scrollRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 w-14 sticky left-0 bg-white z-10 border-r border-gray-100"></th>
                      {weekDays.map(day => (
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
                        {/* Time Column */}
                        <td className="p-2 border-r border-gray-100 text-[10px] text-gray-400 font-medium text-center sticky left-0 bg-white z-10">
                          {hour}
                        </td>
                        
                        {/* Grid Cells */}
                        {weekDays.map(day => {
                          const count = signals[`${day.dayName}-${hour}`] || 0;
                          const key = `${day.dayName}-${hour}`;
                          const hasMySignal = userSignals.has(key);
                          const isSelectedDay = selectedDate === day.fullDate;
                          
                          return (
                            <td key={`${day.dayName}-${hour}`} className={`p-0.5 border-b border-r border-gray-50 ${
                              isSelectedDay ? 'bg-gray-50/50' : ''
                            }`}>
                              <button
                                onClick={() => handleAddSignal(day.dayName, hour)}
                                className={`w-full h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all active:scale-95 ${getHeatmapColor(count, hasMySignal)}`}
                              >
                                {count > 0 && count}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- CHAT TAB --- */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-220px)] bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No messages yet. Say hi!</div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.sender_name === user?.fullName;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${
                        isMe ? 'bg-black text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {isMe ? 'You' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
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

      <BottomNav currentPage="explore" onNavigate={onNavigate} />
    </div>
  );
}