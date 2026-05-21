'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' }
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('arcgov_language');
    if (stored) setCurrentLang(stored);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    localStorage.setItem('arcgov_language', code);
    setCurrentLang(code);
    setIsOpen(false);
    window.location.reload(); // Refresh to apply translations
  };

  const selectedLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-widest"
        aria-label="Select language"
      >
        <span>{selectedLanguage.flag}</span>
        <span className="hidden sm:inline">{selectedLanguage.code}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[48px] right-0 w-[180px] bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  currentLang === lang.code 
                    ? 'bg-[#1D9E75]/10 text-[#1D9E75]' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {currentLang === lang.code && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
