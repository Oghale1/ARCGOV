import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Governance Calendar | ArcGov",
  description: "Track Arc governance proposal voting deadlines on a calendar view.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
