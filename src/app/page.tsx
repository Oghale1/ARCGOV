// ArcGov — Built by Gemini — arcgov.vercel.app
import { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: "ArcGov — Arc Blockchain Governance",
  description: "The first community governance dashboard for Arc blockchain. Vote on proposals, track validators, and shape Arc's future.",
  openGraph: {
    title: "ArcGov — Arc Blockchain Governance",
    description: "The first community governance dashboard for Arc blockchain. Vote on proposals, track validators, and shape Arc's future.",
    url: "https://arcgov.vercel.app",
    siteName: "ArcGov"
  }
};

export default function Page() {
  return <HomeClient />;
}
