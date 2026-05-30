'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React from 'react';
import { ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VerifiedBadgeProps {
  explorerUrl: string;
  blockNumber?: string | number | null;
  lastFetchedAt?: Date | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function VerifiedBadge({ 
  explorerUrl, 
  blockNumber, 
  lastFetchedAt, 
  onRefresh, 
  isLoading 
}: VerifiedBadgeProps) {
  if (!lastFetchedAt && isLoading) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 min-h-[44px]">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-full" />
          <div className="w-24 h-2.5 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!lastFetchedAt) return <div className="min-h-[44px]" />;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 min-h-[44px]">
      <a 
        href={explorerUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] font-black text-[#1D9E75] uppercase tracking-widest hover:underline group"
      >
        <CheckCircle2 size={12} className="shrink-0" />
        Verified on-chain
        <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </a>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
           <span className="shrink-0">Block {blockNumber ? `#${blockNumber}` : '—'}</span>
           <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
           <span className="whitespace-nowrap">Updated {formatDistanceToNow(lastFetchedAt, { addSuffix: true })}</span>
        </div>

        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg text-gray-400 transition-all active:scale-90"
            title="Refresh data"
          >
            <RefreshCw size={10} className={isLoading ? 'animate-spin text-[#1D9E75]' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
