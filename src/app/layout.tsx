// ArcGov — arcgov.vercel.app
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import LayoutContent from "./layout-content";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://arcgov.vercel.app"),
  title: {
    default: "ArcGov — Arc Blockchain Governance",
    template: "%s | ArcGov"
  },
  description: "The first community governance dashboard for Arc blockchain by Circle.",
  openGraph: {
    siteName: "ArcGov",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    site: "@arcgov"
  }
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
          <LayoutContent>
            {children}
          </LayoutContent>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
