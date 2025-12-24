import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { WelcomePage } from './components/WelcomePage';
import { OnboardingPage } from './components/OnboardingPage';
import { ExplorePage } from './components/ExplorePage';
import { SpaceDetailPage } from './components/SpaceDetailPage';
import { CreateSpacePage } from './components/CreateSpacePage';
import { ProfilePage } from './components/ProfilePage';

export type Page = 'welcome' | 'onboarding' | 'explore' | 'space-detail' | 'create-space' | 'profile';

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
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        setCurrentPage('explore');
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
        if (currentPage === 'welcome') {
          setCurrentPage('explore');
        }
      } else {
        setUser(null);
        setCurrentPage('welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: Page, spaceId?: string) => {
    setCurrentPage(page);
    if (spaceId) {
      setSelectedSpaceId(spaceId);
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
    setCurrentPage('welcome');
  };

  const handleCompleteOnboarding = (userData: User) => {
    setUser(userData);
    setCurrentPage('explore');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'welcome' && (
        <WelcomePage onSignUp={handleSignUp} />
      )}
      {currentPage === 'onboarding' && (
        <OnboardingPage onComplete={handleCompleteOnboarding} />
      )}
      {currentPage === 'explore' && (
        <ExplorePage 
          onNavigate={handleNavigate}
          user={user}
        />
      )}
      {currentPage === 'space-detail' && selectedSpaceId && (
        <SpaceDetailPage 
          spaceId={selectedSpaceId}
          onNavigate={handleNavigate}
          user={user}
        />
      )}
      {currentPage === 'create-space' && (
        <CreateSpacePage 
          onNavigate={handleNavigate}
          user={user}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage 
          onNavigate={handleNavigate}
          user={user}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
