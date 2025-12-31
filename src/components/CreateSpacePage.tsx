import React, { useState } from 'react';
import { ArrowLeft, Globe, Lock, MapPin, Tag, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Page, User } from '../App';
import { supabase } from '../lib/supabase'; // Import the client

interface CreateSpacePageProps {
  onNavigate: (page: Page) => void;
  user: User | null;
}

export function CreateSpacePage({ onNavigate, user }: CreateSpacePageProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Community');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // New state for loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !location) return;

    setIsSubmitting(true);

    try {
      // Get the current user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert('You must be logged in to create a space');
        setIsSubmitting(false);
        return;
      }

      // 1. Send data to Supabase
      const { error } = await supabase
        .from('spaces')
        .insert({
          name,
          description,
          location,
          category,
          is_private: isPrivate,
          creator_id: user.id, // Explicitly set the creator ID
        });

      if (error) throw error;

      // 2. If successful, go back to Explore to see the new space!
      onNavigate('explore');
      
    } catch (error: any) {
      alert('Error creating space: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = name.trim() && description.trim() && location.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2 text-gray-900">Create a New Space!</h1>
          <p className="text-gray-600">
            Create a shared space for your community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm mb-2 text-gray-700">
              Space Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Shared Laundry Room"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space for? How should people use it?"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Building A Basement"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm mb-2 text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="Community">Community</option>
              <option value="Health & Fitness">Health & Fitness</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-3 text-gray-700">
              Privacy
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`w-full flex items-start gap-4 p-4 border-2 rounded-xl transition-all ${
                  !isPrivate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  !isPrivate ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {!isPrivate && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-5 h-5 text-gray-700" />
                    <span className="text-gray-900">Public</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Anyone can discover and join this space
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`w-full flex items-start gap-4 p-4 border-2 rounded-xl transition-all ${
                  isPrivate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  isPrivate ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {isPrivate && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-gray-700" />
                    <span className="text-gray-900">Private</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Only people you invite can see and join this space
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}