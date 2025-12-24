import React,{ useState } from 'react';
import { Home, User } from "lucide-react";
import { Page } from "../App";

interface BottomNavProps {
  currentPage: "explore" | "profile";
  onNavigate: (page: Page) => void;
}

export function BottomNav({
  currentPage,
  onNavigate,
}: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        <button
          onClick={() => onNavigate("explore")}
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
          onClick={() => onNavigate("profile")}
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
  );
}