// ============================================================================
// ✅ FIX CHO LỖI "process is not defined" & cải thiện tương thích Vite/TypeScript
// ============================================================================

/* global window */
if (typeof window !== "undefined" && typeof window.process === "undefined") {
  (window as any).process = { env: { NODE_ENV: "production" } };
}

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { Note, ProgressAnalysis } from "../types";

// ✅ Helper: Khởi tạo client an toàn
const getAiClient = (): GoogleGenerativeAI | null => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ Lỗi: VITE_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env.local"
    );
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error("❌ Lỗi khởi tạo GoogleGenerativeAI:", e);
    return null;
  }
};

// ============================================================================
// 🎯 1. Phân tích lỗi sai trong ghi chú
// ============================================================================
export const analyzeMistakes = async (notes: Note[]): Promise<string> => {
  if (notes.length === 0) {
    return "Chưa có ghi chú nào để phân tích. Hãy thêm ghi chú trước nhé!";
  }

  const ai = getAiClient();
  if (!ai) return "⚠️ Chưa cấu hình API Key cho AI.";

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

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text() ?? "AI không phản hồi.";
  } catch (error) {
    console.error("AI Error:", error);
    return "⚠️ Không thể phân tích hiện tại. Vui lòng thử lại sau.";
  }
};

// ============================================================================
// 🎯 2. Phân tích tiến độ học tập
// ============================================================================
export const analyzeProgress = async (
  notes: Note[]
): Promise<ProgressAnalysis> => {
  const fallback: ProgressAnalysis = {
    evaluation: "Không có dữ liệu để đánh giá tiến độ.",
    chartDataByDifficulty: [],
    chartDataBySubject: [],
  };

  if (notes.length === 0) return fallback;

  const ai = getAiClient();
  if (!ai) return { ...fallback, evaluation: "⚠️ Chưa cấu hình API Key cho AI." };

  try {
    const prompt = `
      Hãy phân tích tiến độ học tập dựa trên các ghi chú sau.
      - Nhóm ghi chú theo tháng.
      - Đếm số lượng lỗi theo độ khó và môn học.
      - Viết đoạn nhận xét động viên ngắn gọn (2–4 câu) về xu hướng học tập.
      Trả về JSON gồm: "evaluation", "chartDataByDifficulty", "chartDataBySubject".
      
      Dữ liệu:
      ${JSON.stringify(notes, null, 2)}
    `;

    const model = ai.getGenerativeModel({ model: "gemini-2.0-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      const parsed = JSON.parse(text);
      return parsed as ProgressAnalysis;
    } catch {
      return {
        ...fallback,
        evaluation:
          "⚠️ AI trả về định dạng không hợp lệ. Vui lòng thử lại sau.",
      };
    }
  } catch (error) {
    console.error("AI Error:", error);
    return {
      ...fallback,
      evaluation: "⚠️ Đã xảy ra lỗi khi phân tích tiến độ.",
    };
  }
};
