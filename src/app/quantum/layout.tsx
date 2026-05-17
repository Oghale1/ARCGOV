import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Quantum Readiness Tracker | ArcGov",
  description: "Track Arc blockchain's quantum-resistant infrastructure upgrade. See which validators have completed post-quantum upgrades.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
