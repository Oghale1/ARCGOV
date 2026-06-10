// ArcGov — arcgov.vercel.app
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-4 px-4 md:px-8 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>ArcGov</span>
          <span className="mx-1">·</span>
          <span>{t('footer.built_on')}</span>
          <span className="mx-1">·</span>
          <span>{t('footer.chain_id')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/embed"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('footer.embed_widget')}
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>{t('footer.not_affiliated')}</span>
        </div>
      </div>
    </footer>
  );
}
