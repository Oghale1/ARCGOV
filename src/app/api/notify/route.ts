import { NextResponse } from 'next/server';
import {
  sendEmail,
  stakingWaitlistEmail,
  newProposalEmail,
  quantumUpdateEmail,
} from '@/lib/email';

export const dynamic = 'force-dynamic';

// Normalise legacy type names so older callers keep working.
const TYPE_ALIASES: Record<string, string> = {
  waitlist_confirmation: 'staking_waitlist',
  staking_live: 'staking_waitlist',
  quantum_confirmation: 'quantum_update',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Accept either `to` (new) or `email` (legacy) for the recipient.
    const to = body.to || body.email;
    const data = body.data;
    const type = TYPE_ALIASES[body.type] || body.type;

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing type or to' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'staking_waitlist':
        subject = 'You are on the ArcGov staking waitlist';
        html = stakingWaitlistEmail(data?.validatorName);
        break;
      case 'new_proposal':
        subject = `New proposal: ${data?.title ?? 'on ArcGov'}`;
        html = newProposalEmail(data?.title ?? 'New Proposal', data?.proposalId ?? '');
        break;
      case 'quantum_update':
        subject = 'Arc quantum readiness update from ArcGov';
        html = quantumUpdateEmail(
          data?.updateText ?? 'A validator has completed a quantum upgrade milestone.'
        );
        break;
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }

    const success = await sendEmail({ to, subject, html });

    return NextResponse.json({
      success,
      message: success ? 'Email sent' : 'Email failed — check server logs / credentials',
    });
  } catch (error) {
    console.error('Notify route error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
