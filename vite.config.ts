import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const DEFAULT_GAME_DATA_API = "https://grudge-api-production-0d46.up.railway.app";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");
  const gameDataApi =
    env.VITE_GAME_DATA_API || env.GRUDGE_GAME_DATA_API || DEFAULT_GAME_DATA_API;

  return {
    plugins: [react()],
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
        "/api/auth": { target: gameDataApi, changeOrigin: true, secure: true },
        "/api/account": { target: gameDataApi, changeOrigin: true, secure: true },
        "/api/characters": { target: gameDataApi, changeOrigin: true, secure: true },
        "/api/wallet": { target: gameDataApi, changeOrigin: true, secure: true },
        "/api/treaty": { target: gameDataApi, changeOrigin: true, secure: true },
        // Production VFX pipeline (mirrors vercel.json rewrites)
        "/cdn-effects": {
          target: "https://info.grudge-studio.com",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/cdn-effects/, "/sprites/effects"),
        },
        "/cdn-api/effects.json": {
          target: "https://info.grudge-studio.com",
          changeOrigin: true,
          secure: true,
          rewrite: () => "/api/v1/effectSprites.json",
        },
      },
    },
  };
});