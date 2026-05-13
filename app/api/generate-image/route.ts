import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We will try the user-specified model first, then fall back to gemini-2.0-flash if quota is exceeded
    const modelsToTry = ["gemini-2.5-flash-image", "gemini-2.0-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting image generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            // @ts-ignore
            responseModalities: ["IMAGE"],
          }
        } as any);

        const response = await result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith("image/"));

        if (imagePart && imagePart.inlineData) {
          const imageBase64 = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || "image/png";
          const imageBuffer = Buffer.from(imageBase64, 'base64');

          const ext = mimeType.split("/")[1] || "png";
          const fileName = `generated/${session.user.id}/${Date.now()}.${ext}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('draft-media')
            .upload(fileName, imageBuffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) throw uploadError;

          const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from('draft-media')
            .createSignedUrl(fileName, 86400);

          if (signedError) throw signedError;

          return NextResponse.json({ 
            url: signedData.signedUrl,
            path: fileName,
            model: modelName,
            success: true 
          });
        } else {
          // If Gemini returned a response but no image data (e.g. safety block or text only)
          throw new Error(`Model ${modelName} did not return an image. It might have returned text or been blocked by safety filters.`);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed:`, err.message || err);
        
        // If it's not a quota error, don't bother trying other models (likely a prompt issue)
        if (!err.message?.includes("429") && !err.message?.includes("quota")) {
          break;
        }
        // Continue to next model if it was a quota issue
      }
    }

    // If we reach here, all Gemini models failed
    const isQuotaError = lastError?.message?.includes("429") || lastError?.message?.includes("quota") || lastError?.message?.includes("limit");
    
    if (isQuotaError || lastError) {
      console.log("Gemini failed, using Pollinations.ai as free fallback...");
      // Pollinations.ai is a great free fallback that doesn't require a key
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      
      // We still try to upload it to Supabase for persistence if possible, 
      // but for Pollinations we can also just return the URL directly as it's a stable GET endpoint.
      return NextResponse.json({ 
        url: pollinationsUrl, 
        model: "pollinations-free", 
        success: true,
        note: "Using fallback free provider due to Gemini quota limits."
      });
    }

    const errorMessage = lastError?.message || "Failed to generate image";
    return NextResponse.json({ 
      error: errorMessage,
      details: lastError?.toString(),
      isQuotaError
    }, { status: 500 });

  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate image",
      details: error.toString()
    }, { status: 500 });
  }
}
