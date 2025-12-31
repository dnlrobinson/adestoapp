import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase } from './lib/supabase';
import { WelcomePage } from './components/WelcomePage';
import { OnboardingPage } from './components/OnboardingPage';
import { ExplorePage } from './components/ExplorePage';
import { SpaceDetailPage } from './components/SpaceDetailPage';
import { CreateSpacePage } from './components/CreateSpacePage';
import { ProfilePage } from './components/ProfilePage';
import { AdminToolsPage } from './components/AdminToolsPage';
import { EditProfilePage } from './components/EditProfilePage';

export type Page = 'welcome' | 'onboarding' | 'explore' | 'space-detail' | 'create-space' | 'profile' | 'admin' | 'edit-profile';

export interface User {
  id?: string;
  fullName: string;
  location: string;
  bio: string;
  email?: string;
  avatar?: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  members: number;
  rating: number;
  creator: string;
  isPrivate: boolean;
  color: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Error fetching user:', authError);
          setLoading(false);
          return;
        }

        if (authUser) {
          try {
            // Fetch only needed profile fields
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, location, bio, avatar_url')
              .eq('id', authUser.id)
              .single();

            // Handle profile errors gracefully (profile might not exist yet)
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }

            setUser({
              id: authUser.id,
              fullName: profile?.full_name || authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
              location: profile?.location || '',
              bio: profile?.bio || '',
              email: authUser.email,
              avatar: profile?.avatar_url || authUser.user_metadata.avatar_url
            });

            // If on root or welcome, go to explore
            if (location.pathname === '/' || location.pathname === '/welcome') {
              navigate('/explore');
            }
          } catch (profileErr) {
            console.error('Error processing profile:', profileErr);
            // Still set user with basic info even if profile fetch fails
            setUser({
              id: authUser.id,
              fullName: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
              location: '',
              bio: '',
              email: authUser.email,
              avatar: authUser.user_metadata.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
      } finally {
        // Always set loading to false, even if there's an error
        setLoading(false);
      }
    }

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          // Fetch only needed profile fields
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, location, bio, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile in auth change:', profileError);
          }

          setUser({
            id: session.user.id,
            fullName: profile?.full_name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            location: profile?.location || '',
            bio: profile?.bio || '',
            email: session.user.email,
            avatar: profile?.avatar_url || session.user.user_metadata.avatar_url
          });

          // Only redirect to explore if we're on welcome page
          if (location.pathname === '/' || location.pathname === '/welcome') {
            navigate('/explore');
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Still set user with basic info
          setUser({
            id: session.user.id,
            fullName: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            location: '',
            bio: '',
            email: session.user.email,
            avatar: session.user.user_metadata.avatar_url
          });
        }
      } else {
        setUser(null);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]); // Removed location.pathname to prevent unnecessary re-fetches

  const handleNavigate = (page: Page, spaceId?: string) => {
    if (page === 'space-detail' && spaceId) {
      navigate(`/space/${spaceId}`);
    } else if (page === 'admin' && spaceId) {
      navigate(`/space/${spaceId}/admin`);
    } else if (page === 'create-space') {
      navigate('/create');
    } else if (page === 'edit-profile') {
      navigate('/profile/edit');
    } else if (page === 'welcome') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  };

  const handleProfileUpdated = async () => {
    // Refresh user data after profile update
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, location, bio, avatar_url')
        .eq('id', authUser.id)
        .single();

      setUser({
        id: authUser.id,
        fullName: profile?.full_name || authUser.user_metadata.full_name || authUser.email?.split('@')[0] || 'User',
        location: profile?.location || '',
        bio: profile?.bio || '',
        email: authUser.email,
        avatar: profile?.avatar_url || authUser.user_metadata.avatar_url
      });
    }
  };

  const handleSignUp = async (provider: string) => {
    try {
      // For now we'll just try Google since it's common, or fallback to the provider passed
      // In a real app you'd map the provider string to Supabase provider types
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as any, // 'google', 'github', etc.
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleCompleteOnboarding = (userData: User) => {
    setUser(userData);
    navigate('/explore');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<WelcomePage onSignUp={handleSignUp} />} />
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route path="/onboarding" element={<OnboardingPage onComplete={handleCompleteOnboarding} />} />
        <Route path="/explore" element={<ExplorePage onNavigate={handleNavigate} user={user} />} />
        <Route path="/space/:spaceId" element={<SpaceDetailPageWrapper onNavigate={handleNavigate} user={user} />} />
        <Route path="/space/:spaceId/admin" element={<AdminToolsPageWrapper onNavigate={handleNavigate} user={user} />} />
        <Route path="/create" element={<CreateSpacePage onNavigate={handleNavigate} user={user} />} />
        <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} />} />
        <Route path="/profile/edit" element={<EditProfilePage onNavigate={handleNavigate} user={user} onProfileUpdated={handleProfileUpdated} />} />
        {/* Catch-all route - redirects to explore if authenticated, otherwise welcome */}
        <Route path="*" element={<Navigate to={user ? "/explore" : "/"} replace />} />
      </Routes>
      <SpeedInsights />
    </div>
  );
}

function SpaceDetailPageWrapper({ onNavigate, user }: { onNavigate: (page: Page, spaceId?: string) => void, user: User | null }) {
  const { spaceId } = useParams();
  if (!spaceId) return null;
  return <SpaceDetailPage spaceId={spaceId} onNavigate={onNavigate} user={user} />;
}

function AdminToolsPageWrapper({ onNavigate, user }: { onNavigate: (page: Page, spaceId?: string) => void, user: User | null }) {
  const { spaceId } = useParams();
  if (!spaceId) return null;
  return <AdminToolsPage spaceId={spaceId} onNavigate={onNavigate} user={user} />;
}
