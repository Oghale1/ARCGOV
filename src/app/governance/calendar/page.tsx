'use client';
// ArcGov — Built by Gemini — arcgov.vercel.app

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { getAllProposals } from '@/lib/contract';

const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'];
const CATEGORY_COLORS: any = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};

export default function GovernanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredProposal, setHoveredProposal] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const all = await getAllProposals();
        setProposals((all as any[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- CALENDAR LOGIC (Native JS) ---
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
         <CalendarIcon className="text-[#1D9E75]" size={20} />
         {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </h2>
      <div className="flex items-center gap-2">
         <button onClick={prevMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all h-12 w-12 flex items-center justify-center">
           <ChevronLeft size={24} />
         </button>
         <button onClick={nextMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all h-12 w-12 flex items-center justify-center">
           <ChevronRight size={24} />
         </button>
      </div>
    </div>
  );

  const renderCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const today = new Date();

    const cells = [];
    
    // Previous month padding
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push(
        <div key={`prev-${i}`} className="min-h-[80px] md:min-h-[120px] border border-gray-100 dark:border-gray-800 p-3 opacity-20 bg-gray-50/30">
          <span className="text-sm font-black text-gray-400">{prevMonthDays - i}</span>
        </div>
      );
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      
      const activeOnDay = proposals.filter(p => {
        if (!p.isOpen) return false;
        const deadline = new Date(Number(p.timestamp) * 1000 + (7 * 24 * 60 * 60 * 1000));
        return deadline.getDate() === d && deadline.getMonth() === month && deadline.getFullYear() === year;
      });

      cells.push(
        <div key={d} className={`relative min-h-[80px] md:min-h-[120px] border border-gray-100 dark:border-gray-800 p-3 md:p-4 transition-all bg-white dark:bg-[#0F1117] ${isToday ? 'ring-2 ring-inset ring-[#1D9E75] rounded-lg z-10' : ''}`}>
          <span className={`text-sm font-black ${isToday ? 'text-[#1D9E75]' : 'text-gray-400'}`}>{d}</span>
          <div className="mt-1 md:mt-2 space-y-1">
             {activeOnDay.map((p) => (
               <Link 
                key={p.id.toString()} 
                href={`/governance/${p.id}`}
                onMouseEnter={() => setHoveredProposal(p)}
                onMouseLeave={() => setHoveredProposal(null)}
                className="block group"
               >
                  <div className="flex items-center gap-1.5 p-1 bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-md hover:bg-[#1D9E75] transition-all">
                     <div className="w-1 h-1 rounded-full bg-[#1D9E75] group-hover:bg-white animate-pulse shrink-0" />
                     <span className="text-[8px] md:text-[9px] font-bold text-[#1D9E75] group-hover:text-white truncate">#{p.id.toString()}</span>
                  </div>
               </Link>
             ))}
          </div>
        </div>
      );
    }

    // Next month padding
    const remaining = 42 - cells.length; // 6 rows of 7
    for (let i = 1; i <= remaining; i++) {
      cells.push(
        <div key={`next-${i}`} className="min-h-[80px] md:min-h-[120px] border border-gray-100 dark:border-gray-800 p-3 opacity-20 bg-gray-50/30">
          <span className="text-sm font-black text-gray-400">{i}</span>
        </div>
      );
    }

    return <div className="grid grid-cols-7 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden">{cells}</div>;
  };

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return proposals
      .filter(p => p.isOpen)
      .map(p => {
        const deadline = new Date(Number(p.timestamp) * 1000 + (7 * 24 * 60 * 60 * 1000));
        const diffTime = deadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...p, deadline, daysLeft };
      })
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [proposals]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1117] text-gray-900 dark:text-white">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link href="/governance" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#1D9E75] transition-all mb-8 group min-h-[44px]">
           <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
           Back to Governance
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
             <Loader2 className="animate-spin text-[#1D9E75]" size={40} />
             <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Synchronizing calendar...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div>
               {renderHeader()}
               <div className="grid grid-cols-7 mb-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 py-2">{day}</div>
                  ))}
               </div>
               {renderCells()}
            </div>

            <div className="space-y-8">
               <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-2xl font-black">Upcoming Deadlines</h3>
                  <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     {upcomingDeadlines.length} Active Voting Windows
                  </div>
               </div>

               {upcomingDeadlines.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingDeadlines.map((p) => (
                      <Link key={p.id.toString()} href={`/governance/${p.id}`}>
                        <div className="p-6 bg-white dark:bg-[#0F1117] border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-[#1D9E75] transition-all group h-full flex flex-col justify-between">
                           <div>
                              <div className="flex items-center justify-between mb-4">
                                 <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS[3]}`}>
                                   {CATEGORY_LABELS[p.category] || 'ECOSYSTEM'}
                                 </span>
                                 <span className="text-[10px] font-mono text-gray-400">#{p.id.toString()}</span>
                              </div>
                              <h4 className="font-bold text-lg mb-6 group-hover:text-[#1D9E75] transition-colors line-clamp-2">{p.title}</h4>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-900">
                              <div className="flex items-center gap-1.5 text-[#1D9E75] text-[10px] font-black uppercase tracking-tighter">
                                 <Clock size={12} />
                                 {p.daysLeft <= 0 ? 'Closes Today' : `Closes in ${p.daysLeft} days`}
                              </div>
                              <div className="text-[10px] font-bold text-gray-400">
                                 {p.deadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                           </div>
                        </div>
                      </Link>
                    ))}
                 </div>
               ) : (
                 <div className="p-12 bg-gray-50/50 dark:bg-gray-900/30 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] text-center">
                    <Info className="mx-auto text-gray-300 mb-4" size={32} />
                    <p className="text-gray-500 font-bold">No upcoming voting deadlines</p>
                    <p className="text-sm text-gray-400">Proposals will appear here once they are submitted on-chain.</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
