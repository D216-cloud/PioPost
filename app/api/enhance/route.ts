import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required to enhance.' }, { status: 400 });
    }

    const fallbackOptions = [
      `🚀 Supercharge your strategy! ${text} - Here's how we're doing it... 👇`,
      `✨ Quick tip: ${text} can change everything. Thoughts? 🤔`,
      `🔥 Breaking down our latest insight: ${text} in 3 simple steps!`
    ];

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ options: fallbackOptions });
    }

    const prompt = `You are a social media expert. Take the following post draft and generate 3 distinctly different, highly engaging variations of it. 
Use appropriate emojis, engaging hooks, and professional but conversational tone suitable for LinkedIn, Instagram, and X.
Format the output EXACTLY as a JSON array of 3 strings. Do not include any markdown backticks or other text outside the JSON array.

Draft: "${text}"`;

    const modelsToTry = [
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
        return NextResponse.json({ options: fallbackOptions });
      }
      throw new Error(errMsg || "Gemini models failed to generate content.");
    }
    
    // Clean up potential markdown formatting from the response
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let options = [];
    try {
      options = JSON.parse(cleanedText);
      if (!Array.isArray(options)) throw new Error("Not an array");
    } catch (parseError) {
      options = cleanedText.split('\n').filter((line: string) => line.trim().length > 10).slice(0, 3);
    }

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Enhance API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content.' }, { status: 500 });
  }
}
