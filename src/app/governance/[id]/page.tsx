// ArcGov — Built by Gemini — arcgov.vercel.app
import { Metadata } from 'next';
import ProposalClient from './proposal-client';
import { getAllProposals } from '@/lib/contract';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const proposals = await getAllProposals();
    const proposal = (proposals as any[]).find(p => p.id.toString() === params.id);
    
    if (!proposal) return { title: "Proposal" };
    
    return {
      title: `${proposal.title} | Governance`,
      description: proposal.description.slice(0, 160),
    };
  } catch (err) {
    return { title: "Proposal | ArcGov" };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProposalClient />;
}
