import React from 'react';

interface WelcomePageProps {
  onSignUp: (provider: string) => void;
}

export function WelcomePage({ onSignUp }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Peach/Orange shape - bottom left flowing up */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-orange-200/40 via-orange-300/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200/50 via-orange-300/40 to-transparent rounded-full blur-3xl"></div>
        
        {/* Teal/Green shape - top right flowing down */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-bl from-teal-200/40 via-teal-300/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-teal-200/50 via-teal-300/40 to-transparent rounded-full blur-3xl"></div>
        
        {/* Additional peach shape - right side */}
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-gradient-to-l from-orange-200/40 via-orange-300/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Logo - Top Left */}
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
          <span className="text-gray-900 font-semibold text-lg">Adesto</span>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl w-full">
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4 leading-tight">
              Presence
              <br />
              made simple.
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              A quiet coordination layer for shared spaces.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => onSignUp('google')}
              className="px-8 py-4 bg-orange-400 hover:bg-orange-500 text-white font-medium rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Get Early Access
            </button>
          </div>
        </div>

        {/* Logo - Bottom Center */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-200/60 rounded-full blur-xl mb-2"></div>
          <span className="text-gray-900 font-semibold text-lg">Adesto</span>
        </div>
      </div>
    </div>
  );
}
