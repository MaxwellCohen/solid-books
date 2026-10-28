import { defineConfig, devices } from "@playwright/test";

// Browser checks against a production build. Build with an image CDN so the
// srcset path is exercised: `IMAGE_CDN=vercel pnpm build && pnpm test:e2e`.
const port = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "node .output/server/index.mjs",
    url: `http://localhost:${port}`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
