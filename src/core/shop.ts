// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { cleanLook, DEFAULT_LOOK, type Look } from './look';

/** What the shop sells. Pure data and rules, no DOM. */

/** `headband` holds all hair jewellery: cat ears, bows and clips. */
export type Slot = 'top' | 'skirt' | 'headband' | 'shoes' | 'earrings' | 'nails';
export type Supply = 'food' | 'treat' | 'milk';
/** The shape of an accessory; plain clothes have none. */
export type Accessory = 'ears' | 'bow' | 'clip-star' | 'clip-heart' | 'pearl' | 'heart' | 'star' | 'none';

export interface WearItem {
  kind: 'wear';
  id: string;
  name: string;
  slot: Slot;
  color: string;
  price: number;
  style?: Accessory;
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

/** Decorations for the house; each one makes the cats feel more at home. */
export interface DecoItem {
  kind: 'deco';
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
}

export type ShopItem = WearItem | SupplyItem | ToyItem | DecoItem;

export const SLOT_NAMES: Record<Slot, string> = {
  top: 'Oberteile',
  skirt: 'Röcke',
  headband: 'Haarschmuck',
  shoes: 'Schuhe',
  earrings: 'Ohrringe',
  nails: 'Nagellack',
};

const wear = (slot: Slot, id: string, name: string, color: string, price: number, style?: Accessory): WearItem => ({
  kind: 'wear',
  id,
  name,
  slot,
  color,
  price,
  ...(style ? { style } : {}),
});
const deco = (id: string, name: string, icon: string, description: string, price: number): DecoItem => ({ kind: 'deco', id, name, icon, description, price });

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
  wear('headband', 'band-rosa', 'Rosa Katzenohren', '#ff9fc6', 0, 'ears'),
  wear('headband', 'band-gold', 'Goldene Katzenohren', '#ffc83d', 6, 'ears'),
  wear('headband', 'band-weiss', 'Weiße Katzenohren', '#ffffff', 4, 'ears'),
  wear('headband', 'band-schwarz', 'Schwarze Katzenohren', '#2e2833', 4, 'ears'),
  wear('headband', 'band-lila', 'Lila Katzenohren', '#b388ff', 4, 'ears'),
  wear('headband', 'bow-rosa', 'Rosa Schleife', '#ff7eb6', 3, 'bow'),
  wear('headband', 'bow-rot', 'Rote Schleife', '#ff4d5e', 3, 'bow'),
  wear('headband', 'bow-blau', 'Blaue Schleife', '#4aa3ff', 3, 'bow'),
  wear('headband', 'clip-stern', 'Sternchen-Spange', '#ffd23f', 2, 'clip-star'),
  wear('headband', 'clip-herz', 'Herzchen-Spange', '#ff5c8a', 2, 'clip-heart'),
  wear('shoes', 'shoes-pink', 'Pinke Schuhe', '#e0567a', 0),
  wear('shoes', 'shoes-weiss', 'Weiße Turnschuhe', '#f4f4f4', 3),
  wear('shoes', 'shoes-blau', 'Blaue Schuhe', '#3f7bd9', 3),
  wear('shoes', 'shoes-gold', 'Goldene Schuhe', '#ffc83d', 7),
  wear('earrings', 'ear-none', 'Keine Ohrringe', '#ffffff', 0, 'none'),
  wear('earrings', 'ear-perle', 'Perlenohrringe', '#fff8f0', 3, 'pearl'),
  wear('earrings', 'ear-herz', 'Herzchen-Ohrringe', '#ff5c8a', 4, 'heart'),
  wear('earrings', 'ear-stern', 'Sternchen-Ohrringe', '#ffd23f', 4, 'star'),
  wear('nails', 'nails-none', 'Ohne Nagellack', '#ffffff', 0, 'none'),
  wear('nails', 'nails-rosa', 'Rosa Nagellack', '#ff7eb6', 2),
  wear('nails', 'nails-rot', 'Roter Nagellack', '#e8283f', 2),
  wear('nails', 'nails-lila', 'Lila Nagellack', '#9b6bff', 2),
  wear('nails', 'nails-tuerkis', 'Türkiser Nagellack', '#2fd3cf', 2),
  wear('nails', 'nails-gold', 'Glitzer-Goldlack', '#ffc83d', 4),
  { kind: 'supply', id: 'food', name: 'Katzenfutter', icon: '🥫', description: 'Eine volle Schüssel: 3 Herzen', price: 2 },
  { kind: 'supply', id: 'treat', name: 'Leckerli', icon: '🐟', description: 'Ein Fischleckerli: 2 Herzen', price: 1 },
  { kind: 'supply', id: 'milk', name: 'Katzenmilch', icon: '🥛', description: 'Ein Schälchen zum Trinken: 2 Herzen', price: 1 },
  { kind: 'toy', id: 'yarn', name: 'Wollknäuel', icon: '🧶', description: 'Werfen, und die Katzen rennen hinterher', price: 5 },
  deco('deco-kratzbaum', 'Kratzbaum', '🌳', 'Zum Klettern und Kratzen, im Flur', 12),
  deco('deco-kissen', 'Kuschelkissen', '🛋️', 'Weiche Kissen im Flur', 4),
  deco('deco-blumen', 'Blumentöpfe', '🌷', 'Bunte Blumen für die Küche', 6),
  deco('deco-bild', 'Katzenbild', '🖼️', 'Ein Bild mit Katze fürs Schlafzimmer', 5),
  deco('deco-teppich', 'Herzteppich', '💗', 'Ein Herzteppich fürs Bad', 6),
  deco('deco-lichter', 'Lichterkette', '✨', 'Leuchtet im ganzen Haus', 8),
];

/** Every decoration makes the cupboards fill up this much faster (the cats are happier at home). */
export const DECO_REFILL_BONUS = 0.15;

export const DEFAULT_OUTFIT: Record<Slot, string> = {
  top: 'top-rosa',
  skirt: 'skirt-flieder',
  headband: 'band-rosa',
  shoes: 'shoes-pink',
  earrings: 'ear-none',
  nails: 'nails-none',
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
  /** Decorations bought for the house. */
  deco: string[];
  /** Skin, hair and face, from the figure editor. */
  look: Look;
}

export function newWardrobe(): Wardrobe {
  return {
    money: 0,
    owned: CATALOG.filter((i) => i.price === 0).map((i) => i.id),
    outfit: { ...DEFAULT_OUTFIT },
    supplies: { food: 0, treat: 0, milk: 0 },
    hasYarn: false,
    deco: [],
    look: { ...DEFAULT_LOOK },
  };
}

export type BuyResult = 'ok' | 'owned' | 'poor' | 'unknown';

/** Buy an item. Clothes are put on straight away. */
export function buy(w: Wardrobe, id: string): BuyResult {
  const item = findItem(id);
  if (!item) return 'unknown';
  if (item.kind === 'wear' && w.owned.includes(id)) return 'owned';
  if (item.kind === 'toy' && w.hasYarn) return 'owned';
  if (item.kind === 'deco' && w.deco.includes(id)) return 'owned';
  if (w.money < item.price) return 'poor';
  w.money -= item.price;
  if (item.kind === 'wear') {
    w.owned.push(id);
    w.outfit[item.slot] = id;
  } else if (item.kind === 'supply') w.supplies[item.id]++;
  else if (item.kind === 'deco') w.deco.push(id);
  else w.hasYarn = true;
  return 'ok';
}

/** Put on something already owned. */
export function wearItem(w: Wardrobe, id: string): boolean {
  const item = findItem(id);
  if (item?.kind !== 'wear' || !w.owned.includes(id)) return false;
  w.outfit[item.slot] = id;
  return true;
}

/** The colour worn in a slot. */
export function outfitColor(w: Wardrobe, slot: Slot): string {
  const item = findItem(w.outfit[slot]);
  return item?.kind === 'wear' ? item.color : '#ffffff';
}

/** The shape of the accessory worn in a slot ('none' for plain clothes or nothing). */
export function outfitStyle(w: Wardrobe, slot: Slot): Accessory {
  const item = findItem(w.outfit[slot]);
  return item?.kind === 'wear' ? (item.style ?? 'none') : 'none';
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
    for (const k of ['food', 'treat', 'milk'] as const) {
      const n = r.supplies[k];
      if (typeof n === 'number' && n >= 0) w.supplies[k] = Math.floor(n);
    }
  }
  w.hasYarn = r.hasYarn === true;
  if (Array.isArray(r.deco)) for (const id of r.deco) if (typeof id === 'string' && findItem(id)?.kind === 'deco' && !w.deco.includes(id)) w.deco.push(id);
  w.look = cleanLook(r.look);
  return w;
}
