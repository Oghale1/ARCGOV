// ArcGov — Built by Gemini — arcgov.xyz
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  label?: string;
  subValue?: string;
}

export function StatCard({ title, value, icon: Icon, label, subValue }: StatCardProps) {
  return (
    <div className="stat-card group hover:border-[#1D9E75] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-[#E1F5EE] dark:bg-[#1D9E75]/10 text-[#1D9E75]">
          <Icon size={20} />
        </div>
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E5E7EB] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]">
            {label}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-[#111827] dark:text-white leading-none tracking-tight">
            {value}
          </h3>
          {subValue && (
            <span className="text-xs font-medium text-[#1D9E75]">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
