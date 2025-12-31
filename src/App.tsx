import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { WelcomePage } from './components/WelcomePage';
import { OnboardingPage } from './components/OnboardingPage';
import { ExplorePage } from './components/ExplorePage';
import { SpaceDetailPage } from './components/SpaceDetailPage';
import { CreateSpacePage } from './components/CreateSpacePage';
import { ProfilePage } from './components/ProfilePage';
import { AdminToolsPage } from './components/AdminToolsPage';

export type Page = 'welcome' | 'onboarding' | 'explore' | 'space-detail' | 'create-space' | 'profile' | 'admin';

export interface User {
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
    // Check active session on load
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          fullName: user.user_metadata.full_name || 'User',
          location: '', // Would normally come from profile table
          bio: '',      // Would normally come from profile table
          email: user.email,
          avatar: user.user_metadata.avatar_url
        });
        // If on root or welcome, go to explore
        if (location.pathname === '/' || location.pathname === '/welcome') {
          navigate('/explore');
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          fullName: session.user.user_metadata.full_name || 'User',
          location: '',
          bio: '',
          email: session.user.email,
          avatar: session.user.user_metadata.avatar_url
        });
        // Only redirect to explore if we're on welcome page
        if (location.pathname === '/' || location.pathname === '/welcome') {
          navigate('/explore');
        }
      } else {
        setUser(null);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleNavigate = (page: Page, spaceId?: string) => {
    if (page === 'space-detail' && spaceId) {
      navigate(`/space/${spaceId}`);
    } else if (page === 'admin' && spaceId) {
      navigate(`/space/${spaceId}/admin`);
    } else if (page === 'create-space') {
      navigate('/create');
    } else if (page === 'welcome') {
      navigate('/');
    } else {
      navigate(`/${page}`);
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
      </Routes>
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
