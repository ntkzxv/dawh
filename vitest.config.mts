import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // Next resolves this runtime marker itself; Vitest needs a no-op module.
      "server-only": path.resolve(import.meta.dirname, "test/server-only.ts"),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    exclude: ["node_modules", ".next", ".agents"],
  },
});
