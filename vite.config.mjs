import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react(), tagger()],
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
    }
    // --- AKHIR DARI PERBAIKAN ---
  }
});