import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Khi chạy `npm run dev`, các lệnh gọi /api sẽ được chuyển tới server AI (server/index.js, cổng 8787).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
