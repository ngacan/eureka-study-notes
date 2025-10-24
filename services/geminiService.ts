import { GoogleGenAI, Type } from "@google/genai";
import { Note, ProgressAnalysis, SUBJECT_KEYS, DIFFICULTY_KEYS } from '../types';

// FIX: Per coding guidelines, the API key must be obtained directly from process.env.API_KEY.
// We assume it's pre-configured and valid in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeMistakes = async (notes: Note[]): Promise<string> => {
  if (notes.length === 0) {
    return "Chưa có ghi chú nào để phân tích. Hãy thêm ghi chú trước nhé!";
  }
  try {
    const simplifiedNotes = notes.map(({ subject, lesson, mistake, correction, source }) => ({ subject, lesson, mistake, correction, source }));
    const prompt = `
      Dựa trên các ghi chú học tập sau ở định dạng JSON, hãy đóng vai một huấn luyện viên học tập chuyên nghiệp.
      Nhiệm vụ của bạn là:
      1. Xác định 2-3 chủ đề hoặc dạng lỗi sai phổ biến nhất, có thể liên hệ đến nguồn gốc lỗi sai (source).
      2. Đưa ra đánh giá ngắn gọn về các dạng lỗi này.
      3. Đề xuất 3 bài tập hoặc chiến lược luyện tập cụ thể, có tính hành động cao để khắc phục các lỗi sai này.
      
      Hãy trả lời bằng tiếng Việt.
      Định dạng câu trả lời bằng markdown đơn giản, rõ ràng. Sử dụng tiêu đề và gạch đầu dòng.

      Dữ liệu ghi chú:
      ${JSON.stringify(simplifiedNotes, null, 2)}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing mistakes with Gemini API:", error);
    return "Xin lỗi, tôi không thể phân tích các lỗi sai lúc này. Có thể đã xảy ra sự cố với dịch vụ AI. Vui lòng thử lại sau.";
  }
};

export const analyzeProgress = async (notes: Note[]): Promise<ProgressAnalysis> => {
    const fallbackResult: ProgressAnalysis = {
        evaluation: "Không có dữ liệu để đánh giá tiến độ.",
        chartDataByDifficulty: [],
        chartDataBySubject: [],
    };

    if (notes.length === 0) {
        return fallbackResult;
    }
    try {
        const notesForAnalysis = notes.map(({ createdAt, difficulty, subject }) => ({ createdAt, difficulty, subject }));

        const prompt = `
        Phân tích tiến độ của học sinh dựa trên dữ liệu ghi chú sau. Ngày tháng ở định dạng ISO string.
        Nhiệm vụ của bạn là:
        1. Nhóm các ghi chú theo tháng.
        2. Với mỗi tháng, đếm số lượng ghi chú cho từng mức độ khó ('easy', 'medium', 'hard', 'critical').
        3. Với mỗi tháng, đếm số lượng ghi chú cho từng môn học (${SUBJECT_KEYS.join(', ')}).
        4. Viết một đoạn văn ngắn gọn, mang tính động viên (2-4 câu) để đánh giá xu hướng tiến bộ của học sinh theo thời gian.

        Yêu cầu: CHỈ trả về một đối tượng JSON hợp lệ duy nhất có ba khóa:
        - "evaluation": Một chuỗi chứa nhận xét của bạn bằng tiếng Việt.
        - "chartDataByDifficulty": Một mảng các đối tượng cho biểu đồ độ khó. Mỗi đối tượng phải có khóa "name" là tháng/năm (ví dụ: "Thg 6 2024"), và các khóa 'easy', 'medium', 'hard', 'critical'.
        - "chartDataBySubject": Một mảng các đối tượng cho biểu đồ môn học. Mỗi đối tượng phải có khóa "name" là tháng/năm, và các khóa là mã môn học (${SUBJECT_KEYS.join(', ')}).

        Dữ liệu ghi chú:
        ${JSON.stringify(notesForAnalysis, null, 2)}
        `;

        const difficultyProperties: { [key: string]: { type: Type } } = {
            name: { type: Type.STRING },
        };
        DIFFICULTY_KEYS.forEach(key => {
            difficultyProperties[key] = { type: Type.NUMBER };
        });

        const subjectProperties: { [key: string]: { type: Type } } = {
            name: { type: Type.STRING },
        };
        SUBJECT_KEYS.forEach(key => {
            subjectProperties[key] = { type: Type.NUMBER };
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // FIX: Add responseSchema for more robust and reliable JSON output from the model.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        evaluation: { type: Type.STRING },
                        chartDataByDifficulty: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: difficultyProperties
                            }
                        },
                        chartDataBySubject: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: subjectProperties
                            }
                        }
                    },
                    required: ['evaluation', 'chartDataByDifficulty', 'chartDataBySubject']
                }
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        // Validate the structure to ensure Gemini returns what we expect
        if (result.evaluation && result.chartDataByDifficulty && result.chartDataBySubject) {
             return result as ProgressAnalysis;
        } else {
            console.error("Gemini API returned an unexpected JSON structure:", result);
            return {
                 evaluation: "Đã xảy ra lỗi khi xử lý dữ liệu từ AI. Cấu trúc dữ liệu không đúng.",
                 chartDataByDifficulty: [],
                 chartDataBySubject: [],
            }
        }

    } catch (error) {
        console.error("Error analyzing progress with Gemini API:", error);
        return { 
            evaluation: "Xin lỗi, tôi không thể phân tích tiến độ của bạn lúc này. Có thể đã xảy ra sự cố với dịch vụ AI. Vui lòng thử lại.",
            chartDataByDifficulty: [],
            chartDataBySubject: [],
        };
    }
};