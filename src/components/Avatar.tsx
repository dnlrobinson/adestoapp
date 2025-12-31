import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-3xl'
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = sizeClasses[size];
  const gradientColors = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-teal-400 to-cyan-500',
  ];
  
  // Generate consistent color based on name
  const colorIndex = name.charCodeAt(0) % gradientColors.length;
  const gradient = gradientColors[colorIndex];

  return (
    <div className={`${sizeClass} ${className} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br ${gradient} text-white font-medium shadow-lg`}>
      {src ? (
        <img 
          src={src} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.textContent = initials;
              parent.appendChild(span);
            }
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

