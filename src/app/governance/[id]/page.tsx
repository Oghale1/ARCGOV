'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VoteButtons } from '@/components/governance/VoteButtons';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  User, 
  Info, 
  Share2, 
  FileText 
} from 'lucide-react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { ARC_GOV_CORE_ADDRESS, ARC_GOV_CORE_ABI } from '@/lib/contract';
import { Proposal } from '@/components/governance/ProposalCard';

const CATEGORY_LABELS = ['Validator', 'Parameter', 'Upgrade', 'Ecosystem'];

export default function ProposalDetail() {
  const { id } = useParams();
  const proposalId = BigInt(id as string);

  const { data: proposal, isLoading } = useReadContract({
    address: ARC_GOV_CORE_ADDRESS,
    abi: ARC_GOV_CORE_ABI,
    functionName: 'getProposal',
    args: [proposalId],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 w-full animate-pulse">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-8" />
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded mb-12" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  const p = proposal as Proposal;

  if (!p || p.title === "") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Proposal Not Found</h2>
          <Link href="/governance" className="text-[#1D9E75] hover:underline mt-4 block">Return to Governance</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
  const forPercent = totalVotes > 0n ? (Number(p.forVotes) / Number(totalVotes)) * 100 : 0;
  const againstPercent = totalVotes > 0n ? (Number(p.againstVotes) / Number(totalVotes)) * 100 : 0;
  const abstainPercent = totalVotes > 0n ? (Number(p.abstainVotes) / Number(totalVotes)) * 100 : 0;

  const handleShare = () => {
    const text = `I just voted on Arc governance proposal #${p.id.toString()}: ${p.title} via @ArcGov — https://arcgov.xyz/governance/${p.id.toString()}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <Link href="/governance" className="flex items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#1D9E75] mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Governance
        </Link>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-2.5 py-1 rounded-md bg-[#E1F5EE] dark:bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-bold uppercase tracking-wider">
            {CATEGORY_LABELS[p.category]}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${p.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {p.isOpen ? 'Active' : 'Closed'}
          </span>
          <span className="text-xs text-[#6B7280] font-medium ml-auto">
            Proposal #{p.id.toString()}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-8 leading-tight">
          {p.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#1D9E75]" />
                Description
              </h2>
              <div className="prose dark:prose-invert max-w-none text-lg text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {p.description}
              </div>
            </section>

            <section className="p-6 bg-gray-50 dark:bg-[#1F2937]/30 rounded-2xl border border-gray-100 dark:border-[#1F2937]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-[#1D9E75]" />
                Why this matters
              </h3>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                This proposal was submitted by <span className="font-mono font-bold text-[#111827] dark:text-white">{p.proposer}</span>. 
                Participating in governance ensures that the Arc protocol remains secure, decentralized, and aligned with its mission of providing a stablecoin-native infrastructure for the world.
              </p>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="p-6 bg-white dark:bg-[#1F2937]/20 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl card-subtle-shadow space-y-6">
              <h3 className="font-bold text-lg">Current Tally</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-[#1D9E75]">For</span>
                    <span>{forPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-red-500">
                    <span>Against</span>
                    <span>{againstPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Abstain</span>
                    <span>{abstainPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400" style={{ width: `${abstainPercent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-4 tracking-widest">Cast your vote</p>
                <VoteButtons proposalId={p.id} isOpen={p.isOpen} />
              </div>
            </div>

            <div className="space-y-4 text-xs">
               <div className="flex justify-between items-center text-[#6B7280]">
                <span>Submitted Date</span>
                <span className="font-bold text-[#111827] dark:text-white">
                  {new Date(Number(p.timestamp) * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#6B7280]">
                <span>IPFS Manifest</span>
                <a href={`https://ipfs.io/ipfs/${p.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1D9E75] hover:underline flex items-center gap-1">
                  View <ExternalLink size={12} />
                </a>
              </div>
              <button 
                onClick={handleShare}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-all"
              >
                <Share2 size={16} /> Share on X
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
