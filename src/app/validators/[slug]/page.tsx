'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { QuantumBadge } from '@/components/validators/QuantumBadge';
import { 
  ArrowLeft, 
  Activity, 
  Shield, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import validators from '@/data/validators.json';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockUptimeData = [
  { day: 'Apr 27', uptime: 99.98 },
  { day: 'Apr 28', uptime: 99.95 },
  { day: 'Apr 29', uptime: 99.99 },
  { day: 'Apr 30', uptime: 99.97 },
  { day: 'May 01', uptime: 99.92 },
  { day: 'May 02', uptime: 99.98 },
  { day: 'May 03', uptime: 99.97 },
];

export default function ValidatorDetail() {
  const { slug } = useParams();
  const v = validators.find((val) => val.slug === slug);

  if (!v) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Validator Not Found</h1>
            <Link href="/validators" className="text-[#1D9E75] hover:underline mt-4 block">Back to Network</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link href="/validators" className="flex items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#1D9E75] mb-10 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Network
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          <div className="flex-grow space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-4xl font-black text-[#1D9E75] shadow-inner">
                {v.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black tracking-tight">{v.name}</h1>
                  <QuantumBadge status={v.quantum} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Shield size={16} className="text-[#1D9E75]" /> {v.institution}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{v.location}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1.5 text-green-600 font-bold uppercase tracking-wider text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {v.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-[#1F2937]/20 rounded-2xl border border-gray-100 dark:border-[#1F2937]">
                <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Commission</p>
                <p className="text-2xl font-black font-mono">{v.commission}%</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-[#1F2937]/20 rounded-2xl border border-gray-100 dark:border-[#1F2937]">
                <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Total Uptime</p>
                <p className="text-2xl font-black font-mono text-[#1D9E75]">{v.uptime}%</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-[#1F2937]/20 rounded-2xl border border-gray-100 dark:border-[#1F2937]">
                <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Blocks Signed</p>
                <p className="text-2xl font-black font-mono">1.2M+</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-[#1F2937]/20 rounded-2xl border border-gray-100 dark:border-[#1F2937]">
                <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Self-Stake</p>
                <p className="text-2xl font-black font-mono">5.2M USDC</p>
              </div>
            </div>

            {/* Chart */}
            <div className="p-8 bg-white dark:bg-[#1F2937]/10 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                   <Activity size={20} className="text-[#1D9E75]" />
                   Uptime History
                 </h3>
                 <span className="text-xs font-medium text-[#6B7280]">Last 7 Days</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockUptimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[99.9, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#1D9E75' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="uptime" 
                      stroke="#1D9E75" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#1D9E75', strokeWidth: 0 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] font-bold text-[#6B7280]">
                <span>ARC TESTNET MAIN POOL</span>
                <span>DATA UPDATED EVERY 60S</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-96 space-y-8">
            {/* Delegation Box */}
            <div className="p-8 bg-[#0F1117] text-white rounded-3xl space-y-6">
              <h3 className="text-2xl font-black italic">Start Staking</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Staking for the Arc network is coming soon with the native Arc PoS token. 
                Join the waitlist to be notified when delegation opens for this validator.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-1">
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase">Target APY</p>
                  <p className="text-xl font-black font-mono">7.2% USDC</p>
                </div>
                <button className="w-full py-4 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20">
                  DELEGATE NOW
                </button>
              </div>
            </div>

            {/* Quantum Upgrade Checklist */}
            <div className="p-8 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock size={20} className="text-[#1D9E75]" />
                Quantum Roadmap
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'PQ Wallet Signatures', done: v.quantum === 'PQ Ready' },
                  { label: 'Private State Encryption', done: false },
                  { label: 'Signature Hardening', done: v.quantum === 'PQ Ready' },
                ].map((step) => (
                  <div key={step.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B7280]">{step.label}</span>
                    {step.done ? (
                      <CheckCircle2 size={18} className="text-[#1D9E75]" />
                    ) : (
                      <Clock size={18} className="text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
