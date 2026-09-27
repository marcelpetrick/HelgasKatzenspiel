// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from '@playwright/test';

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
    viewport: { width: 1280, height: 720 },
    // Software WebGL, so the suite runs the same on a laptop and on a headless CI runner.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4273',
    // Always test a fresh build locally; a server left on the port could be serving a stale dist/.
    // The port is our own (not Vite's default 4173), so other Vite projects' previews don't get in the way.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
