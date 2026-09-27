// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { CAT_PRICE, type Game, MAX_CATS, type ShopTab } from '../core/game';
import { buy, CATALOG, owns, SLOT_NAMES, type ShopItem, type Slot, type Wardrobe, wearItem } from '../core/shop';
import { el } from './dom';
import { TEXT } from './text';

type Tab = ShopTab;
/** The shop sells everything; the wardrobe at home only shows the clothes you already have. */
export type ShopMode = 'shop' | 'wardrobe';
/** What just happened, so the app can play a sound or react. */
export type ShopAction = 'bought' | 'poor' | 'wear' | 'newCat' | 'full';

/** The shop window, opened with K: clothes for the girl and things for the cats. */
export class ShopMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private readonly money: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly title: HTMLElement;
  private readonly tabBar: HTMLElement;
  private readonly tabs = new Map<Tab, HTMLButtonElement>();
  private tab: Tab = 'clothes';
  private mode: ShopMode = 'shop';
  private readonly wardrobe: Wardrobe;
  private toastTimer = 0;
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly game: Game,
    /** Called after anything was bought or put on. */
    private readonly onChange: (action: ShopAction, detail?: string) => void,
  ) {
    this.wardrobe = game.wardrobe;
    this.root = el('div', 'shop');
    const card = el('div', 'shop-card');
    const head = el('div', 'shop-head');
    this.money = el('div', 'shop-money');
    const close = el('button', 'shop-close', TEXT.shop.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    this.title = el('h2', '', TEXT.shop.title);
    head.append(this.title, this.money, close);
    const tabs = (this.tabBar = el('div', 'shop-tabs'));
    for (const [id, label] of [
      ['clothes', TEXT.shop.tabClothes],
      ['cats', TEXT.shop.tabCats],
      ['kitchen', TEXT.shop.tabKitchen],
      ['deco', TEXT.shop.tabDeco],
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

  /** Open the shop (on a page, e.g. from a shelf in the shop) or the wardrobe at home. */
  open(mode: ShopMode = 'shop', tab?: Tab): void {
    this.mode = mode;
    if (mode === 'wardrobe') this.tab = 'clothes';
    else if (tab) this.tab = tab;
    this.title.textContent = mode === 'shop' ? TEXT.shop.title : TEXT.shop.wardrobeTitle;
    this.tabBar.style.display = mode === 'shop' ? '' : 'none';
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
      this.onChange('wear');
    } else {
      const result = buy(w, item.id);
      if (result === 'poor') {
        this.say(TEXT.shop.tooPoor, false);
        this.onChange('poor');
      } else if (result === 'ok') {
        this.say(TEXT.shop.bought(item.name), true);
        this.onChange('bought');
      }
    }
    this.render();
  }

  private adopt(): void {
    if (this.game.cats.length >= MAX_CATS) {
      this.say(TEXT.shop.tooManyCats, false);
      this.onChange('full');
    } else {
      const cat = this.game.buyCat();
      if (cat) {
        this.say(TEXT.newCat(cat.name), true);
        this.onChange('newCat', cat.name);
      } else {
        this.say(TEXT.shop.tooPoor, false);
        this.onChange('poor');
      }
    }
    this.render();
  }

  private catCard(): HTMLElement {
    const c = el('div', 'shop-item');
    const info = el('div', 'shop-info');
    info.append(el('div', 'shop-name', TEXT.shop.newCat), el('div', 'shop-desc', TEXT.shop.newCatDesc));
    const b = el('button', 'shop-buy', TEXT.shop.buy);
    b.type = 'button';
    if (this.wardrobe.money < CAT_PRICE) c.classList.add('poor');
    b.addEventListener('click', () => {
      this.adopt();
    });
    c.append(el('div', 'shop-icon', '🐈'), info, el('div', 'shop-price', `🪙 ${CAT_PRICE}`), b);
    return c;
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
    if (item.kind === 'grocery') info.append(el('div', 'shop-desc', TEXT.shop.have(w.pantry[item.id])));
    const price = el('div', 'shop-price', item.price === 0 ? TEXT.shop.free : `🪙 ${item.price}`);

    const b = el('button', 'shop-buy');
    b.type = 'button';
    const owned = owns(w, item.id);
    if (item.kind === 'gear' && item.id === 'backpack' && owned) {
      // The backpack is worn like clothes: put it on or take it off.
      b.textContent = w.wearBackpack ? TEXT.shop.takeOff : TEXT.shop.wear;
      c.classList.toggle('worn', w.wearBackpack);
      b.addEventListener('click', () => {
        this.game.setBackpack(!w.wearBackpack);
        this.onChange('wear');
        this.render();
      });
      c.append(icon, info, price, b);
      return c;
    }
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
        for (const item of CATALOG)
          if (item.kind === 'wear' && item.slot === slot && (this.mode === 'shop' || this.wardrobe.owned.includes(item.id))) grid.append(this.card(item));
        this.body.append(grid);
      }
      const backpack = CATALOG.find((i) => i.id === 'backpack');
      if (backpack && (this.mode === 'shop' || owns(this.wardrobe, 'backpack'))) {
        this.body.append(el('h3', '', TEXT.gearNames.backpack));
        const grid = el('div', 'shop-grid');
        grid.append(this.card(backpack));
        this.body.append(grid);
      }
    } else if (this.tab === 'kitchen') {
      const grid = el('div', 'shop-grid');
      for (const item of CATALOG) if (item.kind === 'grocery' || (item.kind === 'gear' && item.id !== 'backpack')) grid.append(this.card(item));
      this.body.append(grid, el('p', 'shop-hint', TEXT.shop.kitchenHint));
    } else if (this.tab === 'deco') {
      const grid = el('div', 'shop-grid');
      for (const item of CATALOG) if (item.kind === 'deco') grid.append(this.card(item));
      this.body.append(grid, el('p', 'shop-hint', TEXT.shop.decoHint));
    } else {
      const grid = el('div', 'shop-grid');
      for (const item of CATALOG) if (item.kind === 'supply' || item.kind === 'toy') grid.append(this.card(item));
      const backpack = CATALOG.find((i) => i.id === 'backpack');
      if (backpack) grid.append(this.card(backpack));
      grid.append(this.catCard());
      this.body.append(grid, el('p', 'shop-hint', TEXT.shop.useHint));
    }
  }
}
