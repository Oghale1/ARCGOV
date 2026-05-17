'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useMemo } from 'react';
import { ArrowRight, Info, Zap } from 'lucide-react';

interface ProposalDiffProps {
  title: string;
  description: string;
}

/**
 * Automatically detects and visualizes parameter changes in proposals
 */
export default function ProposalDiff({ title, description }: ProposalDiffProps) {
  const diffData = useMemo(() => {
    // Regex to catch patterns like "from 5% to 10%", "increase 100 to 200", "reduce commission to 2%"
    const fromToRegex = /(?:from|from\s+)([\d.]+%?)\s+(?:to|to\s+)([\d.]+%?)/i;
    const changeRegex = /(?:increase|reduce|lower|raise|change|update)\s+.*?\s+(?:to\s+)?([\d.]+%?)/i;

    const fromToMatch = description.match(fromToRegex);
    
    if (fromToMatch) {
      return {
        before: fromToMatch[1],
        after: fromToMatch[2],
        label: "Parameter Change Detected"
      };
    }

    // If only one value found after a change verb
    const changeMatch = description.match(changeRegex);
    if (changeMatch) {
      return {
        before: "Current",
        after: changeMatch[1],
        label: "Value Adjustment Detected"
      };
    }

    // Check if the title itself implies a change
    const titleMatch = title.match(fromToRegex);
    if (titleMatch) {
      return {
        before: titleMatch[1],
        after: titleMatch[2],
        label: "Target Parameters"
      };
    }

    return null;
  }, [title, description]);

  if (!diffData) return null;

  return (
    <div className="my-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px] overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Zap size={14} className="text-[#1D9E75]" /> Proposed Change
          </h4>
          <span className="px-2 py-0.5 rounded bg-[#1D9E75]/10 text-[#1D9E75] text-[9px] font-black uppercase tracking-widest">
            {diffData.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 p-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl text-center">
             <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Before</p>
             <p className="text-2xl font-black text-red-600 dark:text-red-500 font-mono">{diffData.before}</p>
          </div>

          <div className="shrink-0 text-gray-300">
             <ArrowRight size={24} strokeWidth={3} />
          </div>

          <div className="flex-1 p-5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-2xl text-center">
             <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">After</p>
             <p className="text-2xl font-black text-green-600 dark:text-green-500 font-mono">{diffData.after}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-gray-400 italic">
           <Info size={12} /> This change will be applied to the protocol automatically if the proposal passes.
        </div>
      </div>
    </div>
  );
}
