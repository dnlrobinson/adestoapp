import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../App';
import { ArrowLeft, Trash2, Shield, Users, Loader2 } from 'lucide-react';

interface AdminToolsPageProps {
  spaceId: string;
  onNavigate: (page: string, spaceId?: string) => void;
  user: User | null;
}

interface Member {
  id: string;
  user_id: string;
  role?: string | null;
  email?: string | null;
}

export function AdminToolsPage({ spaceId, onNavigate, user }: AdminToolsPageProps) {
  const [spaceName, setSpaceName] = useState('Loading...');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const currentUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserIdRef.current = user?.id ?? null;
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Fetch space info
      const { data: space } = await supabase.from('spaces').select('*').eq('id', spaceId).single();
      if (space) {
        setSpaceName(space.name);
        setCreatorId(space.creator_id);
      }

      // Fetch members (assumes a space_members table)
      const { data: mems } = await supabase
        .from('space_members')
        .select('id, user_id, role, email')
        .eq('space_id', spaceId);

      if (mems) {
        setMembers(mems);
      }
      setLoading(false);
    }
    load();
  }, [spaceId]);

  const isCreator = creatorId && currentUserIdRef.current === creatorId;

  const handleRemove = async (memberId: string) => {
    if (!isCreator) return alert('Only the creator can manage members.');
    setBusyId(memberId);
    await supabase.from('space_members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setBusyId(null);
  };

  const handleDeleteSpace = async () => {
    if (!isCreator) return alert('Only the creator can delete this space.');
    if (members.length > 1) {
      return alert('Remove all other members first. You must be the last member to delete the space.');
    }
    const confirmed = window.confirm(`Delete "${spaceName}" permanently? This cannot be undone.`);
    if (!confirmed) return;
    await supabase.from('spaces').delete().eq('id', spaceId);
    onNavigate('explore');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 text-center">
          <Shield className="w-10 h-10 text-gray-400 mx-auto" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Tools</h2>
          <p className="text-sm text-gray-600">Only the space creator can access admin tools.</p>
          <button
            onClick={() => onNavigate('space-detail', spaceId)}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Back to space
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => onNavigate('space-detail', spaceId)} className="text-gray-600 flex items-center gap-1">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Admin Tools · {spaceName}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            <span className="text-sm text-gray-500">({members.length})</span>
          </div>

          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div className="flex flex-col">
                  <span className="text-gray-900 text-sm font-medium">{member.email || member.user_id}</span>
                  <span className="text-xs text-gray-500">{member.role || 'member'}</span>
                </div>
                {member.user_id !== creatorId ? (
                  <button
                    disabled={busyId === member.id}
                    onClick={() => handleRemove(member.id)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {busyId === member.id ? 'Removing...' : 'Remove'}
                  </button>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">Creator</span>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-6">No members found.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">Delete Space</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You must remove every other member first. When you are the last member, you can permanently delete this space.
          </p>
          <button
            disabled={!isCreator || members.length > 1}
            onClick={handleDeleteSpace}
            className="px-4 py-3 w-full text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {members.length > 1 ? 'Remove all other members to delete' : 'Delete space'}
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings, Trash2, Shield, Save, AlertTriangle } from 'lucide-react';
import { Page, User, Space } from '../App';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AdminToolsPageProps {
  spaceId: string;
  onNavigate: (page: Page, spaceId?: string) => void;
  user: User | null;
}

export function AdminToolsPage({ spaceId, onNavigate, user }: AdminToolsPageProps) {
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>('general');
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSpace() {
      const { data: spaceData, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', spaceId)
        .single();

      if (spaceData) {
        // Only allow creator to access
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id !== spaceData.creator_id) {
          alert('Unauthorized access');
          onNavigate('space-detail', spaceId);
          return;
        }

        const mappedSpace: Space = {
          id: spaceData.id,
          name: spaceData.name,
          description: spaceData.description || '',
          location: spaceData.location || '',
          category: spaceData.category || '',
          members: spaceData.members_count || 0,
          rating: spaceData.rating || 0,
          creator: spaceData.creator_id,
          isPrivate: spaceData.is_private,
          color: spaceData.color || ''
        };
        
        setSpace(mappedSpace);
        setSpaceName(mappedSpace.name);
        setSpaceDescription(mappedSpace.description);
        setIsPrivate(mappedSpace.isPrivate);
      }
      setLoading(false);
    }
    fetchSpace();
  }, [spaceId, onNavigate]);

  const handleSaveGeneral = async () => {
    if (!space) return;
    
    try {
      const { error } = await supabase
        .from('spaces')
        .update({
          name: spaceName,
          description: spaceDescription,
          is_private: isPrivate
        })
        .eq('id', spaceId);

      if (error) throw error;
      alert('Space updated successfully');
    } catch (error) {
      console.error('Error updating space:', error);
      alert('Failed to update space');
    }
  };

  const handleDeleteSpace = async () => {
    if (!confirm('Are you sure you want to delete this space? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', spaceId);

      if (error) throw error;
      onNavigate('explore');
    } catch (error) {
      console.error('Error deleting space:', error);
      alert('Failed to delete space');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!space) return <div className="min-h-screen flex items-center justify-center">Space not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => onNavigate('space-detail', spaceId)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Admin Tools</h1>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'general' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'members' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'danger' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Danger Zone
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Space Name</label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={spaceDescription}
                onChange={(e) => setSpaceDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPrivate ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                  {isPrivate ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Private Space</h3>
                  <p className="text-sm text-gray-500">Only approved members can join</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <button
              onClick={handleSaveGeneral}
              className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Member Management</h3>
            <p className="text-gray-500">Coming soon in the next update.</p>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Delete Space</h3>
                <p className="text-gray-500 text-sm">
                  Once you delete a space, there is no going back. Please be certain.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDeleteSpace}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete this Space
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

