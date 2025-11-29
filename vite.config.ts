import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⭐ Thêm đoạn này để tạo biến timestamp build
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString("vi-VN")),
  },
})