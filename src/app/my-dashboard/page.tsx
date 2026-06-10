'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useAccount, 
  useChainId, 
  useSwitchChain, 
  usePublicClient 
} from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  LayoutDashboard, 
  Vote, 
  FileText, 
  UserCheck, 
  Settings, 
  Lock, 
  ExternalLink, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Coins,
  CheckCircle2,
  Bell,
  Wallet,
  Clock,
  User,
  Plus,
  Trophy,
  ArrowUpRight,
  Mail
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic Recharts
const RadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const RadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

// Libs
import {
  getAllProposals,
  hasVoted,
  ARCGovCoreABI,
  ARC_GOV_CORE_ADDRESS
} from '@/lib/contract';
import { getUSDCBalance } from '@/lib/arc-rpc';
import { isVotingActive, getProposalStatus } from '@/lib/proposal-status';
import { useTranslation } from '@/lib/i18n';
import supabase from '@/lib/supabase';
import { submitForm } from '@/lib/submit';
import { useToast } from '@/components/shared/Toast';

// Components
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import TestnetChip from '@/components/shared/TestnetChip';

// Constants
// Use the SHARED, env-backed contract address (data/deployment.json →
// 0x6C1c…7fA7Ba). The old 0x6cFe85… address was a dead deployment, so votes
// cast against the live contract were never found here — that's why the
// Participation Score, Proposals Voted, and My Votes history all read empty.
const CONTRACT_ADDRESS = ARC_GOV_CORE_ADDRESS;
const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function MyDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // --- DATA STATE ---
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalMeta, setProposalMeta] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<any[]>([]);
  const [myDelegations, setMyDelegations] = useState<any[]>([]);
  const [blockNumber, setBlockNumber] = useState<string>('0');
  const [settings, setSettings] = useState({
    email: '',
    new_proposals: true,
    vote_deadlines: true,
    validator_updates: false,
    quantum_news: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // --- FETCH DATA ---
  const fetchDashboardData = React.useCallback(async () => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [balance, allProposals, delegations, savedSettings, currentBlock, meta] = await Promise.all([
        getUSDCBalance(address!),
        getAllProposals(),
        supabase.from('delegation_interest').select('*').eq('wallet_address', address),
        supabase.from('notification_preferences').select('*').eq('wallet_address', address).maybeSingle(),
        publicClient?.getBlockNumber(),
        supabase.from('proposal_metadata').select('*')
      ]);

      setUsdcBalance(balance);
      setProposals(allProposals || []);
      setProposalMeta(meta.data || []);
      setMyDelegations(delegations.data || []);
      setBlockNumber(currentBlock?.toString() || '0');

      if (savedSettings.data) {
        setSettings(prev => ({ ...prev, ...savedSettings.data, email: savedSettings.data.email ?? '' }));
      }

      // Fetch My Votes from events
      if (publicClient) {
        const logs = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: ARCGovCoreABI,
          eventName: 'VoteCast',
          args: { voter: address as `0x${string}` },
          fromBlock: BigInt(0)
        });
        
        const formattedVotes = logs.map((log: any) => {
          const propId = Number(log.args.proposalId);
          const proposal = (allProposals as any[]).find(p => Number(p.id) === propId);
          return {
            proposalId: propId,
            title: proposal?.title || `Proposal #${propId}`,
            voteType: Number(log.args.voteType),
            transactionHash: log.transactionHash,
            timestamp: 0 
          };
        });
        setMyVotes(formattedVotes);
      }

      setLastFetchedAt(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, publicClient]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- COMPUTED STATS ---
  // Merge each on-chain proposal with its off-chain custom voting window
  // (Supabase `proposal_metadata`), exactly like the governance pages do — so
  // "Active" here means the same thing it does everywhere else.
  const proposalsWithMeta = useMemo(() => {
    return proposals.map(p => {
      const m = proposalMeta.find(meta => meta.proposal_id === p.id.toString());
      return {
        ...p,
        customStart: m && m.custom_start ? new Date(m.custom_start) : new Date(Number(p.createdAt) * 1000),
        customDeadline: m ? new Date(m.custom_deadline) : new Date(Number(p.votingDeadline) * 1000),
      };
    });
  }, [proposals, proposalMeta]);

  // Proposals this wallet authored, deadline-aware status attached.
  const myProposals = useMemo(() => {
    if (!address) return [];
    return proposalsWithMeta
      .filter(p => p.proposer.toLowerCase() === address.toLowerCase())
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [proposalsWithMeta, address]);

  const stats = useMemo(() => {
    // Participation = share of *votable* proposals this wallet has voted on.
    // We count against proposals whose voting window has actually opened, so a
    // future-dated proposal doesn't dilute the score.
    const votesCastCount = myVotes.length;
    const votedIds = new Set(myVotes.map(v => v.proposalId));

    // Only genuinely live proposals still need a vote (deadline in the future
    // AND not already voted on by this wallet).
    const needingVote = proposalsWithMeta.filter(
      p => isVotingActive(p) && !votedIds.has(Number(p.id))
    );

    // Denominator: proposals that have ever been open for this wallet to act on
    // (started voting), so the score reflects real, addressable participation.
    const now = Date.now();
    const addressable = proposalsWithMeta.filter(p => {
      const start = p.customStart instanceof Date ? p.customStart.getTime() : 0;
      return start <= now;
    }).length;
    const score = addressable > 0 ? Math.round((votesCastCount / addressable) * 100) : 0;

    return {
      participationScore: Math.min(score, 100),
      votedCount: votesCastCount,
      submittedCount: myProposals.length,
      delegationCount: myDelegations.length,
      needingVote,
    };
  }, [proposalsWithMeta, myVotes, myProposals, myDelegations]);

  const chartData = [
    { name: 'Participation', value: stats.participationScore, fill: '#1D9E75' }
  ];

  // --- HANDLERS ---
  const handleExportCSV = () => {
    if (myVotes.length === 0) return;
    
    const headers = ["Proposal ID", "Title", "Your Vote", "Date", "Explorer URL"];
    const rows = myVotes.map(v => [
      v.proposalId,
      `"${v.title.replace(/"/g, '""')}"`,
      v.voteType === 0 ? "FOR" : v.voteType === 1 ? "AGAINST" : "ABSTAIN",
      new Date().toLocaleDateString(),
      `https://testnet.arcscan.app/tx/${v.transactionHash}`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];
    const shortAddr = address?.slice(2, 8);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `arcgov-votes-${shortAddr}-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(t('dashboard.csv_exported'), "success");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleSaveSettings = async () => {
    if (!address) return;
    setIsSavingSettings(true);
    const { ok, error } = await submitForm('notification_preferences', {
      wallet_address: address,
      ...settings,
      updated_at: new Date().toISOString(),
    });
    if (ok) {
      toast(t('dashboard.settings_saved'), "success");
    } else {
      toast(error || t('dashboard.settings_failed'), "error");
    }
    setIsSavingSettings(false);
  };

  // --- RENDER HELPERS ---
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
        <main className="flex-grow flex flex-col items-center justify-center p-4 py-20">
          <div className="max-w-2xl w-full text-center space-y-12">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('dashboard.title')}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                {t('dashboard.connect_desc')}
              </p>
            </div>

            <div className="flex justify-center">
               <ConnectButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 select-none pointer-events-none">
               {[
                 { label: t('dashboard.voting_history'), icon: Vote },
                 { label: t('dashboard.participation_score'), icon: Trophy },
                 { label: t('dashboard.active_proposals'), icon: FileText }
               ].map((card) => (
                 <div key={card.label} className="relative p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-3xl blur-[2px]">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                       <Lock className="text-gray-400" size={32} />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                       <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl">
                          <card.icon size={24} className="text-gray-300" />
                       </div>
                       <p className="font-bold text-sm text-gray-300">{card.label}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      {/* CONNECTED TOP BAR */}
      <div className="w-full border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] flex items-center justify-center text-white shadow-lg shadow-[#1D9E75]/20">
                <User size={24} />
             </div>
             <div>
                <h2 className="font-black tracking-tight">{t('dashboard.welcome')}, {address?.slice(0, 6)}...{address?.slice(-4)}</h2>
                <div className="flex items-center gap-2">
                   <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                     <Coins size={12} /> {usdcBalance} USDC <TestnetChip />
                   </div>
                   <span className="text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-400 uppercase tracking-widest">Testnet</span>
                </div>
             </div>
          </div>
          
          {chainId !== 5042002 && (
            <button 
              onClick={() => switchChain({ chainId: 5042002 })}
              className="px-4 h-11 bg-amber-500 text-white text-xs font-black rounded-xl flex items-center gap-2 animate-pulse"
            >
              <AlertCircle size={14} /> {t('dashboard.switch_testnet')}
            </button>
          )}
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* SIDEBAR TABS */}
          <aside className="lg:w-64 shrink-0">
             <nav className="flex flex-row lg:flex-col overflow-x-auto no-scrollbar gap-1 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 lg:bg-transparent lg:border-0 lg:p-0">
                {[
                  { id: 'Overview', icon: LayoutDashboard, label: t('dashboard.tab_overview') },
                  { id: 'My Votes', icon: Vote, label: t('dashboard.tab_votes') },
                  { id: 'My Proposals', icon: FileText, label: t('dashboard.tab_proposals') },
                  { id: 'Delegation', icon: UserCheck, label: t('dashboard.tab_delegation') },
                  { id: 'Settings', icon: Settings, label: t('dashboard.tab_settings') },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 h-14 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#1D9E75] text-white shadow-lg shadow-[#1D9E75]/20'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
             </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="flex-grow min-w-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                 <Loader2 className="animate-spin text-[#1D9E75]" size={40} />
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.syncing')}</p>
              </div>
            ) : (
              <>
                {/* TAB 1 — OVERVIEW */}
                {activeTab === 'Overview' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                       <div className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[40px] flex flex-col items-center text-center">
                          <div className="relative w-48 h-48 mb-4" style={{ width: '100%', height: 192 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="80%" outerRadius="100%" barSize={12} data={chartData} startAngle={90} endAngle={-270}>
                                   <RadialBar background dataKey="value" cornerRadius={10} />
                                </RadialBarChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black">{stats.participationScore}%</span>
                             </div>
                          </div>
                          <h3 className="font-bold">{t('dashboard.participation_score')}</h3>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">{t('dashboard.contribution')}</p>
                       </div>

                       <div className="grid grid-cols-1 gap-4">
                          {[
                            { label: t('dashboard.proposals_voted'), value: stats.votedCount, icon: Vote, color: 'text-blue-500' },
                            { label: t('dashboard.proposals_submitted'), value: stats.submittedCount, icon: FileText, color: 'text-[#1D9E75]' },
                            { label: t('dashboard.active_delegations'), value: stats.delegationCount, icon: UserCheck, color: 'text-purple-500' },
                          ].map((s) => (
                            <div key={s.label} className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 ${s.color}`}>
                                     <s.icon size={20} />
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">{s.label}</span>
                               </div>
                               <span className="text-2xl font-black">{s.value === 0 ? <>{s.value} <TestnetChip /></> : s.value}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-xl font-black flex items-center gap-2">
                          <AlertCircle size={20} className="text-[#1D9E75]" />
                          {t('dashboard.needing_vote')}
                       </h3>
                       {stats.needingVote.length > 0 ? (
                         <div className="space-y-4">
                            {stats.needingVote.map((p) => (
                              <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                                <div className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-[#1D9E75] transition-all flex items-center justify-between group h-20">
                                   <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-black text-gray-400">#{p.id.toString()}</span>
                                      <h4 className="font-bold group-hover:text-[#1D9E75] transition-colors">{p.title}</h4>
                                   </div>
                                   <ChevronRight className="text-gray-300 group-hover:text-[#1D9E75] transition-all" size={20} />
                                </div>
                              </Link>
                            ))}
                         </div>
                       ) : (
                         <div className="p-10 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-[40px] text-center">
                            <CheckCircle2 size={40} className="text-[#1D9E75] mx-auto mb-4" />
                            <p className="font-bold text-[#1D9E75]">{t('dashboard.all_caught_up')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.voted_all')}</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* TAB 2 — MY VOTES */}
                {activeTab === 'My Votes' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <h3 className="text-2xl font-black">{t('dashboard.voting_history')}</h3>
                       {myVotes.length > 0 && (
                         <div className="flex items-center gap-3 no-print">
                            <button
                              onClick={handleExportCSV}
                              className="flex-1 md:flex-none px-4 h-11 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700"
                            >
                              ⬇ {t('dashboard.export_csv')}
                            </button>
                            <button
                              onClick={handleExportPDF}
                              className="flex-1 md:flex-none px-4 h-11 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700"
                            >
                              ⬇ {t('dashboard.export_pdf')}
                            </button>
                         </div>
                       )}
                    </div>

                    {/* VERIFIED BADGE */}
                    <div className="pb-4 border-b border-gray-50 dark:border-gray-900/50">
                       <VerifiedBadge 
                         explorerUrl={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`}
                         blockNumber={blockNumber}
                         lastFetchedAt={lastFetchedAt}
                         onRefresh={fetchDashboardData}
                         isLoading={isLoading}
                       />
                    </div>

                    {myVotes.length > 0 ? (
                      <div className="print-container">
                        {/* Hidden print header */}
                        <div className="hidden print:block mb-8">
                           <h1 className="text-2xl font-black">{t('dashboard.history_title')}</h1>
                           <p className="text-sm text-gray-500 font-mono mt-2">{t('dashboard.address')}: {address}</p>
                           <p className="text-xs text-gray-400 mt-1">{t('dashboard.exported_on')} {new Date().toLocaleString()}</p>
                        </div>

                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block overflow-hidden bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('dashboard.col_id')}</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('dashboard.col_proposal')}</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{t('dashboard.col_your_vote')}</th>
                                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right no-print">{t('dashboard.col_explorer')}</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                               {myVotes.map((vote, i) => (
                                 <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/30 transition-colors">
                                    <td className="px-6 py-5 font-mono text-[10px] text-gray-400">#{vote.proposalId}</td>
                                    <td className="px-6 py-5">
                                       <Link href={`/governance/${vote.proposalId}`} className="font-bold text-sm hover:text-[#1D9E75] transition-colors">{vote.title}</Link>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                         vote.voteType === 0 ? 'bg-green-100 text-green-700' :
                                         vote.voteType === 1 ? 'bg-red-100 text-red-700' :
                                         'bg-gray-100 text-gray-500'
                                       }`}>
                                         {vote.voteType === 0 ? t('common.for') : vote.voteType === 1 ? t('common.against') : t('common.abstain')}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-right no-print">
                                       <a href={`https://testnet.arcscan.app/tx/${vote.transactionHash}`} target="_blank" rel="noopener noreferrer" className="inline-block text-gray-400 hover:text-[#1D9E75] transition-colors">
                                          <ExternalLink size={14} />
                                       </a>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                          </table>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="grid md:hidden grid-cols-1 gap-4">
                           {myVotes.map((vote, i) => (
                             <div key={i} className="p-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proposal #{vote.proposalId}</span>
                                   <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                      vote.voteType === 0 ? 'bg-green-100 text-green-700' :
                                      vote.voteType === 1 ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-500'
                                   }`}>
                                      {vote.voteType === 0 ? 'FOR' : vote.voteType === 1 ? 'AGAINST' : 'ABSTAIN'}
                                   </span>
                                </div>
                                <Link href={`/governance/${vote.proposalId}`} className="block font-bold text-sm leading-tight hover:text-[#1D9E75] transition-colors">{vote.title}</Link>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-900">
                                   <span className="text-[10px] font-bold text-gray-400">{t('dashboard.synced_onchain')}</span>
                                   <a href={`https://testnet.arcscan.app/tx/${vote.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-[#1D9E75] flex items-center gap-1.5 text-[10px] font-black uppercase">
                                      {t('dashboard.explorer')} <ExternalLink size={12} />
                                   </a>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-20 bg-gray-50/50 dark:bg-gray-900/30 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] text-center space-y-6">
                         <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <Vote className="text-gray-300" size={32} />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold">{t('dashboard.no_votes')}</h4>
                            <p className="text-gray-500 text-sm">{t('dashboard.no_votes_desc')}</p>
                         </div>
                         <Link href="/governance" className="btn-primary inline-flex items-center gap-2 px-8 h-12 flex items-center justify-center rounded-xl font-bold">
                            {t('dashboard.view_proposals')} <ChevronRight size={16} />
                         </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3 — MY PROPOSALS */}
                {activeTab === 'My Proposals' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black">{t('dashboard.submitted_proposals')}</h3>
                       <Link href="/governance" className="text-xs font-black text-[#1D9E75] hover:underline uppercase tracking-widest flex items-center gap-1">
                          {t('dashboard.submit_new')} <Plus size={14} />
                       </Link>
                    </div>
                    
                    {myProposals.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                         {myProposals.map((p) => {
                           const totalVotes = Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes);
                           const forPercent = totalVotes > 0 ? (Number(p.forVotes) / totalVotes) * 100 : 0;
                           const againstPercent = totalVotes > 0 ? (Number(p.againstVotes) / totalVotes) * 100 : 0;
                           const abstainPercent = totalVotes > 0 ? (Number(p.abstainVotes) / totalVotes) * 100 : 0;
                           // Deadline-aware status (matches the governance pages):
                           // Active / Passed / Rejected / Failed.
                           const status = getProposalStatus(p);

                           return (
                             <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                                <div className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] hover:border-[#1D9E75] transition-all group relative overflow-hidden">
                                   <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                      <div className="space-y-2">
                                         <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono font-bold text-gray-500">#{p.id.toString().padStart(3, '0')}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS[3]}`}>{CATEGORY_LABELS[p.category] || 'ECOSYSTEM'}</span>
                                         </div>
                                         <h3 className="text-xl font-bold group-hover:text-[#1D9E75] transition-colors">{p.title}</h3>
                                      </div>
                                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                        status === 'Active' ? 'bg-green-100 text-green-700' :
                                        status === 'Passed' ? 'bg-blue-100 text-blue-700' :
                                        status === 'Rejected' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500 animate-pulse' : status === 'Passed' ? 'bg-blue-500' : status === 'Rejected' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        {t('common.' + status.toLowerCase())}
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                         <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
                                         <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
                                         <div className="h-full bg-gray-400 dark:bg-gray-500" style={{ width: `${abstainPercent}%` }} />
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                         <span>{p.forVotes.toString()} {t('dashboard.for')} · {p.againstVotes.toString()} {t('dashboard.against')} · {p.abstainVotes.toString()} {t('dashboard.abstain')}</span>
                                         <span className="flex items-center gap-1 group-hover:text-[#1D9E75] transition-colors uppercase">{t('dashboard.view_detail')} <ChevronRight size={12} /></span>
                                      </div>
                                   </div>
                                </div>
                             </Link>
                           );
                         })}
                      </div>
                    ) : (
                      <div className="p-20 bg-gray-50/50 dark:bg-gray-900/30 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] text-center space-y-6">
                         <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <FileText className="text-gray-300" size={32} />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold">{t('dashboard.no_proposals')}</h4>
                            <p className="text-gray-500 text-sm">{t('dashboard.no_proposals_desc')}</p>
                         </div>
                         <Link href="/governance" className="btn-primary inline-flex items-center gap-2 px-8 h-12 flex items-center justify-center rounded-xl font-bold">
                            {t('dashboard.first_proposal')} <ArrowUpRight size={16} />
                         </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4 — DELEGATION */}
                {activeTab === 'Delegation' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-2xl font-black">{t('dashboard.delegation_title')}</h3>
                    {myDelegations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {myDelegations.map((d, i) => (
                           <div key={i} className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-xs">
                                   {(d.validator_name || '??').slice(0, 2).toUpperCase()}
                                 </div>
                                 <h4 className="font-bold">{d.validator_name || 'Validator'}</h4>
                              </div>
                              <div className="space-y-2">
                                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">{t('dashboard.registered')}</span>
                                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                                 </div>
                                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">{t('dashboard.status')}</span>
                                    <span className="text-[#1D9E75]">{t('dashboard.waiting_pos')}</span>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="p-20 bg-gray-50/50 dark:bg-gray-900/30 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] text-center space-y-6">
                         <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <UserCheck className="text-gray-300" size={32} />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold">{t('dashboard.no_delegations')}</h4>
                            <p className="text-gray-500 text-sm">{t('dashboard.no_delegations_desc')}</p>
                         </div>
                         <Link href="/validators" className="btn-primary inline-flex items-center gap-2 px-8 h-12 flex items-center justify-center rounded-xl font-bold">
                            {t('dashboard.meet_validators')} <ChevronRight size={16} />
                         </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5 — SETTINGS */}
                {activeTab === 'Settings' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
                    <h3 className="text-2xl font-black">{t('dashboard.settings_title')}</h3>

                    <div className="space-y-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[40px] p-8 md:p-12">
                       <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                             <Mail size={14} /> {t('dashboard.email_address')}
                          </label>
                          <input 
                             type="email" 
                             placeholder="you@example.com"
                             className="w-full px-5 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium text-sm"
                             value={settings.email}
                             onChange={(e) => setSettings({...settings, email: e.target.value})}
                          />
                       </div>

                       <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-900">
                          {[
                            { id: 'new_proposals', label: t('dashboard.pref_new_proposals') },
                            { id: 'vote_deadlines', label: t('dashboard.pref_deadlines') },
                            { id: 'validator_updates', label: t('dashboard.pref_validator') },
                            { id: 'quantum_news', label: t('dashboard.pref_quantum') },
                          ].map((pref) => (
                            <div key={pref.id} className="flex items-center justify-between py-2">
                               <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{pref.label}</span>
                               <button 
                                 onClick={() => setSettings({...settings, [pref.id]: !settings[pref.id as keyof typeof settings]})}
                                 className={`w-12 h-7 rounded-full transition-all relative ${settings[pref.id as keyof typeof settings] ? 'bg-[#1D9E75]' : 'bg-gray-200 dark:bg-gray-800'}`}
                               >
                                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${settings[pref.id as keyof typeof settings] ? 'left-6' : 'left-1'}`} />
                               </button>
                            </div>
                          ))}
                       </div>

                       <button 
                         onClick={handleSaveSettings}
                         disabled={isSavingSettings}
                         className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20 flex items-center justify-center gap-2 mt-4"
                       >
                         {isSavingSettings ? <Loader2 className="animate-spin" /> : <><Bell size={18} /> {t('dashboard.save_prefs')}</>}
                       </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
