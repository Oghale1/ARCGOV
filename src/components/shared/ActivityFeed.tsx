'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { 
  Vote, 
  PlusCircle, 
  Clock, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Libs
import { ARCGovCoreABI } from '@/lib/contract';

const CONTRACT_ADDRESS = '0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99' as `0x${string}`;

interface ActivityEvent {
  type: 'ProposalCreated' | 'VoteCast';
  id: string;
  proposalId: number;
  title?: string;
  actor: string;
  voteType?: number; // 0: For, 1: Against, 2: Abstain
  timestamp: number;
  hash: string;
  blockNumber: bigint;
}

export default function ActivityFeed({ maxItems = 10 }: { maxItems?: number }) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchActivity = React.useCallback(async () => {
    if (!publicClient) {
      setIsConnected(false);
      return;
    }

    try {
      setIsConnected(true);
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(200) > BigInt(0) ? currentBlock - BigInt(200) : BigInt(0);

      // Fetch logs
      const [proposalLogs, voteLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: ARCGovCoreABI,
          eventName: 'ProposalCreated',
          fromBlock,
          toBlock: currentBlock
        }),
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: ARCGovCoreABI,
          eventName: 'VoteCast',
          fromBlock,
          toBlock: currentBlock
        })
      ]);

      // Merge and format
      const formattedProposals: ActivityEvent[] = proposalLogs.map((log: any, index: number) => ({
        type: 'ProposalCreated',
        id: `p-${log.transactionHash}-${index}`,
        proposalId: Number(log.args.proposalId),
        title: log.args.title,
        actor: log.args.proposer,
        timestamp: Date.now() - (Number(currentBlock - log.blockNumber) * 1000), 
        hash: log.transactionHash,
        blockNumber: log.blockNumber
      }));

      const formattedVotes: ActivityEvent[] = voteLogs.map((log: any, index: number) => ({
        type: 'VoteCast',
        id: `v-${log.transactionHash}-${index}`,
        proposalId: Number(log.args.proposalId),
        actor: log.args.voter,
        voteType: Number(log.args.voteType),
        timestamp: Date.now() - (Number(currentBlock - log.blockNumber) * 1000),
        hash: log.transactionHash,
        blockNumber: log.blockNumber
      }));

      const allEvents = [...formattedProposals, ...formattedVotes].sort((a, b) => {
        return Number(b.blockNumber - a.blockNumber);
      });

      setEvents(allEvents.slice(0, maxItems));
      setError(null);
    } catch (err) {
      console.error("Activity feed fetch error:", err);
      setIsConnected(false);
      setError("Activity feed temporarily offline");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, maxItems]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-xs font-black uppercase tracking-widest">Synchronizing activity...</span>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-amber-500 gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
        <AlertCircle size={18} />
        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] space-y-6">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto">
           <ClipboardList className="text-gray-300" size={32} />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-gray-500">No governance activity yet.</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">Be the first — submit a proposal to start the conversation.</p>
        </div>
        <Link href="/governance" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D9E75] text-white text-xs font-black uppercase rounded-xl hover:bg-[#0F6E56] transition-all">
          Submit First Proposal <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Feed</span>
      </div>
      
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="p-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
               <div className={`p-3 rounded-xl shrink-0 ${
                 event.type === 'ProposalCreated' 
                  ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-500' 
                  : 'bg-green-50 dark:bg-green-900/10 text-[#1D9E75]'
               }`}>
                  {event.type === 'ProposalCreated' ? <PlusCircle size={18} /> : <Vote size={18} />}
               </div>
               
               <div className="min-w-0">
                  <div className="text-sm font-bold truncate leading-snug">
                     {event.type === 'ProposalCreated' ? (
                       <>📋 New proposal submitted: <span className="text-[#1D9E75]">{event.title}</span></>
                     ) : (
                       <>✅ <span className="font-mono text-xs">{event.actor.slice(0, 6)}...{event.actor.slice(-4)}</span> voted <span className={`font-black ${
                         event.voteType === 0 ? 'text-green-500' : event.voteType === 1 ? 'text-red-500' : 'text-gray-400'
                       }`}>
                         {event.voteType === 0 ? 'FOR' : event.voteType === 1 ? 'AGAINST' : 'ABSTAIN'}
                       </span> on proposal <Link href={`/governance/${event.proposalId}`} className="hover:underline">#{event.proposalId}</Link></>
                     )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     <Clock size={10} /> {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                     {event.type === 'ProposalCreated' && (
                       <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>BY {event.actor.slice(0, 6)}...{event.actor.slice(-4)}</span>
                       </>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <Link href={`/governance/${event.proposalId}`}>
                  <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-400 group-hover:text-[#1D9E75] transition-all" aria-label="View Proposal">
                     <ChevronRight size={18} />
                  </button>
               </Link>
               <a 
                href={`https://testnet.arcscan.app/tx/${event.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-300 hover:text-blue-500 transition-all"
                aria-label="View on Explorer"
               >
                  <ExternalLink size={14} />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
