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
  await expect(page.locator('.title-screen')).toHaveCount(0);
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
  // Hiding the tab (another tab, a closed laptop) saves right away, without waiting for the next round.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate((key) => localStorage.getItem(key) ?? '', KEY)).toContain('Sternchen');
  await page.evaluate(() => {
    window.__katzen.app.game.cats[0].name = 'Mondschein';
  });
  // Leaving the page saves the very latest state too.
  await page.reload();
  await running(page);
  await page.getByRole('button', { name: 'Weiterspielen' }).click();
  const state = await page.evaluate(() => {
    const { game } = window.__katzen.app;
    return { cat: game.cats[0].name, money: game.money };
  });
  expect(state).toEqual({ cat: 'Mondschein', money: 7 });
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
  // The page reloads and builds the whole scene again, which takes a while with software WebGL on CI.
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible({ timeout: 60_000 });
  const state = await page.evaluate((key) => {
    const { game } = window.__katzen.app;
    return { saved: localStorage.getItem(key), names: game.cats.map((c) => c.name), money: game.money };
  }, KEY);
  expect(state.saved).toBeNull();
  expect(state.names).not.toContain('Wolke');
  expect(state.money).toBe(0);
  expect(errors).toEqual([]);
});

test('the title screen New Game button works with Enter', async ({ page }) => {
  const errors = await open(page);
  await playFresh(page);
  await page.keyboard.press('KeyS');
  await page.reload();
  await running(page);

  const fresh = page.getByRole('button', { name: 'Neues Spiel' });
  await fresh.focus();
  page.once('dialog', (d) => void d.accept());
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Los geht’s!' })).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => window.__katzen.app.game.cats[0].name)).not.toBe('Wolke');
  expect(errors).toEqual([]);
});

test('a second tab waits until the first game closes, then loads its latest save', async ({ page, context }) => {
  // Both tabs build a 3D scene before the second one waits. That is too much for the small GitHub
  // runner (minutes of software WebGL), so this test runs only locally (see AGENTS.md).
  test.skip(Boolean(process.env.CI), 'two 3D scenes are too heavy for the CI runner');
  test.setTimeout(240_000);
  const errors = await open(page);
  await playFresh(page);
  await page.keyboard.press('KeyS');
  await expect(page.locator('.toast.show')).toContainText('Gespeichert');
  // A second tab may inspect the title, but cannot start or erase the active game.
  const other = await context.newPage();
  const otherErrors = await open(other);
  expect(await other.evaluate(() => window.__katzen.app.game.cats[0].name)).toBe('Wolke');
  await page.evaluate(() => {
    window.__katzen.app.game.cats[0].name = 'Noch nicht gespeichert';
  });
  other.once('dialog', (d) => void d.accept());
  await other.getByRole('button', { name: 'Neues Spiel beginnen' }).click();
  await expect(other.getByText('Das Spiel ist schon in einem anderen Fenster geöffnet.', { exact: false })).toBeVisible();
  await expect(page.locator('#ui')).not.toHaveClass(/on-title/);
  expect(await other.evaluate((key) => localStorage.getItem(key) ?? '', KEY)).toContain('Wolke');

  // The waiting tab stops rendering and repeated attempts do not take the lock.
  const oldFrame = await other.evaluate(() => window.__katzen.app.engine.frameId);
  await page.waitForTimeout(100);
  expect(await other.evaluate(() => window.__katzen.app.engine.frameId)).toBe(oldFrame);
  await other.getByRole('button', { name: 'Noch mal versuchen' }).click();
  await expect(other.getByText('Das Spiel ist schon in einem anderen Fenster geöffnet.', { exact: false })).toBeVisible();
  expect(await other.evaluate(() => window.__katzen.app.engine.frameId)).toBe(oldFrame);

  // Closing the owner saves its newest state before the waiting tab retries.
  await page.evaluate(() => {
    window.__katzen.app.game.cats[0].name = 'Sternchen';
  });
  await page.close();
  const reloaded = other.waitForEvent('load');
  await other.getByRole('button', { name: 'Noch mal versuchen' }).click();
  await reloaded;
  await running(other);
  await expect(other.locator('#ui')).not.toHaveClass(/on-title/, { timeout: 60_000 });
  expect(await other.evaluate(() => window.__katzen.app.game.cats[0].name)).toBe('Sternchen');
  expect(await other.evaluate((key) => localStorage.getItem(key) ?? '', KEY)).toContain('Sternchen');
  expect([...errors, ...otherErrors]).toEqual([]);
});
