// ArcGov — Built by Gemini — arcgov.vercel.app
import React from 'react';
import Link from 'next/link';
import QuantumBadge from './QuantumBadge';
import { ChevronRight, Globe, Shield } from 'lucide-react';

export interface Validator {
  rank: number;
  name: string;
  institution: string;
  country: string;
  location: string;
  uptime: number;
  commission: number;
  quantum: string;
  status: string;
  slug: string;
}

export function ValidatorTable({ validators }: { validators: Validator[] }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#1F2937]/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-[#1F2937]/50 border-b border-[#E5E7EB] dark:border-[#1F2937]">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Rank</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Validator</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Location</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Uptime</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Commission</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Quantum</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
          {validators.map((v) => (
            <tr key={v.slug} className="group hover:bg-gray-50 dark:hover:bg-[#1D9E75]/5 transition-colors">
              <td className="px-6 py-5">
                <span className="text-sm font-black text-[#6B7280] group-hover:text-[#1D9E75]">
                  #{v.rank}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-[#1D9E75]">
                    {v.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827] dark:text-white leading-none mb-1">{v.name}</p>
                    <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-tighter">{v.institution}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Globe size={14} className="text-[#6B7280]" />
                  {v.country}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono">{v.uptime}%</span>
                  <div className="w-12 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1D9E75]" style={{ width: `${v.uptime}%` }}></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-sm font-bold font-mono">
                {v.commission}%
              </td>
              <td className="px-6 py-5">
                <QuantumBadge status={v.quantum as any} />
              </td>
              <td className="px-6 py-5 text-right">
                <Link 
                  href={`/validators/${v.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1D9E75] hover:underline"
                >
                  DETAILS <ChevronRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
