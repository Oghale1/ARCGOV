'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Layout,
  Terminal,
  Monitor
} from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { useTranslation } from '@/lib/i18n';

export default function EmbedPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe src="https://arcgov.vercel.app/widget" width="320" height="110" frameborder="0" style="border: none; border-radius: 10px; overflow: hidden;" scrolling="no"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast(t('embed.copied'), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* HEADER */}
        <section className="text-center mb-20 space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] font-black tracking-widest border border-[#1D9E75]/20 uppercase">
             <Code2 size={12} /> {t('embed.integration')}
           </div>
           <h1 className="text-5xl font-black tracking-tighter">{t('embed.title')}</h1>
           <p className="text-lg text-gray-500 max-w-2xl mx-auto">
             {t('embed.subtitle')}
           </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
           {/* PREVIEW */}
           <section className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                    <Monitor size={20} />
                 </div>
                 <h2 className="text-xl font-black">{t('embed.live_preview')}</h2>
              </div>
              
              <div className="p-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[40px] flex items-center justify-center min-h-[240px]">
                 <iframe 
                    src="/widget" 
                    width="320" 
                    height="110" 
                    frameBorder="0" 
                    scrolling="no"
                    className="shadow-2xl shadow-black/5"
                 />
              </div>

              <div className="flex items-start gap-3 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                 <Info className="text-blue-500 shrink-0" size={18} />
                 <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                    {t('embed.preview_note')}
                 </p>
              </div>
           </section>

           {/* CODE */}
           <section className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                    <Terminal size={20} />
                 </div>
                 <h2 className="text-xl font-black">{t('embed.embed_code')}</h2>
              </div>

              <div className="relative group">
                 <div className="p-8 bg-[#0F1117] rounded-[32px] font-mono text-[10px] md:text-xs text-gray-400 break-all leading-relaxed border border-white/5 shadow-2xl">
                    {embedCode}
                 </div>
                 <button 
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-[#1D9E75] text-white rounded-2xl transition-all flex items-center gap-2 group/btn min-h-[44px]"
                 >
                   {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                   <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover/btn:block">{t('embed.copy_code')}</span>
                 </button>
              </div>
              ...
              <div className="space-y-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{t('embed.instructions')}</h3>
                 <ol className="space-y-4">
                    {[
                      t('embed.step_1'),
                      t('embed.step_2'),
                      t('embed.step_3'),
                      t('embed.step_4')
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm font-medium text-gray-500">
                        <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-[10px] font-black shrink-0 border border-gray-100 dark:border-gray-800">{i+1}</span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                 </ol>
              </div>

           </section>
        </div>
      </main>
    </div>
  );
}
