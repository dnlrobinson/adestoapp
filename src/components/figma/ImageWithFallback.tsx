import React from 'react';

export function ImageWithFallback({ src, alt, className }: any) {
  // Just render a normal image for now to prevent crashing
  return <img src={src} alt={alt} className={className} />;
}
