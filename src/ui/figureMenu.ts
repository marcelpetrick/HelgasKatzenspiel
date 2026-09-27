// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { type Choice, type ColorChoice, EYES, HAIR_COLORS, HAIR_STYLES, type Look, MOUTHS, SKINS } from '../core/look';
import type { Wardrobe } from '../core/shop';
import { el } from './dom';
import { TEXT } from './text';

/** The figure editor (key F): skin, hair and face, free to change at any time. */
export class FigureMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly wardrobe: Wardrobe,
    /** Called after every change, so the girl is redrawn at once. */
    private readonly onChange: () => void,
  ) {
    // The card sits on the right, so the girl stays visible on the left while you dress her up.
    this.root = el('div', 'shop side figure');
    const card = el('div', 'shop-card');
    const head = el('div', 'shop-head');
    const close = el('button', 'shop-close', TEXT.figure.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    head.append(el('h2', '', TEXT.figure.title), close);
    this.body = el('div', 'shop-body');
    card.append(head, this.body);
    this.root.append(card);
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

  private set<K extends keyof Look>(key: K, value: Look[K]): void {
    this.wardrobe.look[key] = value;
    this.onChange();
    this.render();
  }

  private colours(title: string, list: readonly ColorChoice[], key: 'skin' | 'hair'): HTMLElement[] {
    const row = el('div', 'swatches');
    for (const c of list) {
      const b = el('button', 'swatch-btn' + (this.wardrobe.look[key] === c.color ? ' active' : ''));
      b.type = 'button';
      b.title = c.name;
      b.setAttribute('aria-label', c.name);
      b.style.background = c.color;
      b.addEventListener('click', () => {
        this.set(key, c.color);
      });
      row.append(b);
    }
    return [el('h3', '', title), row];
  }

  private options<K extends 'hairStyle' | 'eyes' | 'mouth'>(title: string, list: readonly Choice<Look[K]>[], key: K): HTMLElement[] {
    const row = el('div', 'option-row');
    for (const c of list) {
      const b = el('button', 'option-btn' + (this.wardrobe.look[key] === c.id ? ' active' : ''), c.name);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.set(key, c.id);
      });
      row.append(b);
    }
    return [el('h3', '', title), row];
  }

  private render(): void {
    const look = this.wardrobe.look;
    const freckles = el('button', 'option-btn' + (look.freckles ? ' active' : ''), look.freckles ? TEXT.figure.frecklesOn : TEXT.figure.frecklesOff);
    freckles.type = 'button';
    freckles.addEventListener('click', () => {
      this.set('freckles', !look.freckles);
    });
    this.body.replaceChildren(
      ...this.colours(TEXT.figure.skin, SKINS, 'skin'),
      ...this.colours(TEXT.figure.hair, HAIR_COLORS, 'hair'),
      ...this.options(TEXT.figure.hairStyle, HAIR_STYLES, 'hairStyle'),
      ...this.options(TEXT.figure.eyes, EYES, 'eyes'),
      ...this.options(TEXT.figure.mouth, MOUTHS, 'mouth'),
      el('h3', '', TEXT.figure.freckles),
      freckles,
      el('p', 'shop-hint', TEXT.figure.hint),
    );
  }
}
