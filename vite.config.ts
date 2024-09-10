import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // デプロイする場所に応じて変更が必要かもしれません
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // 必要に応じて他のビルド設定を追加
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
