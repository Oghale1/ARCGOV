// ArcGov — Built by Gemini — arcgov.vercel.app
import { Metadata } from 'next';
import ValidatorClient from './validator-client';
import validators from '@/data/validators.json';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const validator = (validators as any[]).find(v => v.id.toString() === params.id);
  
  if (!validator) return { title: "Validator" };
  
  return {
    title: `${validator.name} | Arc Validators`,
    description: `${validator.name} — ${validator.uptime}% uptime, ${validator.commission}% commission, quantum status: ${validator.quantumStatus}. Track live on ArcGov.`,
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ValidatorClient />;
}
