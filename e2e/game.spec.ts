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
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await expect(page.getByText('Katze streicheln')).toBeVisible();

  const x0 = await page.evaluate(() => window.__katzen.app.game.girl.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__katzen.app.game.girl.x)).toBeGreaterThan(x0);

  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    const cat = game.cats[0];
    cat.mood = 'sit';
    cat.timer = 30;
    game.girl.x = cat.x - 1;
  });
  await expect(page.locator('.prompt.show')).toContainText('streicheln');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__katzen.app.game.hearts)).toBeGreaterThan(0);

  await page.keyboard.press('KeyZ');
  await page.keyboard.down('Space');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__katzen.app.game.girl.onGround)).toBe(false);
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
