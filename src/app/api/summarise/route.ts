import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { proposalTitle, proposalDescription } = await request.json();

    if (!proposalTitle || !proposalDescription) {
      return NextResponse.json(
        { error: 'Missing proposalTitle or proposalDescription' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a governance analyst for Arc blockchain by Circle. Summarise governance proposals in plain English for non-technical readers. Keep summaries under 200 words. Be neutral, factual, and clear. Always start with 'This proposal aims to...'",
    });

    const prompt = `Proposal title: ${proposalTitle}\n\nDescription: ${proposalDescription}\n\nWrite a plain English summary.`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarise API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
