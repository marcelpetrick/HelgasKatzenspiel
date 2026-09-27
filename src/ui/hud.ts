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
    root.append(top, help, this.prompt);
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
    e.classList.remove('bump');
    void e.offsetWidth;
    e.classList.add('bump');
  }
}
