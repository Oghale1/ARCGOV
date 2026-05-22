'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  deadline: Date;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    setHasMounted(true);
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = new Date(deadline).getTime() - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isExpired: false
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.isExpired) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!hasMounted) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-200 dark:text-gray-800 uppercase tracking-widest">
        <Clock size={12} />
        ---
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <Clock size={12} />
        Voting Closed
      </div>
    );
  }

  const isCritical = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${isCritical ? 'text-red-500' : 'text-[#1D9E75]'}`}>
      <Clock size={12} className={isCritical ? 'animate-pulse' : ''} />
      {isCritical ? (
        <span>Closes in {timeLeft.hours}h {timeLeft.minutes}m</span>
      ) : (
        <span>{timeLeft.days}d {timeLeft.hours}h remaining</span>
      )}
    </div>
  );
}
