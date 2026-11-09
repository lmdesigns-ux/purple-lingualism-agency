import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests',
  workers: 1,
  use: { baseURL: 'http://localhost:5173', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
  ]
});
