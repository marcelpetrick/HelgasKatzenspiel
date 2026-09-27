// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import { type Recipe, RECIPES } from '../core/kitchen';
import type { Gear, Grocery } from '../core/shop';
import { el } from './dom';
import { TEXT } from './text';

/** The stove (Enter at the stove): pick a recipe, and the dish appears on the kitchen table. */
export class CookMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly game: Game,
    /** Called with the result of a cooking attempt. */
    private readonly onCook: (result: 'ok' | 'busy' | 'missing' | 'unknown') => void,
  ) {
    this.root = el('div', 'shop cook');
    const card = el('div', 'shop-card');
    const head = el('div', 'shop-head');
    const close = el('button', 'shop-close', TEXT.cook.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    head.append(el('h2', '', TEXT.cook.title), close);
    this.body = el('div', 'shop-body');
    card.append(head, this.body);
    this.root.append(card);
    parent.append(this.root);
  }

  open(): void {
    this.isOpen = true;
    this.root.classList.add('open');
    this.render();
  }

  close(): void {
    this.isOpen = false;
    this.root.classList.remove('open');
  }

  private card(r: Recipe): HTMLElement {
    const w = this.game.wardrobe;
    const c = el('div', 'shop-item');
    const info = el('div', 'shop-info');
    info.append(el('div', 'shop-name', r.name));
    const needs = Object.entries(r.needs).map(([g, n]) => `${n}× ${TEXT.groceries[g as Grocery]} (${w.pantry[g as Grocery]})`);
    if (r.tool) needs.push(TEXT.gearNames[r.tool] + (w.gear.includes(r.tool) ? ' ✓' : ' ✗'));
    info.append(el('div', 'shop-desc', needs.join(' · ')));
    if (r.cutlery) info.append(el('div', 'shop-desc', `${TEXT.gearNames.cutlery}${w.gear.includes('cutlery' satisfies Gear) ? ' ✓' : ' ✗'}`));
    const missing = this.game.missingFor(r.id);
    const b = el('button', 'shop-buy', TEXT.cook.cook);
    b.type = 'button';
    b.disabled = missing.length > 0 || this.game.meal !== null;
    if (missing.length > 0) c.classList.add('poor');
    b.addEventListener('click', () => {
      this.onCook(this.game.cookMeal(r.id));
      this.close();
    });
    c.append(el('div', 'shop-icon', r.icon), info, el('div', 'shop-price'), b);
    return c;
  }

  private render(): void {
    const grid = el('div', 'shop-grid');
    for (const r of RECIPES) grid.append(this.card(r));
    const hint = el('p', 'shop-hint', this.game.meal !== null ? TEXT.cook.busy : TEXT.cook.hint);
    this.body.replaceChildren(grid, hint);
  }
}
