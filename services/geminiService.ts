import { GoogleGenAI, Type } from "@google/genai";
import { Note, ProgressAnalysis, SUBJECT_KEYS, DIFFICULTY_KEYS } from '../types';

// FIX: Adhere to coding guidelines by using process.env.API_KEY to access the API key.
// This resolves the TypeScript error and aligns with the project's requirements.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // FIX: Updated error message to reflect the use of API_KEY.
    console.error("API_KEY is not defined. Please set it in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey as string });


export const analyzeMistakes = async (notes: Note[]): Promise<string> => {
  if (notes.length === 0) {
    return "Chưa có ghi chú nào để phân tích. Hãy thêm ghi chú trước nhé!";
  }
  if (!apiKey) {
    // FIX: Updated error message to reflect the use of API_KEY.
    return "Lỗi cấu hình: API_KEY chưa được thiết lập. Vui lòng kiểm tra lại cấu hình trên server hosting của bạn.";
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
    let errorMessage = "Xin lỗi, tôi không thể phân tích các lỗi sai lúc này. Có thể đã xảy ra sự cố với dịch vụ AI.";
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            errorMessage = "Lỗi xác thực: API Key của bạn không hợp lệ. Vui lòng kiểm tra lại cấu hình biến môi trường trên server.";
        } else if (error.message.includes('permission denied') || error.message.includes('PERMISSION_DENIED')) {
            errorMessage = "Lỗi quyền truy cập: API Key của bạn không có quyền sử dụng Gemini API. Hãy chắc chắn rằng bạn đã bật 'Generative Language API' trong dự án Google Cloud của mình và cho phép tên miền của trang web truy cập.";
        } else if (error.message.includes('400')) {
             errorMessage = "Lỗi yêu cầu: Dữ liệu gửi đến AI có thể không hợp lệ. Vui lòng thử lại. Nếu sự cố vẫn tiếp diễn, có thể có lỗi trong prompt được tạo.";
        }
    }
    return errorMessage + " Vui lòng thử lại sau.";
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
    if (!apiKey) {
        return {
            // FIX: Updated error message to reflect the use of API_KEY.
            evaluation: "Lỗi cấu hình: API_KEY chưa được thiết lập. Vui lòng kiểm tra lại cấu hình trên server hosting của bạn.",
            chartDataByDifficulty: [],
            chartDataBySubject: [],
        };
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
        let evaluationMessage = "Xin lỗi, tôi không thể phân tích tiến độ của bạn lúc này. Có thể đã xảy ra sự cố với dịch vụ AI.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                evaluationMessage = "Lỗi xác thực: API Key của bạn không hợp lệ. Vui lòng kiểm tra lại cấu hình biến môi trường trên server.";
            } else if (error.message.includes('permission denied') || error.message.includes('PERMISSION_DENIED')) {
                 evaluationMessage = "Lỗi quyền truy cập: API Key của bạn không có quyền sử dụng Gemini API. Hãy chắc chắn rằng bạn đã bật 'Generative Language API' trong dự án Google Cloud của mình và cho phép tên miền của trang web truy cập.";
            } else if (error instanceof SyntaxError || error.message.includes('JSON')) {
                evaluationMessage = "Lỗi phân tích dữ liệu: AI đã trả về một định dạng JSON không hợp lệ. Điều này có thể xảy ra tạm thời, vui lòng thử phân tích lại.";
            } else if (error.message.includes('400')) {
                evaluationMessage = "Lỗi yêu cầu: Dữ liệu gửi đến AI có thể không hợp lệ. Vui lòng thử lại. Nếu sự cố vẫn tiếp diễn, có thể có lỗi trong prompt được tạo.";
            }
        }
        return { 
            evaluation: evaluationMessage + " Vui lòng thử lại.",
            chartDataByDifficulty: [],
            chartDataBySubject: [],
        };
    }
};