import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    include: ["lib/**/*.test.ts"],
    // A US time zone with DST, so date bugs show up here and not on stage.
    env: { TZ: "America/Los_Angeles" },
  },
});
