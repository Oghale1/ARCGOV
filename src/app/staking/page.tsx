'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

// Data & Libs
import validators from '@/data/validators.json';
import { getAllProposals } from '@/lib/contract';
import supabase from '@/lib/supabase';
import { useToast } from '@/components/shared/Toast';

// Components
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import TestnetChip from '@/components/shared/TestnetChip';
import QuantumBadge from '@/components/validators/QuantumBadge';

export default function Staking() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // --- STATE ---
  const [aipProposal, setAipProposal] = useState<any>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

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

  // --- COUNTDOWN LOGIC ---
  useEffect(() => {
    const targetDate = new Date('2027-01-01T00:00:00Z').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    try {
      const { data, error } = await supabase
        .from('staking_waitlist')
        .insert([{ 
          email: validatorEmail, 
          validator_id: validatorId,
          wallet_address: address || null
        }])
        .select();

      if (error) throw error;
      
      const refId = data?.[0]?.id?.toString().slice(0, 8) || 'SUCCESS';
      setValidatorSubmissionRef(refId);
      toast("Added to validator waitlist!", "success");
    } catch (err) {
      console.error(err);
      toast("Submission failed.", "error");
    } finally {
      setIsSubmittingValidator(false);
    }
  };

  const handleGeneralWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalEmail) return;

    setIsSubmittingGeneral(true);
    try {
      const { data, error } = await supabase
        .from('staking_waitlist')
        .insert([{ 
          email: generalEmail, 
          wallet_address: address || null
        }])
        .select();

      if (error) throw error;

      const refId = data?.[0]?.id?.toString().slice(0, 8) || 'SUCCESS';
      setGeneralSubmissionRef(refId);
      toast("You are on the waitlist!", "success");
    } catch (err) {
      console.error(err);
      toast("Submission failed.", "error");
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      {/* SECTION 1 — TESTNET NOTICE */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-center">
          <AlertCircle size={14} className="text-amber-600 dark:text-amber-500" />
          <p className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest leading-relaxed">
            Staking opens after AIP-001 passes. 
            <Link href="/governance" className="ml-1 underline hover:text-amber-900 dark:hover:text-amber-400">
              Track at arcgov.vercel.app/governance
            </Link>
          </p>
        </div>
      </div>

      <main className="flex-grow">
        {/* SECTION 2 — HERO + COUNTDOWN */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest mb-6 border border-[#1D9E75]/20">
            <Clock size={12} /> INITIALIZING PROTOCOL
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            tARC STAKING <br />
            <span className="text-[#1D9E75]">IS COMING.</span>
          </h1>

          <div className="flex justify-center gap-3 md:gap-4 mb-8">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HOURS', value: timeLeft.hours },
              { label: 'MINS', value: timeLeft.minutes },
              { label: 'SECS', value: timeLeft.seconds },
            ].map((unit) => (
              <div key={unit.label} className="w-16 md:w-24 h-20 md:h-28 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center">
                <span className="text-xl md:text-4xl font-black">{unit.value.toString().padStart(2, '0')}</span>
                <span className="text-[7px] md:text-[10px] font-black text-gray-400 tracking-widest mt-1">{unit.label}</span>
              </div>
            ))}
          </div>
          
          <p className="text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-widest">
            Projected date — subject to governance vote
          </p>
        </section>

        {/* SECTION 3 — HOW IT WILL WORK */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              step: 'Step 1', 
              title: 'Vote YES on AIP-001', 
              desc: 'Approve the official launch of the tARC governance token.',
              icon: <CheckCircle2 size={32} />
            },
            { 
              step: 'Step 2', 
              title: 'Claim from Faucet', 
              desc: 'Receive free tARC tokens to begin participating in the network.',
              icon: <Coins size={32} />
            },
            { 
              step: 'Step 3', 
              title: 'Stake & Earn', 
              desc: 'Lock your tARC to secure the network and earn automatic rewards.',
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
              <h2 className="text-3xl font-black tracking-tight mb-2 text-center md:text-left">Rewards Estimator</h2>
              <p className="text-sm text-[#0F6E56] dark:text-[#1D9E75]/60 font-bold text-center md:text-left">Estimate future staking rewards</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F6E56]">tARC Amount</label>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0F6E56]">Lock Duration</label>
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
                       {m} MONTHS
                     </button>
                   ))}
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-[#0F1117] rounded-3xl border border-[#1D9E75]/10 text-center">
                 {parseFloat(calcAmount) > 0 ? (
                   <>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimated tARC Earnings</p>
                    <p className="text-5xl font-black text-[#1D9E75]">+{estimatedRewards.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-[#1D9E75] mt-4 uppercase tracking-tighter">
                      Based on 31.5% Target APY
                    </p>
                   </>
                 ) : (
                   <p className="text-gray-400 font-bold italic">Enter an amount to estimate</p>
                 )}
              </div>

              <p className="text-[10px] text-[#0F6E56] opacity-60 italic text-center px-4">
                Projected estimate — subject to governance approval of tARC parameters
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
                <h3 className="text-2xl font-black">AIP-001 Status</h3>
                {isLoadingProposal ? (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm font-bold">Querying ArcGovCore...</span>
                  </div>
                ) : aipProposal ? (
                  <div className="space-y-4">
                    <div className="px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-xs font-black uppercase tracking-widest inline-block">
                      {aipProposal.isOpen ? 'VOTING ACTIVE' : (Number(aipProposal.forVotes) > Number(aipProposal.againstVotes) ? 'PASSED' : 'REJECTED')}
                    </div>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                      Proposal is currently live on-chain. Your vote matters.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500 font-bold uppercase tracking-wider">
                    Not yet submitted — coming soon
                  </p>
                )}
              </div>

              <Link 
                href="/governance" 
                className="group flex items-center gap-2 h-12 text-sm font-black text-[#1D9E75] hover:underline"
              >
                View and vote on AIP-001 <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        </div>

        {/* SECTION 5 — VALIDATOR STAKING PREVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Institutional Delegation</h2>
              <p className="text-gray-500 text-sm">Select a validator to receive notifications when staking goes live.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mx-auto md:mx-0">
               <span className="w-2 h-2 rounded-full bg-gray-300" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                 0 USDC delegated <TestnetChip />
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
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission</p>
                    <p className="text-sm font-black">{v.commission}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Uptime</p>
                    <p className="text-sm font-black text-[#1D9E75]">{v.uptime}%</p>
                  </div>
                </div>

                {activeValidatorForm === v.rank ? (
                  validatorSubmissionRef ? (
                    <div className="text-center py-2 animate-in fade-in duration-300">
                      <p className="text-[10px] font-bold text-[#1D9E75]">✓ Noted. Ref: {validatorSubmissionRef}</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleValidatorWaitlist(e, v.rank)} className="space-y-3 animate-in slide-in-from-bottom-2">
                       <input 
                        type="email" 
                        required 
                        placeholder="Your email"
                        className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#1D9E75]"
                        value={validatorEmail}
                        onChange={(e) => setValidatorEmail(e.target.value)}
                       />
                       <button 
                        type="submit"
                        disabled={isSubmittingValidator}
                        className="w-full h-11 bg-[#1D9E75] text-white text-[10px] font-black rounded-xl hover:bg-[#0F6E56] transition-all flex items-center justify-center gap-2"
                       >
                         {isSubmittingValidator ? <Loader2 className="animate-spin" size={14} /> : 'CONFIRM'}
                       </button>
                    </form>
                  )
                ) : (
                  <button 
                    onClick={() => setActiveValidatorForm(v.rank)}
                    className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[10px] font-black rounded-xl hover:bg-[#1D9E75] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Bell size={14} /> Notify Me
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
                 <h2 className="text-4xl font-black tracking-tight">Join the staking waitlist</h2>
                 <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                   We will notify you when AIP-001 passes and tARC staking goes live on the Arc network.
                 </p>
              </div>

              {generalSubmissionRef ? (
                <div className="relative z-10 p-8 bg-white/5 border border-white/10 rounded-3xl animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto mb-4" />
                   <h4 className="text-xl font-bold mb-2">✓ You are on the waitlist</h4>
                   <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed font-medium">
                     Reference: <span className="font-mono text-[#1D9E75]">{generalSubmissionRef}</span>. We will notify you when AIP-001 passes and tARC staking goes live.
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
                          placeholder="Enter your email"
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
                        {isSubmittingGeneral ? <Loader2 className="animate-spin" /> : 'JOIN NOW'}
                      </button>
                   </div>
                   <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500">
                      <Wallet size={12} />
                      {isConnected ? `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect wallet to link your address (optional)'}
                   </div>
                </form>
              )}
           </div>
        </section>
        </main>
        </div>
        );
        }

