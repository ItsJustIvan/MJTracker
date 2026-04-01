import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  /* Set to false to prevent multiple tests from fighting over seats */
  fullyParallel: false, 
  
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  /* Use 1 worker locally to avoid 'TestBot' collisions on the same table */
  workers: process.env.CI ? 1 : 1, 

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* You can add Mobile Safari back here once the single-worker setup passes */
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});