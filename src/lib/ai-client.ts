'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export async function generateDescriptionClient(photoDataUri: string): Promise<{
  success: boolean;
  itemName?: string;
  itemDescription?: string;
  message?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { success: false, message: 'Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Extract base64 data and mime type from data URI
    const match = photoDataUri.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return { success: false, message: 'Invalid photo data URI format.' };
    }
    const [, mimeType, base64Data] = match;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      `You are an expert at identifying objects. Analyze this image and respond with ONLY a JSON object (no markdown, no code fences) with these fields:
- "itemName": a concise name for the item
- "itemDescription": a brief descriptive summary of the item`,
    ]);

    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(jsonStr);
    return {
      success: true,
      itemName: parsed.itemName,
      itemDescription: parsed.itemDescription,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { success: false, message: 'Failed to generate description.' };
  }
}
