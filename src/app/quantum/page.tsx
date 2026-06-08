'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Mail, 
  Loader2,
  Info,
  ChevronRight,
  AlertTriangle,
  X
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic Recharts
const RadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const RadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

// Data & Libs
import validators from '@/data/validators.json';
import { submitForm } from '@/lib/submit';
import { useToast } from '@/components/shared/Toast';

export default function QuantumReadiness() {
  const { toast } = useToast();

  // --- STATE ---
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // --- CALCULATIONS ---
  const readinessMetrics = useMemo(() => {
    const total = validators.length;
    const readyCount = (validators as any[]).filter(v => v.quantumStatus === 'ready').length;
    const percentage = (readyCount / total) * 100;
    return {
      percentage: Math.round(percentage),
      readyCount,
      total
    };
  }, []);

  const chartData = [
    { name: 'Readiness', value: readinessMetrics.percentage, fill: '#1D9E75' }
  ];

  // --- HANDLERS ---
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const { ok, ref, error, code } = await submitForm('quantum_subscriber', { email });
    if (ok) {
      setSubmissionId(ref || 'SUCCESS');
      toast("Subscribed to quantum updates", "success");

      // Send confirmation email — fire-and-forget, never block the UI.
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quantum_update',
          to: email,
          data: { updateText: 'Thanks for subscribing — you will receive Arc quantum readiness updates as validators complete their post-quantum upgrades.' }
        }),
      }).catch(console.error);
    } else if (code === '23505') {
      toast("You are already subscribed!", "info");
    } else {
      toast(error || "Subscription failed. Please try again.", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col text-gray-900 dark:text-white">
      <main className="flex-grow">
        {/* SECTION 1 — HERO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest mb-6 border border-[#1D9E75]/20 uppercase">
            <Cpu size={12} /> Post-Quantum Era
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
            QUANTUM-RESISTANT <br />
            <span className="text-[#1D9E75]">INFRASTRUCTURE</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-medium mb-10">
            Arc is building blockchain infrastructure that protects against future quantum computing threats, 
            ensuring institutional assets remain secure for decades to come.
          </p>

          <div className="text-xs text-gray-500 text-center mb-8 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg max-w-2xl mx-auto leading-relaxed">
            ℹ️ Quantum readiness status is reported by validators and manually verified by the ArcGov team. 
            Arc Testnet does not publish a real-time quantum upgrade API. 
            Data is updated when validators confirm milestone completions.
            <br />
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </section>

        {/* SECTION 2 — WHY IT MATTERS */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="p-10 md:p-12 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[48px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight">Why It Matters</h2>
              <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <p>
                  Traditional blockchain security relies on elliptic curve cryptography (ECC). 
                  Quantum computers, specifically using Shor&apos;s algorithm, threaten these systems 
                  by solving the underlying mathematical problems exponentially faster than classical computers. 
                  This means private keys could eventually be derived from public addresses, 
                  compromising the entire network&apos;s immutability.
                </p>
                <p>
                  Post-quantum cryptography (PQC) involves mathematical algorithms that are believed 
                  to be secure against both quantum and classical computers. Arc is proactively 
                  investing in these standards—like CRYSTALS-Dilithium—to harden our network 
                  before the &quot;Q-Day&quot; threat becomes reality, ensuring total security for the 
                  world&apos;s stablecoin infrastructure.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
               <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-[#1D9E75] rounded-full blur-[80px] opacity-20 animate-pulse" />
                  <ShieldCheck size={256} className="relative z-10 text-[#1D9E75]" strokeWidth={1} />
               </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — OVERALL READINESS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 text-center">
           <div className="relative w-64 h-64 mx-auto mb-8" style={{ width: '100%', height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="80%" 
                  outerRadius="100%" 
                  barSize={12} 
                  data={chartData} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <RadialBar 
                    background 
                    dataKey="value" 
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black">{readinessMetrics.percentage}%</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ready</span>
              </div>
           </div>
           <h3 className="text-2xl font-black mb-2">Network Quantum Readiness</h3>
           <p className="text-sm font-bold text-[#1D9E75] uppercase tracking-tighter">
             {readinessMetrics.readyCount} of {readinessMetrics.total} validators fully quantum-ready
           </p>
        </section>

        {/* SECTION 4 — 4-PHASE ROADMAP */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 space-y-4">
           <h2 className="text-2xl font-black mb-8 px-4 text-center md:text-left">Upgrade Roadmap</h2>
           {[
             { 
               phase: 'Phase 1', 
               title: 'Post-Quantum Wallet Signatures', 
               status: 'In Progress', 
               statusColor: 'bg-amber-100 text-amber-700',
               desc: 'Validators upgrade signing keys to quantum-resistant algorithms (CRYSTALS-Dilithium) to secure administrative actions.' 
             },
             { 
               phase: 'Phase 2', 
               title: 'Private State Encryption', 
               status: 'Planned', 
               statusColor: 'bg-gray-100 text-gray-500',
               desc: 'Integration of post-quantum encryption standards for account balances and transaction metadata.' 
             },
             { 
               phase: 'Phase 3', 
               title: 'Validator Signature Hardening', 
               status: 'Planned', 
               statusColor: 'bg-gray-100 text-gray-500',
               desc: 'Upgrading the consensus layer block production signatures to be fully quantum-resistant.' 
             },
             { 
               phase: 'Phase 4', 
               title: 'Full Network Quantum Resistance', 
               status: 'Future', 
               statusColor: 'bg-gray-100 text-gray-500',
               desc: 'End-to-end quantum security across all Arc protocol layers and institutional bridge infrastructure.' 
             },
           ].map((item) => (
             <div key={item.phase} className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col md:flex-row gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 text-gray-400 font-black text-xs">
                   {item.phase.split(' ')[1]}
                </div>
                <div className="flex-grow space-y-2">
                   <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${item.statusColor}`}>
                        {item.status}
                      </span>
                   </div>
                   <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                     {item.desc}
                   </p>
                </div>
             </div>
           ))}
        </section>

        {/* SECTION 5 — PER-VALIDATOR QUANTUM TABLE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black mb-2">Validator Readiness Matrix</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Matrix last updated: Oct 28, 2025
                </p>
              </div>
           </div>
           
           {/* DESKTOP TABLE */}
           <div className="hidden md:block overflow-x-auto rounded-[32px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1117]">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Validator</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">PQ Wallet</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Private State</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Sig Hardening</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {validators.map((v: any) => (
                      <tr key={v.id} className="hover:bg-gray-50/30 dark:hover:bg-[#1D9E75]/5 transition-colors group">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-[10px]">
                                 {v.shortName}
                               </div>
                               <span className="font-bold text-sm">{v.name}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-center">
                               {v.quantumChecks?.postQuantumWallet ? (
                                 <CheckCircle2 className="text-[#1D9E75]" size={18} />
                               ) : (
                                 <X className="text-gray-300 cursor-help" size={18} />
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-center">
                               {v.quantumChecks?.privateStateEncryption ? (
                                 <CheckCircle2 className="text-[#1D9E75]" size={18} />
                               ) : (
                                 <X className="text-gray-300 cursor-help" size={18} />
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex justify-center">
                               {v.quantumChecks?.signatureHardening ? (
                                 <CheckCircle2 className="text-[#1D9E75]" size={18} />
                               ) : (
                                 <X className="text-gray-300 cursor-help" size={18} />
                               )}
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* MOBILE CARDS */}
           <div className="grid md:hidden grid-cols-1 gap-4">
              {validators.map((v: any) => (
                <div key={v.id} className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] dark:bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-black text-[10px]">
                        {v.shortName}
                      </div>
                      <span className="font-black text-sm">{v.name}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'PQ Wallet', status: v.quantumChecks?.postQuantumWallet },
                        { label: 'Private State', status: v.quantumChecks?.privateStateEncryption },
                        { label: 'Hardening', status: v.quantumChecks?.signatureHardening },
                      ].map((check) => (
                        <div key={check.label} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter text-center h-4">{check.label}</span>
                           {check.status ? (
                             <CheckCircle2 className="text-[#1D9E75]" size={16} />
                           ) : (
                             <X className="text-gray-300" size={16} />
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* SECTION 6 — SUBSCRIBE */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="p-12 md:p-16 bg-[#0F1117] text-white rounded-[48px] text-center space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[120px] -mr-32 -mt-32 opacity-20" />
              <div className="relative z-10 space-y-4">
                 <h2 className="text-3xl font-black">Stay Ahead of the Curve</h2>
                 <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                   Get notified when validators complete quantum upgrade milestones.
                 </p>
              </div>

              {submissionId ? (
                <div className="relative z-10 p-8 bg-white/5 border border-white/10 rounded-3xl text-center animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto mb-4" />
                   <h4 className="text-xl font-bold mb-2">Subscription Confirmed</h4>
                   <p className="text-xs text-gray-500">Reference: <span className="font-mono text-[#1D9E75]">{submissionId}</span></p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="relative z-10 max-w-md mx-auto flex flex-col md:flex-row gap-4">
                   <div className="relative flex-grow">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="email" 
                        required 
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 h-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                   </div>
                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 h-12 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20 flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBSCRIBE'}
                   </button>
                </form>
              )}
           </div>
        </section>
      </main>
    </div>
  );
}
