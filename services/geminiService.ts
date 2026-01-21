
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedia = async (base64Data: string, mimeType: string) => {
  try {
    // Fix: Using gemini-3-flash-preview as per the task type (vision/basic analysis) guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Analyze this image and provide a JSON response with 'title', 'description' (short), and 'tags' (array of 3-5 keywords). Be concise.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "tags"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getSmartGreeting = async () => {
  try {
    // Fix: Using gemini-3-flash-preview for basic text generation task
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, poetic 1-sentence greeting for a media vault app based on a 'Memories' theme. Keep it under 10 words.",
    });
    return response.text?.trim() || "Your world, captured.";
  } catch {
    return "Your beautiful memories.";
  }
};
