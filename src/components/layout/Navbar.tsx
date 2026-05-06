// ArcGov — arcgov.vercel.app
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Overview', href: '/' },
  { name: 'Governance', href: '/governance' },
  { name: 'Validators', href: '/validators' },
  { name: 'Staking', href: '/staking' },
  { name: 'Quantum', href: '/quantum' },
  { name: 'Architects', href: '/architects' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 w-full h-[56px] bg-white dark:bg-[#0F1117] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-8">
      {/* Left Section: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-5 h-5 bg-[#1D9E75] rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <span className="font-medium text-lg text-[#0F1117] dark:text-white">ArcGov</span>
      </Link>

      {/* Centre Section: Desktop Links */}
      <div className="hidden md:flex items-center gap-6 h-full">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`h-full flex items-center text-[13px] font-medium transition-colors ${
                isActive
                  ? 'text-[#1D9E75] border-b-2 border-[#1D9E75]'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Right Section: Toggle & Wallet */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <div className="hidden sm:block">
          <ConnectButton 
            accountStatus="avatar"
            chainStatus="icon"
            showBalance={false}
          />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-[56px] left-0 w-full h-[calc(100vh-56px)] bg-white dark:bg-[#0F1117] flex flex-col p-6 gap-6 z-40 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-2xl font-semibold ${
                  isActive ? 'text-[#1D9E75]' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="mt-4 sm:hidden">
             <ConnectButton fullWidth />
          </div>
        </div>
      )}
    </nav>
  );
}
