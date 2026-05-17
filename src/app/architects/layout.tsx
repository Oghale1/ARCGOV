import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arc Architects Program | ArcGov",
  description: "Community builders shaping the Arc blockchain ecosystem. Join the program and get featured on ArcGov.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
