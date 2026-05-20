'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowRight, 
  Vote, 
  ShieldCheck, 
  Coins, 
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';

const RadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const RadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

// Data & Libs
import validators from '@/data/validators.json';
import { getAllProposals } from '@/lib/contract';
import { getNetworkStats, NetworkStats } from '@/lib/arc-rpc';

// Components
import StatCard from '@/components/shared/StatCard';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import QuantumBadge from '@/components/validators/QuantumBadge';
import ActivityFeed from '@/components/shared/ActivityFeed';
import NetworkError from '@/components/shared/NetworkError';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import TestnetChip from '@/components/shared/TestnetChip';

export default function Home() {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [lastKnownBlock, setLastKnownBlock] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'success' | 'error'>('success');

  // --- FETCH DATA ---
  const fetchData = async (isManual = true) => {
    if (isManual) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const [stats, allProposals] = await Promise.all([
        getNetworkStats(),
        getAllProposals()
      ]);
      setNetworkStats(stats);
      setProposals((allProposals as any[]) || []);
      setLastFetchedAt(new Date());
      setLastKnownBlock(stats.blockNumber);
      setFetchStatus('success');
    } catch (err) {
      console.error("Data fetch error:", err);
      setFetchStatus('error');
      if (isManual) setError("Unable to sync with Arc Testnet nodes.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh network stats every 30 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // --- HEALTH SCORE CALCULATION ---
  const healthMetrics = useMemo(() => {
    // 1. Validator Uptime Score (40% weight)
    const avgUptime = validators.reduce((acc, v) => acc + v.uptime, 0) / validators.length;
    
    // 2. Quantum Score (30% weight)
    const readyCount = validators.filter(v => v.quantumStatus === 'ready').length;
    const quantumScore = (readyCount / validators.length) * 100;

    // 3. Participation Score (30% weight)
    let participationScore = 0;
    if (proposals.length > 0) {
      const activeProposals = proposals.filter(p => {
        const totalVotes = Number(p.forVotes) + Number(p.againstVotes);
        return totalVotes > 5;
      });
      participationScore = (activeProposals.length / proposals.length) * 100;
    }

    const finalScore = Math.round(
      (avgUptime * 0.4) + 
      (quantumScore * 0.3) + 
      (participationScore * 0.3)
    );

    let color = '#1D9E75'; // Green
    if (finalScore < 60) color = '#EF4444'; // Red
    else if (finalScore < 80) color = '#F59E0B'; // Amber

    return { score: finalScore, color, hasProposals: proposals.length > 0 };
  }, [proposals]);

  const openProposals = useMemo(() => {
    return proposals.filter(p => p.isOpen);
  }, [proposals]);

  const recentProposals = useMemo(() => {
    // Return max 3 most recent open proposals
    return [...openProposals].reverse().slice(0, 3);
  }, [openProposals]);

  const quantumMetrics = useMemo(() => {
    const ready = validators.filter(v => v.quantumStatus === 'ready').length;
    const upgrading = validators.filter(v => v.quantumStatus === 'in-progress').length;
    const pending = validators.filter(v => v.quantumStatus === 'pending').length;
    return { ready, upgrading, pending };
  }, []);

  // Chart Data using calculated score
  const healthChartData = [
    { name: 'Health', value: healthMetrics.score, fill: healthMetrics.color }
  ];

  if (error) {
    return (
      <div className="flex flex-col text-gray-900 dark:text-white">
        <div className="flex-grow flex items-center justify-center p-4">
          <NetworkError message={error} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      {/* SECTION 1 — NETWORK BAR */}
      <div className="w-full border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 py-3 md:py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] md:text-[11px] font-black tracking-wider uppercase text-gray-500">
          {isLoading ? (
            <SkeletonLoader width="200px" height="12px" />
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                Block <span className="text-gray-900 dark:text-white">#{networkStats?.blockNumber}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                Finality <span className="text-gray-900 dark:text-white">{networkStats?.finality}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                Validators <span className="text-gray-900 dark:text-white">{networkStats?.totalValidators}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#1D9E75] font-black">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Arc Testnet Live
          </div>
        </div>
      </div>

      {/* VERIFIED BADGE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-gray-50 dark:border-gray-900/50">
         <VerifiedBadge 
           explorerUrl="https://testnet.arcscan.app" 
           blockNumber={fetchStatus === 'error' ? `~${lastKnownBlock}` : networkStats?.blockNumber} 
           lastFetchedAt={lastFetchedAt} 
           onRefresh={() => fetchData(false)}
           isLoading={isLoading || isRefreshing}
         />
      </div>

      <main className="flex-grow">
        {/* SECTION 2 — HERO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
            ARC GOVERNANCE <span className="text-[#1D9E75]">HUB</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            The first community governance dashboard for the Arc blockchain. 
            Submit proposals, track validators, and shape Arc&apos;s future.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/governance" className="w-full sm:w-auto px-10 h-14 flex items-center justify-center bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20">
              VIEW PROPOSALS
            </Link>
            <Link href="/validators" className="w-full sm:w-auto px-10 h-14 flex items-center justify-center border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95">
              MEET VALIDATORS
            </Link>
          </div>
        </section>

        {/* SECTION 3 — STAT CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Total Staked" 
              value={<>0 USDC <TestnetChip /></>} 
              subtext="Testnet • Live at mainnet" 
              isLoading={isLoading} 
            />
            <StatCard 
              label="Active Validators" 
              value="8" 
              subtext="Proof of Authority" 
              isLoading={isLoading} 
            />
            <StatCard 
              label="Open Proposals" 
              value={openProposals.length.toString()} 
              subtext="Community Driven" 
              isLoading={isLoading} 
            />
            <StatCard 
              label="Governance Health" 
              value={healthMetrics.score.toString()} 
              subtext={healthMetrics.hasProposals ? "Live Network Health" : "Testnet baseline"} 
              isLoading={isLoading} 
            />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          {/* SECTION 4 — GOVERNANCE HEALTH SCORE */}
          <div className="lg:col-span-1 bg-gray-50/50 dark:bg-gray-900/30 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 mb-6" style={{ width: '100%', height: 192 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="80%" 
                  outerRadius="100%" 
                  barSize={10} 
                  data={healthChartData} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <RadialBar 
                    background 
                    dataKey="value" 
                    cornerRadius={5}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black" style={{ color: healthMetrics.color }}>{healthMetrics.score}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Governance Health</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-[200px]">
              Calculated from validator uptime, quantum readiness, and community participation
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0F1117] rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
               <span className="text-[10px] font-bold text-gray-400">Updates with live on-chain data</span>
            </div>
          </div>

          {/* SECTION 5 — ACTIVE PROPOSALS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Active Proposals</h2>
              <Link href="/governance" className="text-sm font-bold text-[#1D9E75] hover:underline flex items-center gap-1">
                View All Proposals <ChevronRight size={16} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <SkeletonLoader key={i} height="120px" className="rounded-2xl" />)}
              </div>
            ) : recentProposals.length > 0 ? (
              <div className="space-y-4">
                {recentProposals.map((p: any) => {
                  const categoryColors: any = {
                    0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
                    1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
                    2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
                    3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
                  };
                  const categoryLabels: any = {
                    0: 'VALIDATOR',
                    1: 'PARAMETER',
                    2: 'UPGRADE',
                    3: 'ECOSYSTEM',
                  };
                  const totalVotes = Number(p.forVotes) + Number(p.againstVotes) + Number(p.abstainVotes);
                  const forPercent = totalVotes > 0 ? (Number(p.forVotes) / totalVotes) * 100 : 0;

                  return (
                    <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                      <div className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${categoryColors[p.category] || categoryColors[3]}`}>
                              {categoryLabels[p.category] || 'ECOSYSTEM'}
                            </span>
                            <h3 className="font-bold text-lg group-hover:text-[#1D9E75] transition-colors line-clamp-1">{p.title}</h3>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">#{p.id.toString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[11px] text-gray-500">By {p.proposer.slice(0, 6)}...{p.proposer.slice(-4)}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-bold text-[#1D9E75]">{Math.round(forPercent)}% FOR</span>
                             <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1D9E75]" style={{ width: `${forPercent}%` }} />
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                           <div className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500">
                             ~7 DAYS REMAINING
                           </div>
                           <ChevronRight size={16} className="text-gray-300 group-hover:text-[#1D9E75] transform group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[32px] text-center space-y-4">
                <p className="text-gray-500 font-medium">No proposals yet. Be the first.</p>
                <Link href="/governance" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1D9E75] text-white font-bold rounded-xl hover:bg-[#0F6E56] transition-all">
                  <Plus size={18} /> Submit Proposal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 9 — ACTIVITY FEED */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">Live Governance Activity</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1D9E75]/5 rounded-full border border-[#1D9E75]/10">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
                 <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">Real-time Feed</span>
              </div>
           </div>
           <ActivityFeed maxItems={10} />
        </section>

        {/* SECTION 6 — TOP VALIDATORS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Top Validators</h2>
            <Link href="/validators" className="text-sm font-bold text-[#1D9E75] hover:underline flex items-center gap-1">
              View all 8 validators <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {validators.slice(0, 4).map((v) => (
              <Link key={v.id} href={`/validators/${v.id}`}>
                <div className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-xs">
                        {v.shortName}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none mb-1">{v.name}</h4>
                        <QuantumBadge status={v.quantumStatus as any} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Uptime</p>
                        <p className="text-sm font-black text-[#1D9E75]">{v.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Comm.</p>
                        <p className="text-sm font-black">{v.commission}%</p>
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 7 — QUANTUM READINESS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="bg-[#0F1117] text-white rounded-[32px] p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[120px] -mr-32 -mt-32 opacity-20" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-4">Quantum Readiness</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">
                  Tracking the transition of institutional nodes to post-quantum signature schemes. 
                  Mainnet onboarding requires 100% PQ Readiness.
                </p>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-[#1D9E75]">PQ Ready</span>
                        <span>{quantumMetrics.ready} / 8 Nodes</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1D9E75]" style={{ width: `${(quantumMetrics.ready / 8) * 100}%` }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-amber-500">Upgrading</span>
                        <span>{quantumMetrics.upgrading} / 8 Nodes</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(quantumMetrics.upgrading / 8) * 100}%` }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-gray-500">Pending</span>
                        <span>{quantumMetrics.pending} / 8 Nodes</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-500" style={{ width: `${(quantumMetrics.pending / 8) * 100}%` }} />
                      </div>
                   </div>
                </div>
              </div>
              <div className="hidden lg:flex justify-center">
                 <ShieldCheck size={200} className="text-[#1D9E75] opacity-20" strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8 — WHAT IS ARCGOV */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 bg-gray-50 dark:bg-gray-900/30 rounded-[32px] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1117] flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                🗳️
              </div>
              <h3 className="text-xl font-bold">Governance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Vote on proposals that shape the Arc network, from parameter adjustments to major protocol upgrades.
              </p>
           </div>
           <div className="p-8 bg-gray-50 dark:bg-gray-900/30 rounded-[32px] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1117] flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                🏛️
              </div>
              <h3 className="text-xl font-bold">Validators</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Monitor institutional validators securing the network with sub-second finality and quantum-ready infrastructure.
              </p>
           </div>
           <div className="p-8 bg-gray-50 dark:bg-gray-900/30 rounded-[32px] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0F1117] flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                💰
              </div>
              <h3 className="text-xl font-bold">Staking</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Earn USDC rewards by delegating your Arc tokens to top-tier validators once mainnet launches.
              </p>
           </div>
        </section>
      </main>
    </div>
  );
}
-tier validators once mainnet launches.
              </p>
           </div>
        </section>
      </main>
    </div>
  );
}
