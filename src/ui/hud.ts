// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import { ROOMS } from '../core/world';
import type { World } from '../render/world';
import { el } from './dom';
import { TEXT } from './text';

/** The overlay: counters, where you are, the controls hint, cat name tags, hints and messages. */
export class Hud {
  private readonly hearts: HTMLElement;
  private readonly money: HTMLElement;
  private readonly sub: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly supplies: HTMLElement;
  private readonly tags = new Map<number, HTMLElement>();
  private lastSupplies = '';
  private lastHearts = -1;
  private lastMoney = -1;
  private toastTimer = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly game: Game,
  ) {
    const top = el('div', 'hud-top');
    const title = el('div', 'panel title-panel');
    this.sub = el('div', 'panel-sub');
    title.append(el('div', 'panel-title', TEXT.title), this.sub);
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
    this.toast = el('div', 'toast');
    this.supplies = el('div', 'panel supplies');
    root.append(top, help, this.prompt, this.toast, this.supplies);
  }

  /** Show a short message near the top of the screen. */
  say(text: string): void {
    this.toast.textContent = text;
    this.toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }

  update(world: World): void {
    const g = this.game.girl;
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
    const room = ROOMS.find((r) => g.x >= r.from && g.x < r.to);
    const where = g.place === 'house' && room ? TEXT.inHouse(room.name) : TEXT.garden;
    this.sub.textContent = `${where} · ${TEXT.catsCount(this.game.cats.length)}`;

    const w = this.game.wardrobe;
    const key = `${w.supplies.food}/${w.supplies.treat}/${w.supplies.milk}/${w.hasYarn}`;
    if (key !== this.lastSupplies) {
      this.lastSupplies = key;
      const items: [string, string, string, number | null][] = [
        ['1', '🥫', TEXT.supplies.food, w.supplies.food],
        ['2', '🐟', TEXT.supplies.treat, w.supplies.treat],
        ['3', '🧶', TEXT.supplies.yarn, w.hasYarn ? null : 0],
        ['4', '🥛', TEXT.supplies.milk, w.supplies.milk],
      ];
      this.supplies.replaceChildren(
        ...items.map(([k, icon, name, n]) => {
          const s = el('div', 'supply' + (n === 0 ? ' empty' : ''));
          s.append(el('kbd', '', k), el('span', 'icon', icon), el('span', '', n === null ? name : `${name} ×${n}`));
          return s;
        }),
      );
    }

    const focus = this.game.focus();
    for (const c of this.game.cats) {
      let tag = this.tags.get(c.id);
      if (!tag) {
        tag = el('div', 'cat-tag');
        this.root.append(tag);
        this.tags.set(c.id, tag);
      }
      const top = world.catTop(c.id);
      // The cat in her arms needs no name tag; the hint below already says who it is.
      const p = top && c.place === g.place && c.mood !== 'carried' ? world.project(top) : null;
      tag.style.display = p?.visible ? '' : 'none';
      if (!p) continue;
      if (tag.textContent !== c.name) tag.textContent = c.name;
      tag.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      tag.classList.toggle('near', focus?.kind === 'cat' && focus.cat === c);
      tag.classList.toggle('happy', c.mood === 'happy');
      tag.classList.toggle('kitten', c.growth < 1);
    }
    for (const [id, tag] of this.tags)
      if (!this.game.cat(id)) {
        tag.remove();
        this.tags.delete(id);
      }

    const text = TEXT.prompt(focus, g.carrying !== null);
    if (text) {
      if (this.prompt.textContent !== text) this.prompt.textContent = text;
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
