// ============================================================================
// ✅ FIX HOÀN CHỈNH CHO LỖI 404 / 503 / process undefined / fallback model
// ============================================================================

/* global window */
if (typeof window !== "undefined" && typeof (window as any).process === "undefined") {
  (window as any).process = { env: { NODE_ENV: "production" } };
}

import type { Note, ProgressAnalysis } from "../types";

// ============================================================================
// ⚙️ HÀM FETCH TRỰC TIẾP API GOOGLE GENERATIVE AI
// ============================================================================

const API_KEY = import.meta.env.VITE_API_KEY;

const MODEL_PRIORITIES = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

// 🧠 Hàm gọi model có fallback tự động
async function safeGenerateContent(prompt: string): Promise<string> {
  if (!API_KEY) {
    console.error("❌ Thiếu API Key! Hãy thêm VITE_API_KEY vào .env.local");
    return "⚠️ Chưa cấu hình API Key cho AI.";
  }

  for (const modelName of MODEL_PRIORITIES) {
    try {
      console.log("🧠 Đang gọi model:", modelName);

      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`⚠️ Model ${modelName} lỗi ${response.status}: ${errText}`);
        if (response.status === 404 || response.status === 503) continue;
        throw new Error(`Lỗi API ${response.status}`);
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "⚠️ Không có phản hồi từ AI.";
      return text;
    } catch (err: any) {
      console.error("AI Error:", err);
      continue;
    }
  }

  return "⚠️ Tất cả model đều không khả dụng lúc này. Hãy thử lại sau.";
}

/*
  Replace direct top-level GoogleGenAI usage with a safe wrapper that:
  - uses server-side @google/genai when running on Node and API_KEY is present
  - falls back to calling a /api/genai proxy when running in the browser (recommended)
*/
const apiKey = process.env.API_KEY;

async function callGenAi(prompt: string, model = "gemini-2.5-pro", config?: any) {
  // Server-side: use official SDK when API key is available
  if (typeof window === "undefined" && apiKey) {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });
    return response.text;
  }

  // Client-side or no API key: call a server proxy endpoint you must implement (/api/genai)
  const resp = await fetch("/api/genai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, config }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`GenAI proxy error ${resp.status}: ${txt}`);
  }
  const body = await resp.json().catch(() => ({}));
  return body.text ?? body;
}

// Then use callGenAi(...) in analyzeMistakes and analyzeProgress
export const analyzeMistakes = async (notes: Note[]): Promise<string> => {
  if (notes.length === 0) return "Chưa có ghi chú nào để phân tích. Hãy thêm ghi chú trước nhé!";
  try {
    const prompt = `
    Dựa trên các ghi chú học tập sau, hãy đóng vai một huấn luyện viên học tập chuyên nghiệp.
    Nhiệm vụ của bạn là:
    1. Nêu 2-3 dạng lỗi sai phổ biến nhất và nguyên nhân gốc rễ.
    2. Gợi ý 3 chiến lược hoặc bài tập cụ thể để cải thiện.
    Hãy trả lời ngắn gọn, dễ hiểu, bằng tiếng Việt, có định dạng markdown.

    Dữ liệu ghi chú:
    ${JSON.stringify(notes, null, 2)}
    `;
    const text = await callGenAi(prompt, "gemini-2.5-flash");
    return typeof text === "string" ? text : JSON.stringify(text);
  } catch (err) {
    console.error("analyzeMistakes error", err);
    return "⚠️ Không thể phân tích lỗi. Vui lòng thử lại sau.";
  }
};

export const analyzeProgress = async (notes: Note[]): Promise<ProgressAnalysis> => {
  if (notes.length === 0) {
    return {
      evaluation: "Không có dữ liệu để đánh giá tiến độ.",
      chartDataByDifficulty: [],
      chartDataBySubject: [],
    };
  }
  try {
    const prompt = `
    Hãy phân tích tiến độ học tập dựa trên các ghi chú sau:
    - Nhóm ghi chú theo tháng.
    - Đếm số lượng lỗi theo độ khó và môn học.
    - Viết đoạn nhận xét động viên ngắn gọn (2–4 câu) về xu hướng học tập.
    Trả về JSON gồm: "evaluation", "chartDataByDifficulty", "chartDataBySubject".

    Dữ liệu:
    ${JSON.stringify(notes, null, 2)}
    `;
    const config = {
      responseMimeType: "application/json",
      // you may include responseSchema when calling server-side SDK
    };
    const text = await callGenAi(prompt, "gemini-2.5-pro", config);
    // try parse JSON safely
    const trimmed = (text || "").trim();
    try {
      const parsed = JSON.parse(trimmed);
      return parsed as ProgressAnalysis;
    } catch {
      return {
        evaluation: typeof text === "string" ? text : JSON.stringify(text),
        chartDataByDifficulty: [],
        chartDataBySubject: [],
      };
    }
  } catch (err) {
    console.error("analyzeProgress error", err);
    return {
      evaluation: "⚠️ Lỗi khi phân tích tiến độ. Vui lòng thử lại.",
      chartDataByDifficulty: [],
      chartDataBySubject: [],
    };
  }
};
