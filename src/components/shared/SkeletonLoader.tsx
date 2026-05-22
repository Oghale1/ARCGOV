// ArcGov — arcgov.vercel.app
import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function SkeletonLoader({ 
  width = '100%', 
  height = '20px', 
  className = '' 
}: SkeletonLoaderProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
