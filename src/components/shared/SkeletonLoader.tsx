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
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`}
      style={{ width, height }}
    />
  );
}
