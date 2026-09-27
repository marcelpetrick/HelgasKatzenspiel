// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Take the README screenshots from a running game.
 *
 * Usage: start the game (`npm run dev` or `npm run preview`), then
 *   node scripts/screenshot.mjs [url] [outDir]
 * Defaults: url http://localhost:5173/, outDir docs/screenshots.
 *
 * Writes title.jpg (title screen), play.jpg (petting a cat in the garden), house.jpg (cats eating
 * in the kitchen), shop.jpg (the cat shop) and school.jpg (a sum at school). It starts from a fresh
 * game, so it clears the game's saved state in that browser profile (a throwaway one by default).
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173/';
const outDir = process.argv[3] ?? 'docs/screenshots';

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const shot = (name) => page.screenshot({ path: `${outDir}/${name}.jpg`, quality: 85 });
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__katzen?.app.engine.frameId > 5);
await page.waitForTimeout(1500);
await shot('title');

// The garden: dress up a little, then pet a cat so hearts rise.
await page.keyboard.press('Enter');
await page.evaluate(() => {
  const { app } = window.__katzen;
  const { game } = app;
  game.wardrobe.money = 60;
  game.wardrobe.owned.push('bow-rosa', 'ear-herz', 'nails-rosa');
  game.wardrobe.outfit.headband = 'band-gold';
  game.wardrobe.outfit.earrings = 'ear-herz';
  game.wardrobe.look.hairStyle = 'pferdeschwanz';
  app.world.refreshOutfit();
  const cat = game.cats[0];
  cat.place = 'garden';
  cat.mood = 'sit';
  cat.timer = 60;
  game.girl.x = cat.x - 1.6;
  game.girl.z = cat.z;
});
await page.waitForTimeout(1500);
await page.keyboard.press('Enter');
await page.waitForTimeout(450);
await shot('play');

// The kitchen: fill the bowls and let the cats come.
await page.evaluate(() => {
  const { game } = window.__katzen.app;
  game.wardrobe.supplies.food = 2;
  game.goHome();
  game.girl.x = 406;
  game.girl.z = -0.6;
  game.bowls.milk = true;
  game.bowls.food = true;
  for (const [i, c] of game.cats.slice(1, 3).entries()) {
    c.place = 'house';
    c.x = 403 + i * 9;
    c.z = 0;
    c.mood = 'sit';
    c.timer = 0;
  }
});
await page.waitForTimeout(2500);
await shot('house');

await page.keyboard.press('KeyK');
await page.waitForTimeout(400);
await shot('shop');
await page.keyboard.press('Escape');

await page.evaluate(() => {
  const { game } = window.__katzen.app;
  const out = game.girl;
  out.place = 'garden';
  out.x = 22;
  out.z = 0.9;
});
await page.keyboard.press('ArrowUp');
await page.waitForFunction(() => window.__katzen.app.school.isOpen);
await page.getByText('Mittel').click();
await page.waitForTimeout(400);
await shot('school');
await browser.close();
console.log(`Screenshots written to ${outDir}`);
