import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Governance Proposals",
  description: "Browse and vote on active Arc governance proposals. Submit your own proposal and shape the Arc network.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
