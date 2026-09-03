import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const args = process.env.PLAYWRIGHT_CHROMIUM_ARGS_JSON
  ? JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS_JSON) as string[]
  : [];

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'on',
    launchOptions: { executablePath, args },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
