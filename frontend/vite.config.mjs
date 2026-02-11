import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the React frontend.
// Backend Flask server runs on http://localhost:5000 by default.
// We proxy /api and /snapshots to the backend during development.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/snapshots": "http://localhost:5000"
    }
  },
  build: {
    outDir: "dist"
  }
});

