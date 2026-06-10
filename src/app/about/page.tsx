'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState } from 'react';
import {
  Info,
  HelpCircle,
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
import { useTranslation } from '@/lib/i18n';

export default function AboutPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // FAQ Data (translated)
  const FAQS = [
    { q: t('about.faq_q1'), a: t('about.faq_a1') },
    { q: t('about.faq_q2'), a: t('about.faq_a2') },
    { q: t('about.faq_q3'), a: t('about.faq_a3') },
    { q: t('about.faq_q4'), a: t('about.faq_a4') },
    { q: t('about.faq_q5'), a: t('about.faq_a5') },
    { q: t('about.faq_q6'), a: t('about.faq_a6') },
    { q: t('about.faq_q7'), a: t('about.faq_a7') },
    { q: t('about.faq_q8'), a: t('about.faq_a8') },
  ];

  // Feedback Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast(t('about.fill_fields'), "error");
      return;
    }

    setIsSubmitting(true);
    const { ok, ref, error } = await submitForm('feedback', formData);
    if (ok) {
      setSubmissionId(ref || 'SUCCESS');
      toast(t('about.feedback_sent'), "success");
      setFormData({ name: '', email: '', message: '' });
    } else {
      toast(error || t('about.submit_failed'), "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow">
        {/* SECTION 1 — WHAT IS ARCGOV */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
            <Info size={16} /> {t('about.independence')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">{t('about.title')}</h1>
          <div className="space-y-6 text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            <p>
              {t('about.p1')}
            </p>
            <p>
              {t('about.p2')}
            </p>
            <p>
              {t('about.p3')}
            </p>
          </div>
        </section>

        {/* SECTION 2 — WHAT IS ARC */}
        <section className="bg-gray-50/50 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-800 py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
              <Zap size={16} /> {t('about.technology')}
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">{t('about.about_arc')}</h2>
            <div className="space-y-6 text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
              <p>
                {t('about.arc_p1')}
              </p>
              <p>
                {t('about.arc_p2')}
              </p>
              <p>
                {t('about.arc_p3')}
              </p>
            </div>
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black text-[#1D9E75] hover:underline"
            >
              {t('about.learn_more')} <ExternalLink size={16} />
            </a>
          </div>
        </section>

        {/* SECTION 4 — FAQ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-center gap-3 text-[#1D9E75] font-black text-xs uppercase tracking-widest mb-4">
            <HelpCircle size={16} /> {t('about.faq')}
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">{t('about.faq_title')}</h2>
          
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
                 <h2 className="text-3xl font-black">{t('about.feedback_title')}</h2>
                 <p className="text-gray-500 text-sm">{t('about.feedback_desc')}</p>
              </div>

              {submissionId ? (
                <div className="p-10 bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-3xl text-center space-y-4 animate-in zoom-in duration-300">
                   <CheckCircle2 size={48} className="text-[#1D9E75] mx-auto" />
                   <h4 className="text-xl font-bold">✓ {t('about.feedback_received')}</h4>
                   <p className="text-xs text-gray-500">{t('common.reference')}: <span className="font-mono text-[#1D9E75]">{submissionId}</span>. {t('about.feedback_received_desc')}</p>
                   <button
                    onClick={() => setSubmissionId(null)}
                    className="px-6 py-3 text-xs font-black text-[#1D9E75] hover:underline"
                   >
                     {t('about.send_another')}
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <User size={12} /> {t('about.name')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('about.name_placeholder')}
                          className="w-full h-14 px-5 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#1D9E75] transition-all font-medium"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <Mail size={12} /> {t('about.email')}
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
                        <MessageSquare size={12} /> {t('about.message')}
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder={t('about.message_placeholder')}
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
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> {t('about.send_feedback')}</>}
                   </button>
                </form>
              )}
           </div>
        </section>
      </main>
    </div>
  );
}
