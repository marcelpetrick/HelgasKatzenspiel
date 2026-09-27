// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { Game, type Input } from '../src/core/game';
import { restore, SAVE_VERSION, snapshot } from '../src/core/save';
import { bounds, INTERIOR_X } from '../src/core/world';

const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };

describe('saving and loading', () => {
  it('round-trips the whole game', () => {
    const g = new Game();
    g.wardrobe.money = 42;
    g.wardrobe.supplies.food = 2;
    g.hearts = 17;
    g.restyleCat(0, { name: 'Wolke', coat: 'lila', size: 1.4 });
    g.cats[1].love = 12;
    g.cats[1].plump = 0.3;
    g.cats[2].growth = 0.6;
    g.kitchenBowl('milk').portions = 2;
    g.wardrobe.toys.push('ball', 'yarn');
    g.wardrobe.gear.push('backpack');
    g.wardrobe.wearBackpack = true;
    g.pushToy({ kind: 'ball', x: 40, z: 0, place: 'garden' });
    g.pushBowl({ kind: 'food', x: 41, z: 0, place: 'garden', portions: 2 });
    g.meal = 'kaesebrot';
    g.heartsSinceCoin = 2;
    g.heartsSinceKitten = 17;
    g.girl.boost = 30;
    g.spotCoins.fridge = 3;
    g.girl.x = 30;
    g.girl.z = 1;
    const cat = g.cats[0];
    cat.place = 'garden';
    cat.x = 31;
    cat.z = 1;
    g.step(1 / 60, { ...idle, carry: true });
    expect(g.girl.carrying).toBe(cat.id);

    const data = JSON.parse(JSON.stringify(snapshot(g))) as unknown;
    const back = restore(data);
    expect(back.money).toBe(42);
    expect(back.wardrobe.supplies.food).toBe(2);
    expect(back.hearts).toBe(17);
    expect(back.cats.length).toBe(g.cats.length);
    expect(back.cats[0]).toMatchObject({ name: 'Wolke', coat: 'lila', size: 1.4, mood: 'carried' });
    expect(back.cats[1]).toMatchObject({ love: 12, plump: 0.3 });
    expect(back.cats[2].growth).toBe(0.6);
    expect(back.coins.length).toBe(g.coins.length);
    expect(back.kitchenBowl('milk').portions).toBe(2);
    expect(back.kitchenBowl('food').portions).toBe(0);
    expect(back.bowls.find((b) => !b.fixed)).toMatchObject({ kind: 'food', x: 41, portions: 2 });
    expect(back.toys.map((t) => t.kind)).toEqual(['ball']);
    expect(back.meal).toBe('kaesebrot');
    expect(back.heartsSinceCoin).toBe(2);
    expect(back.heartsSinceKitten).toBe(17);
    expect(back.girl.boost).toBeCloseTo(30, 1);
    expect(back.spotCoins.fridge).toBe(3);
    expect(back.girl).toMatchObject({ x: 30, place: 'garden', carrying: back.cats[0].id });
    expect(back.drainEvents()).toEqual([]);
  });

  it('keeps a girl inside the house inside the house', () => {
    const g = new Game();
    g.girl.place = 'house';
    g.girl.x = INTERIOR_X + 10;
    g.girl.z = 0;
    const back = restore(snapshot(g));
    expect(back.girl.place).toBe('house');
    expect(back.girl.x).toBeCloseTo(INTERIOR_X + 10);
  });

  it('starts fresh from nothing, rubbish or an unknown version, keeping an old wardrobe', () => {
    for (const raw of [null, 'x', 42, { version: 99 }, { version: SAVE_VERSION, cats: [] }]) {
      const g = restore(raw);
      expect(g.cats.length).toBe(6);
      expect(g.money).toBe(0);
    }
    const old = restore({ wardrobe: { money: 9 } });
    expect(old.money).toBe(9);
    expect(restore({ version: SAVE_VERSION, cats: 'nope', wardrobe: { money: 3 } }).money).toBe(3);
  });

  it('repairs broken values instead of crashing', () => {
    const g = restore({
      version: SAVE_VERSION,
      hearts: -5,
      wardrobe: null,
      girl: { x: 'far', z: 99, place: 'moon', carrying: 7 },
      cats: [{ name: 42, coat: 'kariert', size: 99, growth: 0, x: -50, z: -50, place: 'house', love: 'lots', plump: 5 }, 'not a cat', { name: 'Keks' }],
      coins: [{ x: 1e9, z: 0, place: 'garden' }, 'x'],
      spotCoins: { fridge: 99, cupboard: -1, table: 5 },
      bowls: { milk: 'yes', food: true },
      meal: 'gift',
      toys: [{ kind: 'ball', x: 5 }],
    });
    expect(g.hearts).toBe(0);
    expect(g.cats.length).toBe(2);
    const [a, b] = g.cats;
    expect(a).toMatchObject({ coat: 'orange', size: 1.6, growth: 0.5, place: 'house', love: 0, plump: 1 });
    expect(a.name.length).toBeGreaterThan(0);
    expect(a.x).toBe(bounds('house').minX);
    expect(b.name).toBe('Keks');
    expect(b.place).toBe('garden');
    expect(g.coins.length).toBe(1);
    expect(g.coins[0].x).toBe(bounds('garden').maxX);
    expect(g.spotCoins.fridge).toBe(3);
    expect(g.spotCoins.cupboard).toBe(0);
    expect(g.spotCoins.table).toBe(0);
    expect(g.kitchenBowl('milk').portions).toBe(0);
    expect(g.kitchenBowl('food').portions).toBe(3);
    expect(g.meal).toBeNull();
    expect(g.toys).toEqual([]);
    expect(g.girl.place).toBe('garden');
    expect(g.girl.z).toBe(bounds('garden').maxZ);
    expect(g.girl.carrying).toBeNull();
  });

  it('copes with missing parts', () => {
    const g = restore({ version: SAVE_VERSION, cats: [{}] });
    expect(g.cats.length).toBe(1);
    expect(g.coins.length).toBe(0);
    expect(g.girl.place).toBe('garden');
  });

  it('keeps cats in the backpack, and moves an old save’s house to where the house is now', () => {
    const g = new Game();
    g.wardrobe.gear.push('backpack');
    g.wardrobe.wearBackpack = true;
    g.girl.x = 30;
    for (const c of g.cats.slice(0, 2)) {
      c.place = 'garden';
      c.x = 31;
      c.z = g.girl.z;
      c.mood = 'sit';
      g.step(1 / 60, { ...idle, carry: true });
      g.step(1 / 60, { ...idle, backpack: true });
    }
    expect(g.girl.backpack.length).toBe(2);
    const back = restore(JSON.parse(JSON.stringify(snapshot(g))));
    expect(back.girl.backpack.length).toBe(2);
    expect(back.cats.filter((c) => c.mood === 'backpack').length).toBe(2);

    const old = restore({
      version: 1,
      cats: [{ name: 'Alt', place: 'house', x: 410, z: 0 }],
      girl: { place: 'house', x: 420, z: 0 },
      bowls: [{ kind: 'milk', fixed: true, portions: 2 }],
    });
    expect(old.cats[0].x).toBeCloseTo(INTERIOR_X + 10);
    expect(old.girl.x).toBeCloseTo(INTERIOR_X + 20);
    expect(old.kitchenBowl('milk').portions).toBe(2);
  });
});
