import React, { useEffect, useRef, useState } from 'react';
import { signInWithGoogleCredential } from '../services/firebaseService';
import { firebaseConfig, isGoogleClientConfigured } from '../firebaseConfig';

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC = () => {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialResponse = async (response: any) => {
    try {
      if (response.credential) {
        await signInWithGoogleCredential(response.credential);
        // onAuthStateChanged in App.tsx will handle the rest
      } else {
        throw new Error("Phản hồi của Google không chứa thông tin đăng nhập.");
      }
    } catch (err: any) {
      console.error("Lỗi khi đăng nhập với Google Credential:", err);
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
    }
  };

  const initializeGoogleSignIn = () => {
    try {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
            client_id: firebaseConfig.googleClientId,
            callback: handleCredentialResponse
        });
        if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: "outline", size: "large", type: "standard", text: "signin_with", shape: "rectangular", logo_alignment: "left" } 
            );
        }
      } else {
        throw new Error("Thư viện Google Sign-In chưa sẵn sàng.");
      }
    } catch (e) {
        console.error("Lỗi khi khởi tạo Google Sign-In:", e);
        setError("Không thể khởi tạo dịch vụ đăng nhập Google. Vui lòng tải lại trang.");
    }
  };

  useEffect(() => {
    if (!isGoogleClientConfigured) {
      setError("Cấu hình Google Client ID chưa được thiết lập trong tệp firebaseConfig.ts. Đăng nhập Google sẽ không hoạt động.");
      return;
    }

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) return; // Script not found

    const handleLoad = () => {
        initializeGoogleSignIn();
    }
    
    // Check if script is already loaded
    if (window.google && window.google.accounts) {
        initializeGoogleSignIn();
    } else {
        script.addEventListener('load', handleLoad);
    }
    
    return () => {
        script.removeEventListener('load', handleLoad);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-sky-400">
          Eureka <span className="text-white font-normal">- from error to hero</span>
        </h1>
        <p className="mt-4 text-slate-400">
          Biến mỗi lỗi sai thành một cơ hội học tập quý giá.
        </p>
        <p className="mt-2 text-slate-400">
            Đăng nhập để bắt đầu đồng bộ hóa ghi chú trên mọi thiết bị.
        </p>
        <div className="mt-8 flex justify-center">
          {/* This div is where the Google button will be rendered */}
          <div ref={googleButtonRef}></div>
        </div>

        {error && (
            <div className="mt-4 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-md text-sm">
                <p className='font-bold'>Lỗi:</p>
                <p>{error}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;