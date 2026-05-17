// ArcGov — arcgov.vercel.app
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Bell, 
  Clock, 
  ExternalLink, 
  Vote, 
  PlusCircle, 
  ChevronRight,
  AlertCircle 
} from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { ARCGovCoreABI } from '@/lib/contract';
import { formatDistanceToNow } from 'date-fns';

const CONTRACT_ADDRESS = '0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99' as `0x${string}`;

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
  const publicClient = usePublicClient();
  const [mounted, setMounted] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastRead, setLastRead] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('arcgov_last_read');
    if (stored) setLastRead(parseInt(stored));
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('button[aria-label="Toggle menu"]')) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = React.useCallback(async () => {
    if (!publicClient) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(100) > BigInt(0) ? currentBlock - BigInt(100) : BigInt(0);

      const [pLogs, vLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: ARCGovCoreABI,
          eventName: 'ProposalCreated',
          fromBlock,
          toBlock: currentBlock
        }),
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: ARCGovCoreABI,
          eventName: 'VoteCast',
          fromBlock,
          toBlock: currentBlock
        })
      ]);

      const all = [
        ...pLogs.map((l: any) => ({ 
          type: 'ProposalCreated', 
          title: l.args.title, 
          proposalId: Number(l.args.proposalId), 
          timestamp: Date.now(), 
          hash: l.transactionHash,
          block: Number(l.blockNumber)
        })),
        ...vLogs.map((l: any) => ({ 
          type: 'VoteCast', 
          actor: l.args.voter, 
          voteType: Number(l.args.voteType), 
          proposalId: Number(l.args.proposalId), 
          timestamp: Date.now(), 
          hash: l.transactionHash,
          block: Number(l.blockNumber)
        }))
      ].sort((a, b) => b.block - a.block).slice(0, 5);

      setNotifications(all);
      
      // Calculate unread based on block number as proxy for time if timestamp is same
      const unread = all.filter(n => n.block > lastRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn("Notif fetch failed");
    }
  }, [publicClient, lastRead]);

  useEffect(() => {
    if (mounted) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchNotifications]);

  const markAllRead = () => {
    const latestBlock = notifications.length > 0 ? notifications[0].block : lastRead;
    setLastRead(latestBlock);
    setUnreadCount(0);
    localStorage.setItem('arcgov_last_read', latestBlock.toString());
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 w-full h-[56px] bg-white dark:bg-[#0F1117] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-8">
      {/* Left Section: Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1D9E75] rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="font-medium text-lg text-[#0F1117] dark:text-white tracking-tight">ArcGov</span>
        </Link>
        
        <a 
          href="https://testnet.arcscan.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-[#1D9E75] transition-all group"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <span className="text-[9px] font-black text-gray-400 group-hover:text-[#1D9E75] uppercase tracking-widest transition-colors">Testnet</span>
        </a>
      </div>

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

      {/* Right Section: Notifs & Toggle & Wallet */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} className={unreadCount > 0 ? 'text-[#1D9E75]' : 'text-gray-500'} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#0F1117]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-[48px] right-0 w-[320px] bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
                  <h3 className="text-xs font-black uppercase tracking-widest">Governance Notifications</h3>
                  <button onClick={markAllRead} className="text-[10px] font-bold text-[#1D9E75] hover:underline">Mark all read</button>
               </div>
               <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {notifications.map((n, i) => (
                        <Link key={i} href={`/governance/${n.proposalId}`} onClick={() => setIsNotifOpen(false)}>
                          <div className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex gap-3 ${n.block > lastRead ? 'bg-[#1D9E75]/5' : ''}`}>
                             <div className={`p-2 rounded-lg shrink-0 ${n.type === 'ProposalCreated' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-green-50 dark:bg-green-900/20 text-[#1D9E75]'}`}>
                                {n.type === 'ProposalCreated' ? <PlusCircle size={14} /> : <Vote size={14} />}
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-bold leading-snug line-clamp-2">
                                   {n.type === 'ProposalCreated' ? `New proposal: ${n.title}` : `New vote cast on #${n.proposalId}`}
                                </p>
                                <p className="text-[9px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                                   <Clock size={8} /> Just now
                                </p>
                             </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                       <AlertCircle className="mx-auto text-gray-300 mb-2" size={24} />
                       <p className="text-xs text-gray-500 font-medium">No recent activity</p>
                    </div>
                  )}
               </div>
               <Link href="/" onClick={() => setIsNotifOpen(false)} className="block p-3 text-center border-t border-gray-50 dark:border-gray-800 text-[10px] font-black text-[#1D9E75] hover:bg-gray-50 dark:hover:bg-gray-900 transition-all uppercase tracking-widest">
                  View all activity <ChevronRight size={10} className="inline ml-1" />
               </Link>
            </div>
          )}
        </div>

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
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="absolute top-[56px] left-0 w-full h-[calc(100vh-56px)] bg-white dark:bg-[#0F1117] flex flex-col p-6 gap-6 z-40 md:hidden"
        >
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
             <ConnectButton />
          </div>
        </div>
      )}
    </nav>
  );
}
