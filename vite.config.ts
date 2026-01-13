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
    port: 3000,
    strictPort: true,
  },
  build: {
    // 下调至 es2015 (ES6) 是移动端最安全的策略
    target: 'es2015',
    minify: 'esbuild',
    outDir: 'dist',
    assetsDir: 'assets',
    // 移除复杂的 Rollup 配置，让 Vite 使用默认的最佳实践
    sourcemap: false,
    cssCodeSplit: true,
  }
});