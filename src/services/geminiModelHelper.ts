// src/services/geminiModelHelper.ts
export async function getValidGeminiModel(apiKey: string, preferredModel = "gemini-2.0-pro") {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models";
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error("❌ Lỗi khi gọi API ListModels:", response.status, await response.text());
      return preferredModel;
    }

    const data = await response.json();
    const models = data.models || [];

    console.log("📜 Danh sách model khả dụng:");
    models.forEach((m: any) => {
      console.log(`- ${m.name} (${m.displayName || "no displayName"})`);
    });

    // Kiểm tra nếu model bạn mong muốn có trong danh sách
    const found = models.find((m: any) => m.name.includes(preferredModel));

    if (found) {
      console.log(`✅ Model "${preferredModel}" khả dụng, sẽ dùng model này.`);
      return found.name;
    }

    // Nếu không có model mong muốn, chọn model đầu tiên hỗ trợ generateContent
    const fallback = models.find((m: any) => (m.supportedMethods || []).includes("generateContent"));

    if (fallback) {
      console.warn(`⚠️ Model "${preferredModel}" không khả dụng. Sử dụng model thay thế: "${fallback.name}"`);
      return fallback.name;
    }

    console.error("❌ Không tìm thấy model nào hỗ trợ generateContent.");
    return "";
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách model:", error);
    return preferredModel;
  }
}
