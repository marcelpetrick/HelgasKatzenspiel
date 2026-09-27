// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import type { World } from '../render/world';
import { TEXT } from './text';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
}

/** The overlay: counters, the controls hint, cat name tags and the petting prompt. */
export class Hud {
  private readonly hearts: HTMLElement;
  private readonly money: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly supplies: HTMLElement;
  private lastSupplies = '';
  private readonly tags = new Map<number, HTMLElement>();
  private lastHearts = -1;
  private lastMoney = -1;

  constructor(
    root: HTMLElement,
    private readonly game: Game,
  ) {
    const top = el('div', 'hud-top');
    const title = el('div', 'panel title-panel');
    title.append(el('div', 'panel-title', TEXT.title), el('div', 'panel-sub', TEXT.catsCount(game.cats.length)));
    const counters = el('div', 'panel counters');
    this.hearts = el('span', 'counter', '0');
    this.money = el('span', 'counter', '0');
    const heartBox = el('div', 'count');
    heartBox.append(el('span', 'icon', '💖'), this.hearts, el('span', 'count-label', TEXT.hearts));
    const moneyBox = el('div', 'count');
    moneyBox.append(el('span', 'icon', '🪙'), this.money, el('span', 'count-label', TEXT.coins));
    counters.append(heartBox, moneyBox);
    top.append(title, counters);

    const help = el('div', 'panel help');
    for (const [key, what] of TEXT.controls) {
      const row = el('div', 'help-row');
      row.append(el('kbd', '', key), el('span', '', what));
      help.append(row);
    }
    this.prompt = el('div', 'prompt');
    this.supplies = el('div', 'panel supplies');
    root.append(top, help, this.prompt, this.supplies);
    for (const c of game.cats) {
      const tag = el('div', 'cat-tag', c.name);
      root.append(tag);
      this.tags.set(c.id, tag);
    }
  }

  update(world: World): void {
    if (this.game.hearts !== this.lastHearts) {
      this.lastHearts = this.game.hearts;
      this.hearts.textContent = String(this.game.hearts);
      this.bump(this.hearts);
    }
    if (this.game.money !== this.lastMoney) {
      this.lastMoney = this.game.money;
      this.money.textContent = String(this.game.money);
      this.bump(this.money);
    }
    const w = this.game.wardrobe;
    const key = `${w.supplies.food}/${w.supplies.treat}/${w.hasYarn}`;
    if (key !== this.lastSupplies) {
      this.lastSupplies = key;
      const items: [string, string, string, number | null][] = [
        ['1', '🥫', TEXT.supplies.food, w.supplies.food],
        ['2', '🐟', TEXT.supplies.treat, w.supplies.treat],
        ['3', '🧶', TEXT.supplies.yarn, w.hasYarn ? null : 0],
      ];
      this.supplies.replaceChildren(
        ...items.map(([k, icon, name, n]) => {
          const s = el('div', 'supply' + (n === 0 ? ' empty' : ''));
          s.append(el('kbd', '', k), el('span', 'icon', icon), el('span', '', n === null ? name : `${name} ×${n}`));
          return s;
        }),
      );
    }
    const near = this.game.nearestCat();
    for (const c of this.game.cats) {
      const tag = this.tags.get(c.id);
      const top = world.catTop(c.id);
      if (!tag || !top) continue;
      const p = world.project(top);
      tag.style.display = p.visible ? '' : 'none';
      tag.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      tag.classList.toggle('near', c === near);
      tag.classList.toggle('happy', c.mood === 'happy');
    }
    if (near) {
      this.prompt.textContent = TEXT.petPrompt(near.name);
      this.prompt.classList.add('show');
    } else this.prompt.classList.remove('show');
  }

  private bump(e: HTMLElement): void {
    // Restart the animation on the next frame, after the removal has been rendered.
    e.classList.remove('bump');
    requestAnimationFrame(() => {
      e.classList.add('bump');
    });
  }
}
