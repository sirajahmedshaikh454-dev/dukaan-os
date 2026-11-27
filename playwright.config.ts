import { defineConfig, devices } from '@playwright/test';

// E2E runs the real API + web app against a separate database, so it never
// touches your dev data. MongoDB must be running (locally, or as a CI service).
const env = {
  MONGODB_URI: process.env.E2E_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dukaan_e2e',
  JWT_SECRET: 'e2e-secret-that-is-at-least-32-characters-long',
  PORT: '4000',
};

export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // The installed Chrome: no 150 MB browser download (GitHub's Ubuntu runners ship Chrome too).
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    // Shopkeepers use cheap Android phones: test at 360px (CLAUDE.md section 11).
    { name: 'phone-360', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @dukaan/api exec tsx src/server.ts',
      url: 'http://localhost:4000/api/health',
      env,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @dukaan/web exec vite --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
