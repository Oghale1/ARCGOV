'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import { useState, useEffect, useCallback } from 'react';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import pt from '@/messages/pt.json';

const messages: any = { en, fr, pt };

export function useTranslation() {
  const [lang, setLang] = useState<'en' | 'fr' | 'pt'>('en');

  useEffect(() => {
    const stored = localStorage.getItem('arcgov_language') as 'en' | 'fr' | 'pt' | null;
    if (stored && messages[stored]) {
      setLang(stored);
    }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = messages[lang];

    for (const k of keys) {
      value = value?.[k];
    }

    // Fall back to English, then to the raw key, so a missing translation never
    // renders a blank — it shows the English copy instead.
    if (value == null) {
      let fallback: any = messages.en;
      for (const k of keys) fallback = fallback?.[k];
      value = fallback ?? key;
    }

    // Interpolate {placeholder} tokens, e.g. t('x.y', { name: 'BlackRock' }).
    if (typeof value === 'string' && vars) {
      return value.replace(/\{(\w+)\}/g, (_, name) =>
        vars[name] != null ? String(vars[name]) : `{${name}}`
      );
    }

    return value ?? key;
  }, [lang]);

  return { t, lang, setLang };
}
