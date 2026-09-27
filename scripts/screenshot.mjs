// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Take the README screenshots from a running game.
 *
 * Usage: start the game (`npm run dev` or `npm run preview`), then
 *   node scripts/screenshot.mjs [url] [outDir]
 * Defaults: url http://localhost:5173/, outDir docs/screenshots.
 *
 * Writes title.jpg (title screen), play.jpg (feeding the cats in the garden, with a backpack),
 * house.jpg (cats eating in the kitchen), shop.jpg (the cat shop), school.jpg (a sum at school) and
 * beach.jpg (the beach at the far end of the garden). It starts from a fresh
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

// The garden: dress up a little, put the backpack on, and set down a bowl for the cats.
await page.keyboard.press('Enter');
await page.evaluate(() => {
  const { app } = window.__katzen;
  const { game } = app;
  const w = game.wardrobe;
  w.money = 60;
  w.supplies.food = 1;
  w.owned.push('ear-herz');
  w.outfit.headband = 'band-gold';
  w.outfit.earrings = 'ear-herz';
  w.look.hairStyle = 'zoepfe';
  w.gear.push('backpack');
  game.setBackpack(true);
  app.world.refreshOutfit();
  game.girl.x = 40;
  game.girl.z = -0.6;
  game.girl.facing = 1;
  // Three garden cats nearby, ready to come running to the bowl.
  game.cats
    .filter((c) => c.place === 'garden')
    .slice(0, 3)
    .forEach((c, i) => {
      c.x = 44 + i * 2.5;
      c.z = -1 + i * 0.6;
      c.mood = 'sit';
      c.timer = 0;
    });
});
await page.waitForTimeout(1500);
await page.keyboard.press('Digit1');
await page.waitForFunction(() => window.__katzen.app.game.cats.some((c) => c.mood === 'eat'), null, { timeout: 60000 });
await page.waitForTimeout(600);
await shot('play');

// The kitchen: fill the bowls and let the cats come.
await page.evaluate(() => {
  const { game } = window.__katzen.app;
  game.wardrobe.supplies.food = 2;
  game.goHome();
  game.girl.x = 2006;
  game.girl.z = -0.6;
  game.kitchenBowl('milk').portions = 2;
  game.kitchenBowl('food').portions = 3;
  for (const [i, c] of game.cats.slice(1, 3).entries()) {
    c.place = 'house';
    c.x = 2003 + i * 9;
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
await page.keyboard.press('Escape');

await page.evaluate(() => {
  const { game } = window.__katzen.app;
  game.girl.x = 515;
  game.girl.z = -1.5;
});
// Give the camera time to glide the long way down to the beach.
await page.waitForFunction(() => Math.abs(window.__katzen.app.world.camera.position.x - 515) < 3, null, { timeout: 120000 });
await page.waitForTimeout(800);
await shot('beach');
await browser.close();
console.log(`Screenshots written to ${outDir}`);
