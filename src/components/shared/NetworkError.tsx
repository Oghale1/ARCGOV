'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Global component for handling blockchain or API connectivity issues
 */
export default function NetworkError({ message, onRetry }: NetworkErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="w-full p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-[32px] text-center space-y-4 animate-in fade-in duration-300">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-500">
        <AlertCircle size={24} />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest text-sm">
          Arc Testnet temporarily unavailable
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-600/80 max-w-sm mx-auto leading-relaxed">
          {message || 'Data will refresh automatically. Check testnet.arcscan.app for network status.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-6 py-2.5 bg-amber-600 text-white text-xs font-black rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {isRetrying ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            TRY AGAIN
          </button>
        )}
        <a 
          href="https://testnet.arcscan.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-2.5 bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-500 text-xs font-black rounded-xl border border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 min-h-[44px]"
        >
          <ExternalLink size={14} />
          NETWORK STATUS
        </a>
      </div>
    </div>
  );
}
