import { NextResponse } from 'next/server';

// Arc governance AI assistant — powered by Groq (Llama 3.3 70B).
// Groq exposes an OpenAI-compatible chat-completions endpoint, so we call it
// directly with fetch — no SDK/dependency needed.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function POST(request: Request) {
  try {
    const { proposalTitle, proposalDescription, userMessage } = await request.json();

    if (!proposalTitle || !proposalDescription) {
      return NextResponse.json(
        { error: 'Missing proposal data' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI assistant temporarily unavailable. Please check GROQ_API_KEY.' },
        { status: 503 }
      );
    }

    const systemInstruction = `You are "Arc Assistant", a governance analyst for the Arc blockchain.
Your goal is to help users understand governance proposals in plain, simple terms.
Be neutral, factual, and concise.
The current proposal is titled: "${proposalTitle}".
The description is: "${proposalDescription}".

If the user asks for a summary, provide a clear 2-3 paragraph explanation starting with "This proposal aims to...".
If the user asks a specific question, answer it based on the proposal description provided.
If the answer isn't in the description, say you don't have that specific information but explain what you do know.`;

    const userPrompt = userMessage
      ? userMessage
      : 'Please provide a summary of this proposal.';

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `Groq request failed (${res.status})`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const text: string = data?.choices?.[0]?.message?.content?.trim() || '';

    // Return both keys: the proposal page reads `text`, the AIP-001 page reads `summary`.
    return NextResponse.json({ text, summary: text });
  } catch (error: any) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
