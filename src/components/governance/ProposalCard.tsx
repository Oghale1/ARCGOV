// ArcGov — Built by Gemini — arcgov.xyz
import React from 'react';
import Link from 'next/link';
import { Clock, User, ChevronRight } from 'lucide-react';

export interface Proposal {
  id: bigint | number;
  proposer: string;
  title: string;
  description: string;
  category: number;
  timestamp: bigint | number;
  forVotes: bigint | number;
  againstVotes: bigint | number;
  abstainVotes: bigint | number;
  isOpen: boolean;
}

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const forVotes = Number(proposal.forVotes);
  const againstVotes = Number(proposal.againstVotes);
  const abstainVotes = Number(proposal.abstainVotes);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
  
  const status = proposal.isOpen ? 'Active' : (forVotes > againstVotes ? 'Passed' : 'Failed');

  return (
    <Link href={`/governance/${proposal.id}`}>
      <div className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[24px] hover:border-[#1D9E75] transition-all group relative overflow-hidden">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono font-bold text-gray-500">
                #{proposal.id.toString().padStart(3, '0')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${CATEGORY_COLORS[proposal.category] || CATEGORY_COLORS[3]}`}>
                {CATEGORY_LABELS[proposal.category] || 'ECOSYSTEM'}
              </span>
            </div>
            <h3 className="text-xl font-bold group-hover:text-[#1D9E75] transition-colors">{proposal.title}</h3>
            <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><User size={14} /> Proposed by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
            status === 'Active' ? 'bg-green-100 text-green-700' :
            status === 'Passed' ? 'bg-blue-100 text-blue-700' :
            'bg-red-100 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'Active' ? 'bg-green-500 animate-pulse' :
              status === 'Passed' ? 'bg-blue-500' :
              'bg-red-500'
            }`} />
            {status === 'Active' ? '7 DAYS REMAINING' : `Voting ${status}`}
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[11px] font-bold text-gray-500">
              <span className="text-[#1D9E75]">{forVotes} For</span> · 
              <span className="text-red-500 ml-1.5">{againstVotes} Against</span> · 
              <span className="ml-1.5">{abstainVotes} Abstain</span>
            </p>
            <span className="text-[11px] font-black text-[#1D9E75] flex items-center gap-1 group-hover:gap-2 transition-all uppercase">
              View & Vote <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

