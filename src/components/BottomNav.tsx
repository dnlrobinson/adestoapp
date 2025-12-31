"use client"

import { Home, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const currentPage = pathname.startsWith('/profile') ? 'profile' : 'explore'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        <button
          onClick={() => router.push("/explore")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            currentPage === "explore"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Spaces</span>
        </button>
        <button
          onClick={() => router.push("/profile")}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
            currentPage === "profile"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  )
}
