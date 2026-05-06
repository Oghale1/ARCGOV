// ArcGov — arcgov.vercel.app
'use client';

import React, { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';

export default function TestnetBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('arcgov-testnet-banner-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('arcgov-testnet-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 z-[60] relative">
      <div className="flex items-center gap-2 text-[13px] font-medium mx-auto">
        <Zap className="w-4 h-4 fill-white" />
        <span>
          Arc Testnet — All staking figures show 0 USDC. Get free testnet USDC at{' '}
          <a 
            href="https://faucet.circle.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            faucet.circle.com
          </a>
        </span>
      </div>
      <button 
        onClick={dismiss}
        className="p-1 hover:bg-black/10 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
