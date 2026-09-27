// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** What the shop sells. Pure data and rules, no DOM. */

export type Slot = 'top' | 'skirt' | 'headband' | 'shoes';
export type Supply = 'food' | 'treat';

export interface WearItem {
  kind: 'wear';
  id: string;
  name: string;
  slot: Slot;
  color: string;
  price: number;
}

export interface SupplyItem {
  kind: 'supply';
  id: Supply;
  name: string;
  icon: string;
  description: string;
  price: number;
}

export interface ToyItem {
  kind: 'toy';
  id: 'yarn';
  name: string;
  icon: string;
  description: string;
  price: number;
}

export type ShopItem = WearItem | SupplyItem | ToyItem;

export const SLOT_NAMES: Record<Slot, string> = {
  top: 'Oberteile',
  skirt: 'Röcke',
  headband: 'Katzenohren-Haarreifen',
  shoes: 'Schuhe',
};

const wear = (slot: Slot, id: string, name: string, color: string, price: number): WearItem => ({ kind: 'wear', id, name, slot, color, price });

export const CATALOG: readonly ShopItem[] = [
  wear('top', 'top-rosa', 'Rosa Shirt', '#ff7eb6', 0),
  wear('top', 'top-himmel', 'Himmelblaues Shirt', '#6ec6ff', 3),
  wear('top', 'top-minze', 'Minz-Shirt', '#6fe0b5', 3),
  wear('top', 'top-sonne', 'Sonnengelbes Shirt', '#ffd24d', 4),
  wear('top', 'top-lila', 'Lila Pulli', '#9b6bff', 5),
  wear('top', 'top-weiss', 'Weiße Bluse', '#f7f4f0', 5),
  wear('skirt', 'skirt-flieder', 'Fliederrock', '#b388ff', 0),
  wear('skirt', 'skirt-rosa', 'Rosa Rock', '#ff9fc6', 3),
  wear('skirt', 'skirt-tuerkis', 'Türkiser Rock', '#3fd0d4', 4),
  wear('skirt', 'skirt-rot', 'Roter Rock', '#ff5a6e', 4),
  wear('skirt', 'skirt-jeans', 'Jeansrock', '#4a78c2', 6),
  wear('headband', 'band-rosa', 'Rosa Katzenohren', '#ff9fc6', 0),
  wear('headband', 'band-gold', 'Goldene Katzenohren', '#ffc83d', 6),
  wear('headband', 'band-weiss', 'Weiße Katzenohren', '#ffffff', 4),
  wear('headband', 'band-schwarz', 'Schwarze Katzenohren', '#2e2833', 4),
  wear('headband', 'band-lila', 'Lila Katzenohren', '#b388ff', 4),
  wear('shoes', 'shoes-pink', 'Pinke Schuhe', '#e0567a', 0),
  wear('shoes', 'shoes-weiss', 'Weiße Turnschuhe', '#f4f4f4', 3),
  wear('shoes', 'shoes-blau', 'Blaue Schuhe', '#3f7bd9', 3),
  wear('shoes', 'shoes-gold', 'Goldene Schuhe', '#ffc83d', 7),
  { kind: 'supply', id: 'food', name: 'Katzenfutter', icon: '🥫', description: 'Eine volle Schüssel: 3 Herzen', price: 2 },
  { kind: 'supply', id: 'treat', name: 'Leckerli', icon: '🐟', description: 'Ein Fischleckerli: 2 Herzen', price: 1 },
  { kind: 'toy', id: 'yarn', name: 'Wollknäuel', icon: '🧶', description: 'Werfen, und die Katzen rennen hinterher', price: 5 },
];

export const DEFAULT_OUTFIT: Record<Slot, string> = {
  top: 'top-rosa',
  skirt: 'skirt-flieder',
  headband: 'band-rosa',
  shoes: 'shoes-pink',
};

export function findItem(id: string): ShopItem | undefined {
  return CATALOG.find((i) => i.id === id);
}

/** Everything the player owns and wears; this is what gets saved. */
export interface Wardrobe {
  money: number;
  owned: string[];
  outfit: Record<Slot, string>;
  supplies: Record<Supply, number>;
  hasYarn: boolean;
}

export function newWardrobe(): Wardrobe {
  return {
    money: 0,
    owned: CATALOG.filter((i) => i.price === 0).map((i) => i.id),
    outfit: { ...DEFAULT_OUTFIT },
    supplies: { food: 0, treat: 0 },
    hasYarn: false,
  };
}

export type BuyResult = 'ok' | 'owned' | 'poor' | 'unknown';

/** Buy an item. Clothes are put on straight away. */
export function buy(w: Wardrobe, id: string): BuyResult {
  const item = findItem(id);
  if (!item) return 'unknown';
  if (item.kind === 'wear' && w.owned.includes(id)) return 'owned';
  if (item.kind === 'toy' && w.hasYarn) return 'owned';
  if (w.money < item.price) return 'poor';
  w.money -= item.price;
  if (item.kind === 'wear') {
    w.owned.push(id);
    w.outfit[item.slot] = id;
  } else if (item.kind === 'supply') w.supplies[item.id]++;
  else w.hasYarn = true;
  return 'ok';
}

/** Put on something already owned. */
export function wearItem(w: Wardrobe, id: string): boolean {
  const item = findItem(id);
  if (!item || item.kind !== 'wear' || !w.owned.includes(id)) return false;
  w.outfit[item.slot] = id;
  return true;
}

/** The colour worn in a slot. */
export function outfitColor(w: Wardrobe, slot: Slot): string {
  const item = findItem(w.outfit[slot]);
  return item && item.kind === 'wear' ? item.color : '#ffffff';
}

/** Read a saved wardrobe back, repairing anything missing or broken. */
export function loadWardrobe(raw: unknown): Wardrobe {
  const w = newWardrobe();
  if (!raw || typeof raw !== 'object') return w;
  const r = raw as Partial<Wardrobe>;
  if (typeof r.money === 'number' && r.money >= 0) w.money = Math.floor(r.money);
  if (Array.isArray(r.owned)) for (const id of r.owned) if (typeof id === 'string' && findItem(id)?.kind === 'wear' && !w.owned.includes(id)) w.owned.push(id);
  if (r.outfit && typeof r.outfit === 'object') for (const id of Object.values(r.outfit)) if (typeof id === 'string') wearItem(w, id);
  if (r.supplies && typeof r.supplies === 'object') {
    for (const k of ['food', 'treat'] as const) {
      const n = r.supplies[k];
      if (typeof n === 'number' && n >= 0) w.supplies[k] = Math.floor(n);
    }
  }
  w.hasYarn = r.hasYarn === true;
  return w;
}
