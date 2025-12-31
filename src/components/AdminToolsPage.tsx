import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Page } from '../App';
import { ArrowLeft, Trash2, Shield, Users, Loader2 } from 'lucide-react';

interface AdminToolsPageProps {
  spaceId: string;
  onNavigate: (page: Page, spaceId?: string) => void;
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
      // 1) Space info
      const { data: space } = await supabase.from('spaces').select('*').eq('id', spaceId).single();
      if (space) {
        setSpaceName(space.name);
        setCreatorId(space.creator_id);
      }

      // 2) Members (requires space_members table)
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

