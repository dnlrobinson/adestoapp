"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signUp: (provider: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signUp: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUserProfile = useCallback(async (authUser: any): Promise<User> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, location, bio, avatar_url')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      return {
        id: authUser.id,
        fullName: profile?.full_name || authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
        location: profile?.location || '',
        bio: profile?.bio || '',
        email: authUser.email,
        avatar: profile?.avatar_url || authUser.user_metadata.avatar_url
      }
    } catch (error) {
      console.error('Error processing profile:', error)
      return {
        id: authUser.id,
        fullName: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
        location: '',
        bio: '',
        email: authUser.email,
        avatar: authUser.user_metadata.avatar_url
      }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const userData = await fetchUserProfile(authUser)
      setUser(userData)
    }
  }, [fetchUserProfile])

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Error fetching user:', authError)
          setLoading(false)
          return
        }

        if (authUser) {
          const userData = await fetchUserProfile(authUser)
          setUser(userData)

          // If on root or welcome, go to explore
          if (pathname === '/' || pathname === '/welcome') {
            router.push('/explore')
          }
        }
      } catch (error) {
        console.error('Error in fetchUser:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await fetchUserProfile(session.user)
        setUser(userData)

        // Only redirect to explore if we're on welcome page
        if (pathname === '/' || pathname === '/welcome') {
          router.push('/explore')
        }
      } else {
        setUser(null)
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, pathname, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const signUp = async (provider: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as any,
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signUp, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

