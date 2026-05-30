'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { ARCGovCoreABI } from '@/lib/contract';

const CONTRACT_ADDRESS = '0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99' as `0x${string}`;

export default function GovernanceWidget() {
  const publicClient = usePublicClient();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWidgetData = React.useCallback(async () => {
    if (!publicClient) return;
    try {
      // 1. Get Open Proposals count
      const count = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ARCGovCoreABI,
        functionName: 'getProposalCount',
      });

      // 2. Get latest VoteCast event
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(500) > BigInt(0) ? currentBlock - BigInt(500) : BigInt(0);
      
      const logs = await publicClient.getContractEvents({
        address: CONTRACT_ADDRESS,
        abi: ARCGovCoreABI,
        eventName: 'VoteCast',
        fromBlock,
        toBlock: currentBlock
      });

      const latestVote = logs.length > 0 ? (logs as any[]).sort((a: any, b: any) => Number(b.blockNumber - a.blockNumber))[0] : null;

      setData({
        count: Number(count),
        latestVote: latestVote ? {
          voter: latestVote.args.voter,
          proposalId: Number(latestVote.args.proposalId),
          voteType: Number(latestVote.args.voteType)
        } : null
      });
    } catch (err) {
      console.warn("Widget fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchWidgetData();
    const interval = setInterval(fetchWidgetData, 30000);
    return () => clearInterval(interval);
  }, [fetchWidgetData]);

  if (isLoading) {
    return (
      <div className="w-[320px] h-[110px] bg-white border border-gray-100 rounded-[10px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1D9E75]" size={16} />
      </div>
    );
  }

  if (!data && !isLoading) {
    return (
      <div className="w-[320px] h-[110px] bg-amber-50 border border-amber-100 rounded-[10px] p-4 flex items-center gap-3">
        <AlertCircle className="text-amber-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-amber-700">Governance data temporarily unavailable. <br/>Check arcscan.app</p>
      </div>
    );
  }

  return (
    <div className="w-[320px] h-[110px] bg-white border border-gray-200 rounded-[10px] p-4 flex flex-col justify-between overflow-hidden shadow-sm text-[12px] leading-tight select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
           <span className="font-black uppercase tracking-widest text-[#0F1117]">ArcGov</span>
        </div>
        <span className="font-bold text-gray-400">Governance Widget</span>
      </div>

      <div className="space-y-1">
         <p className="font-black text-gray-600">
           Open Proposals: <span className="text-[#1D9E75]">{data?.count || 0}</span>
         </p>
         <p className="text-gray-500 font-medium truncate">
           {data?.latestVote ? (
             <>
               Latest: <span className="font-mono text-[10px]">{data.latestVote.voter.slice(0, 6)}...</span> voted 
               <span className={`mx-1 font-black ${data.latestVote.voteType === 0 ? 'text-green-500' : 'text-red-500'}`}>
                 {data.latestVote.voteType === 0 ? 'FOR' : 'AGAINST'}
               </span> 
               on #{data.latestVote.proposalId}
             </>
           ) : (
             "No recent votes detected"
           )}
         </p>
      </div>

      <div className="flex justify-end">
         <a 
          href="https://arcgov.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="font-black text-[#1D9E75] hover:underline flex items-center gap-1"
         >
           View on ArcGov <ExternalLink size={10} />
         </a>
      </div>
    </div>
  );
}
