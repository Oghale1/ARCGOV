'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
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
  Layout
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
  getAllProposals, 
  castVote, 
  hasVoted,
  ARC_GOV_CORE_ADDRESS,
  ARC_GOV_CORE_ABI
} from '@/lib/contract';
import { useToast } from '@/components/shared/Toast';
import { useTranslation } from '@/lib/i18n';

const YOUR_WALLET_ADDRESS = '0x196288da05b125e42Eb92bAB38F4ed7642dc8522'; // Placeholder

export default function AIP001Page() {
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const { t } = useTranslation();

  const fullProposalText = `Title: AIP-001: Launch the tARC Community Token

Summary:
This proposal seeks community approval to launch tARC — the ArcGov community reward token. tARC is a testnet ERC-20 token deployed on Arc Testnet (Chain ID 5042002) with no real monetary value. It exists solely to reward governance participation and build community engagement around ArcGov.

Motivation:
ArcGov needs a mechanism to reward its earliest and most active community members. Governance participation, validator applications, proposal submissions, and consistent voting deserve recognition. tARC provides that recognition in a transparent, on-chain way.

Specification:
Token Name: ArcGov Token
Symbol: tARC
Network: Arc Testnet — Chain ID 5042002
Total Supply: 100,000,000 tARC
Decimals: 18
Monetary Value: None — testnet only
Faucet: 100 tARC claimable free per wallet

Token Allocation:
50% — Community governance rewards
20% — Retroactive early user airdrop  
15% — Validator recognition incentives
10% — Builder / founder allocation
5%  — Hackathon and bounty prizes

Reward Rates (proposed):
Casting a governance vote: 10 tARC
Submitting a proposal: 50 tARC
Validator application submitted: 100 tARC
Early user retroactive drop: 500 tARC
Architect builder monthly: 1,000 tARC

Timeline:
If AIP-001 passes: tARC deployed within 7 days
If AIP-002 subsequently passes: tARC staking enabled within 14 days of AIP-002 vote close

This proposal does not commit to any financial value for tARC. It is a community coordination and recognition tool only.

Risks:
None significant — testnet token only.
Smart contract risk: contract will be open source and reviewable before deployment.

Vote YES to approve tARC launch.
Vote NO to reject this proposal.`;

  const fetchProposalData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllProposals();
      const found = (all as any[]).find(p => 
        p.title.toUpperCase().includes('AIP-001') || 
        p.title.toUpperCase().includes('TARC')
      );
      
      if (found) {
        setProposal(found);
        if (isConnected && address) {
          const voted = await hasVoted(Number(found.id), address);
          setUserVoteStatus(voted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

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

    const toastId = toast(t('proposal.casting_vote'), "loading");
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
      toast(t('proposal.vote_success'), "success");
      fetchProposalData();
    } catch (err: any) {
      dismiss(toastId);
      toast(err.message || t('proposal.vote_failed'), "error");
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
          proposalTitle: "AIP-001: Launch the tARC Community Token",
          proposalDescription: fullProposalText,
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

  const handleShare = () => {
    const text = `ArcGov's first governance proposal is live. AIP-001: Launch the tARC community token. Vote now at arcgov.vercel.app/governance/aip-001 #ArcGov #ArcGovernance`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const totalVotes = proposal ? Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes) : 0;
  const forPercent = totalVotes > 0 ? (Number(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (Number(proposal.againstVotes) / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (Number(proposal.abstainVotes) / totalVotes) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* SECTION 1 — HEADER */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">
          <Link href="/governance" className="hover:text-[#1D9E75] transition-colors">{t('nav.governance')}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-white">AIP-001</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
            AIP-001: Launch the tARC Community Token
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-2.5 py-1 rounded text-[10px] font-black tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-900/10 uppercase">
              ECOSYSTEM
            </span>
            <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-green-50 text-green-700 dark:bg-green-900/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Signal Vote Active
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <User size={14} /> {t('proposal.proposed_by')}
              <span className="font-mono font-bold text-[#1D9E75]">{YOUR_WALLET_ADDRESS.slice(0, 6)}...{YOUR_WALLET_ADDRESS.slice(-4)}</span>
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock size={14} /> Submitted May 8, 2026
            </span>
          </div>
        </header>

        {/* SECTION 2 — VOTE TALLY */}
        {!isLoading && !proposal ? (
           <div className="p-12 bg-gray-50 dark:bg-gray-900/30 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] text-center mb-12">
              <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
              <h3 className="text-xl font-bold mb-2">AIP-001 Not Found on Chain</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Signal voting opens when this proposal is submitted on-chain. Check back soon.
              </p>
           </div>
        ) : (
          <section className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 md:p-12 mb-12">
             {isLoading ? (
               <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-[#1D9E75]" />
               </div>
             ) : (
               <>
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
                
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-12">
                  <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
                  <div className="h-full bg-gray-400" style={{ width: `${abstainPercent}%` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {userVoteStatus ? (
                     <div className="md:col-span-3 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center space-y-2">
                        <CheckCircle2 className="mx-auto text-green-500" size={32} />
                        <p className="text-sm font-black text-green-500">{t('proposal.you_have_voted')}</p>
                     </div>
                   ) : (
                     <>
                      <button
                        onClick={() => handleVoteClick(0)}
                        className="py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all"
                      >
                        ✓ {t('proposal.vote_for')}
                      </button>
                      <button
                        onClick={() => handleVoteClick(1)}
                        className="py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all"
                      >
                        ✗ {t('proposal.vote_against')}
                      </button>
                      <button
                        onClick={() => handleVoteClick(2)}
                        className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                      >
                        — {t('proposal.abstain')}
                      </button>
                     </>
                   )}
                </div>
               </>
             )}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* SECTION 3 — FULL PROPOSAL TEXT */}
            <section className="bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[40px] p-10 md:p-12 shadow-sm">
               <div className="prose dark:prose-invert max-w-none space-y-10">
                  <div>
                    <h2 className="text-2xl font-black mb-4">Summary</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      This proposal seeks community approval to launch tARC — the ArcGov community reward token. tARC is a testnet ERC-20 token deployed on Arc Testnet (Chain ID 5042002) with no real monetary value. It exists solely to reward governance participation and build community engagement around ArcGov.
                    </p>
                  </div>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

                  <div>
                    <h2 className="text-2xl font-black mb-4">Motivation</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      ArcGov needs a mechanism to reward its earliest and most active community members. Governance participation, validator applications, proposal submissions, and consistent voting deserve recognition. tARC provides that recognition in a transparent, on-chain way.
                    </p>
                  </div>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

                  <div>
                    <h2 className="text-2xl font-black mb-6">Specification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                       {[
                         { label: 'Token Name', value: 'ArcGov Token' },
                         { label: 'Symbol', value: 'tARC' },
                         { label: 'Network', value: 'Arc Testnet — 5042002' },
                         { label: 'Total Supply', value: '100,000,000' },
                         { label: 'Decimals', value: '18' },
                         { label: 'Monetary Value', value: 'None — Testnet only' },
                       ].map((spec) => (
                         <div key={spec.label} className="flex justify-between border-b border-gray-50 dark:border-gray-900 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{spec.label}</span>
                            <span className="font-black">{spec.value}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

                  <div>
                    <h2 className="text-2xl font-black mb-6">Token Allocation</h2>
                    <div className="grid grid-cols-1 gap-2">
                       {[
                         { label: 'Community governance rewards', value: '50%' },
                         { label: 'Retroactive early user airdrop', value: '20%' },
                         { label: 'Validator recognition incentives', value: '15%' },
                         { label: 'Builder / founder allocation', value: '10%' },
                         { label: 'Hackathon and bounty prizes', value: '5%' },
                       ].map((item) => (
                         <div key={item.label} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                            <div className="w-12 text-xl font-black text-[#1D9E75]">{item.value}</div>
                            <span className="font-bold text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

                  <div>
                    <h2 className="text-2xl font-black mb-6">Reward Rates (Proposed)</h2>
                    <div className="space-y-4">
                       {[
                         { action: 'Casting a governance vote', rate: '10 tARC' },
                         { action: 'Submitting a proposal', rate: '50 tARC' },
                         { action: 'Validator application submitted', rate: '100 tARC' },
                         { action: 'Early user retroactive drop', rate: '500 tARC' },
                         { action: 'Architect builder monthly', rate: '1,000 tARC' },
                       ].map((r) => (
                         <div key={r.action} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">{r.action}</span>
                            <span className="font-black text-[#1D9E75] bg-[#1D9E75]/5 px-3 py-1 rounded-full">{r.rate}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </section>

            {/* SECTION 4 — AI SUMMARY */}
            <section className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">
                <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="w-full p-6 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center text-white shadow-lg shadow-[#1D9E75]/20">
                      <MessageSquare size={20} />
                    </div>
                    <div className="text-left">
                       <span className="block text-sm font-black uppercase tracking-widest">{t('proposal.ai_assistant')}</span>
                       <span className="block text-[10px] font-bold text-gray-400">{t('proposal.ai_powered')}</span>
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
            </section>
          </div>

          <aside className="space-y-8">
            {/* SECTION 5 — SHARE */}
            <section className="p-8 bg-[#0F1117] text-white rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#1DA1F2] rounded-full blur-[80px] -mr-16 -mt-16 opacity-20" />
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xl font-black">{t('proposal.share_proposal')}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {t('proposal.share_desc')}
                  </p>
                  <button
                    onClick={handleShare}
                    className="w-full py-4 bg-[#1DA1F2] text-white font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1DA1F2]/20"
                  >
                    <Share2 size={20} /> {t('proposal.share_on_x')}
                  </button>
               </div>
            </section>

            {/* SECTION 6 — WHAT HAPPENS NEXT */}
            <section className="p-8 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[40px] space-y-8">
               <h3 className="text-lg font-black flex items-center gap-2">
                  <Zap size={18} className="text-[#1D9E75]" /> Roadmap
               </h3>
               <div className="space-y-6">
                  {[
                    { step: 1, title: 'Community Vote', desc: 'Signal voting on AIP-001 is now open.', active: true },
                    { step: 2, title: 'tARC Deployment', desc: 'If passed, the token launches within 7 days.' },
                    { step: 3, title: 'Early User Drop', desc: 'Retroactive tokens sent to active testers.' },
                    { step: 4, title: 'AIP-002 Staking', desc: 'Governance vote for staking rewards.' },
                    { step: 5, title: 'Staking Live', desc: 'Earn yields on your tARC balance.' },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 relative">
                       {s.step !== 5 && <div className="absolute left-3 top-6 w-0.5 h-10 bg-gray-100 dark:bg-gray-800" />}
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 z-10 ${s.active ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                          {s.step}
                       </div>
                       <div className="space-y-1">
                          <p className={`text-xs font-black ${s.active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.title}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">{s.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </aside>
        </div>
      </main>

      {/* VOTE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F1117] w-full max-w-md p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-2xl scale-in-center">
            <h3 className="text-2xl font-black mb-4">{t('proposal.confirm_vote')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-sm">
              {t('proposal.confirm_text_1')} <span className={`font-black ${selectedVote === 0 ? 'text-[#1D9E75]' : selectedVote === 1 ? 'text-red-500' : 'text-gray-400'}`}>
                {selectedVote === 0 ? t('common.for') : selectedVote === 1 ? t('common.against') : t('common.abstain')}
              </span> {t('proposal.confirm_text_2')}AIP-001.
              <br /><br />
              {t('proposal.confirm_permanent')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 transition-all text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={executeVote}
                className="flex-1 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all text-sm"
              >
                {t('proposal.confirm_vote_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
