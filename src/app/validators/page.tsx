'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useMemo, useEffect } from 'react';
import QuantumBadge from '@/components/validators/QuantumBadge';
import TestnetChip from '@/components/shared/TestnetChip';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import validators from '@/data/validators.json';
import { submitForm } from '@/lib/submit';
import { 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  Globe, 
  ShieldCheck, 
  Activity,
  Cpu,
  Lock,
  X,
  Loader2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { getBlockNumberFormatted } from '@/lib/arc-rpc';
import { getBlockCounts } from '@/lib/validators';
import { useTranslation } from '@/lib/i18n';

export default function ValidatorsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rank'); // Default to ID/Rank
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [countryFilter, setCountryFilter] = useState('All');
  const [quantumFilter, setQuantumFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Live Data State
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockCounts, setBlockCounts] = useState<Record<number, number>>({});

  // Stats
  const avgUptime = useMemo(() => {
    const total = validators.reduce((acc, v) => acc + v.uptime, 0);
    return (total / validators.length).toFixed(2);
  }, []);

  const quantumReadyCount = useMemo(() => {
    return validators.filter(v => v.quantumStatus === 'ready').length;
  }, []);

  const countries = useMemo(() => {
    return ['All', ...Array.from(new Set(validators.map(v => v.country)))];
  }, []);

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [block, countsMap] = await Promise.all([
        getBlockNumberFormatted(),
        getBlockCounts()
      ]);
      setBlockNumber(block);
      setBlockCounts(countsMap);
      setLastFetchedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll Lock for Modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  // Filter & Sort Logic
  const filteredValidators = useMemo(() => {
    let result = validators.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                           v.country.toLowerCase().includes(search.toLowerCase());
      const matchesCountry = countryFilter === 'All' || v.country === countryFilter;
      const matchesQuantum = quantumFilter === 'All' || 
                            (quantumFilter === 'Ready' && v.quantumStatus === 'ready') ||
                            (quantumFilter === 'Upgrading' && v.quantumStatus === 'in-progress') ||
                            (quantumFilter === 'Pending' && v.quantumStatus === 'pending');
      return matchesSearch && matchesCountry && matchesQuantum;
    });

    result.sort((a, b) => {
      let valA: any = a[sortBy as keyof typeof a];
      let valB: any = b[sortBy as keyof typeof b];

      if (sortBy === 'quantum') {
        valA = a.quantumStatus;
        valB = b.quantumStatus;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, sortBy, sortOrder, countryFilter, quantumFilter]);

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    institution_name: '',
    country: '',
    email: '',
    infrastructure_description: '',
    quantum_status: 'Not yet started',
    experience: '',
    message: ''
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApplyError(null);
    const { ok, ref, error } = await submitForm('validator_application', formData);
    if (ok) {
      setSubmissionId(ref || `AG${Date.now().toString(36).slice(-6).toUpperCase()}`);
    } else {
      setApplyError(error || t('validators.submit_failed'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* VERIFIED BADGE */}
        <div className="mb-12 border-b border-gray-50 dark:border-gray-900/50 pb-4">
           <VerifiedBadge 
             explorerUrl="https://testnet.arcscan.app"
             blockNumber={blockNumber}
             lastFetchedAt={lastFetchedAt}
             onRefresh={fetchData}
             isLoading={isLoading}
           />
        </div>

        {/* SECTION 2 — HERO */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div className="max-w-2xl text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{t('validators.title')}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {t('validators.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-8 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20 whitespace-nowrap h-14"
            >
              {t('validators.apply_validator')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('validators.total_validators'), value: '8', icon: ShieldCheck },
              { label: t('validators.average_uptime'), value: `${avgUptime}%`, icon: Activity },
              { label: t('validators.quantum_ready'), value: `${quantumReadyCount}/8`, icon: Cpu },
              { label: t('validators.total_staked'), value: <span className="flex items-center gap-1">0 USDC <TestnetChip /></span>, icon: Lock },
            ].map((s) => (
              <div key={s.label} className="p-6 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[24px] flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-2 text-[#1D9E75]">
                  <s.icon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
                <div className="text-2xl font-black">{s.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ILLUSTRATIVE-DATA DISCLAIMER */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-500 leading-relaxed">
            <span className="uppercase tracking-widest">{t('validators.disclaimer_label')}</span> {t('validators.disclaimer')}
          </p>
        </div>

        {/* SECTION 3 — CONTROLS ROW */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder={t('validators.filter_placeholder')}
              className="w-full pl-12 pr-4 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select 
              className="px-4 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none text-xs font-bold"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              {countries.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
            <select 
              className="px-4 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none text-xs font-bold"
              value={quantumFilter}
              onChange={(e) => setQuantumFilter(e.target.value)}
            >
              <option value="All">{t('validators.all_quantum')}</option>
              <option value="Ready">{t('validators.ready')}</option>
              <option value="Upgrading">{t('validators.upgrading')}</option>
              <option value="Pending">{t('validators.pending')}</option>
            </select>
          </div>

          <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
            {[
              { label: t('validators.sort_uptime'), key: 'uptime' },
              { label: t('validators.sort_commission'), key: 'commission' },
              { label: t('validators.sort_name'), key: 'name' },
              { label: t('validators.sort_quantum'), key: 'quantum' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => toggleSort(btn.key)}
                className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  sortBy === btn.key 
                    ? 'bg-white dark:bg-[#0F1117] text-[#1D9E75] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
                <ArrowUpDown size={12} className={sortBy === btn.key ? 'text-[#1D9E75]' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4 — VALIDATORS TABLE / CARDS */}
        <div className="hidden md:block overflow-hidden bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_rank')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_institution')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_location')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_uptime')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_commission')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_blocks')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_quantum')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('validators.col_status')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('validators.col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
              {filteredValidators.map((v) => {
                const blocks = blockCounts[v.id] || 0;
                const isPlaceholder = v.validatorAddress?.startsWith("0x1000") || !v.validatorAddress;

                return (
                  <tr key={v.id} className="group hover:bg-gray-50/50 dark:hover:bg-[#1D9E75]/5 transition-colors">
                    <td className="px-6 py-6 font-mono font-bold text-gray-400">#{v.id}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-xs">
                          {v.shortName}
                        </div>
                        <span className="font-bold group-hover:text-[#1D9E75] transition-colors">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-medium flex items-center gap-2">
                      <span>{v.flagEmoji}</span>
                      <span className="text-gray-500">{v.country}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono">{v.uptime}%</span>
                        <div className="w-10 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D9E75]" style={{ width: `${v.uptime}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-bold font-mono">{v.commission}%</td>
                    <td className="px-6 py-6">
                      {isPlaceholder || blocks === 0 ? (
                        <span className="text-gray-300 font-black cursor-help" title="Live when Arc publishes validator addresses">—</span>
                      ) : (
                        <span className="text-sm font-black font-mono">{blocks.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <QuantumBadge status={v.quantumStatus as any} />
                    </td>
                    <td className="px-6 py-6">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/10 text-green-600 text-[10px] font-black uppercase tracking-widest">
                         <span className="w-1 h-1 rounded-full bg-green-500" /> {t('validators.status_active')}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right space-x-2">
                      <Link 
                        href={`/staking#${v.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black uppercase hover:bg-[#1D9E75] hover:text-white transition-all h-10"
                      >
                        {t('validators.stake')}
                      </Link>
                      <Link
                        href={`/validators/${v.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-[10px] font-black uppercase hover:bg-[#1D9E75] hover:text-white transition-all h-10"
                      >
                        {t('validators.view_profile')} <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="grid md:hidden grid-cols-1 gap-4">
          {filteredValidators.map((v) => {
            const blocks = blockCounts[v.id] || 0;
            const isPlaceholder = v.validatorAddress?.startsWith("0x1000") || !v.validatorAddress;

            return (
              <div key={v.id} className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[24px]">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-xs">
                        {v.shortName}
                      </div>
                      <div>
                         <h4 className="font-bold leading-none mb-1">{v.name}</h4>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{v.flagEmoji} {v.country}</p>
                      </div>
                    </div>
                    <QuantumBadge status={v.quantumStatus as any} />
                 </div>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('validators.col_uptime')}</p>
                      <p className="text-sm font-black font-mono">{v.uptime}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('validators.blocks')}</p>
                      <p className="text-sm font-black font-mono">
                        {isPlaceholder || blocks === 0 ? "—" : blocks.toLocaleString()}
                      </p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <Link 
                    href={`/staking#${v.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="h-12 bg-[#1D9E75] text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-[#0F6E56] transition-all"
                   >
                     {t('validators.stake_now')}
                   </Link>
                   <Link
                    href={`/validators/${v.id}`}
                    className="h-12 bg-gray-50 dark:bg-gray-900 text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-[#1D9E75] hover:text-white transition-all"
                   >
                     {t('validators.view_profile')} <ChevronRight size={14} />
                   </Link>
                 </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* SECTION 5 — VALIDATOR APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0F1117] md:bg-black/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center animate-in fade-in duration-200">
          <div className="w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] md:rounded-[32px] md:border md:border-gray-100 md:dark:border-gray-800 md:shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-md px-8 py-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-900 z-10">
              <h2 className="text-2xl font-black">{t('validators.modal_title')}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setSubmissionId(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {submissionId ? (
              <div className="p-12 text-center space-y-6">
                 <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-[#1D9E75]">
                   <CheckCircle2 size={48} />
                 </div>
                 <h3 className="text-3xl font-black tracking-tight">{t('validators.app_submitted')}</h3>
                 <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                   {t('validators.app_submitted_desc')}
                 </p>
                 <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 inline-block">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('validators.reference_id')}</p>
                    <p className="font-mono font-bold text-[#1D9E75]">{submissionId}</p>
                 </div>
                 <button
                  onClick={() => { setIsModalOpen(false); setSubmissionId(null); }}
                  className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all"
                 >
                   {t('common.close')}
                 </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.institution_name')}</label>
                    <input
                      type="text" required placeholder={t('validators.institution_placeholder')}
                      className="w-full px-5 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-bold"
                      value={formData.institution_name}
                      onChange={e => setFormData({...formData, institution_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.country')}</label>
                    <input
                      type="text" required placeholder={t('validators.country_placeholder')}
                      className="w-full px-5 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-bold"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.tech_email')}</label>
                  <input
                    type="email" required placeholder="tech@institution.com"
                    className="w-full px-5 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-bold"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.infra_desc')}</label>
                  <textarea
                    required rows={3} placeholder={t('validators.infra_placeholder')}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-medium text-sm"
                    value={formData.infrastructure_description}
                    onChange={e => setFormData({...formData, infrastructure_description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.quantum_status')}</label>
                  <select
                    className="w-full px-5 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-bold appearance-none"
                    value={formData.quantum_status}
                    onChange={e => setFormData({...formData, quantum_status: e.target.value})}
                  >
                    <option value="Already quantum-ready">{t('validators.qs_ready')}</option>
                    <option value="Actively upgrading">{t('validators.qs_upgrading')}</option>
                    <option value="Planning to upgrade">{t('validators.qs_planning')}</option>
                    <option value="Not yet started">{t('validators.qs_not_started')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.experience')}</label>
                  <textarea
                    required rows={3} placeholder={t('validators.experience_placeholder')}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-medium text-sm"
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('validators.message_optional')}</label>
                  <textarea
                    rows={2} placeholder={t('validators.message_placeholder')}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#1D9E75] outline-none font-medium text-sm"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                {applyError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3">
                    {applyError}
                  </p>
                )}

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setApplyError(null); }}
                    className="flex-1 h-14 border-2 border-gray-100 dark:border-gray-800 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all uppercase tracking-widest text-xs"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : t('validators.submit_application')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
