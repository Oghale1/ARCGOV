// ArcGov — arcgov.vercel.app
// One badge to render a proposal's current state everywhere, so "Active",
// "Passed" and "Cancelled" always look and mean the same thing across the app.
import React from 'react';
import CountdownTimer from '@/components/shared/CountdownTimer';
import {
  getProposalStatus,
  getEffectiveDeadline,
  type ProposalLike,
} from '@/lib/proposal-status';

interface ProposalStatusBadgeProps {
  proposal: ProposalLike;
  /** Show the live countdown while Active (default). Set false for a plain dot+label. */
  showCountdown?: boolean;
  className?: string;
}

const STATUS_STYLES: Record<string, { wrap: string; dot: string; text: string }> = {
  Passed: {
    wrap: 'bg-blue-100 dark:bg-blue-900/20',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
  },
  Failed: {
    wrap: 'bg-red-100 dark:bg-red-900/20',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
  },
  Rejected: {
    wrap: 'bg-amber-100 dark:bg-amber-900/20',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-500',
  },
  Active: {
    wrap: 'bg-green-100 dark:bg-green-900/20',
    dot: 'bg-green-500 animate-pulse',
    text: 'text-[#1D9E75]',
  },
};

export default function ProposalStatusBadge({
  proposal,
  showCountdown = true,
  className = '',
}: ProposalStatusBadgeProps) {
  const status = getProposalStatus(proposal);
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${styles.wrap} ${className}`}
    >
      {status === 'Active' && showCountdown ? (
        <CountdownTimer deadline={getEffectiveDeadline(proposal)} />
      ) : (
        <>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          <span className={styles.text}>{status}</span>
        </>
      )}
    </div>
  );
}
