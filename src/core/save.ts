// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Saving and loading the whole game: where the girl stands, every cat with its name and look,
 * coins lying around, cupboards, bowls and the wardrobe. Plain JSON, validated on the way in so a
 * broken or old save never crashes the game.
 */

import { clampSize, cleanName, COATS } from './cats';
import { Game, KITTEN_GROWTH, MAX_CATS } from './game';
import { loadWardrobe, type Wardrobe } from './shop';
import { bounds, groundY, type Place, SPOTS, type SpotId } from './world';

export const SAVE_VERSION = 1;

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
  girl: { x: number; z: number; place: Place; carrying: number | null };
  cats: SavedCat[];
  coins: { x: number; y: number; z: number; place: Place }[];
  spotCoins: Partial<Record<SpotId, number>>;
  bowls: { milk: boolean; food: boolean };
}

export function snapshot(game: Game): SaveData {
  const g = game.girl;
  return {
    version: SAVE_VERSION,
    wardrobe: structuredClone(game.wardrobe),
    hearts: game.hearts,
    girl: { x: g.x, z: g.z, place: g.place, carrying: g.carrying === null ? null : game.cats.findIndex((c) => c.id === g.carrying) },
    cats: game.cats.map((c) => ({ name: c.name, coat: c.coat, size: c.size, growth: c.growth, x: c.x, z: c.z, place: c.place, love: c.love, plump: c.plump })),
    coins: game.coins.map((c) => ({ x: c.x, y: c.y, z: c.z, place: c.place })),
    spotCoins: { ...game.spotCoins },
    bowls: { ...game.bowls },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const place = (v: unknown): Place => (v === 'house' ? 'house' : 'garden');

function inside(p: Place, x: number, z: number): { x: number; z: number } {
  const b = bounds(p);
  return { x: Math.min(b.maxX, Math.max(b.minX, x)), z: Math.min(b.maxZ, Math.max(b.minZ, z)) };
}

/** Build a game from saved data; anything missing or broken falls back to a fresh start. */
export function restore(raw: unknown, seed = 7): Game {
  if (!isObject(raw) || raw.version !== SAVE_VERSION) return new Game(seed, 6, loadWardrobe(isObject(raw) ? raw.wardrobe : null));
  const cats = Array.isArray(raw.cats) ? raw.cats.filter(isObject).slice(0, MAX_CATS) : [];
  const game = new Game(seed, 0, loadWardrobe(raw.wardrobe));
  game.coins.length = 0;
  game.drainEvents();
  game.hearts = Math.max(0, Math.floor(num(raw.hearts, 0)));

  for (const c of cats) {
    const p = place(c.place);
    const pos = inside(p, num(c.x, bounds(p).minX + 5), num(c.z, 0));
    game.addCat({
      name: cleanName(typeof c.name === 'string' ? c.name : '', ''),
      coat: COATS.some((k) => k.id === c.coat) ? (c.coat as string) : COATS[0].id,
      size: clampSize(num(c.size, 1)),
      growth: Math.min(1, Math.max(KITTEN_GROWTH, num(c.growth, 1))),
      x: pos.x,
      z: pos.z,
      place: p,
      love: Math.max(0, Math.floor(num(c.love, 0))),
      plump: Math.min(1, Math.max(0, num(c.plump, 0))),
    });
  }
  if (game.cats.length === 0) return new Game(seed, 6, game.wardrobe);

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
  if (isObject(raw.bowls)) {
    game.bowls.milk = raw.bowls.milk === true;
    game.bowls.food = raw.bowls.food === true;
  }

  const g = game.girl;
  const girl = isObject(raw.girl) ? raw.girl : {};
  g.place = place(girl.place);
  const pos = inside(g.place, num(girl.x, g.x), num(girl.z, g.z));
  g.x = pos.x;
  g.z = pos.z;
  g.y = groundY(g.x);
  const carried = typeof girl.carrying === 'number' ? game.cats[girl.carrying] : undefined;
  if (carried) {
    g.carrying = carried.id;
    carried.mood = 'carried';
    carried.place = g.place;
  }
  game.drainEvents();
  return game;
}
