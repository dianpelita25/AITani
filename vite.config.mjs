// vite.config.mjs
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

const binHeaderPlugin = () => ({
  name: 'ensure-bin-content-type',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req?.url?.includes('/model/') && req.url.endsWith('.bin')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react(), tagger(), binHeaderPlugin()],
  server: {
    port: 4028,
    host: "0.0.0.0",
    strictPort: true,
    
    // --- KONFIGURASI PROXY YANG LEBIH DETAIL ---
    proxy: {
      // Setiap permintaan ke /api akan diteruskan ke server backend Wrangler
      '/api': {
        target: 'http://127.0.0.1:8787', // Pastikan port ini sama dengan port Wrangler Anda
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Hapus /api dari path sebelum dikirim ke Worker
      },
    },
    // --- AKHIR DARI PERBAIKAN ---
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'ai-tani-kupang-api/src/**/*.{test,spec}.js',
    ],
    environmentMatchGlobs: [
      ['ai-tani-kupang-api/**', 'node'],
      ['**/*.worker.test.{js,ts}', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: [
        'src/**/*.{js,jsx}',
        'ai-tani-kupang-api/src/**/*.js',
      ],
      exclude: [
        'src/**/__mocks__/**',
        'src/**/__fixtures__/**',
        'tests/**/*.spec.{js,ts}',
        'tests/**/*.e2e.{js,ts}',
        'ai-tani-kupang-api/tests/**/*.mjs',
      ],
    },
  },
});
