import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" alias from tsconfig.json
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Unit/component tests live next to the code; e2e/ belongs to Playwright
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
