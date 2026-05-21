'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import { useState, useEffect } from 'react';
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
  
  function t(key: string): string {
    const keys = key.split('.');
    let value: any = messages[lang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value ?? key;
  }
  
  return { t, lang, setLang };
}
