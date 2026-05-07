// ArcGov — arcgov.vercel.app
'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { arcTestnet } from '@/app/providers';

export default function WrongNetworkBanner() {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === arcTestnet.id) {
    return null;
  }

  const handleSwitch = () => {
    switchChain({ chainId: arcTestnet.id });
  };

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 text-sm font-bold">
        <AlertTriangle size={18} className="shrink-0" />
        <span>
          Wrong Network — ArcGov runs on Arc Testnet.
        </span>
      </div>
      
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <RefreshCw size={14} />
        )}
        {isPending ? 'Switching...' : 'Switch to Arc Testnet'}
      </button>
    </div>
  );
}
