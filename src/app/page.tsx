"use client"

import { Mail, Facebook, Instagram } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function WelcomePage() {
  const { signUp, loading, user } = useAuth()

  // If loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h1 className="text-4xl mb-4 text-gray-900">Welcome to Adesto</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Presence made simple. Plan your time around your community and connect with the places you care about.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-4">
          <button
            onClick={() => signUp('google')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700">Continue with Google</span>
          </button>

          <button
            onClick={() => signUp('facebook')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1877F2] rounded-xl hover:bg-[#166FE5] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Facebook className="w-5 h-5 text-white" fill="white" />
            <span className="text-white">Continue with Facebook</span>
          </button>

          <button
            onClick={() => signUp('instagram')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Instagram className="w-5 h-5 text-white" />
            <span className="text-white">Continue with Instagram</span>
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => signUp('email')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Mail className="w-5 h-5 text-white" />
            <span className="text-white">Continue with Email</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

