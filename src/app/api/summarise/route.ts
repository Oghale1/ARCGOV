import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { proposalTitle, proposalDescription } = await request.json();

    if (!proposalTitle || !proposalDescription) {
      return NextResponse.json(
        { error: 'Missing proposalTitle or proposalDescription' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620', // Using a valid stable model name
        max_tokens: 500,
        system: "You are a governance analyst for Arc blockchain by Circle. Summarise governance proposals in plain English for non-technical readers. Keep summaries under 200 words. Be neutral, factual, and clear. Always start with 'This proposal aims to...'",
        messages: [
          {
            role: 'user',
            content: `Proposal title: ${proposalTitle}\n\nDescription: ${proposalDescription}\n\nWrite a plain English summary.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch summary from Anthropic' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.content[0].text;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarise API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
