import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { proposalTitle, proposalDescription, userMessage } = await request.json();

    if (!proposalTitle || !proposalDescription) {
      return NextResponse.json(
        { error: 'Missing proposal data' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI assistant temporarily unavailable. Please check GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-1.5-flash was retired by Google in 2025 — newer API keys get a 404
    // "model not found" on it. Use a current, GA flash model instead.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const systemInstruction = `You are "Gemini Arc", a governance analyst for the Arc blockchain.
    Your goal is to help users understand governance proposals. 
    Be neutral, factual, and concise. 
    The current proposal is titled: "${proposalTitle}".
    The description is: "${proposalDescription}".
    
    If the user asks for a summary, provide a clear 2-3 paragraph explanation starting with "This proposal aims to...".
    If the user asks a specific question, answer it based on the proposal description provided.
    If the answer isn't in the description, say you don't have that specific information but explain what you do know.`;

    let prompt = "";
    if (userMessage) {
      prompt = `${systemInstruction}\n\nUser Question: ${userMessage}`;
    } else {
      prompt = `${systemInstruction}\n\nPlease provide a summary of this proposal.`;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
