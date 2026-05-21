import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Governance Dashboard",
  description: "Your personal Arc governance dashboard — voting history, participation score, and delegation interests.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
