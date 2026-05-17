import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AIP-001: Launch tARC Token | ArcGov",
  description: "Vote on AIP-001 — the first ArcGov governance proposal to launch the tARC community token on Arc Testnet.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
