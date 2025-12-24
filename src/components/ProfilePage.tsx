import { MapPin, Edit, Mail, Calendar, Users } from 'lucide-react';
import { Page, User } from '../App';
import { BottomNav } from './BottomNav';
import React,{ useState } from 'react';

interface ProfilePageProps {
  onNavigate: (page: Page, spaceId?: string) => void;
  user: User | null;
  onSignOut?: () => void;
}

const MOCK_USER_SPACES = [
  {
    id: '1',
    name: 'Shared Laundry Room',
    location: 'Building A Basement',
    members: 12,
    color: 'from-blue-400 to-blue-600',
    role: 'Creator'
  },
  {
    id: '3',
    name: 'Gym & Fitness',
    location: 'Building B Floor 1',
    members: 45,
    color: 'from-orange-400 to-red-500',
    role: 'Member'
  },
  {
    id: '2',
    name: 'Rooftop Garden',
    location: 'Building A Rooftop',
    members: 24,
    color: 'from-green-400 to-green-600',
    role: 'Member'
  }
];

export function ProfilePage({ onNavigate, user, onSignOut }: ProfilePageProps) {
  const displayUser = user || {
    fullName: 'Alex Johnson',
    location: 'Building A, Floor 3',
    bio: 'Community enthusiast and coordinator. Love organizing shared spaces and bringing neighbors together. Always happy to help!',
    email: 'alex.johnson@example.com'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-32"></div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="relative -mt-16 mb-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl flex-shrink-0 shadow-lg">
                {displayUser.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl text-gray-900 truncate">{displayUser.fullName}</h1>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{displayUser.location}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <Users className="w-4 h-4" />
                    <span>{MOCK_USER_SPACES.length} Spaces</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Joined Nov 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-500 mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{displayUser.bio}</p>
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
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-gray-900">My Spaces</h2>
            <button
              onClick={() => onNavigate('create-space')}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm"
            >
              Create New
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_USER_SPACES.map(space => (
              <div
                key={space.id}
                onClick={() => onNavigate('space-detail', space.id)}
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
              onClick={onSignOut}
              className="w-full text-left px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <BottomNav currentPage="profile" onNavigate={onNavigate} />
    </div>
  );
}
