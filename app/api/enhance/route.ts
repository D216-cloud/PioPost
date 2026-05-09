import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;
    const tone = body.tone || 'professional';

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required to enhance.' }, { status: 400 });
    }

    const fallbackText = `[${tone} tone] ✨ ${text}`;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ text: fallbackText });
    }

    const prompt = `You are a social media expert. Rewrite the following social media caption in a ${tone} tone. Return ONLY the improved caption, no extra text:

Draft: "${text}"`;

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    let responseText = "";
    let firstError = null;
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
        if (responseText) {
          break; // Successfully generated content
        }
      } catch (err: any) {
        if (!firstError) firstError = err;
        continue;
      }
    }

    if (!responseText) {
      // If the error is related to quota/billing (429) or region limits, gracefully fallback to mock data
      const errMsg = firstError?.message || "";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("billing")) {
        console.warn("Gemini Quota Exceeded. Falling back to mock data.");
        return NextResponse.json({ text: fallbackText });
      }
      throw new Error(errMsg || "Gemini models failed to generate content.");
    }
    
    // Clean up potential markdown formatting from the response
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ text: cleanedText });
  } catch (error: any) {
    console.error('Enhance API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content.' }, { status: 500 });
  }
}
