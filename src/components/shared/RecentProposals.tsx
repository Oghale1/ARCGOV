'use client';
// ArcGov — arcgov.vercel.app
// Home page "Recent Activity" — driven by real proposals (not a short event
// window), newest first, paginated 10 at a time with numbered page buttons.
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types';
import { getProposalStatus } from '@/lib/proposal-status';
import ProposalStatusBadge from '@/components/shared/ProposalStatusBadge';
import SkeletonLoader from '@/components/shared/SkeletonLoader';

const PAGE_SIZE = 10;

/** Build a compact page list like [1, '…', 4, 5, 6, '…', 12]. */
function getPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('…');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('…');
  items.push(total);
  return items;
}

export default function RecentProposals({
  proposals,
  isLoading = false,
}: {
  proposals: any[];
  isLoading?: boolean;
}) {
  const [page, setPage] = useState(1);

  // Newest first. Sort by id (monotonic on-chain counter) — reliable even if
  // the on-chain timestamp field is unavailable.
  const sorted = useMemo(
    () => [...proposals].sort((a, b) => Number(b.id) - Number(a.id)),
    [proposals]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonLoader key={i} height="84px" className="rounded-2xl" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] space-y-6">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto">
          <ClipboardList className="text-gray-300" size={32} />
        </div>
        <div className="space-y-2">
          <p className="font-bold text-gray-500">No governance activity yet.</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Be the first — submit a proposal to start the conversation.
          </p>
        </div>
        <Link
          href="/governance"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D9E75] text-white text-xs font-black uppercase rounded-xl hover:bg-[#0F6E56] transition-all"
        >
          Submit First Proposal <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {pageItems.map((p: any) => {
          const status = getProposalStatus(p);
          const forVotes = Number(p.forVotes);
          const againstVotes = Number(p.againstVotes);
          return (
            <Link key={p.id.toString()} href={`/governance/${p.id}`}>
              <div className="p-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                          CATEGORY_COLORS[p.category] || CATEGORY_COLORS[3]
                        }`}
                      >
                        {CATEGORY_LABELS[p.category] || 'ECOSYSTEM'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-400">
                        #{p.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                    <p className="text-sm font-bold truncate leading-snug group-hover:text-[#1D9E75] transition-colors">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-[#1D9E75]">{forVotes} For</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-red-500">{againstVotes} Against</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Plain status pill (no countdown) keeps rows compact */}
                  <ProposalStatusBadge proposal={p} showCountdown={false} />
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-[#1D9E75] transition-all"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-100"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageItems(safePage, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-xs font-black">
                …
              </span>
            ) : (
              <button
                key={item}
                onClick={() => setPage(item)}
                aria-current={item === safePage ? 'page' : undefined}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                  item === safePage
                    ? 'bg-[#1D9E75] text-white shadow-md shadow-[#1D9E75]/20'
                    : 'border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-[#1D9E75] hover:border-[#1D9E75]'
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-gray-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
