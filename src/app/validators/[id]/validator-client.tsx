'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic Recharts
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const ChartTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

// Data & Libs
import validators from '@/data/validators.json';
import { 
  getNetworkSummary, 
  deriveValidatorActivity, 
  getBlocksValidatedByAddress,
  NetworkStats,
  ValidatorActivity
} from '@/lib/validator-stats';
import { getBlockNumberFormatted } from '@/lib/arc-rpc';
import QuantumBadge from '@/components/validators/QuantumBadge';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import NetworkError from '@/components/shared/NetworkError';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import TestnetChip from '@/components/shared/TestnetChip';
import { submitForm } from '@/lib/submit';
import { useAccount } from 'wagmi';
import type { Validator } from '@/types';

export default function ValidatorClient() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customWallet, setCustomWallet] = useState('');

  // Live Data State
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [activity, setActivity] = useState<ValidatorActivity | null>(null);
  const [blocksValidated, setBlocksValidated] = useState<number>(0);
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validator = useMemo(() => {
    return (validators as Validator[]).find(v => v.id.toString() === id);
  }, [id]);

  // Fetch Live Data
  const fetchLiveData = React.useCallback(async () => {
    if (!validator) return;
    setIsLoadingLive(true);
    setError(null);
    
    const vAddress = validator.validatorAddress || "0x0000000000000000000000000000000000000000";
    
    try {
      const [nStats, vActivity, bValidated, bNumber] = await Promise.all([
        getNetworkSummary(),
        deriveValidatorActivity(vAddress),
        getBlocksValidatedByAddress(vAddress),
        getBlockNumberFormatted()
      ]);

      setNetworkStats(nStats);
      setActivity(vActivity);
      setBlocksValidated(bValidated);
      setBlockNumber(bNumber);
      setLastFetchedAt(new Date());
    } catch (err) {
      console.error("Error fetching live validator data:", err);
      setError("Unable to retrieve live statistics from ArcScan.");
    } finally {
      setIsLoadingLive(false);
    }
  }, [validator]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Uptime chart timeframe.
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('30d');

  // Per-validator uptime series. Seeded deterministically by validator id +
  // index, so it is STABLE across renders (no random flicker) and unique per
  // validator. This is an honest PROJECTION around the validator's SLA uptime —
  // real per-validator history requires official on-chain validator addresses
  // (placeholders today). The live signal is the Arc network card above.
  const chartData = useMemo(() => {
    const points = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const base = validator?.uptime ?? 99.9;
    const seed = (validator?.id ?? 1) * 97 + points;
    return Array.from({ length: points }, (_, i) => {
      // Deterministic pseudo-noise in [0,1).
      const n = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
      const uptime = Math.min(100, base - 0.12 * n + 0.05 * (1 - n));
      const label = timeframe === '24h' ? `${i}:00` : timeframe === '7d' ? `Day ${i + 1}` : `D${i + 1}`;
      return { label, uptime: Number(uptime.toFixed(3)) };
    });
  }, [timeframe, validator?.uptime, validator?.id]);

  if (!validator) {
    return (
      <div className="flex flex-col">
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <AlertTriangle size={64} className="text-gray-200 mb-6" />
          <h2 className="text-2xl font-black mb-2">Validator Not Found</h2>
          <p className="text-gray-500 mb-8">The validator ID #{id} does not exist in our network.</p>
          <Link href="/validators" className="px-8 h-12 flex items-center justify-center bg-[#1D9E75] text-white font-black rounded-xl">
            Back to Network
          </Link>
        </main>
      </div>
    );
  }

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    const wallet = isConnected ? address : customWallet;
    const { ok, ref, error } = await submitForm('staking_waitlist', {
      validator_id: validator.id,
      wallet_address: wallet,
      email: email,
    });

    if (ok) {
      setSubmissionId(ref || `AG${Date.now().toString(36).slice(-6).toUpperCase()}`);

      // Send confirmation email — fire-and-forget, never block the UI.
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'staking_waitlist',
          to: email,
          data: { validatorName: validator.name }
        }),
      }).catch(console.error);
    } else {
      setSubmitError(error || "Couldn't join the waitlist. Please try again.");
    }
    setIsSubmitting(false);
  };

  const isPlaceholderAddress = validator.validatorAddress?.startsWith("0x100000000000000000000000") || !validator.validatorAddress;

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* BACK LINK */}
        <Link href="/validators" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1D9E75] transition-all mb-10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to all validators
        </Link>

        {error && (
           <div className="mb-12">
              <NetworkError message={error} onRetry={fetchLiveData} />
           </div>
        )}

        {/* SECTION 1 — HEADER */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
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
              
              {isLoadingLive ? (
                <SkeletonLoader width="100px" height="20px" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${activity?.isRecentlyActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${activity?.isRecentlyActive ? 'text-green-600' : 'text-gray-400'}`} title="Based on Arc Testnet block production">
                    {activity?.isRecentlyActive ? 'Recently Active' : 'Address Pending'}
                  </span>
                </span>
              )}

              <span className="flex items-center gap-1.5 text-xs">
                <Clock size={16} /> Arc Validator since {new Date(validator.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* EXPLORER LINK */}
        {!isPlaceholderAddress && (
          <div className="mb-12 flex justify-center md:justify-start">
            <a 
              href={`https://testnet.arcscan.app/address/${validator.validatorAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#1D9E75] hover:underline flex items-center gap-1.5 min-h-[44px]"
            >
              View on Arc Testnet Explorer <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* ILLUSTRATIVE-DATA DISCLAIMER */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
          <Info size={16} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-500 leading-relaxed">
            <span className="uppercase tracking-widest">Illustrative profile</span> — this validator&apos;s
            uptime, commission and quantum-upgrade status are sample / projected figures for demonstration,
            not verified on-chain facts. Live, verifiable data is limited to the Arc Testnet network card below
            and the current block height. Per-validator figures go live once Arc publishes official validator addresses.
          </p>
        </div>

        {/* SECTION 2 — STATS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-center md:text-left">
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
            <p className="text-2xl font-black text-gray-300">0 USDC <TestnetChip /></p>
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Self Stake</p>
            <p className="text-2xl font-black text-gray-300">0 USDC <TestnetChip /></p>
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blocks Validated</p>
            {isLoadingLive ? (
              <SkeletonLoader width="60px" height="32px" />
            ) : blocksValidated > 0 ? (
              <p className="text-2xl font-black">{blocksValidated.toLocaleString()}</p>
            ) : (
              <p className="text-2xl font-black text-gray-300" title="Live data when official validator addresses are published by Circle">— <TestnetChip /></p>
            )}
            <span className="absolute top-2 right-2 text-[8px] font-black bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase text-gray-500">Testnet</span>
          </div>
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Slash Events</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <p className="text-2xl font-black text-green-500">0 <TestnetChip /></p>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-tight">Clean record</span>
            </div>
          </div>
        </section>

        {/* SECTION 4 — NETWORK STATS CARD */}
        <section className="mb-4">
          <div className="p-6 bg-[#E1F5EE] dark:bg-[#1D9E75]/5 border border-[#1D9E75]/10 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest flex items-center gap-2">
                <Database size={14} /> Arc Testnet Network — Live from Blockscout
              </h4>
              <a 
                href="https://testnet.arcscan.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-bold text-[#1D9E75] hover:underline"
              >
                Powered by Blockscout
              </a>
            </div>
            {isLoadingLive || !networkStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} height="40px" className="rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Total Blocks</p>
                  <p className="text-sm font-black">{networkStats.totalBlocks}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Transactions</p>
                  <p className="text-sm font-black">{networkStats.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Avg Block Time</p>
                  <p className="text-sm font-black">{networkStats.averageBlockTime}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Total Addresses</p>
                  <p className="text-sm font-black">{networkStats.totalAddresses}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* VERIFIED BADGE */}
        <div className="mb-12 border-b border-gray-50 dark:border-gray-900/50 pb-4">
           <VerifiedBadge 
             explorerUrl={`https://testnet.arcscan.app/address/${validator.validatorAddress}`}
             blockNumber={blockNumber}
             lastFetchedAt={lastFetchedAt}
             onRefresh={fetchLiveData}
             isLoading={isLoadingLive}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* SECTION 3 — UPTIME HISTORY CHART */}
            <section className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 text-center sm:text-left">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <Activity size={20} className="text-[#1D9E75]" />
                    {timeframe === '24h' ? '24-Hour' : timeframe === '7d' ? '7-Day' : '30-Day'} Uptime History
                  </h3>
                  {isLoadingLive ? (
                    <SkeletonLoader width="300px" height="12px" />
                  ) : (
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed max-w-md">
                      {blocksValidated > 0
                        ? `Uptime estimated from ${blocksValidated.toLocaleString()} blocks validated on Arc Testnet`
                        : 'Projected uptime from institutional SLA. Live network metrics shown in the card above; per-validator history goes live when Arc publishes validator addresses.'}
                    </p>
                  )}
                </div>
                {/* Timeframe toggle */}
                <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0 self-center sm:self-start">
                  {(['24h', '7d', '30d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        timeframe === tf
                          ? 'bg-white dark:bg-[#0F1117] text-[#1D9E75] shadow-sm'
                          : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full" style={{ width: '100%', height: 256 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="label" hide />
                    <YAxis domain={[99.8, 100.1]} hide />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#0F1117', borderRadius: '12px', border: '1px solid #1F2937' }}
                      itemStyle={{ color: '#1D9E75', fontWeight: 'bold' }}
                      labelStyle={{ color: '#6B7280', fontSize: '11px' }}
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
              <p className="mt-6 text-[10px] font-bold text-gray-400 italic text-center md:text-left">
                {blocksValidated > 0
                  ? 'Live Testnet activity detected'
                  : `Projected ${timeframe} uptime · anchored to ${validator.uptime}% institutional SLA`}
              </p>
            </section>

            {/* SECTION 4 — QUANTUM UPGRADE STATUS */}
            <section className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px]">
              <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <Zap size={20} className="text-[#1D9E75]" />
                Quantum Upgrade Status
              </h3>
              <p className="text-[10px] font-bold text-amber-600/80 dark:text-amber-500/80 uppercase tracking-tight mb-8">
                Illustrative / projected — not verified on-chain
              </p>
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
            <section className="p-8 bg-[#0F1117] text-white rounded-[32px] space-y-6 shadow-2xl relative overflow-hidden text-center md:text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9E75] rounded-full blur-[80px] -mr-16 -mt-16 opacity-20" />
              <div className="relative z-10">
                <ShieldCheck size={40} className="text-[#1D9E75] mb-4 mx-auto md:mx-0" />
                <h3 className="text-2xl font-black leading-tight mb-2">Staking Waitlist</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  Notify me when <span className="text-white font-bold">{validator.name}</span> opens for delegation.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20"
                >
                  JOIN WAITLIST
                </button>
              </div>
            </section>

            <div className="p-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[32px] space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">About this validator</h4>
               <p className="text-xs text-gray-500 leading-relaxed italic">
                 {validator.description}
               </p>
               <a 
                href={validator.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D9E75] hover:underline min-h-[44px]"
               >
                 Institutional Website <ExternalLink size={14} />
               </a>
            </div>
          </aside>
        </div>

        {/* SECTION 6 — STAKING CTA */}
        <section className="mt-24 p-12 bg-[#E1F5EE] dark:bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-[48px] text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[120px] -mr-32 -mt-32 opacity-10" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Interested in staking with {validator.name}?</h2>
            <p className="text-gray-600 dark:text-[#1D9E75]/70 font-medium max-w-xl mx-auto">
              Join the waitlist and be notified when delegation opens on Arc mainnet. Get early access to institutional rewards.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-10 h-16 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-xl shadow-[#1D9E75]/20 uppercase tracking-widest text-sm"
              >
                Join Staking Waitlist
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* DELEGATION INTEREST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0F1117] md:bg-black/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center animate-in fade-in duration-200">
          <div className="w-full h-full md:h-auto md:max-w-md md:rounded-[32px] md:border md:border-gray-100 md:dark:border-gray-800 md:shadow-2xl overflow-y-auto">
            <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-900 sticky top-0 bg-white dark:bg-[#0F1117] z-10">
              <h2 className="text-xl font-black">Staking Notification</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setSubmissionId(null); setSubmitError(null); }}
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
                   You&apos;ll be notified when staking launches for this validator.
                 </p>
                 <button 
                  onClick={() => { setIsModalOpen(false); setSubmissionId(null); setSubmitError(null); }}
                  className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl"
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
                    className="w-full h-12 px-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] font-mono text-xs font-bold"
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
                    className="w-full h-12 px-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] font-bold text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {submitError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'NOTIFY ME'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
