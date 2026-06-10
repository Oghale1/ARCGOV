'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Coins, 
  ShieldCheck, 
  Loader2, 
  ChevronRight, 
  Bell, 
  Mail, 
  Wallet,
  ExternalLink,
  Info,
  Zap
} from 'lucide-react';

// Data & Libs
import validators from '@/data/validators.json';
import { getAllProposals } from '@/lib/contract';
import { submitForm } from '@/lib/submit';
import { useToast } from '@/components/shared/Toast';
import { useTranslation } from '@/lib/i18n';

// Components
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import TestnetChip from '@/components/shared/TestnetChip';
import QuantumBadge from '@/components/validators/QuantumBadge';

export default function Staking() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { t } = useTranslation();

  // --- STATE ---
  const [aipProposal, setAipProposal] = useState<any>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(true);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<string>('0');
  const [duration, setDuration] = useState<number>(12); // months

  // Validator Waitlist State
  const [activeValidatorForm, setActiveValidatorForm] = useState<number | null>(null);
  const [validatorEmail, setValidatorEmail] = useState('');
  const [isSubmittingValidator, setIsSubmittingValidator] = useState(false);
  const [validatorSubmissionRef, setValidatorSubmissionRef] = useState<string | null>(null);

  // General Waitlist State
  const [generalEmail, setGeneralEmail] = useState('');
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [generalSubmissionRef, setGeneralSubmissionRef] = useState<string | null>(null);

  // --- FETCH AIP-001 STATUS ---
  useEffect(() => {
    async function fetchAIP() {
      setIsLoadingProposal(true);
      
      // 5 second timeout logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      try {
        const proposals: any = await Promise.race([
          getAllProposals(),
          timeoutPromise
        ]);
        
        if (proposals && proposals.length > 0) {
          const found = (proposals as any[]).find(p => 
            p.title.toUpperCase().includes('AIP-001') || 
            p.title.toUpperCase().includes('TARC TOKEN')
          );
          setAipProposal(found || null);
        } else {
          setAipProposal(null);
        }
      } catch (err) {
        console.error("Failed to fetch AIP-001 status", err);
        setAipProposal(null); // Fallback to 'not found'
      } finally {
        setIsLoadingProposal(false);
      }
    }
    fetchAIP();
  }, []);

  // --- CALCULATOR LOGIC ---
  const estimatedRewards = useMemo(() => {
    const amount = parseFloat(calcAmount) || 0;
    if (amount === 0) return 0;
    const apy = 0.315; // 31.5%
    return amount * apy * (duration / 12);
  }, [calcAmount, duration]);

  // --- SUBMISSION HANDLERS ---
  const handleValidatorWaitlist = async (e: React.FormEvent, validatorId: number) => {
    e.preventDefault();
    if (!validatorEmail) return;

    setIsSubmittingValidator(true);
    const { ok, ref, error } = await submitForm('staking_waitlist', {
      email: validatorEmail,
      validator_id: validatorId,
      wallet_address: address || null,
    });
    if (ok) {
      setValidatorSubmissionRef(ref || 'SUCCESS');
      toast(t('staking.added_waitlist'), "success");

      // Send confirmation email — fire-and-forget, never block the UI.
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'staking_waitlist',
          to: validatorEmail
        }),
      }).catch(console.error);
    } else {
      toast(error || t('staking.submit_failed'), "error");
    }
    setIsSubmittingValidator(false);
  };

  const handleGeneralWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalEmail) return;

    setIsSubmittingGeneral(true);
    const { ok, ref, error } = await submitForm('staking_waitlist', {
      email: generalEmail,
      wallet_address: address || null,
    });
    if (ok) {
      setGeneralSubmissionRef(ref || 'SUCCESS');
      toast(t('staking.on_waitlist_toast'), "success");

      // Send confirmation email — fire-and-forget, never block the UI.
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'staking_waitlist',
          to: generalEmail
        }),
      }).catch(console.error);
    } else {
      toast(error || t('staking.submit_failed'), "error");
    }
    setIsSubmittingGeneral(false);
  };

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      {/* SECTION 1 — TESTNET NOTICE */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-center">
          <AlertCircle size={14} className="text-amber-600 dark:text-amber-500" />
          <p className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest leading-relaxed">
            {t('staking.notice')}
            <Link href="/governance" className="ml-1 underline hover:text-amber-900 dark:hover:text-amber-400">
              {t('staking.track_at')}
            </Link>
          </p>
        </div>
      </div>

      <main className="flex-grow">
        {/* SECTION 2 — HERO + COMING SOON */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest mb-6 border border-[#1D9E75]/20">
            <Clock size={12} /> Arc Testnet
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            {t('staking.hero_1')} <br />
            <span className="text-[#1D9E75]">{t('staking.hero_2')}</span>
          </h1>

          <div className="text-center py-8">
            <span className="text-4xl font-bold text-[#1D9E75]">{t('staking.coming_soon')}</span>
            <p className="text-gray-400 mt-3 text-sm">
              {t('staking.projected')}
            </p>
          </div>
        </section>

        {/* SECTION 3 — HOW IT WILL WORK */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: t('staking.step_1'),
              title: t('staking.step_1_title'),
              desc: t('staking.step_1_desc'),
              icon: <CheckCircle2 size={32} />
            },
            {
              step: t('staking.step_2'),
              title: t('staking.step_2_title'),
              desc: t('staking.step_2_desc'),
              icon: <Coins size={32} />
            },
            {
              step: t('staking.step_3'),
              title: t('staking.step_3_title'),
              desc: t('staking.step_3_desc'),
              icon: <ShieldCheck size={32} />
            },
          ].map((item) => (
            <div key={item.step} className="p-10 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[40px] relative overflow-hidden group">
              <div className="text-[#1D9E75] mb-6 transform group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
              <h3 className="text-xl font-black mb-3">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              <span className="absolute top-10 right-10 text-xs font-black text-gray-200 dark:text-gray-800">{item.step}</span>
            </div>
          ))}
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* SECTION 4 — APY CALCULATOR */}
          <section className="p-10 bg-[#E1F5EE] dark:bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-[40px] space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2 text-center md:text-left">{t('staking.estimator')}</h2>
              <p className="text-sm text-[#0F6E56] dark:text-[#1D9E75]/60 font-bold text-center md:text-left">{t('staking.estimator_sub')}</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F6E56]">{t('staking.tarc_amount')}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full h-14 px-6 bg-white dark:bg-[#0F1117] border-2 border-[#1D9E75]/20 rounded-2xl text-3xl font-black font-mono outline-none focus:border-[#1D9E75] transition-all"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300">tARC</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F6E56]">{t('staking.lock_duration')}</label>
                <div className="grid grid-cols-3 gap-2">
                   {[3, 6, 12].map((m) => (
                     <button
                       key={m}
                       onClick={() => setDuration(m)}
                       className={`h-12 rounded-xl text-xs font-black transition-all ${
                         duration === m
                          ? 'bg-[#1D9E75] text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
                       }`}
                     >
                       {m} {t('staking.months')}
                     </button>
                   ))}
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-[#0F1117] rounded-3xl border border-[#1D9E75]/10 text-center">
                 {parseFloat(calcAmount) > 0 ? (
                   <>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('staking.est_earnings')}</p>
                    <p className="text-5xl font-black text-[#1D9E75]">+{estimatedRewards.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-[#1D9E75] mt-4 uppercase tracking-tighter">
                      {t('staking.based_apy')}
                    </p>
                   </>
                 ) : (
                   <p className="text-gray-400 font-bold italic">{t('staking.enter_amount')}</p>
                 )}
              </div>

              <p className="text-[10px] text-[#0F6E56] opacity-60 italic text-center px-4">
                {t('staking.est_disclaimer')}
              </p>
            </div>
          </section>

          {/* SECTION 7 — CURRENT GOVERNANCE STATUS */}
          <section className="flex flex-col">
            <div className="p-10 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[40px] flex-grow flex flex-col justify-center items-center text-center space-y-8">
              <div className="w-16 h-16 bg-white dark:bg-[#0F1117] rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800">
                <AlertCircle className="text-[#1D9E75]" size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black">{t('staking.aip_status')}</h3>
                {isLoadingProposal ? (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm font-bold">{t('staking.querying')}</span>
                  </div>
                ) : aipProposal ? (
                  <div className="space-y-4">
                    <div className="px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-xs font-black uppercase tracking-widest inline-block">
                      {aipProposal.isOpen ? t('staking.voting_active') : (Number(aipProposal.forVotes) > Number(aipProposal.againstVotes) ? t('staking.passed') : t('staking.rejected'))}
                    </div>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                      {t('staking.live_onchain')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500 font-bold uppercase tracking-wider">
                    {t('staking.not_submitted')}
                  </p>
                )}
              </div>

              <Link
                href="/governance"
                className="group flex items-center gap-2 h-12 text-sm font-black text-[#1D9E75] hover:underline"
              >
                {t('staking.view_vote_aip')} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        </div>

        {/* SECTION 5 — VALIDATOR STAKING PREVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">{t('staking.delegation_title')}</h2>
              <p className="text-gray-500 text-sm">{t('staking.delegation_sub')}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mx-auto md:mx-0">
               <span className="w-2 h-2 rounded-full bg-gray-300" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 {t('staking.usdc_delegated')} <TestnetChip />
               </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {validators.map((v: any) => (
              <div 
                key={v.id} 
                id={v.name.toLowerCase().replace(/\s+/g, '-')}
                className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] hover:border-[#1D9E75] transition-all group scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black text-xs">
                    {v.name.slice(0, 1)}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-sm leading-none mb-1">{v.name}</h4>
                    <QuantumBadge status={v.quantum === "PQ Ready" ? "ready" : v.quantum === "In Progress" ? "in-progress" : "pending"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('staking.commission')}</p>
                    <p className="text-sm font-black">{v.commission}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('staking.uptime')}</p>
                    <p className="text-sm font-black text-[#1D9E75]">{v.uptime}%</p>
                  </div>
                </div>

                {activeValidatorForm === v.rank ? (
                  validatorSubmissionRef ? (
                    <div className="text-center py-2 animate-in fade-in duration-300">
                      <p className="text-[10px] font-bold text-[#1D9E75]">✓ {t('staking.noted_ref')} {validatorSubmissionRef}</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleValidatorWaitlist(e, v.rank)} className="space-y-3 animate-in slide-in-from-bottom-2">
                       <input 
                        type="email" 
                        required 
                        placeholder={t('staking.your_email')}
                        className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#1D9E75]"
                        value={validatorEmail}
                        onChange={(e) => setValidatorEmail(e.target.value)}
                       />
                       <button
                        type="submit"
                        disabled={isSubmittingValidator}
                        className="w-full h-11 bg-[#1D9E75] text-white text-[10px] font-black rounded-xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2"
                       >
                         {isSubmittingValidator ? <Loader2 className="animate-spin" size={14} /> : t('staking.confirm')}
                       </button>
                    </form>
                  )
                ) : (
                  <button 
                    onClick={() => setActiveValidatorForm(v.rank)}
                    className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[10px] font-black rounded-xl hover:bg-[#1D9E75] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Bell size={14} /> {t('staking.notify_me')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6 — STAKING INTEREST FORM */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="p-12 md:p-16 bg-[#0F1117] text-white rounded-[48px] text-center space-y-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[120px] -mr-32 -mt-32 opacity-20" />
              
              <div className="relative z-10 space-y-4">
                 <h2 className="text-4xl font-black tracking-tight">{t('staking.waitlist_title')}</h2>
                 <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                   {t('staking.waitlist_desc')}
                 </p>
              </div>

              {generalSubmissionRef ? (
                <div className="relative z-10 p-8 bg-white/5 border border-white/10 rounded-3xl animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto mb-4" />
                   <h4 className="text-xl font-bold mb-2">✓ {t('staking.on_waitlist')}</h4>
                   <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed font-medium">
                     {t('common.reference')}: <span className="font-mono text-[#1D9E75]">{generalSubmissionRef}</span>. {t('staking.on_waitlist_desc')}
                   </p>
                </div>
              ) : (
                <form onSubmit={handleGeneralWaitlist} className="relative z-10 max-w-md mx-auto space-y-4">
                   <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="email" 
                          required 
                          placeholder={t('common.your_email')}
                          className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium"
                          value={generalEmail}
                          onChange={(e) => setGeneralEmail(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingGeneral}
                        className="px-8 h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {isSubmittingGeneral ? <Loader2 className="animate-spin" /> : t('staking.join_now')}
                      </button>
                   </div>
                   <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500">
                      <Wallet size={12} />
                      {isConnected ? `${t('staking.wallet_linked')} ${address?.slice(0, 6)}...${address?.slice(-4)}` : t('staking.connect_optional')}
                   </div>
                </form>
              )}
           </div>
        </section>
        </main>
        </div>
        );
        }

