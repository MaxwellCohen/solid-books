import { defineConfig } from "@playwright/test";

export const PORT = Number(process.env.FT_PORT ?? 4107);

// Runs against an already-started production server (see run.mjs).
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [["list"], ["json", { outputFile: ".tmp/playwright-report.json" }]],
  outputDir: ".tmp/test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: {
      executablePath: process.env.CHROME_PATH ?? "/home/maxc/.local/bin/google-chrome",
    },
  },
});
