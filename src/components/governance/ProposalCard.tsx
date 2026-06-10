'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app
import React from 'react';
import Link from 'next/link';
import { Clock, User, ChevronRight } from 'lucide-react';
import ProposalStatusBadge from '@/components/shared/ProposalStatusBadge';
import { getVotingStart, getEffectiveDeadline } from '@/lib/proposal-status';
import { useTranslation } from '@/lib/i18n';

export interface Proposal {
  id: bigint | number;
  proposer: string;
  title: string;
  description: string;
  category: number;
  createdAt?: bigint | number;
  timestamp?: bigint | number;
  votingDeadline: bigint | number;
  customStart?: Date;
  customDeadline?: Date;
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
  const { t } = useTranslation();
  const [hasMounted, setHasMounted] = React.useState(false);
  
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const forVotes = Number(proposal.forVotes);
  const againstVotes = Number(proposal.againstVotes);
  const abstainVotes = Number(proposal.abstainVotes);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;

  const votingStart = getVotingStart(proposal);
  const votingEnd = getEffectiveDeadline(proposal);
  const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

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
            <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium h-4">
              <span className="flex items-center gap-1.5"><User size={14} /> {t('proposal.proposed_by')} {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
              {hasMounted ? (
                <span className="flex items-center gap-1.5"><Clock size={14} /> {fmtDate(votingStart)} – {fmtDate(votingEnd)}</span>
              ) : (
                <span className="flex items-center gap-1.5 opacity-0"><Clock size={14} /> --/--/----</span>
              )}
            </div>
          </div>
          
          <ProposalStatusBadge proposal={proposal} />
        </div>

        <div className="space-y-3">
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[11px] font-bold text-gray-500">
              <span className="text-[#1D9E75]">{forVotes} {t('common.for')}</span> ·
              <span className="text-red-500 ml-1.5">{againstVotes} {t('common.against')}</span> ·
              <span className="ml-1.5">{abstainVotes} {t('common.abstain')}</span>
            </p>
            <span className="text-[11px] font-black text-[#1D9E75] flex items-center gap-1 group-hover:gap-2 transition-all uppercase">
              {t('common.view_vote')} <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
