// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { cleanLook, DEFAULT_LOOK, type Look } from './look';

/** What the shop sells. Pure data and rules, no DOM. */

/** `headband` holds all hair jewellery: cat ears, bows and clips. `skirt` holds skirts and trousers. */
export type Slot = 'top' | 'skirt' | 'headband' | 'shoes' | 'earrings' | 'nails';
export type Supply = 'food' | 'treat' | 'milk';
/** The shape of an accessory; plain clothes have none. */
export type Accessory = 'ears' | 'band' | 'flowers' | 'bow' | 'clip-star' | 'clip-heart' | 'pearl' | 'heart' | 'star' | 'pants' | 'none';

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
  price: number;
}

/** Toys for the cats: three to throw (key 3) and a feather wand to wave (key 5). */
export type Toy = 'yarn' | 'ball' | 'mouse' | 'feather';
/** Things the girl owns once: a backpack for cats and kitchen tools. */
export type Gear = 'backpack' | 'pan' | 'pot' | 'cutlery';
/** Food and drinks for the girl, made in the kitchen. `dairy` is milk for the girl (`milk` is the cats'). */
export type Grocery = 'tomato' | 'leek' | 'egg' | 'bread' | 'cheese' | 'apple' | 'dairy' | 'cocoa' | 'orange';

export const GROCERIES: readonly Grocery[] = ['tomato', 'leek', 'egg', 'bread', 'cheese', 'apple', 'dairy', 'cocoa', 'orange'];

export interface ToyItem {
  kind: 'toy';
  id: Toy;
  name: string;
  icon: string;
  price: number;
}

export interface GearItem {
  kind: 'gear';
  id: Gear;
  name: string;
  icon: string;
  price: number;
}

export interface GroceryItem {
  kind: 'grocery';
  id: Grocery;
  name: string;
  icon: string;
  price: number;
}

/** Decorations for the house; each one makes the cats feel more at home. */
export interface DecoItem {
  kind: 'deco';
  id: string;
  name: string;
  icon: string;
  price: number;
}

export type ShopItem = WearItem | SupplyItem | ToyItem | GearItem | GroceryItem | DecoItem;

export const SLOT_NAMES: Record<Slot, string> = {
  top: 'Oberteile',
  skirt: 'Röcke und Hosen',
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
const deco = (id: string, name: string, icon: string, price: number): DecoItem => ({ kind: 'deco', id, name, icon, price });

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
  wear('skirt', 'pants-jeans', 'Jeanshose', '#3f6fb8', 5, 'pants'),
  wear('skirt', 'pants-rosa', 'Rosa Leggings', '#ff9fc6', 4, 'pants'),
  wear('skirt', 'pants-gruen', 'Grüne Latzhose', '#5cc98a', 6, 'pants'),
  wear('headband', 'band-rosa', 'Rosa Katzenohren', '#ff9fc6', 0, 'ears'),
  wear('headband', 'band-gold', 'Goldene Katzenohren', '#ffc83d', 6, 'ears'),
  wear('headband', 'band-weiss', 'Weiße Katzenohren', '#ffffff', 4, 'ears'),
  wear('headband', 'band-schwarz', 'Schwarze Katzenohren', '#2e2833', 4, 'ears'),
  wear('headband', 'band-lila', 'Lila Katzenohren', '#b388ff', 4, 'ears'),
  wear('headband', 'reif-rot', 'Roter Haarreif', '#ff4d5e', 2, 'band'),
  wear('headband', 'reif-tuerkis', 'Türkiser Haarreif', '#2fd3cf', 2, 'band'),
  wear('headband', 'reif-blumen', 'Blumen-Haarreif', '#ff9fc6', 5, 'flowers'),
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
  { kind: 'supply', id: 'food', name: 'Katzenfutter', icon: '🥫', price: 2 },
  { kind: 'supply', id: 'treat', name: 'Leckerli', icon: '🐟', price: 1 },
  { kind: 'supply', id: 'milk', name: 'Katzenmilch', icon: '🥛', price: 1 },
  { kind: 'toy', id: 'yarn', name: 'Wollknäuel', icon: '🧶', price: 5 },
  { kind: 'toy', id: 'ball', name: 'Glöckchenball', icon: '⚽', price: 3 },
  { kind: 'toy', id: 'mouse', name: 'Spielzeugmaus', icon: '🐭', price: 4 },
  { kind: 'toy', id: 'feather', name: 'Federwedel', icon: '🪶', price: 4 },
  { kind: 'gear', id: 'backpack', name: 'Rucksack', icon: '🎒', price: 10 },
  { kind: 'gear', id: 'pan', name: 'Bratpfanne', icon: '🍳', price: 6 },
  { kind: 'gear', id: 'pot', name: 'Kochtopf', icon: '🍲', price: 6 },
  { kind: 'gear', id: 'cutlery', name: 'Besteck', icon: '🍴', price: 4 },
  { kind: 'grocery', id: 'tomato', name: 'Tomate', icon: '🍅', price: 1 },
  { kind: 'grocery', id: 'leek', name: 'Lauch', icon: '🥬', price: 1 },
  { kind: 'grocery', id: 'egg', name: 'Ei', icon: '🥚', price: 1 },
  { kind: 'grocery', id: 'bread', name: 'Brot', icon: '🍞', price: 1 },
  { kind: 'grocery', id: 'cheese', name: 'Käse', icon: '🧀', price: 2 },
  { kind: 'grocery', id: 'apple', name: 'Apfel', icon: '🍎', price: 1 },
  { kind: 'grocery', id: 'dairy', name: 'Milch', icon: '🥛', price: 1 },
  { kind: 'grocery', id: 'cocoa', name: 'Kakaopulver', icon: '🍫', price: 2 },
  { kind: 'grocery', id: 'orange', name: 'Orange', icon: '🍊', price: 1 },
  deco('deco-kratzbaum', 'Kratzbaum', '🌳', 12),
  deco('deco-kissen', 'Kuschelkissen', '🛋️', 4),
  deco('deco-blumen', 'Blumentöpfe', '🌷', 6),
  deco('deco-bild', 'Katzenbild', '🖼️', 5),
  deco('deco-teppich', 'Herzteppich', '💗', 6),
  deco('deco-lichter', 'Lichterkette', '✨', 8),
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
  /** Toys and gear are bought once. */
  toys: Toy[];
  gear: Gear[];
  /** The backpack is worn (it has to be bought first). */
  wearBackpack: boolean;
  /** Groceries in the kitchen. */
  pantry: Record<Grocery, number>;
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
    toys: [],
    gear: [],
    wearBackpack: false,
    pantry: { tomato: 0, leek: 0, egg: 0, bread: 0, cheese: 0, apple: 0, dairy: 0, cocoa: 0, orange: 0 },
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
  if (owns(w, id)) return 'owned';
  if (w.money < item.price) return 'poor';
  w.money -= item.price;
  if (item.kind === 'wear') {
    w.owned.push(id);
    w.outfit[item.slot] = id;
  } else if (item.kind === 'supply') w.supplies[item.id]++;
  else if (item.kind === 'grocery') w.pantry[item.id]++;
  else if (item.kind === 'deco') w.deco.push(id);
  else if (item.kind === 'toy') w.toys.push(item.id);
  else {
    w.gear.push(item.id);
    // A new backpack is put on straight away, like new clothes.
    if (item.id === 'backpack') w.wearBackpack = true;
  }
  return 'ok';
}

/** Is this one-off thing (clothes, toy, gear, decoration) already owned? Food never is. */
export function owns(w: Wardrobe, id: string): boolean {
  const item = findItem(id);
  if (!item) return false;
  if (item.kind === 'wear') return w.owned.includes(id);
  if (item.kind === 'toy') return w.toys.includes(item.id);
  if (item.kind === 'gear') return w.gear.includes(item.id);
  if (item.kind === 'deco') return w.deco.includes(id);
  return false;
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
  const old = raw as { hasYarn?: unknown };
  // Saves from before there were several toys only knew about the yarn ball.
  if (old.hasYarn === true) w.toys.push('yarn');
  const ofKind = (list: unknown, kind: 'toy' | 'gear'): string[] =>
    Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string' && findItem(id)?.kind === kind) : [];
  for (const id of ofKind(r.toys, 'toy')) if (!w.toys.includes(id as Toy)) w.toys.push(id as Toy);
  for (const id of ofKind(r.gear, 'gear')) if (!w.gear.includes(id as Gear)) w.gear.push(id as Gear);
  w.wearBackpack = r.wearBackpack === true && w.gear.includes('backpack');
  if (r.pantry && typeof r.pantry === 'object') {
    for (const k of GROCERIES) {
      const n = (r.pantry as Record<string, unknown>)[k];
      if (typeof n === 'number' && n >= 0) w.pantry[k] = Math.floor(n);
    }
  }
  if (Array.isArray(r.deco)) for (const id of r.deco) if (typeof id === 'string' && findItem(id)?.kind === 'deco' && !w.deco.includes(id)) w.deco.push(id);
  w.look = cleanLook(r.look);
  return w;
}
