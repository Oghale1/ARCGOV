// ArcGov — arcgov.vercel.app
import React from 'react';
import SkeletonLoader from './SkeletonLoader';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  subtextColor?: string;
  isLoading?: boolean;
}

export default function StatCard({
  label,
  value,
  subtext,
  subtextColor = 'text-gray-500',
  isLoading = false
}: StatCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-[12px] p-4 bg-white dark:bg-[#0F1117] flex flex-col gap-1">
      <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      
      {isLoading ? (
        <div className="py-1">
          <SkeletonLoader width="60%" height="28px" />
        </div>
      ) : (
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      )}

      {(subtext || isLoading) && (
        <div className="h-4 flex items-center">
          {isLoading ? (
            <SkeletonLoader width="40%" height="12px" />
          ) : (
            <span className={`text-[12px] ${subtextColor}`}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
