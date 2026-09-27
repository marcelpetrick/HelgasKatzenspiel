// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { expect, type Page, test } from '@playwright/test';
import type { App } from '../src/app';

declare global {
  interface Window {
    __katzen: { app: App; start: () => void };
  }
}

/** Open the game, fail on any page error, and wait until the first frame has rendered. */
async function open(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.__katzen.app.engine.frameId > 5);
  return errors;
}

test('title screen, walking, petting and magic work without errors', async ({ page }) => {
  const errors = await open(page);
  await expect(page.getByRole('heading', { name: 'Helgas Katzenspiel' })).toBeVisible();
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await expect(page.getByText('streicheln · benutzen')).toBeVisible();

  const x0 = await page.evaluate(() => window.__katzen.app.game.girl.x);
  // Software rendering on CI can take a long time per frame, so wait for the result, not a fixed time.
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.x)).toBeGreaterThan(x0);
  await page.keyboard.up('ArrowRight');

  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    const cat = game.cats[0];
    cat.mood = 'sit';
    cat.timer = 30;
    game.girl.x = cat.x - 1;
    game.girl.z = cat.z;
  });
  await expect(page.locator('.prompt.show')).toContainText('streicheln');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.hearts)).toBeGreaterThan(0);

  await page.keyboard.press('KeyZ');
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.onGround)).toBe(false);
  await page.keyboard.up('Space');
  expect(errors).toEqual([]);
});

test('the shop sells clothes and cat supplies, and remembers them after a reload', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.keyboard.press('Enter');
  await page.evaluate(() => (window.__katzen.app.game.wardrobe.money = 20));
  await page.keyboard.press('KeyK');
  await expect(page.getByRole('heading', { name: /Katzenladen/ })).toBeVisible();

  const card = (name: string) => page.locator('.shop-item', { hasText: name });
  await card('Lila Pulli').getByRole('button').click();
  await expect(card('Lila Pulli').getByRole('button')).toHaveText('Angezogen ✓');
  await page.getByRole('button', { name: '🐱 Für Katzen' }).click();
  await card('Katzenfutter').getByRole('button').click();
  await card('Wollknäuel').getByRole('button').click();
  await expect(page.locator('.shop-money')).toContainText('8');
  await expect(card('Wollknäuel').getByRole('button')).toBeDisabled();
  await expect(card('Wollknäuel').getByRole('button')).toHaveText('Hast du schon ✓');
  await page.keyboard.press('KeyK');
  await expect(page.locator('.shop.open')).toHaveCount(0);
  await expect(page.locator('.supplies')).toContainText('Futter ×1');

  await page.reload();
  await page.waitForFunction(() => window.__katzen.app.engine.frameId > 5);
  const w = await page.evaluate(() => window.__katzen.app.game.wardrobe);
  expect(w.outfit.top).toBe('top-lila');
  expect(w.supplies.food).toBe(1);
  expect(w.toys).toContain('yarn');
  expect(errors).toEqual([]);
});

test('walk into the cat shop, open a shelf and walk out again', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    for (const c of game.cats) if (c.place === 'garden') c.x = 130;
    game.girl.x = 96;
    game.girl.z = 0;
  });
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.place)).toBe('shop');
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('.panel-sub')).toContainText('Im Katzenladen');

  // The cat shelf opens the shop on the page with things for cats.
  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    game.girl.x = 3007.5;
    game.girl.z = 0.9;
  });
  await expect(page.locator('.prompt.show')).toContainText('Futter');
  await page.keyboard.press('Enter');
  await expect(page.locator('.shop-tab.active')).toHaveText('🐱 Für Katzen');
  await page.keyboard.press('Escape');

  await page.evaluate(() => {
    window.__katzen.app.game.girl.x = 3012;
  });
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.place)).toBe('garden');
  expect(errors).toEqual([]);
});

test('walk into the house, fill the bowls, rename a cat, save with S and come back', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    for (const c of game.cats) c.x = 110;
    game.girl.x = 60;
    game.girl.z = 0;
  });
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.place)).toBe('house');
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('.panel-sub')).toContainText('Im Haus');

  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    // The bowls in the kitchen; the house cats wait in the bedroom so none is closer than the bowls.
    for (const c of game.cats) if (c.place === 'house') c.x = 2050;
    game.girl.x = 2009;
    game.girl.z = -0.6;
  });
  await expect(page.locator('.prompt.show')).toContainText('Milch');
  await page.keyboard.press('Enter');
  await expect(page.locator('.toast.show')).toContainText('Milch steht bereit');

  await page.keyboard.press('KeyM');
  const name = page.locator('.cat-name').first();
  await name.fill('Wolke');
  await name.press('Enter');
  await page.locator('.cat-row').first().getByRole('button', { name: 'Grün' }).click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__katzen.app.game.cats[0])).toMatchObject({ name: 'Wolke', coat: 'gruen' });

  await page.keyboard.press('KeyS');
  await expect(page.locator('.toast.show')).toContainText('Gespeichert');
  await page.reload();
  await page.waitForFunction(() => window.__katzen.app.engine.frameId > 5);
  await expect(page.getByRole('button', { name: 'Weiterspielen' })).toBeVisible();
  await page.keyboard.press('Enter');
  const state = await page.evaluate(() => {
    const { game } = window.__katzen.app;
    return { place: game.girl.place, cat: game.cats[0].name, coat: game.cats[0].coat, milk: game.kitchenBowl('milk').portions > 0 };
  });
  expect(state).toEqual({ place: 'house', cat: 'Wolke', coat: 'gruen', milk: true });
  expect(errors).toEqual([]);
});

test('bowl, toys, backpack and hide-and-seek work in the browser', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const { app } = window.__katzen;
    const w = app.game.wardrobe;
    w.supplies.food = 1;
    w.toys.push('yarn', 'ball');
    w.gear.push('backpack');
    app.game.setBackpack(true);
    app.world.refreshOutfit();
  });
  await page.keyboard.press('Digit1');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.bowls.filter((b) => !b.fixed).length)).toBe(1);
  await page.keyboard.press('Digit3');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.toys.length)).toBe(1);

  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    const cat = game.cats[0];
    cat.place = 'garden';
    cat.mood = 'sit';
    cat.timer = 60;
    cat.bowl = null;
    cat.x = game.girl.x + 1;
    cat.z = game.girl.z;
  });
  await page.keyboard.press('KeyN');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.carrying)).not.toBeNull();
  await page.keyboard.press('KeyR');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.girl.backpack.length)).toBe(1);
  await expect(page.locator('.supplies')).toContainText('Rucksack 1/3');

  await page.keyboard.press('KeyV');
  await expect(page.locator('.toast.show')).toContainText('Augen zu');
  await expect(page.locator('.seek-badge')).toContainText('Verstecken', { timeout: 30_000 });
  expect(errors).toEqual([]);
});
