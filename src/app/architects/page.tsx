'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect } from 'react';
import {
  Hammer,
  Twitter,
  Trophy,
  ExternalLink,
  Code2,
  UserPlus,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Zap,
  Globe,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

// Data & Libs
import architectsData from '@/data/architects.json';
import { submitForm } from '@/lib/submit';
import { useToast } from '@/components/shared/Toast';

export default function Architects() {
  const { toast } = useToast();
  const architects = architectsData as any[];

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: '',
    xHandle: '',
    appLink: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Community submissions (from the form) shown alongside the static featured list.
  const [submittedProjects, setSubmittedProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/architects')
      .then((r) => r.json())
      .then((d) => setSubmittedProjects(Array.isArray(d.projects) ? d.projects : []))
      .catch(() => setSubmittedProjects([]));
  }, []);

  // Static featured builders + community submissions, normalized into one shape
  // so they render in the same card grid.
  const featuredProjects = [
    ...architects.map((a) => ({
      key: `static-${a.id}`,
      title: a.projectName,
      category: a.category,
      description: a.projectDescription,
      builder: a.name,
      xHandle: a.xHandle,
      appLink: a.appLink,
    })),
    ...submittedProjects.map((s) => ({
      key: `db-${s.id}`,
      title: s.name,
      category: 'Community',
      description: s.description,
      builder: s.name,
      xHandle: s.x_handle,
      appLink: s.app_link,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.xHandle || !formData.description) {
      toast("Please fill in all required fields", "error");
      return;
    }

    if (formData.appLink && !formData.appLink.startsWith('https://')) {
      toast("App Link must start with https://", "error");
      return;
    }

    setIsSubmitting(true);
    const formattedXHandle = formData.xHandle.startsWith('@') ? formData.xHandle : `@${formData.xHandle}`;
    const { ok, ref, error } = await submitForm('architect_application', {
      name: formData.name,
      x_handle: formattedXHandle,
      app_link: formData.appLink,
      description: formData.description,
    });
    if (ok) {
      setSubmissionId(ref || 'SUCCESS');
      toast("Application submitted successfully!", "success");
      // Optimistically show it in the list right away.
      setSubmittedProjects((prev) => [
        { id: ref || `local-${Date.now()}`, name: formData.name, x_handle: formattedXHandle, app_link: formData.appLink, description: formData.description },
        ...prev,
      ]);
    } else {
      toast(error || "Submission failed. Please try again.", "error");
    }
    setIsSubmitting(false);
  };

  const scrollToForm = () => {
    const form = document.getElementById('apply-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
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
                  Building on Arc means contributing to the infrastructure layer of institutional stablecoin finance. ArcGov welcomes builders who are creating real tools for the Arc ecosystem.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — FEATURED BUILDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <h2 className="text-3xl font-black mb-10 text-center">Featured Arc Builders</h2>
           {featuredProjects.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredProjects.map((arc) => (
                  <div key={arc.key} className="p-8 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-[32px] hover:border-[#1D9E75] transition-all group flex flex-col h-full shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-[#1D9E75]/10 text-[#1D9E75] text-[9px] font-black uppercase tracking-widest">
                            {arc.category}
                          </span>
                          <h3 className="text-xl font-black group-hover:text-[#1D9E75] transition-colors">{arc.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {arc.xHandle && (
                            <a href={`https://twitter.com/${arc.xHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                              <Twitter size={20} />
                            </a>
                          )}
                        </div>
                     </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 flex-grow italic">
                       &quot;{arc.description}&quot;
                     </p>
                     <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-gray-50 dark:border-gray-900">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">By {arc.builder}</span>
                           <div className="flex items-center gap-2">
                             {arc.appLink && (
                               <a
                                 href={arc.appLink}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg text-[10px] font-black uppercase hover:bg-[#1D9E75] hover:text-white transition-all"
                               >
                                 <Globe size={12} /> Visit App
                               </a>
                             )}
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[48px] space-y-6">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto">
                   <Code2 className="text-gray-300" size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-gray-500">No featured builders yet.</p>
                  <p className="text-gray-400 max-w-xs mx-auto">Be the first to apply and build something on Arc.</p>
                </div>
                <button 
                  onClick={scrollToForm}
                  className="px-8 py-3 bg-[#1D9E75] text-white text-xs font-black uppercase rounded-xl hover:bg-[#0F6E56] transition-all"
                >
                  Apply Now
                </button>
             </div>
           )}
        </section>

        {/* SECTION 4 — LEADERBOARD TABLE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
           <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-2">Community Leaderboard</h2>
              <p className="text-sm text-gray-500">Leaderboard updates as builders contribute to the Arc network.</p>
           </div>

           {architects.length > 0 ? (
             <>
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
             </>
           ) : (
             <div className="p-16 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800 space-y-4">
                <ClipboardList className="mx-auto text-gray-300" size={40} />
                <p className="font-bold text-gray-500">Leaderboard empty — waiting for the first Arc builders.</p>
                <p className="text-sm text-gray-400">Submit your project to be featured.</p>
             </div>
           )}
        </section>

        {/* SECTION 5 — JOIN FORM */}
        <section id="apply-form" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
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
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400">Live App URL (optional)</label>
                      <input
                        type="url"
                        placeholder="https://yourapp.vercel.app"
                        className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all text-sm font-medium"
                        value={formData.appLink}
                        onChange={(e) => setFormData({...formData, appLink: e.target.value})}
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
