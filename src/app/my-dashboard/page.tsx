'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { 
  User, 
  History, 
  FilePlus, 
  Award, 
  Bell, 
  ChevronRight, 
  Wallet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ARC_GOV_CORE_ADDRESS, ARC_GOV_CORE_ABI } from '@/lib/contract';
import { Proposal } from '@/components/governance/ProposalCard';

export default function MyDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { data: rawProposals, isLoading } = useReadContract({
    address: ARC_GOV_CORE_ADDRESS,
    abi: ARC_GOV_CORE_ABI,
    functionName: 'getAllProposals',
  });

  const myProposals = useMemo(() => {
    if (!rawProposals || !address) return [];
    return (rawProposals as Proposal[]).filter(p => p.proposer.toLowerCase() === address.toLowerCase());
  }, [rawProposals, address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full p-10 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl text-center space-y-6 card-subtle-shadow">
            <div className="w-20 h-20 bg-[#E1F5EE] dark:bg-[#1D9E75]/10 rounded-full flex items-center justify-center mx-auto text-[#1D9E75]">
              <Wallet size={40} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Connect Wallet</h1>
            <p className="text-[#6B7280] dark:text-[#9CA3AF]">Please connect your wallet to access your personal governance dashboard.</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const participationScore = 65; // Mock score

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] flex items-center justify-center text-white shadow-lg">
               <User size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">My Dashboard</h1>
              <p className="font-mono text-sm text-[#6B7280] dark:text-[#9CA3AF]">{address}</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="p-4 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-2xl flex items-center gap-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
                    <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - participationScore / 100)} className="text-[#1D9E75]" />
                  </svg>
                  <span className="absolute text-[10px] font-black">{participationScore}%</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest leading-none mb-1">Participation</p>
                  <p className="text-sm font-bold">Good Standing</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Proposals */}
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FilePlus size={20} className="text-[#1D9E75]" />
                Your Proposals
              </h2>
              {myProposals.length > 0 ? (
                <div className="space-y-4">
                  {myProposals.map((p) => (
                    <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                      <div className="p-5 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-2xl hover:border-[#1D9E75] transition-all flex justify-between items-center group">
                        <div>
                          <h3 className="font-bold group-hover:text-[#1D9E75] transition-colors">{p.title}</h3>
                          <p className="text-xs text-[#6B7280] mt-1">Submitted on {new Date(Number(p.timestamp) * 1000).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-[#1D9E75]" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-10 bg-gray-50 dark:bg-[#1F2937]/10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-center">
                  <p className="text-sm text-[#6B7280] mb-4">You haven't submitted any proposals yet.</p>
                  <Link href="/governance" className="btn-primary inline-flex items-center gap-2">
                    <Plus size={16} /> Create Proposal
                  </Link>
                </div>
              )}
            </section>

            {/* Voting History (Mock) */}
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <History size={20} className="text-[#1D9E75]" />
                Voting History
              </h2>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-5 bg-gray-50/50 dark:bg-[#1F2937]/10 border border-gray-100 dark:border-[#1F2937] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Voted FOR Proposal #00{i}</p>
                        <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-widest">2 Days ago</p>
                      </div>
                    </div>
                    <a href="#" className="text-[#1D9E75] hover:underline text-xs font-bold">VIEW TX</a>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Rewards */}
            <div className="p-8 bg-[#1D9E75] text-white rounded-3xl space-y-6 shadow-xl shadow-[#1D9E75]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award size={20} />
                Gov Rewards
              </h3>
              {chainId === 5042002 ? (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Accumulated Rewards</p>
                    <p className="text-3xl font-black font-mono">142.50 USDC</p>
                  </div>
                  <button className="w-full py-3 bg-white text-[#1D9E75] font-black rounded-xl hover:bg-gray-50 transition-colors">
                    CLAIM REWARDS
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium opacity-90">Switch to Arc Testnet to see your USDC balance and rewards.</p>
                  <button 
                    onClick={() => switchChain({ chainId: 5042002 })}
                    className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/30"
                  >
                    <RefreshCw size={16} /> Switch Network
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="p-8 bg-white dark:bg-[#1F2937]/30 border border-[#E5E7EB] dark:border-[#1F2937] rounded-3xl space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Bell size={20} className="text-[#1D9E75]" />
                Alerts
              </h3>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">New Proposal: AGP-004</p>
                      <p className="text-xs text-[#6B7280]">Upgrade validator security specs.</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold">Voting Ending: AGP-003</p>
                      <p className="text-xs text-[#6B7280]">2 hours remaining to cast your vote.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
