// =====================================================================================
// !! QUAN TRỌNG !! - CẤU HÌNH FIREBASE CỦA BẠN
// =====================================================================================
//
// Để ứng dụng này hoạt động, bạn cần tạo một dự án Firebase và điền các giá trị
// cấu hình của bạn vào bên dưới.
//
// 1. Truy cập https://console.firebase.google.com/
// 2. Tạo một dự án mới.
// 3. Trong dự án của bạn, nhấp vào biểu tượng Bánh răng (Cài đặt dự án).
// 4. Trong tab "Chung", cuộn xuống phần "Ứng dụng của bạn".
// 5. Nhấp vào biểu tượng Web (</>) để tạo một ứng dụng web mới.
// 6. Đặt tên cho ứng dụng của bạn và đăng ký.
// 7. Firebase sẽ cung cấp cho bạn một đoạn mã cấu hình. Sao chép các giá trị
//    (apiKey, authDomain, v.v.) từ đoạn mã đó và dán vào đây.
// 8. Bật tính năng xác thực Google:
//    - Trong menu bên trái, đi tới "Authentication".
//    - Nhấp vào tab "Sign-in method".
//    - Chọn "Google" và bật nó lên.
// 9. Bật Firestore:
//    - Trong menu bên trái, đi tới "Firestore Database".
//    - Nhấp vào "Create database".
//    - Bắt đầu ở chế độ "test mode" để dễ dàng phát triển. LƯU Ý: Đối với
//      ứng dụng sản phẩm, bạn nên thiết lập các quy tắc bảo mật chặt chẽ hơn.
// 10. Lấy OAuth 2.0 Client ID:
//    - Đăng nhập vào Google Cloud Console: https://console.cloud.google.com/
//    - Chọn dự án Firebase của bạn từ danh sách thả xuống ở trên cùng.
//    - Sử dụng thanh tìm kiếm ở trên cùng, tìm và điều hướng đến "APIs & Services > Credentials".
//    - Trong phần "OAuth 2.0 Client IDs", bạn sẽ thấy một client ID có loại "Web application".
//    - Sao chép "Client ID" (KHÔNG PHẢI Client Secret) và dán vào giá trị `googleClientId` bên dưới.
//
// =====================================================================================

// src/config/firebaseConfig.js

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
};

// ✅ Kiểm tra cấu hình Firebase có đầy đủ không
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// ✅ Kiểm tra Google Client ID
export const isGoogleClientConfigured = Boolean(firebaseConfig.googleClientId);
