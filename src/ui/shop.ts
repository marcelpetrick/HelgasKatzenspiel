// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { buy, CATALOG, SLOT_NAMES, type ShopItem, type Slot, type Wardrobe, wearItem } from '../core/shop';
import { TEXT } from './text';

type Tab = 'clothes' | 'cats';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
}

/** The shop window, opened with K: clothes for the girl and things for the cats. */
export class ShopMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private readonly money: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly tabs = new Map<Tab, HTMLButtonElement>();
  private tab: Tab = 'clothes';
  private toastTimer = 0;
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly wardrobe: Wardrobe,
    /** Called after anything was bought or put on. */
    private readonly onChange: () => void,
  ) {
    this.root = el('div', 'shop');
    const card = el('div', 'shop-card');
    const head = el('div', 'shop-head');
    this.money = el('div', 'shop-money');
    const close = el('button', 'shop-close', TEXT.shop.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    head.append(el('h2', '', TEXT.shop.title), this.money, close);
    const tabs = el('div', 'shop-tabs');
    for (const [id, label] of [
      ['clothes', TEXT.shop.tabClothes],
      ['cats', TEXT.shop.tabCats],
    ] as const) {
      const b = el('button', 'shop-tab', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.tab = id;
        this.render();
      });
      this.tabs.set(id, b);
      tabs.append(b);
    }
    this.body = el('div', 'shop-body');
    this.toast = el('div', 'shop-toast');
    card.append(head, tabs, this.body, this.toast);
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

  private say(text: string, good: boolean): void {
    this.toast.textContent = text;
    this.toast.classList.toggle('bad', !good);
    this.toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2200);
  }

  private act(item: ShopItem): void {
    const w = this.wardrobe;
    if (item.kind === 'wear' && w.owned.includes(item.id)) {
      wearItem(w, item.id);
    } else {
      const result = buy(w, item.id);
      if (result === 'poor') this.say(TEXT.shop.tooPoor, false);
      else if (result === 'ok') this.say(TEXT.shop.bought(item.name), true);
    }
    this.onChange();
    this.render();
  }

  private card(item: ShopItem): HTMLElement {
    const w = this.wardrobe;
    const c = el('div', 'shop-item');
    const icon = el('div', 'shop-icon');
    if (item.kind === 'wear') {
      icon.classList.add('swatch');
      icon.style.background = item.color;
    } else icon.textContent = item.icon;
    const info = el('div', 'shop-info');
    info.append(el('div', 'shop-name', item.name));
    if (item.kind !== 'wear') info.append(el('div', 'shop-desc', item.description));
    if (item.kind === 'supply') info.append(el('div', 'shop-desc', TEXT.shop.have(w.supplies[item.id])));
    const price = el('div', 'shop-price', item.price === 0 ? TEXT.shop.free : `🪙 ${item.price}`);

    const b = el('button', 'shop-buy');
    b.type = 'button';
    const owned = item.kind === 'wear' ? w.owned.includes(item.id) : item.kind === 'toy' && w.hasYarn;
    if (item.kind === 'wear' && w.outfit[item.slot] === item.id) {
      b.textContent = TEXT.shop.wearing;
      b.disabled = true;
      c.classList.add('worn');
    } else if (item.kind === 'wear' && owned) b.textContent = TEXT.shop.wear;
    else if (owned) {
      b.textContent = TEXT.shop.owned;
      b.disabled = true;
    } else {
      b.textContent = TEXT.shop.buy;
      if (w.money < item.price) c.classList.add('poor');
    }
    b.addEventListener('click', () => {
      this.act(item);
    });
    c.append(icon, info, price, b);
    return c;
  }

  private render(): void {
    this.money.textContent = `🪙 ${this.wardrobe.money} ${TEXT.coins}`;
    for (const [id, b] of this.tabs) b.classList.toggle('active', id === this.tab);
    this.body.replaceChildren();
    if (this.tab === 'clothes') {
      for (const slot of Object.keys(SLOT_NAMES) as Slot[]) {
        this.body.append(el('h3', '', SLOT_NAMES[slot]));
        const grid = el('div', 'shop-grid');
        for (const item of CATALOG) if (item.kind === 'wear' && item.slot === slot) grid.append(this.card(item));
        this.body.append(grid);
      }
    } else {
      const grid = el('div', 'shop-grid');
      for (const item of CATALOG) if (item.kind !== 'wear') grid.append(this.card(item));
      this.body.append(grid, el('p', 'shop-hint', TEXT.shop.useHint));
    }
  }
}
