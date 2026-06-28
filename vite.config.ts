import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const RAILWAY_API =
  process.env.VITE_GAME_DATA_API ||
  process.env.VITE_GRUDGE_API_URL ||
  "https://grudge-builder-production.up.railway.app";

export default defineConfig(({ mode }) => {
  loadEnv(mode, path.resolve(import.meta.dirname), "");
  return {
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api/auth": { target: RAILWAY_API, changeOrigin: true, secure: true },
      "/api/account": { target: RAILWAY_API, changeOrigin: true, secure: true },
      "/api/characters": { target: RAILWAY_API, changeOrigin: true, secure: true },
    },
  },
};
});
