'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Share2,
  ExternalLink,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Info,
  Zap,
  Plus
} from 'lucide-react';
import { 
  useAccount, 
  useWalletClient, 
  usePublicClient, 
  useChainId,
  useSwitchChain
} from 'wagmi';
import Link from 'next/link';

// Libs
import { 
  getAllProposals, 
  castVote, 
  hasVoted,
  getProposalCount
} from '@/lib/contract';
import { getBlockNumberFormatted } from '@/lib/arc-rpc';
import { useToast } from '@/components/shared/Toast';
import supabase from '@/lib/supabase';

// Components
import ProposalDiff from '@/components/governance/ProposalDiff';
import NetworkError from '@/components/shared/NetworkError';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import TestnetChip from '@/components/shared/TestnetChip';
import CountdownTimer from '@/components/shared/CountdownTimer';

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function ProposalClient() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<any>(null);
  const [customDeadline, setCustomDeadline] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userVoteStatus, setUserVoteStatus] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  
  // AI Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast, dismiss } = useToast();

  const fetchProposalData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [all, block, meta] = await Promise.all([
        getAllProposals(),
        getBlockNumberFormatted(),
        supabase.from('proposal_metadata').select('*').eq('proposal_id', id).single()
      ]);
      const found = (all as any[]).find(p => p.id.toString() === id);
      
      if (found) {
        setProposal(found);
        setBlockNumber(block);
        setLastFetchedAt(new Date());
        
        if (meta.data) {
          setCustomDeadline(new Date(meta.data.custom_deadline));
        } else {
          setCustomDeadline(new Date(Number(found.votingDeadline) * 1000));
        }

        if (isConnected && address) {
          const voted = await hasVoted(Number(found.id), address);
          setUserVoteStatus(voted);
        }
      } else {
        setError("Proposal not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch proposal details");
    } finally {
      setIsLoading(false);
    }
  }, [id, isConnected, address]);

  useEffect(() => {
    fetchProposalData();
  }, [fetchProposalData]);

  const handleVoteClick = (choice: number) => {
    if (!isConnected) return;
    if (chainId !== 5042002) {
      switchChain({ chainId: 5042002 });
      return;
    }
    setSelectedVote(choice);
    setShowConfirmModal(true);
  };

  const executeVote = async () => {
    if (selectedVote === null || !walletClient || !publicClient || !proposal) return;

    const toastId = toast("Casting your vote on Arc Testnet...", "loading");
    setIsVoting(true);
    setShowConfirmModal(false);

    try {
      await castVote(
        Number(proposal.id),
        selectedVote,
        walletClient,
        publicClient as any
      );
      
      dismiss(toastId);
      toast("Vote cast successfully!", "success");
      fetchProposalData();
    } catch (err: any) {
      dismiss(toastId);
      toast(err.message || "Failed to cast vote", "error");
    } finally {
      setIsVoting(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setIsSummaryExpanded(true);
    try {
      const response = await fetch('/api/summarise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalTitle: proposal.title,
          proposalDescription: proposal.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      toast("AI summarization failed", "error");
    } finally {
      setIsSummarizing(false);
    }
  };

  const totalVotes = proposal ? Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes) : 0;
  const forPercent = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0;

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117]">
        <main className="flex-grow flex items-center justify-center p-4">
           <NetworkError message={error} onRetry={fetchProposalData} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link href="/governance" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1D9E75] transition-all mb-10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Governance
        </Link>

        {isLoading ? (
          <div className="space-y-12">
             <SkeletonLoader height="60px" width="70%" className="rounded-2xl" />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                   <SkeletonLoader height="300px" className="rounded-[40px]" />
                </div>
                <div className="space-y-8">
                   <SkeletonLoader height="200px" className="rounded-[40px]" />
                </div>
             </div>
          </div>
        ) : proposal && (
          <>
            <header className="mb-12 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                {proposal.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wider ${CATEGORY_COLORS[proposal.category] || CATEGORY_COLORS[3]} uppercase`}>
                  {CATEGORY_LABELS[proposal.category] || 'ECOSYSTEM'}
                </span>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${proposal.isOpen ? 'bg-green-50 text-green-700 dark:bg-green-900/10' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/10'}`}>
                  {proposal.isOpen && customDeadline ? (
                    <CountdownTimer deadline={customDeadline} />
                  ) : (
                    <>
                      <span className={`w-1.5 h-1.5 rounded-full ${proposal.isOpen ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                      {proposal.isOpen ? 'Voting Active' : 'Voting Closed'}
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <User size={14} /> Proposed by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} /> {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                {/* PROPOSAL BODY */}
                <div className="bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[40px] p-8 md:p-12 shadow-sm">
                   <h2 className="text-2xl font-black mb-8">Description</h2>
                   <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {proposal.description}
                   </div>
                </div>

                {/* Parameter Change Detection */}
                <ProposalDiff title={proposal.title} description={proposal.description} />

                {/* AI Summary Section */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">
                    <button 
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="w-full p-6 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center text-white shadow-lg shadow-[#1D9E75]/20">
                          <MessageSquare size={20} />
                        </div>
                        <div className="text-left">
                           <span className="block text-sm font-black uppercase tracking-widest">AI Summary</span>
                           <span className="block text-[10px] font-bold text-gray-400">Powered by Gemini 1.5 Flash</span>
                        </div>
                      </div>
                      {isSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {isSummaryExpanded && (
                      <div className="p-8 bg-white dark:bg-[#0F1117] border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300">
                        {isSummarizing ? (
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <Loader2 className="animate-spin text-[#1D9E75]" size={18} />
                            Generating proposal insight...
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                            {summary}
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>

              <aside className="space-y-8">
                {/* VOTE TALLY CARD */}
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[40px] p-8 space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-400">Vote Tally</h3>
                    <p className="text-xs font-bold text-gray-500">
                      {totalVotes === 0 ? <>0 <TestnetChip /></> : totalVotes.toString()} Total Votes Cast
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm font-black">
                          <span className="text-[#1D9E75]">FOR</span>
                          <span>{forPercent.toFixed(1)}%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm font-black">
                          <span className="text-red-500">AGAINST</span>
                          <span>{againstPercent.toFixed(1)}%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
                       </div>
                    </div>
                  </div>

                  {proposal.isOpen && (
                    <div className="pt-4 space-y-4">
                      {userVoteStatus ? (
                         <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600">
                            <CheckCircle2 size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">You have voted</span>
                         </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-3">
                            <button 
                              onClick={() => handleVoteClick(0)}
                              className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all h-14"
                            >
                              ✓ Vote FOR
                            </button>
                            <button 
                              onClick={() => handleVoteClick(1)}
                              className="w-full py-4 border-2 border-red-100 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all h-14"
                            >
                              ✗ Vote AGAINST
                            </button>
                            <button 
                              onClick={() => handleVoteClick(2)}
                              className="w-full py-4 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all h-14"
                            >
                              ABSTAIN
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400 text-center font-bold italic">
                            Transaction will be submitted to Arc Testnet
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-8 bg-[#0F1117] text-white rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9E75] rounded-full blur-[80px] -mr-16 -mt-16 opacity-20" />
                   <div className="relative z-10 space-y-4">
                      <Zap className="text-[#1D9E75]" size={32} />
                      <h3 className="text-xl font-black">Share Proposal</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                         Help shape the network by inviting other community members to vote on this proposal.
                      </p>
                      <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 h-14">
                         <Share2 size={18} /> SHARE ON X
                      </button>
                   </div>
                </div>
              </aside>
            </div>

            {/* SECTION 7 — ON-CHAIN VERIFICATION */}
            <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-900/50">
               <VerifiedBadge 
                 explorerUrl={`https://testnet.arcscan.app/address/${proposal.proposer}`}
                 blockNumber={blockNumber} 
                 lastFetchedAt={lastFetchedAt}
                 onRefresh={fetchProposalData}
                 isLoading={isLoading}
               />
            </div>
          </>
        )}
      </main>

      {/* VOTE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F1117] w-full max-w-md p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-2xl scale-in-center">
            <h3 className="text-2xl font-black mb-4">Confirm Your Vote</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-sm">
              You are casting a <span className={`font-black ${selectedVote === 0 ? 'text-[#1D9E75]' : selectedVote === 1 ? 'text-red-500' : 'text-gray-400'}`}>
                {selectedVote === 0 ? 'FOR' : selectedVote === 1 ? 'AGAINST' : 'ABSTAIN'}
              </span> vote for Proposal #{id}. 
              <br /><br />
              This action is permanent and will be recorded on the Arc Testnet.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 transition-all text-sm h-14"
              >
                CANCEL
              </button>
              <button 
                onClick={executeVote}
                className="flex-1 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all text-sm h-14"
              >
                CONFIRM VOTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
