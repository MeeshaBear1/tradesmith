import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Tests cover the pure, money-critical logic (geometry, markup, estimate,
// vertical configs, and the validation/derivation helpers). These run in a
// plain Node environment with no DB, network, or secrets — same zero-secrets
// guarantee the app ships with.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
