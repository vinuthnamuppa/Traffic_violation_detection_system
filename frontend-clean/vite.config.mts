import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for frontend-clean.
// Proxy API calls and snapshots to the Flask backend on port 5000.

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

