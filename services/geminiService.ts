
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendations = async (ingredients: string[], mood: string) => {
  const prompt = `基于这些食材: ${ingredients.join(', ')}，以及心情 "${mood}"，推荐 3 道适合情侣周末的创意菜品。请用中文提供菜名、所需食材列表和一段简短的浪漫描述。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING }
            },
            required: ["name", "ingredients", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (e) {
    console.error("AI 推荐失败", e);
    return [];
  }
};

export const suggestIngredients = async (dishName: string) => {
  const prompt = `菜品 "${dishName}" 通常需要哪些食材？请用中文列出简单的食材名称列表。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ingredients"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.ingredients || [];
  } catch (e) {
    console.error("食材推荐失败", e);
    return [];
  }
};
