import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arc Validators",
  description: "Track all 8 Arc blockchain validators — uptime, commission rates, quantum readiness, and delegation interest.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
