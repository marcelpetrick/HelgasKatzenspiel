// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig, devices } from '@playwright/test';

const FIREFOX = {
  name: 'firefox',
  testMatch: 'save.spec.ts',
  use: {
    ...devices['Desktop Firefox'],
    viewport: { width: 1280, height: 720 },
  },
};

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:4273',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Software WebGL, so the suite runs the same on a laptop and on a headless CI runner.
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
    // Saving and continuing is also checked in Firefox, where the game is played too. Not on CI: the
    // GitHub runner has no GPU, and Firefox finds no WebGL driver there.
    ...(process.env.CI ? [] : [FIREFOX]),
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4273',
    // Always test a fresh build: a server left on the port could be serving a stale dist/. The port is
    // our own (strictPort), so a leftover preview makes the run fail loudly instead of testing it.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
