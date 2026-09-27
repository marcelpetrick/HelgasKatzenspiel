// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Saving and loading the whole game: where the girl stands, every cat with its name and look,
 * coins lying around, cupboards, bowls and the wardrobe. Plain JSON, validated on the way in so a
 * broken or old save never crashes the game.
 */

import { clampSize, cleanName, COATS } from './cats';
import { BACKPACK_SIZE, BOWL_PORTIONS, Game, heartsPerCoin, KITTEN_GROWTH, KITTEN_HEARTS, MAX_CATS, MAX_GROWTH } from './game';
import { MEAL_BOOST_TIME, recipe } from './kitchen';
import { loadWardrobe, type Wardrobe } from './shop';
import { bounds, groundY, INTERIOR_X, type Place, SPOTS, type SpotId } from './world';

/** Version 2 added bowls with portions, toys on the floor and the backpack; version 1 still loads. */
export const SAVE_VERSION = 2;
/** Before version 2 the house interior was built at x = 400; it now starts at `INTERIOR_X`. */
const OLD_INTERIOR_X = 400;

export interface SavedCat {
  name: string;
  coat: string;
  size: number;
  growth: number;
  x: number;
  z: number;
  place: Place;
  love: number;
  plump: number;
}

export interface SaveData {
  version: number;
  wardrobe: Wardrobe;
  hearts: number;
  heartsSinceCoin: number;
  heartsSinceKitten: number;
  /** Cats are referred to by their index in `cats`. */
  girl: { x: number; z: number; place: Place; carrying: number | null; backpack: number[]; boost: number };
  cats: SavedCat[];
  coins: { x: number; y: number; z: number; place: Place }[];
  spotCoins: Record<SpotId, number>;
  bowls: { kind: 'food' | 'milk'; x: number; z: number; place: Place; portions: number; fixed: boolean }[];
  toys: { kind: 'yarn' | 'ball' | 'mouse'; x: number; z: number; place: Place }[];
  meal: string | null;
}

export function snapshot(game: Game): SaveData {
  const g = game.girl;
  return {
    version: SAVE_VERSION,
    wardrobe: structuredClone(game.wardrobe),
    hearts: game.hearts,
    heartsSinceCoin: game.heartsSinceCoin,
    heartsSinceKitten: game.heartsSinceKitten,
    girl: {
      x: g.x,
      z: g.z,
      place: g.place,
      carrying: g.carrying === null ? null : game.cats.findIndex((c) => c.id === g.carrying),
      backpack: g.backpack.map((id) => game.cats.findIndex((c) => c.id === id)).filter((i) => i >= 0),
      boost: g.boost,
    },
    cats: game.cats.map((c) => ({ name: c.name, coat: c.coat, size: c.size, growth: c.growth, x: c.x, z: c.z, place: c.place, love: c.love, plump: c.plump })),
    coins: game.coins.map((c) => ({ x: c.x, y: c.y, z: c.z, place: c.place })),
    spotCoins: { ...game.spotCoins },
    bowls: game.bowls.map((b) => ({ kind: b.kind, x: b.x, z: b.z, place: b.place, portions: b.portions, fixed: b.fixed })),
    toys: game.toys.map((t) => ({ kind: t.kind, x: t.x, z: t.z, place: t.place })),
    meal: game.meal,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const place = (v: unknown): Place => (v === 'house' || v === 'shop' ? v : 'garden');

function inside(p: Place, rawX: number, z: number): { x: number; z: number } {
  const b = bounds(p);
  // Old saves put the house at x = 400; move those positions to where the house is now.
  const x = p === 'house' && rawX < INTERIOR_X - 500 ? rawX - OLD_INTERIOR_X + INTERIOR_X : rawX;
  return { x: Math.min(b.maxX, Math.max(b.minX, x)), z: Math.min(b.maxZ, Math.max(b.minZ, z)) };
}

/** Build a game from saved data; anything missing or broken falls back to a fresh start. */
export function restore(raw: unknown, seed = 7): Game {
  if (!isObject(raw) || (raw.version !== SAVE_VERSION && raw.version !== 1)) return new Game(seed, 6, loadWardrobe(isObject(raw) ? raw.wardrobe : null));
  const cats = Array.isArray(raw.cats) ? raw.cats.filter(isObject).slice(0, MAX_CATS) : [];
  // Without any saved cats the six starting cats move in again, but everything else is kept.
  const game = new Game(seed, cats.length === 0 ? 6 : 0, loadWardrobe(raw.wardrobe));
  game.coins.length = 0;
  game.drainEvents();
  game.hearts = Math.max(0, Math.floor(num(raw.hearts, 0)));
  game.heartsSinceCoin = Math.max(0, Math.floor(num(raw.heartsSinceCoin, 0))) % heartsPerCoin(game.hearts);
  game.heartsSinceKitten = Math.max(0, Math.floor(num(raw.heartsSinceKitten, 0))) % KITTEN_HEARTS;

  for (const c of cats) {
    const p = place(c.place);
    const pos = inside(p, num(c.x, bounds(p).minX + 5), num(c.z, 0));
    game.addCat({
      name: cleanName(typeof c.name === 'string' ? c.name : '', ''),
      coat: COATS.some((k) => k.id === c.coat) ? (c.coat as string) : COATS[0].id,
      size: clampSize(num(c.size, 1)),
      growth: Math.min(MAX_GROWTH, Math.max(KITTEN_GROWTH, num(c.growth, 1))),
      x: pos.x,
      z: pos.z,
      place: p,
      love: Math.max(0, Math.floor(num(c.love, 0))),
      plump: Math.min(1, Math.max(0, num(c.plump, 0))),
    });
  }

  if (Array.isArray(raw.coins)) {
    for (const c of raw.coins.filter(isObject).slice(0, 200)) {
      const p = place(c.place);
      const pos = inside(p, num(c.x, bounds(p).minX + 5), num(c.z, 0));
      game.pushCoin({ x: pos.x, y: num(c.y, groundY(pos.x) + 0.8), z: pos.z, place: p });
    }
  }
  if (isObject(raw.spotCoins)) {
    for (const s of SPOTS) if (s.searchable) game.spotCoins[s.id] = Math.max(0, Math.min(3, Math.floor(num(raw.spotCoins[s.id], 0))));
  }
  restoreBowls(game, raw.bowls);
  if (Array.isArray(raw.toys)) {
    const kinds = new Set<string>();
    for (const t of raw.toys.filter(isObject)) {
      const kind = t.kind === 'ball' || t.kind === 'mouse' || t.kind === 'yarn' ? t.kind : null;
      // Only toys that were bought, and each one only once.
      if (!kind || kinds.has(kind) || !game.wardrobe.toys.includes(kind)) continue;
      kinds.add(kind);
      const p = place(t.place);
      const pos = inside(p, num(t.x, bounds(p).minX + 5), num(t.z, 0));
      game.pushToy({ kind, x: pos.x, z: pos.z, place: p });
    }
  }
  game.meal = typeof raw.meal === 'string' && recipe(raw.meal) ? raw.meal : null;

  const g = game.girl;
  const girl = isObject(raw.girl) ? raw.girl : {};
  g.place = place(girl.place);
  const pos = inside(g.place, num(girl.x, g.x), num(girl.z, g.z));
  g.x = pos.x;
  g.z = pos.z;
  g.y = groundY(g.x);
  g.boost = Math.max(0, Math.min(MEAL_BOOST_TIME, num(girl.boost, 0)));
  const carried = typeof girl.carrying === 'number' ? game.cats[girl.carrying] : undefined;
  if (carried) {
    g.carrying = carried.id;
    carried.mood = 'carried';
    carried.place = g.place;
  }
  if (Array.isArray(girl.backpack) && game.wardrobe.wearBackpack) {
    for (const i of girl.backpack) {
      const cat = typeof i === 'number' ? game.cats[i] : undefined;
      if (cat?.mood !== 'sit' || g.backpack.length >= BACKPACK_SIZE) continue;
      g.backpack.push(cat.id);
      cat.mood = 'backpack';
      cat.place = g.place;
    }
  }
  game.drainEvents();
  return game;
}

/** Bowls: version 2 lists every bowl; version 1 only knew whether the kitchen bowls were full. */
function restoreBowls(game: Game, raw: unknown): void {
  if (Array.isArray(raw)) {
    for (const b of raw.filter(isObject).slice(0, 20)) {
      const kind = b.kind === 'milk' ? 'milk' : 'food';
      const portions = Math.max(0, Math.min(BOWL_PORTIONS[kind], Math.floor(num(b.portions, 0))));
      if (b.fixed === true) game.kitchenBowl(kind).portions = portions;
      else if (portions > 0) {
        const p = place(b.place);
        const pos = inside(p, num(b.x, bounds(p).minX + 5), num(b.z, 0));
        game.pushBowl({ kind, x: pos.x, z: pos.z, place: p, portions });
      }
    }
  } else if (isObject(raw)) {
    if (raw.milk === true) game.kitchenBowl('milk').portions = BOWL_PORTIONS.milk;
    if (raw.food === true) game.kitchenBowl('food').portions = BOWL_PORTIONS.food;
  }
}
