import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" path alias.
    alias: { "@": path.resolve(__dirname, ".") }
  }
});
