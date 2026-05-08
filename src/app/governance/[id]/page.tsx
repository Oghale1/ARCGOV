'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  User, 
  Share2, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { 
  useAccount, 
  useWalletClient, 
  usePublicClient, 
  useChainId,
  useSwitchChain
} from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Libs
import { 
  getProposal, 
  castVote, 
  hasVoted, 
  getAllProposals,
  ARC_GOV_CORE_ADDRESS,
  ARC_GOV_CORE_ABI
} from '@/lib/contract';
import { getNetworkStats } from '@/lib/arc-rpc';
import { useToast } from '@/components/shared/Toast';

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function ProposalDetail() {
  const { id } = useParams();
  const proposalId = Number(id);
  const router = useRouter();
  
  const [proposal, setProposal] = useState<any>(null);
  const [relatedProposals, setRelatedProposals] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userVoteStatus, setUserVoteStatus] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast, dismiss } = useToast();

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [p, stats, all] = await Promise.all([
        getProposal(proposalId),
        getNetworkStats(),
        getAllProposals()
      ]);

      if (!p || p.title === "") {
        setProposal(null);
      } else {
        setProposal(p);
      }

      setNetworkStats(stats);
      
      // Related proposals (excluding current)
      if (all) {
        const related = all
          .filter((item: any) => Number(item.id) !== proposalId)
          .slice(0, 3);
        setRelatedProposals(related);
      }

      // Check if user has voted
      if (isConnected && address) {
        const voted = await hasVoted(proposalId, address);
        setUserVoteStatus(voted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [proposalId, isConnected, address]);

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

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      toast("AI summarization failed", "error");
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleVoteClick = (choice: number) => {
    if (!isConnected) {
      // RainbowKit modal is usually triggered by a ConnectButton, 
      // but here we can just alert or rely on the button state UI
      return;
    }
    if (chainId !== 5042002) {
      switchChain({ chainId: 5042002 });
      return;
    }
    setSelectedVote(choice);
    setShowConfirmModal(true);
  };

  const executeVote = async () => {
    if (selectedVote === null || !walletClient || !publicClient) return;

    const toastId = toast("Casting your vote on Arc Testnet...", "loading");
    setIsVoting(true);
    setShowConfirmModal(false);

    try {
      await castVote(
        proposalId,
        selectedVote,
        walletClient,
        publicClient as any
      );
      
      dismiss(toastId);
      toast("Vote cast successfully!", "success");
      fetchData(true);
    } catch (err: any) {
      dismiss(toastId);
      toast(err.message || "Failed to cast vote", "error");
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = () => {
    const choiceText = ["FOR", "AGAINST", "ABSTAIN"][selectedVote || 0];
    const text = `I just voted on Arc governance proposal #${proposal.id.toString()}: ${proposal.title} on @ARCGOV1 → arcgov.vercel.app/governance/${proposal.id.toString()} #ArcGovernance`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F1117]">
        <Navbar />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-20 w-full space-y-8">
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-12 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          </div>
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F1117]">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <AlertCircle size={64} className="text-gray-200 mb-6" />
          <h2 className="text-2xl font-black mb-2">Proposal Not Found</h2>
          <p className="text-gray-500 mb-8">The proposal you are looking for does not exist on Arc Testnet.</p>
          <Link href="/governance" className="btn-primary px-8 py-3 rounded-xl font-bold">
            Back to Governance
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const totalVotes = Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);
  const forPercent = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* SECTION 1 — BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">
          <Link href="/governance" className="hover:text-[#1D9E75] transition-colors">Governance</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-white">Proposal #{proposal.id.toString()}</span>
        </nav>

        {/* SECTION 2 — HEADER */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-6 leading-tight">{proposal.title}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wider ${CATEGORY_COLORS[proposal.category] || CATEGORY_COLORS[3]}`}>
              {CATEGORY_LABELS[proposal.category] || 'ECOSYSTEM'}
            </span>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
              proposal.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${proposal.isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {proposal.isOpen ? 'Active' : 'Voting Closed'}
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <User size={14} /> Proposed by 
              <a 
                href={`https://testnet.arcscan.app/address/${proposal.proposer}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono font-bold text-[#1D9E75] hover:underline"
              >
                {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
              </a>
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock size={14} /> Submitted {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* SECTION 3 — VOTE TALLY */}
        <section className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 md:p-12 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-center">
            <div className="space-y-1">
              <p className="text-4xl font-black text-[#1D9E75]">{proposal.forVotes.toString()}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FOR · {forPercent.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black text-red-500">{proposal.againstVotes.toString()}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AGAINST · {againstPercent.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black text-gray-400">{proposal.abstainVotes.toString()}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ABSTAIN · {abstainPercent.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-6">
            <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
            <div className="h-full bg-gray-400" style={{ width: `${abstainPercent}%` }} />
          </div>
          
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            {totalVotes} total votes cast
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-12">
            {/* SECTION 5 — PROPOSAL DESCRIPTION */}
            <section className="space-y-6">
              <div className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] relative">
                <div className="flex items-center gap-2 mb-6 text-[#1D9E75]">
                  <FileText size={20} />
                  <h2 className="text-xl font-black">Description</h2>
                </div>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {proposal.description}
                </div>
              </div>

              {/* AI Summary */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">
                <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="w-full p-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1D9E75] flex items-center justify-center text-white">
                      <MessageSquare size={16} />
                    </div>
                    <span className="text-sm font-bold">AI Summary</span>
                  </div>
                  {isSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {isSummaryExpanded && (
                  <div className="p-6 bg-white dark:bg-[#0F1117] border-t border-gray-100 dark:border-gray-800">
                    {isSummarizing ? (
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <Loader2 className="animate-spin text-[#1D9E75]" size={18} />
                        Summarising proposal...
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                        {summary}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 8 — RELATED PROPOSALS */}
            {relatedProposals.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-xl font-black">Related Proposals</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedProposals.map((rp) => (
                    <Link key={rp.id.toString()} href={`/governance/${rp.id}`}>
                      <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group">
                         <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mb-2 inline-block ${CATEGORY_COLORS[rp.category] || CATEGORY_COLORS[3]}`}>
                            {CATEGORY_LABELS[rp.category] || 'ECOSYSTEM'}
                         </span>
                         <h4 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-[#1D9E75] transition-colors">{rp.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            {/* SECTION 4 — VOTE BUTTONS */}
            <section className="p-8 bg-[#0F1117] text-white rounded-[32px] space-y-6 shadow-2xl">
              <h3 className="text-xl font-black">Cast Your Vote</h3>
              
              {!isConnected ? (
                <div className="space-y-4">
                   <p className="text-sm text-gray-400 italic">Connect your wallet to participate in Arc governance.</p>
                   <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button 
                        onClick={openConnectModal}
                        className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all"
                      >
                        CONNECT TO VOTE
                      </button>
                    )}
                  </ConnectButton.Custom>
                </div>
              ) : chainId !== 5042002 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 italic">Switch to Arc Testnet to cast your vote on-chain.</p>
                  <button 
                    onClick={() => switchChain({ chainId: 5042002 })}
                    className="w-full py-4 border-2 border-[#1D9E75] text-[#1D9E75] font-black rounded-2xl hover:bg-[#1D9E75]/10 transition-all"
                  >
                    SWITCH TO ARC TESTNET
                  </button>
                </div>
              ) : userVoteStatus ? (
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center space-y-3">
                   <CheckCircle2 className="mx-auto text-green-500" size={32} />
                   <p className="text-sm font-bold text-green-500">YOU HAVE VOTED</p>
                   <p className="text-xs text-gray-400">Your participation secures the network. Multiple votes per proposal are not allowed.</p>
                </div>
              ) : !proposal.isOpen ? (
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl text-center">
                   <AlertCircle className="mx-auto text-gray-500 mb-2" size={32} />
                   <p className="text-sm font-bold text-gray-500">VOTING CLOSED</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleVoteClick(0)}
                    disabled={isVoting}
                    className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> ✓ Vote FOR
                  </button>
                  <button 
                    onClick={() => handleVoteClick(1)}
                    disabled={isVoting}
                    className="w-full py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} /> ✗ Vote AGAINST
                  </button>
                  <button 
                    onClick={() => handleVoteClick(2)}
                    disabled={isVoting}
                    className="w-full py-4 bg-gray-700 text-white font-black rounded-2xl hover:bg-gray-600 transition-all"
                  >
                    — ABSTAIN
                  </button>
                </div>
              )}

              {/* SECTION 6 — SHARE */}
              <div className="pt-6 border-t border-gray-800">
                <button 
                  onClick={handleShare}
                  className="w-full py-4 bg-[#1DA1F2] text-white font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} /> SHARE ON X
                </button>
              </div>
            </section>

            {/* SECTION 7 — VERIFIED BADGE */}
            <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[24px]">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Data Verified On-Chain
                  </div>
                  <button 
                    onClick={() => fetchData(true)}
                    disabled={isRefreshing}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-all"
                  >
                    <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
               </div>
               <div className="space-y-2 text-[10px] font-mono text-gray-500">
                  <p>Block #{networkStats?.blockNumber || '...'}</p>
                  <p className="break-all">
                    Contract: <a href={`https://testnet.arcscan.app/address/${ARC_GOV_CORE_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#1D9E75] underline">{ARC_GOV_CORE_ADDRESS}</a>
                  </p>
               </div>
            </div>
          </aside>
        </div>
      </main>

      {/* VOTE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F1117] w-full max-w-md p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-2xl scale-in-center">
            <h3 className="text-2xl font-black mb-4">Confirm Your Vote</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              You are voting <span className={`font-black ${selectedVote === 0 ? 'text-[#1D9E75]' : selectedVote === 1 ? 'text-red-500' : 'text-gray-400'}`}>
                {selectedVote === 0 ? 'FOR' : selectedVote === 1 ? 'AGAINST' : 'ABSTAIN'}
              </span> on Proposal #{proposalId}. 
              <br /><br />
              This uses testnet USDC for gas fees and <span className="text-gray-900 dark:text-white font-bold">cannot be undone.</span>
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                CANCEL
              </button>
              <button 
                onClick={executeVote}
                className="flex-1 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
