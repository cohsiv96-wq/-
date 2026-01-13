import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  // 严格检查，防止 process.env.API_KEY 被注入为字符串 "undefined" 或 "null"
  const apiKey = process.env.API_KEY;
  const isValidKey = apiKey && 
                     apiKey !== "" && 
                     apiKey !== "undefined" && 
                     apiKey !== "null" && 
                     apiKey.length > 10; // API Key 通常较长

  if (!isValidKey) return null;

  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Gemini SDK 实例化异常:", e);
    return null;
  }
};

// 本地备用数据，确保在无网络或无 API 时依然有内容展示
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
    // 延迟一小会儿模拟加载感，体验更好
    await new Promise(r => setTimeout(r, 800));
    return [...LOCAL_MOCK_RECOMMENDATIONS].sort(() => 0.5 - Math.random());
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `基于已有菜品：${existingDishNames.join(', ')}，推荐3个适合情侣周末做的菜。要求：名字温馨，JSON格式。`,
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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.warn("AI 接口调用失败，使用本地库");
    return LOCAL_MOCK_RECOMMENDATIONS;
  }
};

export const suggestIngredients = async (dishName: string) => {
  const ai = getAI();
  if (!ai) return ["核心食材", "常用调料"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `做“${dishName}”的核心食材清单（5个以内）。`,
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
    return ["食材加载失败"];
  }
};