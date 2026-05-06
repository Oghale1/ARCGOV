// ArcGov — Built by Gemini — arcgov.xyz
import React from 'react';

export function QuantumBadge({ status }: { status: string }) {
  if (status === 'PQ Ready') {
    return (
      <span className="px-2 py-1 rounded bg-[#E1F5EE] dark:bg-[#1D9E75]/20 text-[#1D9E75] text-[10px] font-black italic tracking-tighter border border-[#1D9E75]/30">
        PQ READY
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
        IN PROGRESS
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-300 dark:border-gray-700">
      PENDING
    </span>
  );
}
