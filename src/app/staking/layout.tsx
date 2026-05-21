import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "tARC Staking",
  description: "Stake tARC and earn rewards on ArcGov. Join the waitlist for Arc Testnet staking — launching after AIP-001 governance vote.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
