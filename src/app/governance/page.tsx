'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProposalCard, Proposal } from '@/components/governance/ProposalCard';
import { Search, Filter, Plus, ExternalLink } from 'lucide-react';
import { useReadContract, useChainId } from 'wagmi';
import { ARC_GOV_CORE_ADDRESS, ARC_GOV_CORE_ABI } from '@/lib/contract';
import { useToast } from '@/components/shared/Toast';

export default function Governance() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const chainId = useChainId();
  const { toast } = useToast();

  const handleOpenSubmit = () => {
    if (chainId !== 5042002) {
      toast("Please switch to Arc Testnet before submitting a proposal", "error");
      return;
    }
    // TODO: Open modal
  };

  const { data: rawProposals, isLoading } = useReadContract({
    address: ARC_GOV_CORE_ADDRESS,
    abi: ARC_GOV_CORE_ABI,
    functionName: 'getAllProposals',
  });

  const proposals = useMemo(() => {
    if (!rawProposals) return [];
    return [...(rawProposals as Proposal[])].reverse();
  }, [rawProposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || 
        (filter === 'Active' && p.isOpen) || 
        (filter === 'Closed' && !p.isOpen);
      return matchesSearch && matchesFilter;
    });
  }, [proposals, search, filter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Arc Governance</h1>
            <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">Shape the future of the world's first stablecoin-native Layer-1.</p>
          </div>
          <button 
            onClick={handleOpenSubmit}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Submit Proposal
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search proposals by keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Closed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                  filter === f 
                    ? "bg-[#1D9E75] border-[#1D9E75] text-white" 
                    : "bg-white dark:bg-[#1F2937]/30 border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] hover:border-[#1D9E75]"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProposals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProposals.map((p) => (
              <ProposalCard key={p.id.toString()} proposal={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-[#1F2937]/10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No proposals found</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Verifiability Footer */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-[#1F2937]/20 rounded-xl border border-[#E5E7EB] dark:border-[#1F2937]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Verified On-Chain
            <a href="https://testnet.arcscan.app/address/0x4b939c72182CEedA116dB4Eb3c28300911c7bf89" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#1D9E75] hover:underline">
               Contract <ExternalLink size={10} />
            </a>
          </div>
          <div className="text-[10px] font-medium text-[#6B7280]">
            Last Updated: {new Date().toLocaleTimeString()} · Click to refresh
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
