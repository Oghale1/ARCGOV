'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Coins, ArrowRight, Bell, Calculator, Info } from 'lucide-react';
import validators from '@/data/validators.json';

export default function Staking() {
  const [amount, setAmount] = useState('');
  const apy = 7.2;

  const estimatedEarnings = amount ? (Number(amount) * apy) / 100 : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-[#0F1117] text-white rounded-[32px] p-8 md:p-16 mb-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="150" fill="none" stroke="#1D9E75" strokeWidth="2" strokeDasharray="10 10" className="animate-spin-slow" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="#1D9E75" strokeWidth="1" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/20 text-[#1D9E75] text-xs font-black tracking-widest mb-6 border border-[#1D9E75]/30">
              COMING JAN 1, 2027
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.9]">
              STAKING IS <br />
              <span className="text-[#1D9E75]">COMING TO ARC.</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Secure the world's most trusted stablecoin network. Delegate your Arc tokens to top-tier validators and earn USDC rewards directly from transaction fees.
            </p>
            <div className="flex flex-wrap gap-4">
               <button className="px-8 py-4 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20">
                  JOIN THE WAITLIST
               </button>
               <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all">
                  READ THE DOCS
               </button>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { step: '01', title: 'Get Arc Tokens', desc: 'Acquire native Arc tokens on mainnet launch or via official bridges.' },
            { step: '02', title: 'Choose Validator', desc: 'Select from our vetting list of institutional-grade validator nodes.' },
            { step: '03', title: 'Earn USDC', desc: 'Rewards are distributed every epoch (approx. 24 hours) in USDC.' },
          ].map((item) => (
            <div key={item.step} className="p-8 bg-white dark:bg-[#1F2937]/20 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl relative overflow-hidden">
              <span className="text-6xl font-black text-gray-100 dark:text-gray-800/50 absolute top-4 right-4 leading-none">{item.step}</span>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* APY Estimator */}
          <section className="p-10 bg-[#E1F5EE] dark:bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-[32px] space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1D9E75] rounded-2xl text-white">
                <Calculator size={24} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">APY Estimator</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#0F6E56] dark:text-[#1D9E75] mb-2">Staking Amount (USDC Equivalent)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="10,000"
                    className="w-full p-4 bg-white dark:bg-[#0F1117] border-2 border-[#1D9E75]/20 rounded-2xl text-2xl font-black font-mono outline-none focus:border-[#1D9E75] transition-all"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">USDC</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-[#0F1117] rounded-2xl border border-[#1D9E75]/10">
                   <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Projected APY</p>
                   <p className="text-2xl font-black text-[#1D9E75]">7.20%</p>
                </div>
                <div className="p-6 bg-white dark:bg-[#0F1117] rounded-2xl border border-[#1D9E75]/10">
                   <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Annual Rewards</p>
                   <p className="text-2xl font-black text-[#1D9E75]">{estimatedEarnings.toLocaleString()} USDC</p>
                </div>
              </div>

              <p className="text-[10px] text-[#6B7280] italic leading-relaxed">
                * Estimations based on current testnet parameters. Actual rewards may vary based on network inflation, fee volume, and validator commission.
              </p>
            </div>
          </section>

          {/* Waitlist Form */}
          <section className="p-10 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-[32px] space-y-8">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Bell size={24} className="text-[#1D9E75]" />
              Get Notified
            </h2>
            <p className="text-[#6B7280] dark:text-[#9CA3AF]">Be the first to know when staking opens. We'll send you an early access invite.</p>
            
            <form className="space-y-4">
              <input 
                type="email" 
                placeholder="email@example.com"
                className="w-full p-4 bg-gray-50 dark:bg-[#0F1117] border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <button className="w-full py-4 bg-[#0F1117] dark:bg-[#1D9E75] text-white font-black rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                JOIN WAITLIST <ArrowRight size={20} />
              </button>
            </form>

            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/50">
               <Info size={16} className="text-blue-500 shrink-0" />
               <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-tight">
                 Your email will only be used for ArcGov staking updates. No spam, ever.
               </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
