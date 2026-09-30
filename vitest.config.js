import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

process.env.TZ = "UTC"; // EXIF dates have no zone; pin one so results are stable.

// app.js imports exifr from unpkg; tests use the same version from node_modules.
export default defineConfig({
  resolve: {
    alias: {
      "https://unpkg.com/exifr@7.1.3/dist/full.esm.js": fileURLToPath(new URL("./node_modules/exifr/dist/full.esm.mjs", import.meta.url)),
    },
  },
  test: { environment: "jsdom" },
});
