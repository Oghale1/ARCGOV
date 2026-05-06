// ArcGov — Built by Gemini — arcgov.xyz
import React from 'react';
import Link from 'next/link';
import { Clock, User, BarChart } from 'lucide-react';

export enum Category { VALIDATOR, PARAMETER, UPGRADE, ECOSYSTEM }

export interface Proposal {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  category: number;
  ipfsHash: string;
  timestamp: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  isOpen: boolean;
}

const CATEGORY_LABELS = ['Validator', 'Parameter', 'Upgrade', 'Ecosystem'];
const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
];

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercent = totalVotes > 0n ? (Number(proposal.forVotes) / Number(totalVotes)) * 100 : 0;
  const againstPercent = totalVotes > 0n ? (Number(proposal.againstVotes) / Number(totalVotes)) * 100 : 0;

  return (
    <Link href={`/governance/${proposal.id}`}>
      <div className="p-6 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl hover:border-[#1D9E75] transition-all group">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[proposal.category] || CATEGORY_COLORS[0]}`}>
            {CATEGORY_LABELS[proposal.category]}
          </span>
          <div className="flex items-center gap-2">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${proposal.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {proposal.isOpen ? 'Active' : 'Closed'}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-[#1D9E75] transition-colors leading-tight">
          {proposal.title}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-6">
          <div className="flex items-center gap-1">
            <User size={14} />
            {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
            <span className="text-[#1D9E75]">For ({forPercent.toFixed(1)}%)</span>
            <span className="text-red-500">Against ({againstPercent.toFixed(1)}%)</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }}></div>
            <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
            <span>{totalVotes.toString()} Total Votes</span>
            <span className="flex items-center gap-1">
              <BarChart size={12} /> Voting Progress
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
