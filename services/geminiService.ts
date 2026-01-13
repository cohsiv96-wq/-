import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  // 严格过滤环境变量中的非法字符串，防止 Vite 注入 undefined 的字符串形式
  const apiKey = process.env.API_KEY;
  const isKeyStringValid = typeof apiKey === 'string' && 
                           apiKey.length > 5 && 
                           apiKey !== "undefined" && 
                           apiKey !== "null" &&
                           apiKey !== "";

  if (!isKeyStringValid) return null;

  try {
    return new GoogleGenAI({ apiKey: apiKey as string });
  } catch (e) {
    console.warn("GenAI SDK init failed:", e);
    return null;
  }
};

const LOCAL_MOCK_RECOMMENDATIONS = [
  {
    name: "芝士瀑布焗饭",
    notes: "满满的拉丝，像极了甜甜的恋爱。",
    tasteTags: ["浓郁", "治愈"],
    ingredients: ["马苏里拉芝士", "培根", "玉米粒", "隔夜米饭"]
  },
  {
    name: "清新柠檬手撕鸡",
    notes: "清爽不腻，非常适合周末的午后。",
    tasteTags: ["清爽", "酸甜"],
    ingredients: ["鸡腿", "柠檬", "香菜", "小米辣"]
  },
  {
    name: "番茄浓汤肥牛面",
    notes: "暖心暖胃，简单却很有仪式感。",
    tasteTags: ["浓郁", "快手"],
    ingredients: ["肥牛卷", "番茄", "鸡蛋", "挂面"]
  }
];

export const getAIRecommendations = async (existingDishNames: string[]) => {
  const ai = getAI();
  
  if (!ai) {
    // 无 API 时，直接返回本地库，避免多余的 Promise 链
    return [...LOCAL_MOCK_RECOMMENDATIONS].sort(() => 0.5 - Math.random());
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `基于已有的菜谱名：${existingDishNames.join(', ')}，推荐3个新的适合情侣做的菜。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              notes: { type: Type.STRING },
              tasteTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "notes", "tasteTags", "ingredients"]
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : LOCAL_MOCK_RECOMMENDATIONS;
  } catch (error) {
    return LOCAL_MOCK_RECOMMENDATIONS;
  }
};

export const suggestIngredients = async (dishName: string) => {
  const ai = getAI();
  if (!ai) return ["基础食材", "调味料"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `做“${dishName}”需要哪些食材？`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["获取失败"];
  }
};
