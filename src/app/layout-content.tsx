'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React from 'react';
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TestnetBanner from "@/components/shared/TestnetBanner";
import WrongNetworkBanner from "@/components/shared/WrongNetworkBanner";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWidget = pathname === '/widget';

  return (
    <>
      {!isWidget && <TestnetBanner />}
      {!isWidget && <Navbar />}
      {!isWidget && <WrongNetworkBanner />}
      <main className={isWidget ? '' : 'flex-1'}>
        {children}
      </main>
      {!isWidget && <Footer />}
    </>
  );
}
