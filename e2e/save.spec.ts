// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

// Runs in Chromium and, locally, in Firefox (see playwright.config.ts): the game has to keep itself in both.

import { expect, type Page, test } from '@playwright/test';
import type { App } from '../src/app';

declare global {
  interface Window {
    __katzen: { app: App; start: () => void };
  }
}

const KEY = 'helgas-katzenspiel/save';

/** What the browser reported, only to explain a game that did not start. */
const logs = new WeakMap<Page, string[]>();

/** Wait until the game runs; the hook is only there once the scene exists, so ask for it first. */
async function running(page: Page): Promise<void> {
  try {
    // A game without WebGL never starts, so give up long before the test timeout.
    await page.waitForFunction(() => Reflect.has(window, '__katzen') && window.__katzen.app.engine.frameId > 5, undefined, { timeout: 60_000 });
  } catch (e) {
    // Without this a missing WebGL only shows up as "__katzen is undefined".
    throw new Error(`the game did not start: ${String(e)}\nbrowser said: ${(logs.get(page) ?? []).join(' | ') || 'nothing'}`, { cause: e });
  }
}

async function open(page: Page): Promise<string[]> {
  const errors: string[] = [];
  const log: string[] = [];
  logs.set(page, log);
  page.on('pageerror', (e) => {
    errors.push(e.message);
    log.push(e.message);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log.push(m.text());
  });
  await page.goto('/');
  await running(page);
  return errors;
}

/** A fresh game with the first cat renamed and some coins, so a kept game is easy to tell apart. */
async function playFresh(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await running(page);
  await page.getByRole('button', { name: 'Los geht’s!' }).click();
  await page.evaluate(() => {
    const { game } = window.__katzen.app;
    game.cats[0].name = 'Wolke';
    game.earn(7);
  });
}

test('the game keeps itself without pressing S and goes on after a reload', async ({ page }) => {
  const errors = await open(page);
  await playFresh(page);
  // The regular autosave writes it on its own, well before anyone leaves the page.
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key) ?? '', KEY), { timeout: 30_000 }).toContain('Wolke');
  await page.evaluate(() => {
    window.__katzen.app.game.cats[0].name = 'Sternchen';
  });
  // Leaving the page saves the very latest state too.
  await page.reload();
  await running(page);
  await page.getByRole('button', { name: 'Weiterspielen' }).click();
  const state = await page.evaluate(() => {
    const { game } = window.__katzen.app;
    return { cat: game.cats[0].name, money: game.money };
  });
  expect(state).toEqual({ cat: 'Sternchen', money: 7 });
  expect(errors).toEqual([]);
});

test('"Neues Spiel" in the game starts over and does not bring the old game back', async ({ page }) => {
  const errors = await open(page);
  await playFresh(page);
  await page.keyboard.press('KeyS');
  await expect(page.locator('.toast.show')).toContainText('Gespeichert');

  // Saying no keeps everything.
  page.once('dialog', (d) => void d.dismiss());
  await page.getByRole('button', { name: 'Neues Spiel' }).click();
  expect(await page.evaluate(() => window.__katzen.app.game.cats[0].name)).toBe('Wolke');

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Neues Spiel' }).click();
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible();
  const state = await page.evaluate((key) => {
    const { game } = window.__katzen.app;
    return { saved: localStorage.getItem(key), names: game.cats.map((c) => c.name), money: game.money };
  }, KEY);
  expect(state.saved).toBeNull();
  expect(state.names).not.toContain('Wolke');
  expect(state.money).toBe(0);
  expect(errors).toEqual([]);
});
