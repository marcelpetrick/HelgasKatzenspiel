// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  // Reports written by the pipeline must not make the dev server reload the game.
  server: { watch: { ignored: ['**/coverage/**', '**/test-results/**', '**/playwright-report/**', '**/docs/**'] } },
  build: {
    target: 'es2022',
    // Babylon is imported by deep path; a bundle far above this means the package root slipped in.
    chunkSizeWarningLimit: 1800,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      // The game rules are unit tested. `src/render`, `src/ui` and `src/app.ts` need WebGL or the
      // DOM and are covered by the Playwright suite in `e2e/` instead.
      include: ['src/core/**/*.ts'],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
});
