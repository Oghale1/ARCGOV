'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ValidatorTable } from '@/components/validators/ValidatorTable';
import { Search, Filter, ShieldCheck, Info } from 'lucide-react';
import validatorsData from '@/data/validators.json';

export default function Validators() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredValidators = useMemo(() => {
    return validatorsData.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                           v.institution.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || v.quantum === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#1D9E75] font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldCheck size={16} /> Arc Validator Network
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Network Security</h1>
            <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
              Meet the institutional validators securing the Arc blockchain with sub-second finality.
            </p>
          </div>
          <div className="p-4 bg-[#E1F5EE] dark:bg-[#1D9E75]/10 rounded-xl border border-[#1D9E75]/20">
             <div className="flex items-center gap-2 text-[#0F6E56] dark:text-[#1D9E75]">
                <span className="text-2xl font-black">{validatorsData.length}</span>
                <span className="text-xs font-bold uppercase tracking-wide">Active Nodes</span>
             </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Filter by name or institution..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#1D9E75]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             {['All', 'PQ Ready', 'In Progress', 'Pending'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap",
                  filter === f 
                    ? "bg-[#1D9E75] border-[#1D9E75] text-white" 
                    : "bg-white dark:bg-[#1F2937]/30 border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] hover:border-[#1D9E75]"
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <ValidatorTable validators={filteredValidators} />

        {/* Note Section */}
        <div className="mt-12 p-6 bg-gray-50 dark:bg-[#1F2937]/20 rounded-2xl border border-gray-100 dark:border-[#1F2937] flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white dark:bg-[#1F2937] shadow-sm">
              <Info className="text-[#1D9E75]" />
            </div>
            <div className="max-w-xl">
              <h3 className="font-bold mb-1">About Arc Validators</h3>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                Arc validators are selected through a rigorous institutional vetting process. They ensure the integrity of the USDC-native economy. 
                Quantum readiness (PQ) is a mandatory requirement for mainnet onboarding.
              </p>
            </div>
          </div>
          <button className="btn-primary whitespace-nowrap">
            APPLY AS VALIDATOR
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
