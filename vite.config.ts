import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || "")
    }
  },
  server: {
    host: true,
    port: 3000
  },
  build: {
    // 针对 iOS 16.1 调整为更稳健的 es2020
    target: 'es2020',
    minify: 'esbuild',
    outDir: 'dist',
    rollupOptions: {
      output: {
        // 确保生成的 JS 文件名不带特殊字符，防止旧版 Safari 解析路径错误
        manualChunks: undefined
      }
    }
  }
});