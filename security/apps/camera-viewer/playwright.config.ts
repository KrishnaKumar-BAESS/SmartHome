import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:4319', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node dist/server/index.js',
    url: 'http://127.0.0.1:4319',
    env: { PORT: '4319', XFINITY_SIGNALING_HOSTS: '', CAMERA_NAMES: '{}' },
    reuseExistingServer: false,
  },
});
