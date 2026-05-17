'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
import { getAllProposals, submitProposal } from '@/lib/contract';
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import NetworkError from '@/components/shared/NetworkError';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import ProposalCard from '@/components/governance/ProposalCard';
import TestnetChip from '@/components/shared/TestnetChip';

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function Governance() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { toast, dismiss } = useToast();

  // Fetch Proposals
  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const all = await getAllProposals();
      setProposals((all as any[]) || []);
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

  // Stats
  const stats = useMemo(() => {
    const total = proposals.length;
    const active = proposals.filter(p => p.isOpen).length;
    const passed = proposals.filter(p => !p.isOpen && Number(p.forVotes) > Number(p.againstVotes)).length;
    const failed = proposals.filter(p => !p.isOpen && Number(p.forVotes) <= Number(p.againstVotes)).length;
    return { total, active, passed, failed };
  }, [proposals]);

  // Filtered Proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesTab = 
        filterTab === 'All' || 
        (filterTab === 'Active' && p.isOpen) || 
        (filterTab === 'Passed' && !p.isOpen && Number(p.forVotes) > Number(p.againstVotes)) ||
        (filterTab === 'Failed' && !p.isOpen && Number(p.forVotes) <= Number(p.againstVotes)) ||
        (filterTab === 'Pending' && p.isOpen); // Mapping Pending to Active for now
      return matchesSearch && matchesTab;
    }).sort((a, b) => Number(b.id) - Number(a.id));
  }, [proposals, search, filterTab]);

  // Modal Handlers
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 0,
    rationale: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletClient || !publicClient) return;

    if (chainId !== 5042002) {
      toast("Please switch to Arc Testnet to submit a proposal", "error");
      return;
    }

    const toastId = toast("Submitting to Arc Testnet...", "loading");
    setIsSubmitting(true);

    try {
      const fullDescription = formData.rationale 
        ? `${formData.description}\n\nWHY THIS MATTERS:\n${formData.rationale}` 
        : formData.description;
      
      const hash = await submitProposal(
        formData.title,
        fullDescription,
        formData.category,
        walletClient,
        publicClient as any
      );

      dismiss(toastId);
      toast(`Proposal submitted! Hash: ${hash.slice(0, 10)}...`, "success");
      setIsModalOpen(false);
      setFormData({ title: '', description: '', category: 0, rationale: '' });
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
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* SECTION 1 — HERO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 text-center md:text-left">
          <div>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
               <h1 className="text-4xl md:text-5xl font-black tracking-tight">Arc Governance</h1>
               <Link 
                href="/governance/calendar" 
                className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black text-gray-500 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all flex items-center gap-1.5"
               >
                 <CalendarIcon size={12} /> CALENDAR
               </Link>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">Vote on proposals that shape the Arc network</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
            <button 
              onClick={() => isConnected ? setIsModalOpen(true) : null}
              disabled={!isConnected}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all ${!isConnected ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]'}`}
            >
              <Plus size={20} />
              Submit Proposal
            </button>
            {!isConnected && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Connect your wallet to submit
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 — STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Proposals', value: stats.total },
            { label: 'Active Now', value: stats.active, color: 'text-[#1D9E75]' },
            { label: 'Passed', value: stats.passed, color: 'text-blue-500' },
            { label: 'Failed', value: stats.failed, color: 'text-red-500' },
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
             explorerUrl={`https://testnet.arcscan.app/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99'}`}
             lastFetchedAt={lastFetchedAt}
             onRefresh={fetchProposals}
             isLoading={isLoading}
           />
        </div>

        {/* SECTION 3 — FILTERS + SEARCH */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar shrink-0">
            {['All', 'Active', 'Passed', 'Failed', 'Pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
                  filterTab === tab 
                    ? 'bg-white dark:bg-[#0F1117] text-[#1D9E75] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search proposals by title..."
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
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#1D9E75] text-white uppercase tracking-widest">Featured</span>
                      <span className="text-[10px] font-mono font-bold text-gray-400">AIP-001</span>
                   </div>
                   <h3 className="text-2xl font-black tracking-tight">Launch the tARC Community Token</h3>
                   <p className="text-sm text-[#0F6E56] dark:text-[#1D9E75]/70 font-medium">ArcGov&apos;s first community reward and coordination proposal.</p>
                </div>
                <Link href="/governance/aip-001" className="w-full md:w-auto">
                   <button className="w-full md:w-auto px-8 py-3 bg-[#1D9E75] text-white font-black rounded-xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2 shadow-md">
                      Vote Now <ArrowRight size={18} />
                   </button>
                </Link>
             </div>
          </div>

          {isLoading ? (
            [1, 2, 3, 4].map(i => <SkeletonLoader key={i} height="160px" className="rounded-[24px]" />)
          ) : filteredProposals.length > 0 ? (
            filteredProposals.map((p) => (
              <ProposalCard key={p.id.toString()} proposal={p} />
            ))
          ) : (
            <div className="text-center py-24 bg-gray-50/50 dark:bg-gray-900/20 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
               <div className="w-16 h-16 bg-white dark:bg-[#0F1117] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
                 <Filter className="text-gray-300" size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">No proposals yet</h3>
               <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
                 The governance forum is open — be the first to submit a proposal to shape Arc&apos;s future.
               </p>
               <button 
                 onClick={() => isConnected ? setIsModalOpen(true) : null}
                 className="px-8 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20"
               >
                 Submit Proposal
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
              <h2 className="text-2xl font-black">Submit Proposal</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Proposal Title</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g., Upgrade Validator Security Specs"
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
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Category</label>
                  <select 
                    className="w-full px-5 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all font-bold appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: parseInt(e.target.value)})}
                  >
                    {CATEGORY_LABELS.map((label, i) => (
                      <option key={label} value={i}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                   <p className="text-[10px] text-gray-500 italic">Select the category that best fits your proposal&apos;s impact.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Description</label>
                <div className="relative">
                  <textarea 
                    required
                    maxLength={1000}
                    rows={5}
                    placeholder="Provide a clear and concise description of the change..."
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
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Why this matters (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="How does this benefit the Arc network?"
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
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT PROPOSAL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
