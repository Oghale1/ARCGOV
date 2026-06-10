'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

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
  Plus,
  Lock,
  Activity
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const RadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const RadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

// Data & Libs
import validators from '@/data/validators.json';
import { getAllProposals } from '@/lib/contract';
import { getNetworkStats, NetworkStats } from '@/lib/arc-rpc';
import { isVotingActive } from '@/lib/proposal-status';
import supabase from '@/lib/supabase';

// Components
import StatCard from '@/components/shared/StatCard';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import QuantumBadge from '@/components/validators/QuantumBadge';
import RecentProposals from '@/components/shared/RecentProposals';
import NetworkError from '@/components/shared/NetworkError';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import TestnetChip from '@/components/shared/TestnetChip';

export default function Home() {
  const { t } = useTranslation();
  const [hasMounted, setHasMounted] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [lastKnownBlock, setLastKnownBlock] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --- FETCH DATA ---
  const fetchData = React.useCallback(async (isManual = true) => {
    if (isManual) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const [stats, allProposals, meta] = await Promise.all([
        getNetworkStats(),
        getAllProposals(),
        // Off-chain deadline overrides — non-fatal: a Supabase hiccup must not
        // blank out the proposals themselves.
        supabase.from('proposal_metadata').select('*').then(r => r.data || [], () => [])
      ]);
      setNetworkStats(stats);
      setProposals((allProposals as any[]) || []);
      setMetadata((meta as any[]) || []);
      setLastFetchedAt(new Date());
      setLastKnownBlock(stats.blockNumber);
      setFetchStatus('success');
    } catch (err) {
      console.error("Data fetch error:", err);
      setFetchStatus('error');
      if (isManual) setError(t('common.error_network'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();

    // Refresh network stats every 30 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

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

  // Merge in off-chain custom deadlines so status/countdown match the rest of the app.
  const proposalsWithMetadata = useMemo(() => {
    return proposals.map(p => {
      const m = metadata.find(meta => meta.proposal_id === p.id.toString());
      return {
        ...p,
        customDeadline: m ? new Date(m.custom_deadline) : new Date(Number(p.votingDeadline) * 1000)
      };
    });
  }, [proposals, metadata]);

  // "Active" = voting genuinely open. A proposal whose deadline has passed is
  // NOT active even if its on-chain `isOpen` flag is still true (it just hasn't
  // been closed yet).
  const openProposals = useMemo(() => {
    return proposalsWithMetadata.filter(p => isVotingActive(p));
  }, [proposalsWithMetadata]);

  const recentProposals = useMemo(() => {
    // The 3 most recent *currently active* proposals to feature.
    return [...openProposals].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 3);
  }, [openProposals]);

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
      <div className="w-full border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 py-3 md:py-2 min-h-[48px] md:min-h-[40px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] md:text-[11px] font-black tracking-wider uppercase text-gray-500">
          {!hasMounted || isLoading ? (
            <div className="flex items-center gap-6">
              <SkeletonLoader width="80px" height="12px" />
              <SkeletonLoader width="80px" height="12px" />
              <SkeletonLoader width="80px" height="12px" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className={`flex items-center gap-1.5 whitespace-nowrap transition-opacity duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                {t('common.block')} <span className={`text-gray-900 dark:text-white ${isRefreshing ? 'animate-pulse' : ''}`}>
                  {fetchStatus === 'error' ? `~${lastKnownBlock}` : `#${networkStats?.blockNumber}`}
                </span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {t('common.finality')} <span className="text-gray-900 dark:text-white">{networkStats?.finality}</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {t('common.validators')} <span className="text-gray-900 dark:text-white">{networkStats?.totalValidators}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Arc Testnet <span className="hidden md:inline text-gray-400">5042002</span>
             </span>
          </div>
        </div>
      </div>

      <main className="flex-grow">
        {/* SECTION 2 — HERO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest mb-6 border border-[#1D9E75]/20 uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
             {t('common.testnet')}
           </div>
           <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.85] text-gray-900 dark:text-white uppercase">
             {t('home.hero_title')}
           </h1>
           <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed">
             {t('home.hero_subtitle')}
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/governance" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 h-16 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-xl shadow-[#1D9E75]/20 flex items-center justify-center gap-2 group uppercase tracking-widest text-sm">
                   {t('home.view_proposals')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/validators" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 h-16 bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white font-black rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-[#1D9E75] transition-all active:scale-95 uppercase tracking-widest text-sm">
                   {t('home.meet_validators')}
                </button>
              </Link>
           </div>
        </section>

        {/* SECTION 3 — STAT CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t('home.total_staked')}
              value={<>0 USDC <TestnetChip /></>}
              subtext={t('home.testnet_live')}
              isLoading={isLoading}
            />
            <StatCard
              label={t('home.active_validators')}
              value="8"
              subtext={t('home.proof_of_authority')}
              isLoading={isLoading}
            />
            <StatCard
              label={t('home.open_proposals')}
              value={openProposals.length.toString()}
              subtext={t('home.community_driven')}
              isLoading={isLoading}
            />
            <StatCard
              label={t('home.governance_health')}
              value={healthMetrics.score.toString()}
              subtext={healthMetrics.hasProposals ? t('home.live_network_health') : t('home.testnet_baseline')}
              isLoading={isLoading}
            />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
          {/* SECTION 4 — GOVERNANCE HEALTH SCORE */}
          <div className="lg:col-span-1 bg-gray-50/50 dark:bg-gray-900/30 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-full h-48 mb-6 flex flex-col items-center justify-center">
              {hasMounted ? (
                <>
                  <div className="absolute inset-0">
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
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black" style={{ color: healthMetrics.color }}>{healthMetrics.score}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('home.score')}</span>
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 rounded-full border-8 border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-center">
                  <span className="text-gray-300 font-black text-2xl">--</span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">{t('home.governance_health')}</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-[200px]">
              {t('home.health_desc')}
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0F1117] rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
               <span className="text-[10px] font-bold text-gray-400">{t('home.updates_live')}</span>
            </div>
          </div>

          {/* SECTION 5 — ACTIVE PROPOSALS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">{t('home.active_proposals')}</h2>
              <Link href="/governance" className="text-sm font-bold text-[#1D9E75] hover:underline flex items-center gap-1">
                {t('home.view_all_proposals')} <ChevronRight size={16} />
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

                  return (
                    <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                      <div className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-[#1D9E75] transition-all group">
                         <div className="flex items-center gap-3 mb-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${categoryColors[p.category] || categoryColors[3]}`}>
                               {categoryLabels[p.category] || 'ECOSYSTEM'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-400">#{p.id.toString().padStart(3, '0')}</span>
                         </div>
                         <h4 className="text-lg font-bold group-hover:text-[#1D9E75] transition-colors mb-2">{p.title}</h4>
                         <p className="text-xs text-gray-500 line-clamp-1 mb-4">{p.description}</p>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                                  <span className="text-[10px] font-black uppercase text-[#1D9E75]">{Number(p.forVotes)} {t('common.for')}</span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  <span className="text-[10px] font-black uppercase text-red-500">{Number(p.againstVotes)} {t('common.against')}</span>
                               </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[#1D9E75] transition-all" />
                         </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-12 text-center">
                 <p className="text-gray-400 text-sm font-bold">{t('home.no_active_proposals')}</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6 — ACTIVITY FEED */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">{t('home.recent_activity')}</h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1D9E75]/10 rounded-full border border-[#1D9E75]/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
                 <span className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest">{t('home.live_feed')}</span>
              </div>
           </div>
           <RecentProposals proposals={proposalsWithMetadata} isLoading={isLoading} />
        </section>

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

        {/* SECTION 7 — BUILD ON ARC */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
           <div className="p-12 md:p-16 bg-[#0F1117] rounded-[48px] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D9E75] rounded-full blur-[150px] -mr-48 -mt-48 opacity-20" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                          {t('home.cta_title')}
                       </h2>
                       <p className="text-gray-400 text-lg font-medium leading-relaxed">
                          {t('home.cta_subtitle')}
                       </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                       <Link href="/governance">
                          <button className="px-8 h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2 group uppercase tracking-widest text-xs">
                             {t('home.submit_proposal')} <Plus size={18} />
                          </button>
                       </Link>
                       <Link href="/architects">
                          <button className="px-8 h-14 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all uppercase tracking-widest text-xs">
                             {t('home.join_architects')}
                          </button>
                       </Link>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-2">
                       <p className="text-3xl font-black text-[#1D9E75]">31.5%</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{t('home.projected_yield')}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-2">
                       <p className="text-3xl font-black text-white">8</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{t('home.tier1_validators')}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-2 col-span-2">
                       <p className="text-lg font-bold text-white leading-relaxed">
                          &quot;{t('home.cta_quote')}&quot;
                       </p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight mt-2">{t('home.cta_quote_author')}</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
