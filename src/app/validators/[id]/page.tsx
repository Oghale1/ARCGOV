'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Database, 
  AlertTriangle,
  Mail,
  Wallet,
  Loader2,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Data & Components
import validators from '@/data/validators.json';
import QuantumBadge from '@/components/validators/QuantumBadge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import supabase from '@/lib/supabase';
import { useAccount } from 'wagmi';

export default function ValidatorDetail() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customWallet, setCustomWallet] = useState('');

  const validator = useMemo(() => {
    return validators.find(v => v.id.toString() === id);
  }, [id]);

  // Mock chart data (30 days)
  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      uptime: 99.9 + Math.random() * 0.1
    }));
  }, []);

  if (!validator) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F1117]">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <AlertTriangle size={64} className="text-gray-200 mb-6" />
          <h2 className="text-2xl font-black mb-2">Validator Not Found</h2>
          <p className="text-gray-500 mb-8">The validator ID #{id} does not exist in our network.</p>
          <Link href="/validators" className="btn-primary px-8 py-3 rounded-xl font-bold">
            Back to Network
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const wallet = isConnected ? address : customWallet;
      const { data, error } = await supabase
        .from('delegation_interest')
        .insert([
          { 
            validator_id: validator.id, 
            validator_name: validator.name,
            wallet_address: wallet,
            email: email 
          }
        ])
        .select();

      if (error) throw error;
      if (data) {
        setSubmissionId(data[0].id.toString().slice(0, 8));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit interest. Please ensure the 'delegation_interest' table exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* SECTION 6 — BACK LINK */}
        <Link href="/validators" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1D9E75] transition-colors mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to all validators
        </Link>

        {/* SECTION 1 — HEADER */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-4xl md:text-5xl font-black text-[#1D9E75] shadow-inner shrink-0">
            {validator.shortName}
          </div>
          <div className="text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{validator.name}</h1>
              <QuantumBadge status={validator.quantumStatus as any} />
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><Globe size={16} /> {validator.flagEmoji} {validator.country}</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Active</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Clock size={16} /> Arc Validator since {new Date(validator.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* SECTION 2 — STATS GRID */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Uptime</p>
            <p className={`text-2xl font-black ${validator.uptime >= 99.9 ? 'text-green-500' : 'text-amber-500'}`}>
              {validator.uptime}%
            </p>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission</p>
            <p className="text-2xl font-black">{validator.commission}%</p>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Staked</p>
            <p className="text-2xl font-black">0 USDC</p>
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Self Stake</p>
            <p className="text-2xl font-black">0 USDC</p>
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blocks Validated</p>
            <p className="text-2xl font-black">0</p>
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Slash Events</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-green-500">0</p>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-tight">Clean record</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* SECTION 3 — UPTIME HISTORY CHART */}
            <section className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Activity size={20} className="text-[#1D9E75]" />
                  30-Day Uptime History
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="day" hide />
                    <YAxis domain={[99.8, 100.1]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F1117', borderRadius: '12px', border: '1px solid #1F2937' }}
                      itemStyle={{ color: '#1D9E75', fontWeight: 'bold' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="uptime" 
                      stroke="#1D9E75" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-6 text-[10px] font-bold text-gray-400 italic">
                Mock data — live historical data coming at mainnet
              </p>
            </section>

            {/* SECTION 4 — QUANTUM READINESS CHECKLIST */}
            <section className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px]">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <Zap size={20} className="text-[#1D9E75]" />
                Quantum Upgrade Status
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Post-quantum wallet signatures', key: 'postQuantumWallet' },
                  { label: 'Private state encryption', key: 'privateStateEncryption' },
                  { label: 'Validator signature hardening', key: 'signatureHardening' },
                ].map((check) => {
                  const isDone = validator.quantumChecks[check.key as keyof typeof validator.quantumChecks];
                  return (
                    <div key={check.key} className="flex items-center justify-between p-4 bg-white dark:bg-[#0F1117] rounded-2xl border border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{check.label}</span>
                      {isDone ? (
                        <CheckCircle2 className="text-[#1D9E75]" size={20} />
                      ) : (
                        <XCircle className="text-gray-300" size={20} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            {/* SECTION 5 — DELEGATION INTEREST */}
            <section className="p-8 bg-[#0F1117] text-white rounded-[32px] space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9E75] rounded-full blur-[80px] -mr-16 -mt-16 opacity-20" />
              <div className="relative z-10">
                <ShieldCheck size={40} className="text-[#1D9E75] mb-4" />
                <h3 className="text-2xl font-black leading-tight mb-2">Staking Waitlist</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  Notify me when <span className="text-white font-bold">{validator.name}</span> opens for delegation.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20"
                >
                  JOIN WAITLIST
                </button>
              </div>
            </section>

            <div className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px] space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">About this validator</h4>
               <p className="text-xs text-gray-500 leading-relaxed">
                 {validator.description}
               </p>
               <a 
                href={validator.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D9E75] hover:underline"
               >
                 Institutional Website <ExternalLink size={14} />
               </a>
            </div>
          </aside>
        </div>
      </main>

      {/* DELEGATION INTEREST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F1117] w-full max-w-md rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-2xl scale-in-center overflow-hidden">
            <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-900">
              <h2 className="text-xl font-black">Staking Notification</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setSubmissionId(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {submissionId ? (
              <div className="p-10 text-center space-y-6">
                 <CheckCircle2 className="mx-auto text-[#1D9E75]" size={48} />
                 <h3 className="text-2xl font-black">✓ Noted.</h3>
                 <p className="text-gray-500 text-sm">
                   Reference: <span className="font-mono font-bold">{submissionId}</span>. <br />
                   You'll be notified when staking launches for this validator.
                 </p>
                 <button 
                  onClick={() => { setIsModalOpen(false); setSubmissionId(null); }}
                  className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl"
                 >
                   DONE
                 </button>
              </div>
            ) : (
              <form onSubmit={handleInterestSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Wallet size={12} /> Wallet Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="0x..."
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] font-mono text-xs font-bold"
                    value={isConnected ? address : customWallet}
                    onChange={e => !isConnected && setCustomWallet(e.target.value)}
                    disabled={isConnected}
                  />
                  {isConnected && <p className="text-[10px] text-[#1D9E75] font-bold">✓ Connected wallet auto-filled</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input 
                    type="email" 
                    required 
                    placeholder="you@example.com"
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] font-bold"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'NOTIFY ME'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function ExternalLink({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
}
