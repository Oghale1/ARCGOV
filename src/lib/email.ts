// ArcGov — arcgov.vercel.app
// Email delivery via Gmail + Nodemailer (free, no custom domain required).
// Set GMAIL_USER and GMAIL_APP_PASSWORD (a Google App Password, not your
// normal password) in the environment. When they're absent, sendEmail() is a
// safe no-op so the rest of the app never breaks on a missing credential.

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email credentials not configured — skipping send');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"ArcGov" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

const SHELL_OPEN = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0F1117; color: #F9FAFB; padding: 32px; border-radius: 12px;">`;
const BRAND = `<div style="margin-bottom: 24px;"><span style="display:inline-block;width:32px;height:32px;background:#1D9E75;border-radius:50%;vertical-align:middle;margin-right:10px;"></span><span style="font-size:20px;font-weight:700;vertical-align:middle;">ArcGov</span></div>`;

export function stakingWaitlistEmail(validatorName?: string): string {
  return `
    ${SHELL_OPEN}
      ${BRAND}
      <h2 style="color: #1D9E75; margin-bottom: 16px;">You are on the staking waitlist</h2>
      <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 16px;">
        ${
          validatorName
            ? `You have expressed interest in staking with <strong style="color:#F9FAFB;">${validatorName}</strong>.`
            : 'You have joined the ArcGov staking waitlist.'
        }
        We will notify you when tARC staking goes live after the AIP-001 governance proposal passes.
      </p>
      <a href="https://arcgov.vercel.app/governance/aip-001" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">Vote on AIP-001 →</a>
      <p style="color:#6B7280;font-size:12px;border-top:1px solid #1F2937;padding-top:16px;">
        ArcGov · Built on Arc Testnet · Chain ID 5042002 · Not affiliated with Circle
      </p>
    </div>
  `;
}

export function newProposalEmail(proposalTitle: string, proposalId: string | number): string {
  return `
    ${SHELL_OPEN}
      ${BRAND}
      <h2 style="color: #1D9E75; margin-bottom: 16px;">New governance proposal</h2>
      <p style="color:#9CA3AF;line-height:1.6;margin-bottom:8px;">A new proposal has been submitted to Arc governance:</p>
      <div style="background:#1F2937;border-left:3px solid #1D9E75;padding:16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
        <strong style="color:#F9FAFB;font-size:15px;">${proposalTitle}</strong>
      </div>
      <a href="https://arcgov.vercel.app/governance/${proposalId}" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">Vote Now →</a>
      <p style="color:#6B7280;font-size:12px;border-top:1px solid #1F2937;padding-top:16px;">
        ArcGov · Built on Arc Testnet · Not affiliated with Circle<br>
        <a href="https://arcgov.vercel.app" style="color:#1D9E75;">arcgov.vercel.app</a>
      </p>
    </div>
  `;
}

export function quantumUpdateEmail(updateText: string): string {
  return `
    ${SHELL_OPEN}
      ${BRAND}
      <h2 style="color: #1D9E75; margin-bottom: 16px;">Quantum readiness update</h2>
      <p style="color:#9CA3AF;line-height:1.6;margin-bottom:16px;">${updateText}</p>
      <a href="https://arcgov.vercel.app/quantum" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Quantum Tracker →</a>
      <p style="color:#6B7280;font-size:12px;border-top:1px solid #1F2937;padding-top:16px;margin-top:24px;">ArcGov · arcgov.vercel.app</p>
    </div>
  `;
}
