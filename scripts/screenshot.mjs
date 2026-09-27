// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Take the README screenshots from a running game.
 *
 * Usage: start the game (`npm run dev` or `npm run preview`), then
 *   node scripts/screenshot.mjs [url] [outDir]
 * Defaults: url http://localhost:5173/, outDir docs/screenshots.
 *
 * Writes title.jpg (title screen), play.jpg (petting a cat, hearts rising) and shop.jpg (the shop).
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = process.argv[3] ?? 'docs/screenshots';

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__katzen?.app.engine.frameId > 5);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/title.jpg`, quality: 85 });

await page.keyboard.press('Enter');
await page.evaluate(() => {
  const { game } = window.__katzen.app;
  const cat = game.cats[0];
  cat.mood = 'sit';
  cat.timer = 30;
  game.girl.x = cat.x - 1.6;
  game.wardrobe.money = 12;
});
await page.waitForTimeout(1500);
await page.keyboard.press('Enter');
await page.waitForTimeout(450);
await page.screenshot({ path: `${outDir}/play.jpg`, quality: 85 });

await page.keyboard.press('KeyK');
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/shop.jpg`, quality: 85 });
await browser.close();
console.log(`Screenshots written to ${outDir}`);
