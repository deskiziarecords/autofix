
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const performOCR = async (base64Image: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Extract the license plate number from this image. Return ONLY the plate number, nothing else." }
      ]
    }
  });
  return response.text?.trim() || "";
};

export const identifyPart = async (base64Image: string): Promise<{ name: string; estimatedPrice: number }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Identify the car part in this image that appears damaged. Provide a standard name and a rough market estimate for the part in USD." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          estimatedPrice: { type: Type.NUMBER }
        },
        required: ["name", "estimatedPrice"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { name: "Unknown Part", estimatedPrice: 0 };
  }
};

export const generateJobSummary = async (transcript: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the following mechanic's notes into a professional job description for an invoice: "${transcript}"`
  });
  return response.text?.trim() || transcript;
};

export const fetchSimulatedQuotes = async (partName: string): Promise<any[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate 3 different price quotes for a "${partName}" from local distributors. Include distributor name, price, and labor estimate.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING },
            price: { type: Type.NUMBER },
            laborEstimate: { type: Type.NUMBER }
          },
          required: ["source", "price", "laborEstimate"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
