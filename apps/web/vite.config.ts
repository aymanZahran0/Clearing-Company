import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Public-route prerendering (research.md R9) is added in Phase 3 (T079) once
// the public route tree exists. This base config covers dev/build/test only.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 5173,
  },
});
