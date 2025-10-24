import React, { useState } from 'react';

const FirebaseConfigWarning: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full border border-red-500/50">
        <h1 className="text-3xl font-bold text-red-400">
          Chưa Cấu Hình Firebase!
        </h1>
        <p className="mt-4 text-slate-300">
          Để sử dụng tính năng đồng bộ hóa và lưu trữ đám mây, bạn cần cấu hình dự án Firebase của mình.
        </p>
        <div className="mt-6 text-left bg-slate-900 p-4 rounded-md text-sm text-slate-400 space-y-2">
           <p><strong>Bước chính:</strong> Mở tệp <code className="bg-slate-700 px-1.5 py-0.5 rounded text-sky-400">firebaseConfig.ts</code> trong dự án, làm theo hướng dẫn trong đó và dán các giá trị bạn nhận được từ Firebase và Google Cloud vào.</p>
        </div>
        
        <div className="mt-4">
            <button 
                onClick={() => setShowInstructions(!showInstructions)}
                className="px-4 py-2 text-sm font-semibold text-sky-300 bg-sky-800/50 rounded-md hover:bg-sky-700/50 transition-colors"
            >
                {showInstructions ? 'Ẩn Hướng Dẫn Chi Tiết' : 'Xem Hướng Dẫn Chi Tiết'}
            </button>
        </div>

        {showInstructions && (
            <div className="mt-4 text-left bg-slate-800/50 p-4 rounded-md text-sm text-slate-400 space-y-3 animate-fade-in">
                <p className="font-bold text-base text-white">Làm thế nào để lấy thông tin cấu hình?</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Bảng điều khiển Firebase</a> và nhấp <strong>"Add project"</strong>.</li>
                    <li>
                        Trong dự án, tìm và nhấp vào biểu tượng Bánh răng (Cài đặt dự án) ở menu bên trái.
                        <div className="mt-1 pl-4">
                            <p className="text-xs text-slate-500">Trong tab "Chung", cuộn xuống phần "Ứng dụng của bạn". Nhấp vào biểu tượng Web <code className="bg-slate-700 px-1 py-0.5 rounded">&lt;/&gt;</code> để tạo hoặc xem ứng dụng web của bạn.</p>
                        </div>
                    </li>
                    <li>
                        Firebase sẽ hiển thị một đối tượng <code className="bg-slate-700 px-1 py-0.5 rounded">firebaseConfig</code>.
                        <div className="mt-1 pl-4">
                            <p className="text-xs text-slate-500">Sao chép các giá trị như <code className="text-pink-400">apiKey</code>, <code className="text-pink-400">authDomain</code>, v.v. và dán chúng vào tệp <code className="text-sky-400">firebaseConfig.ts</code>.</p>
                        </div>
                    </li>
                     <li>
                        <strong>Lấy Google Web Client ID (QUAN TRỌNG):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
                            <li>Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Google Cloud Credentials page</a> và chọn đúng dự án của bạn từ thanh menu trên cùng.</li>
                            <li>Dưới mục "OAuth 2.0 Client IDs", tìm một mục có loại "Web application".</li>
                            <li>Sao chép giá trị <strong>Client ID</strong> và dán vào trường `googleClientId` trong tệp <code className="text-sky-400">firebaseConfig.ts</code>.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Kích hoạt Đăng nhập Google:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
                            <li>Ở menu bên trái của Firebase, vào <strong>Authentication</strong> &rarr; tab <strong>Sign-in method</strong>.</li>
                            <li>Chọn <strong>Google</strong>, bật nó lên và lưu lại.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Kích hoạt Cơ sở dữ liệu:</strong>
                         <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
                            <li>Ở menu bên trái của Firebase, vào <strong>Firestore Database</strong> &rarr; <strong>Create database</strong>.</li>
                            <li>Chọn bắt đầu ở <strong>Test mode</strong> (Chế độ thử nghiệm).</li>
                        </ul>
                    </li>
                    <li>Lưu tệp <code className="text-sky-400">firebaseConfig.ts</code> và tải lại trang này.</li>
                </ol>
                <p className="mt-4 pt-3 border-t border-slate-700 font-bold text-base text-white">Về chi phí:</p>
                <p className="text-slate-500">Bạn không cần lo lắng về chi phí. Ứng dụng này sử dụng gói <strong className="text-slate-400">Spark Plan</strong> miễn phí của Firebase, vốn rất hào phóng và quá đủ cho việc sử dụng cá nhân.</p>
            </div>
        )}
        
        <p className="mt-6 text-xs text-slate-500">
          Ứng dụng sẽ không hoạt động cho đến khi cấu hình Firebase được hoàn tất.
        </p>
      </div>
    </div>
  );
};

export default FirebaseConfigWarning;