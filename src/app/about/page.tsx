'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState } from 'react';
import { 
  Info, 
  HelpCircle, 
  Github, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Mail, 
  User, 
  Send,
  Loader2,
  CheckCircle2,
  Lock,
  Zap,
  Globe
} from 'lucide-react';
import { submitForm } from '@/lib/submit';
import { useToast } from '@/components/shared/Toast';

// FAQ Data
const FAQS = [
  {
    q: "Is ArcGov the official Arc governance site?",
    a: "No. ArcGov is an independent community-built dashboard. We are not affiliated with Circle or the official Arc team."
  },
  {
    q: "Do I need tokens to vote on proposals?",
    a: "On testnet: any wallet can vote for free. At mainnet launch: Arc tokens will be required for weighted voting on protocol changes."
  },
  {
    q: "How do I get testnet USDC for gas?",
    a: "Visit faucet.circle.com, select Arc Testnet, enter your wallet address, and you will receive 10 testnet USDC free of charge."
  },
  {
    q: "What is the Arc Testnet chain ID?",
    a: "The chain ID is 5042002. You can add this to MetaMask under Settings → Networks using the RPC URL: https://rpc.testnet.arc.network"
  },
  {
    q: "Are governance votes binding?",
    a: "On testnet, they serve as signal votes for the community. At mainnet with the native Arc token, passed proposals can trigger automated on-chain execution."
  },
  {
    q: "How do validators get added to Arc?",
    a: "Circle approves validators directly based on strict criteria including compliance, security standards, and jurisdictional diversity."
  },
  {
    q: "What is quantum readiness?",
    a: "Post-quantum cryptography protects against future quantum computers that could break current encryption. Arc is proactively upgrading its entire infrastructure."
  },
  {
    q: "How do I build on Arc?",
    a: "Visit docs.arc.network for comprehensive developer documentation, tutorials, and technical RPC details for building your own dApps."
  }
];

export default function AboutPage() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Feedback Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast("Please fill in all fields", "error");
      return;
    }

    setIsSubmitting(true);
    const { ok, ref, error } = await submitForm('feedback', formData);
    if (ok) {
      setSubmissionId(ref || 'SUCCESS');
      toast("Feedback sent! Thank you.", "success");
      setFormData({ name: '', email: '', message: '' });
    } else {
      toast(error || "Submission failed. Please try again.", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow">
        {/* SECTION 1 — WHAT IS ARCGOV */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
            <Info size={16} /> Independence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">About ArcGov</h1>
          <div className="space-y-6 text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            <p>
              ArcGov is the first community-built governance and validator dashboard designed specifically for the Arc blockchain. 
              Our mission is to provide transparency and accessibility to the network&apos;s most critical decision-making processes.
            </p>
            <p>
              We built ArcGov before Circle even needed it—believing that community-owned infrastructure is vital for the 
              long-term health of the Arc ecosystem. We provide the tools for builders and users to track network health and shape its future.
            </p>
            <p>
              ArcGov is fully open source, non-commercial, and entirely independent. We are not affiliated with, 
              sponsored by, or endorsed by Circle Internet Financial Ltd.
            </p>
          </div>
        </section>

        {/* SECTION 2 — WHAT IS ARC */}
        <section className="bg-gray-50/50 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-800 py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
              <Zap size={16} /> Technology
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">About Arc Blockchain</h2>
            <div className="space-y-6 text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
              <p>
                Circle built Arc as a stablecoin-native Layer-1 blockchain, engineered from the ground up 
                to support the world&apos;s most trusted digital assets with institutional-grade security and scale.
              </p>
              <p>
                Arc uses USDC as the native gas token, eliminating the volatility of traditional gas fees. 
                It features sub-second finality and is fully EVM compatible, making it the perfect environment 
                for global payment protocols and DeFi applications.
              </p>
              <p>
                The network is secured by a diverse set of institutional validators and is following an 
                ambitious quantum-resistant roadmap, ensuring that assets on Arc remain protected 
                against future cryptographic threats.
              </p>
            </div>
            <a 
              href="https://arc.network" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black text-[#1D9E75] hover:underline"
            >
              Learn more at arc.network <ExternalLink size={16} />
            </a>
          </div>
        </section>

        {/* SECTION 3 — OPEN SOURCE */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
           <div className="p-12 bg-[#0F1117] text-white rounded-[48px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D9E75] rounded-full blur-[100px] -mr-32 -mt-32 opacity-20" />
              <div className="relative z-10 space-y-6">
                 <h2 className="text-3xl font-black">ArcGov is fully open source</h2>
                 <p className="text-gray-400 max-w-sm mx-auto">
                    MIT Licence — fork it, build on it, contribute to the future of governance.
                 </p>
                 <a 
                  href="https://github.com/arcgov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all"
                 >
                   <Github size={20} /> VIEW ON GITHUB
                 </a>
              </div>
           </div>
        </section>

        {/* SECTION 4 — FAQ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
            <HelpCircle size={16} /> FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all min-h-[64px]"
                >
                  <span className="font-bold text-base md:text-lg pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="shrink-0" /> : <ChevronDown size={20} className="shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="p-6 pt-0 text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-900 animate-in fade-in duration-300">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5 — FEEDBACK FORM */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
           <div className="p-10 md:p-12 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[48px] space-y-10">
              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-black">Send us feedback</h2>
                 <p className="text-gray-500 text-sm">Have an idea or spotted a bug? We&apos;d love to hear from you.</p>
              </div>

              {submissionId ? (
                <div className="p-10 bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-3xl text-center space-y-4 animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto" />
                   <h4 className="text-xl font-bold">✓ Feedback received</h4>
                   <p className="text-xs text-gray-500">Reference: <span className="font-mono text-[#1D9E75]">{submissionId}</span>. We&apos;ll get back to you soon.</p>
                   <button 
                    onClick={() => setSubmissionId(null)}
                    className="px-6 py-3 text-xs font-black text-[#1D9E75] hover:underline"
                   >
                     SEND ANOTHER MESSAGE
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <User size={12} /> Name
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Your Name"
                          className="w-full h-14 px-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <Mail size={12} /> Email
                        </label>
                        <input 
                          type="email" 
                          required 
                          placeholder="you@example.com"
                          className="w-full h-14 px-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <MessageSquare size={12} /> Message
                      </label>
                      <textarea 
                        required 
                        rows={5}
                        placeholder="Tell us what's on your mind..."
                        className="w-full px-5 py-4 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium resize-none"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      />
                   </div>

                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#1D9E75] text-white font-black rounded-2xl hover:bg-[#0F6E56] transition-all shadow-lg shadow-[#1D9E75]/20 flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> SEND FEEDBACK</>}
                   </button>
                </form>
              )}
           </div>
        </section>
      </main>
    </div>
  );
}
