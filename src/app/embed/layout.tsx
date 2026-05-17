import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Embed ArcGov Widget | ArcGov",
  description: "Embed live Arc governance stats on any website with one line of iframe code.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
