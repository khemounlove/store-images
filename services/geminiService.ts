import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization to prevent issues if API_KEY is missing during build time
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export const analyzeMedia = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  if (!ai) return null;

  try {
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
  const ai = getAI();
  if (!ai) return "Your world, captured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, poetic 1-sentence greeting for a media vault app based on a 'Memories' theme. Keep it under 10 words.",
    });
    return response.text?.trim() || "Your world, captured.";
  } catch {
    return "Your beautiful memories.";
  }
};