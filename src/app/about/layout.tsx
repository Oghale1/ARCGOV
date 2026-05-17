import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About ArcGov | Arc Blockchain Governance",
  description: "ArcGov is the first community-built governance and validator dashboard for Arc blockchain by Circle.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
