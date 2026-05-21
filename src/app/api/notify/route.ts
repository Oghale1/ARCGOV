import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'noreply@arcgov.vercel.app';

export async function POST(req: Request) {
  try {
    const { type, email, data } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'staking_live':
        subject = 'tARC Staking is now live on ArcGov';
        html = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
            <h2>ArcGov staking is now live!</h2>
            <p>You are on the waitlist and can now stake tARC tokens at <a href="https://arcgov.vercel.app/staking">arcgov.vercel.app/staking</a></p>
            <p>This was triggered by the passing of AIP-001 governance proposal.</p>
            <hr />
            <p><a href="https://arcgov.vercel.app">Visit ArcGov →</a></p>
            <p style="font-size: 12px; color: #666;">ArcGov · Built on Arc Testnet · Not affiliated with Circle</p>
          </div>
        `;
        break;

      case 'new_proposal':
        subject = 'New governance proposal on ArcGov';
        html = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
            <h2>A new proposal has been submitted</h2>
            <p><strong>${data?.title || 'Untitled Proposal'}</strong></p>
            <p>Vote now at <a href="https://arcgov.vercel.app/governance">arcgov.vercel.app/governance</a></p>
            <hr />
            <p style="font-size: 12px; color: #666;">ArcGov · Built on Arc Testnet</p>
          </div>
        `;
        break;

      case 'waitlist_confirmation':
        subject = "You're on the ArcGov staking waitlist";
        html = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
            <h2>Waitlist Confirmed</h2>
            <p>You'll be notified when tARC staking goes live on ArcGov after AIP-001 governance proposal passes.</p>
            <p>Track the proposal at: <a href="https://arcgov.vercel.app/governance/aip-001">arcgov.vercel.app/governance/aip-001</a></p>
            <hr />
            <p style="font-size: 12px; color: #666;">ArcGov · Built on Arc Testnet</p>
          </div>
        `;
        break;

      case 'quantum_confirmation':
        subject = "Subscribed to ArcGov Quantum Updates";
        html = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #111;">
            <h2>Subscription Confirmed</h2>
            <p>You've successfully subscribed to quantum readiness updates on ArcGov.</p>
            <p>We'll notify you as more institutional validators complete their post-quantum upgrades.</p>
            <p>View current status: <a href="https://arcgov.vercel.app/quantum">arcgov.vercel.app/quantum</a></p>
            <hr />
            <p style="font-size: 12px; color: #666;">ArcGov · Built on Arc Testnet</p>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const { data: resendData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: resendData?.id });
  } catch (err: any) {
    console.error('Notify route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
