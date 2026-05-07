// ArcGov — arcgov.vercel.app
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TestnetBanner from "@/components/shared/TestnetBanner";
import WrongNetworkBanner from "@/components/shared/WrongNetworkBanner";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ArcGov — Governance & Validator Dashboard",
  description: "The first governance and validator dashboard for the Arc blockchain by Circle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-[#0F1117] text-black dark:text-white min-h-screen flex flex-col`}>
        <Providers>
          <TestnetBanner />
          <Navbar />
          <WrongNetworkBanner />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
