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
  expect(w.hasYarn).toBe(true);
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
    game.girl.x = 409;
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
    return { place: game.girl.place, cat: game.cats[0].name, coat: game.cats[0].coat, milk: game.bowls.milk };
  });
  expect(state).toEqual({ place: 'house', cat: 'Wolke', coat: 'gruen', milk: true });
  expect(errors).toEqual([]);
});
