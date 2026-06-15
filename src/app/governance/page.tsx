'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Filter, 
  ChevronRight, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  X,
  Calendar as CalendarIcon,
  ArrowRight
} from 'lucide-react';
import { getAllProposals, submitProposal, ARC_GOV_CORE_ADDRESS } from '@/lib/contract';
import { getProposalStatus } from '@/lib/proposal-status';
import { getBlockNumberFormatted } from '@/lib/arc-rpc';
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import NetworkError from '@/components/shared/NetworkError';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import ProposalCard from '@/components/governance/ProposalCard';
import TestnetChip from '@/components/shared/TestnetChip';
import { addDays, format } from 'date-fns';
import supabase from '@/lib/supabase';
import { submitForm } from '@/lib/submit';
import { useTranslation } from '@/lib/i18n';

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function Governance() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { toast, dismiss } = useToast();
  const { t } = useTranslation();

  // Fetch Proposals and Metadata
  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const [all, block, meta] = await Promise.all([
        getAllProposals(),
        getBlockNumberFormatted(),
        supabase.from('proposal_metadata').select('*')
      ]);
      setProposals((all as any[]) || []);
      setBlockNumber(block);
      setMetadata(meta.data || []);
      setLastFetchedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Scroll Lock for Modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  // Merged Proposals
  const proposalsWithMetadata = useMemo(() => {
    return proposals.map(p => {
      const m = metadata.find(meta => meta.proposal_id === p.id.toString());
      return {
        ...p,
        customStart: m && m.custom_start ? new Date(m.custom_start) : new Date(Number(p.createdAt) * 1000),
        customDeadline: m ? new Date(m.custom_deadline) : new Date(Number(p.votingDeadline) * 1000)
      };
    });
  }, [proposals, metadata]);

  // Stats — derived from the proposal's *current* state (deadline-aware), so a
  // proposal whose voting window has lapsed no longer counts as "Active".
  const stats = useMemo(() => {
    const total = proposalsWithMetadata.length;
    let active = 0, passed = 0, failed = 0, rejected = 0;
    for (const p of proposalsWithMetadata) {
      const s = getProposalStatus(p);
      if (s === 'Active') active++;
      else if (s === 'Passed') passed++;
      else if (s === 'Rejected') rejected++;
      else failed++;
    }
    return { total, active, passed, failed, rejected };
  }, [proposalsWithMetadata]);

  // Filtered Proposals
  const filteredProposals = useMemo(() => {
    return proposalsWithMetadata.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesTab = filterTab === 'All' || getProposalStatus(p) === filterTab;
      return matchesSearch && matchesTab;
    }).sort((a, b) => Number(b.id) - Number(a.id));
  }, [proposalsWithMetadata, search, filterTab]);

  // Split the visible proposals into "Active" (voting still open) and "Past"
  // (decided) so the list reads like the home overview. The tab filter already
  // narrows the set, so a section simply renders empty when it has no matches.
  const activeProposals = useMemo(
    () => filteredProposals.filter(p => getProposalStatus(p) === 'Active'),
    [filteredProposals]
  );
  const pastProposals = useMemo(
    () => filteredProposals.filter(p => getProposalStatus(p) !== 'Active'),
    [filteredProposals]
  );

  // Modal Handlers
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 0,
    rationale: '',
    votingPeriod: '7',
    customStart: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    customDeadline: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
  });

  // The start/end the proposal's voting window will actually use, derived from
  // the selected period. Presets start now; "custom" uses the picked start/end.
  const votingWindow = useMemo(() => {
    const start = formData.votingPeriod === 'custom' && formData.customStart
      ? new Date(formData.customStart)
      : new Date();
    const end = formData.votingPeriod === 'custom'
      ? new Date(formData.customDeadline)
      : addDays(start, parseInt(formData.votingPeriod));
    const ms = end.getTime() - start.getTime();
    const days = ms > 0 ? Math.round(ms / (1000 * 60 * 60 * 24)) : 0;
    const valid = end.getTime() > start.getTime();
    return { start, end, days, valid };
  }, [formData.votingPeriod, formData.customStart, formData.customDeadline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletClient || !publicClient) return;

    if (chainId !== 5042002) {
      toast("Please switch to Arc Testnet to submit a proposal", "error");
      return;
    }

    // Voting window from the selected period.
    const start = formData.votingPeriod === 'custom'
      ? new Date(formData.customStart)
      : new Date();
    const deadline = formData.votingPeriod === 'custom'
      ? new Date(formData.customDeadline)
      : addDays(new Date(), parseInt(formData.votingPeriod));

    if (deadline.getTime() <= start.getTime()) {
      toast("Voting end must be after the start", "error");
      return;
    }

    // Voting window length the contract will actually enforce. The on-chain
    // deadline is set to (now + this many seconds), so the countdown the UI
    // shows matches the contract — long proposals stay votable until they end.
    const votingDurationSeconds = Math.max(
      3600, // contract MIN_VOTING_DURATION (1 hour)
      Math.round((deadline.getTime() - Date.now()) / 1000)
    );

    const toastId = toast("Submitting to Arc Testnet...", "loading");
    setIsSubmitting(true);

    try {
      const fullDescription = formData.rationale
        ? `${formData.description}\n\nWHY THIS MATTERS:\n${formData.rationale}`
        : formData.description;

      const { hash, proposalId } = await submitProposal(
        formData.title,
        fullDescription,
        formData.category,
        walletClient,
        publicClient as any,
        votingDurationSeconds
      );

      // Store metadata off-chain (custom voting window) via the server route,
      // which writes with the service role and isn't blocked by RLS.
      const { ok: metaOk, error: metaError } = await submitForm('proposal_metadata', {
        proposal_id: proposalId.toString(),
        custom_start: start.toISOString(),
        custom_deadline: deadline.toISOString(),
        submitter_wallet: address,
      });
      if (!metaOk) {
        // The on-chain deadline now reflects the chosen duration, so voting
        // still works. Only the display extras (custom start time) weren't
        // saved — the proposal falls back to its on-chain timestamps.
        console.error('proposal_metadata insert failed:', metaError);
        toast(
          "Proposal submitted on-chain. (Display metadata couldn't be saved — run the SQL migration; voting still works.)",
          "error"
        );
      }

      dismiss(toastId);
      toast(`Proposal #${proposalId} submitted!`, "success");
      setIsModalOpen(false);
      setFormData({
        title: '', description: '', category: 0, rationale: '',
        votingPeriod: '7',
        customStart: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        customDeadline: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
      });
      fetchProposals();
    } catch (err: any) {
      dismiss(toastId);
      toast(err.message || "Failed to submit proposal", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* SECTION 1 — HERO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 text-center md:text-left">
          <div>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
               <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('governance.title')}</h1>
               <Link
                href="/governance/calendar"
                className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black text-gray-500 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all flex items-center gap-1.5"
               >
                 <CalendarIcon size={12} /> {t('governance.calendar')}
               </Link>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">{t('governance.subtitle')}</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
            <button 
              onClick={() => isConnected ? setIsModalOpen(true) : null}
              disabled={!isConnected}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all ${!isConnected ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]'}`}
            >
              <Plus size={20} />
              {t('governance.submit_proposal')}
            </button>
            {!isConnected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t('governance.connect_to_submit')}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 — STATS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {[
            { label: t('governance.total_proposals'), value: stats.total },
            { label: t('governance.active_now'), value: stats.active, color: 'text-[#1D9E75]' },
            { label: t('governance.passed'), value: stats.passed, color: 'text-blue-500' },
            { label: t('governance.failed'), value: stats.failed, color: 'text-red-500' },
            { label: t('governance.rejected'), value: stats.rejected, color: 'text-amber-500' },
          ].map((s) => (
            <div key={s.label} className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-3xl font-black ${s.color || ''}`}>
                 {isLoading ? '...' : (s.value === 0 ? <>{s.value} <TestnetChip /></> : s.value)}
              </p>
            </div>
          ))}
        </div>

        {/* VERIFIED BADGE */}
        <div className="mb-12 border-b border-gray-50 dark:border-gray-900/50 pb-4">
           <VerifiedBadge 
             explorerUrl={`https://testnet.arcscan.app/address/${ARC_GOV_CORE_ADDRESS}`}
             blockNumber={blockNumber}
             lastFetchedAt={lastFetchedAt}
             onRefresh={fetchProposals}
             isLoading={isLoading}
           />
        </div>

        {/* SECTION 3 — FILTERS + SEARCH */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar shrink-0">
            {['All', 'Active', 'Passed', 'Failed', 'Rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
                  filterTab === tab
                    ? 'bg-white dark:bg-[#0F1117] text-[#1D9E75] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'All' ? t('governance.filter_all') : t('common.' + tab.toLowerCase())}
              </button>
            ))}
          </div>
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder={t('governance.search_placeholder')}
              className="w-full pl-12 pr-4 h-12 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-medium text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 4 — PROPOSAL LIST */}
        <div className="space-y-4">
          {/* FEATURED: AIP-001 */}
          <div className="p-8 bg-[#E1F5EE] dark:bg-[#1D9E75]/5 border-2 border-[#1D9E75] rounded-[24px] relative overflow-hidden shadow-lg shadow-[#1D9E75]/10 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9E75] rounded-full blur-[80px] -mr-16 -mt-16 opacity-20" />
             <div className="flex flex-wrap justify-between items-center gap-6 relative z-10">
                <div className="space-y-2 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#1D9E75] text-white uppercase tracking-widest">{t('governance.featured')}</span>
                      <span className="text-[10px] font-mono font-bold text-gray-400">AIP-001</span>
                   </div>
                   <h3 className="text-2xl font-black tracking-tight">{t('governance.aip001_title')}</h3>
                   <p className="text-sm text-[#0F6E56] dark:text-[#1D9E75]/70 font-medium">{t('governance.aip001_subtitle')}</p>
                </div>
                <Link href="/governance/aip-001" className="w-full md:w-auto">
                   <button className="w-full md:w-auto px-8 py-3 bg-[#1D9E75] text-white font-black rounded-xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2 shadow-md">
                      {t('governance.vote_now')} <ArrowRight size={18} />
                   </button>
                </Link>
             </div>
          </div>

          {isLoading ? (
            [1, 2, 3, 4].map(i => <SkeletonLoader key={i} height="160px" className="rounded-[24px]" />)
          ) : filteredProposals.length > 0 ? (
            <>
              {activeProposals.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pt-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#1D9E75]">{t('governance.active_proposals')}</h3>
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#1D9E75]/10 text-[10px] font-black text-[#1D9E75]">{activeProposals.length}</span>
                    <div className="flex-grow h-px bg-gray-100 dark:bg-gray-800" />
                  </div>
                  {activeProposals.map((p) => (
                    <ProposalCard key={p.id.toString()} proposal={p} />
                  ))}
                </div>
              )}

              {pastProposals.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pt-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{t('governance.past_proposals')}</h3>
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-500">{pastProposals.length}</span>
                    <div className="flex-grow h-px bg-gray-100 dark:bg-gray-800" />
                  </div>
                  {pastProposals.map((p) => (
                    <ProposalCard key={p.id.toString()} proposal={p} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-gray-50/50 dark:bg-gray-900/20 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
               <div className="w-16 h-16 bg-white dark:bg-[#0F1117] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
                 <Filter className="text-gray-300" size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">{t('governance.no_proposals_title')}</h3>
               <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
                 {t('governance.no_proposals_desc')}
               </p>
               <button
                 onClick={() => isConnected ? setIsModalOpen(true) : null}
                 className="px-8 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20"
               >
                 {t('governance.submit_proposal')}
               </button>
            </div>
          )}
        </div>
      </main>

      {/* SECTION 5 — SUBMIT PROPOSAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0F1117] md:bg-black/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center animate-in fade-in duration-200">
          <div className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] md:overflow-y-auto md:rounded-[32px] md:border md:border-gray-100 md:dark:border-gray-800 md:shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-900 z-10">
              <h2 className="text-2xl font-black">{t('governance.modal_title')}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.proposal_title')}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder={t('governance.title_placeholder')}
                    className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  <span className="absolute right-4 bottom-4 text-[10px] font-bold text-gray-400">
                    {formData.title.length}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.category')}</label>
                  <select
                    className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: parseInt(e.target.value)})}
                  >
                    {CATEGORY_LABELS.map((label, i) => (
                      <option key={label} value={i}>{t('governance.cat_' + label.toLowerCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.voting_period')}</label>
                  <select
                    className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold appearance-none"
                    value={formData.votingPeriod}
                    onChange={(e) => setFormData({ ...formData, votingPeriod: e.target.value })}
                  >
                    <option value="3">{t('governance.days_3')}</option>
                    <option value="7">{t('governance.days_7')}</option>
                    <option value="14">{t('governance.days_14')}</option>
                    <option value="30">{t('governance.days_30')}</option>
                    <option value="custom">{t('governance.custom_date')}</option>
                  </select>
                </div>
              </div>

              {formData.votingPeriod === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.voting_starts')}</label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold"
                      value={formData.customStart}
                      onChange={(e) => setFormData({ ...formData, customStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.voting_ends')}</label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold"
                      value={formData.customDeadline}
                      onChange={(e) => setFormData({ ...formData, customDeadline: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Voting window summary — always shows the resulting start/end */}
              <div className={`rounded-2xl border p-5 ${votingWindow.valid ? 'bg-[#1D9E75]/5 border-[#1D9E75]/20' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('governance.voting_window')}</span>
                  {votingWindow.valid ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">{votingWindow.days} {votingWindow.days === 1 ? t('governance.day') : t('governance.days')}</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{t('governance.end_after_start')}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('governance.opens')}</p>
                      <p className="text-xs font-bold">{format(votingWindow.start, "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('governance.closes')}</p>
                      <p className="text-xs font-bold">{votingWindow.valid ? format(votingWindow.end, "MMM d, yyyy 'at' h:mm a") : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.description')}</label>
                <div className="relative">
                  <textarea
                    required
                    maxLength={1000}
                    rows={5}
                    placeholder={t('governance.description_placeholder')}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-medium text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <span className="absolute right-4 bottom-4 text-[10px] font-bold text-gray-400">
                    {formData.description.length}/1000
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('governance.why_matters')}</label>
                <textarea
                  rows={3}
                  placeholder={t('governance.why_placeholder')}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-medium text-sm"
                  value={formData.rationale}
                  onChange={(e) => setFormData({...formData, rationale: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : t('governance.submit_proposal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
