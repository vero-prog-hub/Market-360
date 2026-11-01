const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'),
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/serve.cjs',
    env: { PORT: '4175' },
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI
  }
});
