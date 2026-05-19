'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState } from 'react';
import { 
  Hammer, 
  Github, 
  Twitter, 
  Trophy, 
  ExternalLink, 
  Code2, 
  UserPlus, 
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// Data & Libs
import architects from '@/data/architects.json';
import supabase from '@/lib/supabase';
import { useToast } from '@/components/shared/Toast';

export default function Architects() {
  const { toast } = useToast();

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: '',
    xHandle: '',
    githubUrl: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.xHandle || !formData.githubUrl || !formData.description) {
      toast("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedXHandle = formData.xHandle.startsWith('@') ? formData.xHandle : `@${formData.xHandle}`;
      
      const { data, error } = await supabase
        .from('architect_applications')
        .insert([{
          name: formData.name,
          x_handle: formattedXHandle,
          github_url: formData.githubUrl,
          description: formData.description
        }])
        .select();

      if (error) throw error;

      const refId = data?.[0]?.id?.toString().slice(0, 8) || 'SUCCESS';
      setSubmissionId(refId);
      toast("Application submitted successfully!", "success");
    } catch (err) {
      console.error(err);
      toast("Submission failed. Table 'architect_applications' might be missing.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow">
        {/* SECTION 1 — HERO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest mb-6 border border-[#1D9E75]/20 uppercase">
            <Hammer size={12} /> Architects Program
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
            ARC <span className="text-[#1D9E75]">ARCHITECTS</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-medium mb-10">
            Community builders shaping the Arc ecosystem. Building the future of institutional finance, one block at a time.
          </p>
          <a 
            href="https://community.arc.network" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all active:scale-95 shadow-lg shadow-[#1D9E75]/20"
          >
            Join the official program <ArrowUpRight size={20} />
          </a>
        </section>

        {/* SECTION 2 — WHAT IS IT */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="p-10 md:p-12 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[48px] space-y-8">
            <h2 className="text-3xl font-black tracking-tight text-center md:text-left">Building the Future</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto md:mx-0">
                   <Code2 size={20} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  The Arc Architects Program is an initiative led by Circle and community partners to support developers building on the Arc blockchain.
                </p>
              </div>
              <div className="space-y-3 text-center md:text-left">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center mx-auto md:mx-0">
                   <Trophy size={20} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Builders gain global recognition, direct connections to institutional partners, and rewards for contributing to core infrastructure.
                </p>
              </div>
              <div className="space-y-3 text-center md:text-left">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 text-[#1D9E75] flex items-center justify-center mx-auto md:mx-0">
                   <Zap size={20} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Building governance tools like ArcGov positions you as a key contributor ahead of the Arc token launch and mainnet ecosystem incentives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — FEATURED BUILDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <h2 className="text-3xl font-black mb-10 text-center">Featured Arc Builders</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {architects.map((arc) => (
                <div key={arc.id} className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] hover:border-[#1D9E75] transition-all group flex flex-col h-full shadow-sm">
                   <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-[#1D9E75]/10 text-[#1D9E75] text-[9px] font-black uppercase tracking-widest">
                          {arc.category}
                        </span>
                        <h3 className="text-xl font-black group-hover:text-[#1D9E75] transition-colors">{arc.projectName}</h3>
                      </div>
                      <a href={`https://twitter.com/${arc.xHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                        <Twitter size={20} />
                      </a>
                   </div>
                   <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 flex-grow italic">
                     &quot;{arc.projectDescription}&quot;
                   </p>
                   <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-900">
                      <span className="text-[10px] font-bold text-gray-400">By {arc.name}</span>
                      <a 
                        href={arc.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-[#0F1117] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                      >
                        <Github size={18} />
                      </a>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* SECTION 4 — LEADERBOARD TABLE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-2">Community Leaderboard</h2>
              <p className="text-sm text-gray-500">Leaderboard updates as builders contribute to the Arc network.</p>
           </div>

           {/* DESKTOP TABLE */}
           <div className="hidden md:block overflow-x-auto rounded-[32px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0F1117]">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Rank</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Builder</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Projects</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Proposals</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Votes</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">GitHub</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                    {architects.map((arc, index) => (
                      <tr key={arc.id} className="hover:bg-gray-50/30 dark:hover:bg-[#1D9E75]/5 transition-colors">
                         <td className="px-8 py-6 font-mono font-bold text-gray-400">#{index + 1}</td>
                         <td className="px-8 py-6">
                            <div className="flex flex-col">
                               <span className="font-bold text-sm">{arc.name}</span>
                               <span className="font-mono text-[10px] text-gray-400">{arc.walletAddress.slice(0, 6)}...{arc.walletAddress.slice(-4)}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-center font-bold">{arc.projectsBuilt}</td>
                         <td className="px-8 py-6 text-center font-bold">{arc.proposalsSubmitted}</td>
                         <td className="px-8 py-6 text-center font-bold">{arc.votesCast}</td>
                         <td className="px-8 py-6 text-right">
                            <a href={arc.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-block p-2 text-gray-400 hover:text-[#1D9E75] transition-colors">
                               <Github size={18} />
                            </a>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* MOBILE CARDS */}
           <div className="grid md:hidden grid-cols-1 gap-4">
              {architects.map((arc, index) => (
                <div key={arc.id} className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-black text-gray-300 font-mono">#{index + 1}</span>
                         <div className="flex flex-col">
                            <span className="font-black text-sm">{arc.name}</span>
                            <span className="font-mono text-[10px] text-gray-500">{arc.walletAddress.slice(0, 6)}...</span>
                         </div>
                      </div>
                      <a href={arc.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-400">
                         <Github size={16} />
                      </a>
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Projects', val: arc.projectsBuilt },
                        { label: 'Proposals', val: arc.proposalsSubmitted },
                        { label: 'Votes', val: arc.votesCast },
                      ].map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                           <span className="text-sm font-black">{stat.val}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* SECTION 5 — JOIN FORM */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="p-12 md:p-16 bg-[#0F1117] text-white rounded-[48px] space-y-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[120px] -mr-32 -mt-32 opacity-20" />
              
              <div className="relative z-10 text-center space-y-4">
                 <h2 className="text-4xl font-black tracking-tight">Apply to be featured</h2>
                 <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                   Are you building on Arc? Join the directory and showcase your project to the community.
                 </p>
              </div>

              {submissionId ? (
                <div className="relative z-10 p-8 bg-white/5 border border-white/10 rounded-3xl text-center animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto mb-4" />
                   <h4 className="text-xl font-bold mb-2">Application Submitted</h4>
                   <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto mb-6">
                     Reference: <span className="font-mono text-[#1D9E75]">{submissionId}</span>. We review applications weekly.
                   </p>
                   <button 
                    onClick={() => setSubmissionId(null)}
                    className="px-8 h-12 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                   >
                     SUBMIT ANOTHER
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Builder Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Your Name"
                          className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">X (Twitter) Handle</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="@handle"
                          className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium"
                          value={formData.xHandle}
                          onChange={(e) => setFormData({...formData, xHandle: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400">GitHub Profile or Repo URL</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://github.com/..."
                        className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400">What are you building?</label>
                      <textarea 
                        required 
                        rows={4}
                        placeholder="Briefly describe your project or contribution to the Arc ecosystem..."
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                   </div>

                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20 flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT APPLICATION'}
                   </button>
                </form>
              )}
           </div>
        </section>
      </main>
    </div>
  );
}
