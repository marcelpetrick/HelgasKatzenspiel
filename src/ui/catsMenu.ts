// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { COATS, MAX_NAME_LENGTH, MAX_SIZE, MIN_SIZE, sizeName } from '../core/cats';
import type { Cat, Game } from '../core/game';
import { el } from './dom';
import { TEXT } from './text';

/** "Meine Katzen" (key M): give every cat a name, a colour and a size. */
export class CatsMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly game: Game,
    /** Called after a cat was changed, so the scene can redraw it. */
    private readonly onChange: () => void,
  ) {
    this.root = el('div', 'shop cats-menu');
    const card = el('div', 'shop-card');
    const head = el('div', 'shop-head');
    const close = el('button', 'shop-close', TEXT.catsMenu.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    head.append(el('h2', '', TEXT.catsMenu.title), close);
    this.body = el('div', 'shop-body cats-list');
    card.append(head, this.body);
    this.root.append(card);
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close();
    });
    parent.append(this.root);
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
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

  private row(cat: Cat): HTMLElement {
    const row = el('div', 'cat-row');
    const head = el('div', 'cat-row-head');
    const name = el('input', 'cat-name');
    name.value = cat.name;
    name.maxLength = MAX_NAME_LENGTH;
    name.setAttribute('aria-label', TEXT.catsMenu.name);
    name.addEventListener('change', () => {
      this.game.restyleCat(cat.id, { name: name.value });
      name.value = cat.name;
      this.onChange();
    });
    // Typing into the name must not walk the girl around or open menus.
    name.addEventListener('keydown', (e) => {
      // Esc still closes the menu; everything else is typing.
      if (e.key !== 'Escape') e.stopPropagation();
      if (e.key === 'Enter') name.blur();
    });
    const info = el('div', 'cat-info');
    const facts = [TEXT.catsMenu.where(cat.place === 'house'), TEXT.catsMenu.love(cat.love)];
    if (cat.growth < 1) facts.unshift(TEXT.catsMenu.kitten(Math.round(((cat.growth - 0.5) / 0.5) * 100)));
    else if (cat.growth > 1) facts.push(TEXT.catsMenu.grown(Math.round((cat.growth - 1) * 100)));
    info.textContent = facts.join(' · ');
    head.append(name, info);

    const colours = el('div', 'swatches');
    colours.setAttribute('aria-label', TEXT.catsMenu.color);
    for (const c of COATS) {
      const b = el('button', 'swatch-btn' + (c.id === cat.coat ? ' active' : ''));
      b.type = 'button';
      b.title = c.name;
      b.setAttribute('aria-label', c.name);
      b.style.background = c.spots ? `conic-gradient(${c.fur} 0 33%, ${c.patch} 0 66%, ${c.spots} 0)` : c.fur;
      b.addEventListener('click', () => {
        this.game.restyleCat(cat.id, { coat: c.id });
        this.onChange();
        this.render();
      });
      colours.append(b);
    }

    const sizeBox = el('label', 'size-box');
    const slider = el('input', 'size-slider');
    slider.type = 'range';
    slider.min = String(MIN_SIZE);
    slider.max = String(MAX_SIZE);
    slider.step = '0.05';
    slider.value = String(cat.size);
    const sizeLabel = el('span', 'size-label', sizeName(cat.size));
    slider.addEventListener('input', () => {
      this.game.restyleCat(cat.id, { size: Number(slider.value) });
      sizeLabel.textContent = sizeName(cat.size);
      this.onChange();
    });
    slider.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') e.stopPropagation();
    });
    sizeBox.append(el('span', '', `${TEXT.catsMenu.size}:`), slider, sizeLabel);
    row.append(head, colours, sizeBox);
    return row;
  }

  private render(): void {
    this.body.replaceChildren(...this.game.cats.map((c) => this.row(c)));
  }
}
