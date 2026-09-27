// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { Game, type Input } from '../src/core/game';
import { restore, SAVE_VERSION } from '../src/core/save';
import { BEACH_X, BUILDINGS, BUSHES, groundY, INTERIOR_X, sandiness, SEA_X } from '../src/core/world';

const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
const tap = (g: Game, input: Partial<Input>) => {
  g.step(1 / 60, { ...idle, ...input });
};
const run = (g: Game, seconds: number, input: Partial<Input> = {}) => {
  for (let t = 0; t < seconds; t += 1 / 60) tap(g, input);
};

function lonely(): Game {
  const g = new Game();
  for (const c of g.cats) {
    c.place = 'garden';
    c.x = 540;
    c.z = -3;
    c.mood = 'sit';
    c.timer = 1e9;
  }
  g.girl.x = 200;
  g.girl.y = groundY(200);
  g.girl.z = 0;
  return g;
}

describe('edge cases', () => {
  it('the beach: sand only at the far end, and the ground slopes down into the sea', () => {
    expect(sandiness(100)).toBe(0);
    expect(sandiness(BEACH_X + 10)).toBe(1);
    expect(groundY(SEA_X)).toBeLessThan(0);
    expect(BUSHES.length).toBeGreaterThan(16);
  });

  it('broken ids in arms or backpack do not crash', () => {
    const g = lonely();
    g.wardrobe.gear.push('backpack');
    g.setBackpack(true);
    tap(g, { backpack: true });
    g.girl.carrying = 999;
    tap(g, { backpack: true });
    expect(g.girl.backpack).toEqual([]);
    g.girl.backpack.push(998);
    g.girl.carrying = 997;
    g.girl.x = BUILDINGS[0].x;
    g.girl.y = groundY(g.girl.x);
    g.girl.z = BUILDINGS[0].front - 0.5;
    tap(g, { enter: true });
    expect(g.girl.place).toBe('house');
    tap(g, { backpack: true });
    expect(g.girl.carrying).toBeNull();
    g.girl.backpack.push(996);
    g.setBackpack(false);
    expect(g.girl.backpack).toEqual([]);
    g.wardrobe.gear.length = 0;
    g.setBackpack(true);
    expect(g.wardrobe.wearBackpack).toBe(false);
    expect(() => {
      g.bowls.length = 0;
      g.kitchenBowl('milk');
    }).toThrow();
  });

  it('a cat that is packed but no longer in the backpack sits down', () => {
    const g = lonely();
    const cat = g.cats[0];
    cat.mood = 'backpack';
    tap(g, {});
    expect(cat.mood).toBe('sit');
  });

  it('indoors far from anything there is nothing to use; in the air there is no door', () => {
    const g = lonely();
    g.goHome();
    g.girl.x = INTERIOR_X + 25.5;
    g.girl.z = -2.5;
    expect(g.focus()).toBeNull();
    const h = lonely();
    h.girl.x = BUILDINGS[0].x;
    h.girl.z = BUILDINGS[0].front - 0.5;
    h.girl.onGround = false;
    expect(h.focus()).toBeNull();
  });

  it('restyling only the coat keeps the name', () => {
    const g = lonely();
    const name = g.cats[0].name;
    g.restyleCat(g.cats[0].id, { coat: 'blau' });
    expect(g.cats[0]).toMatchObject({ name, coat: 'blau' });
  });

  it('picking up a toy a cat is playing with ends the game for that cat', () => {
    const g = lonely();
    g.wardrobe.toys.push('yarn');
    const toy = g.pushToy({ kind: 'yarn', x: 200, z: 0, place: 'garden' });
    const cat = g.cats[0];
    cat.toy = toy.id;
    cat.mood = 'play';
    tap(g, { pet: true });
    expect(g.toys).toEqual([]);
    expect(cat.toy).toBeNull();
  });

  it('the mouse runs away to the left from a cat on its right', () => {
    const g = lonely();
    g.wardrobe.toys.push('mouse');
    g.girl.facing = -1;
    const cat = g.cats[0];
    cat.x = 196;
    cat.z = 0;
    cat.mood = 'play';
    tap(g, { toy: true });
    const mouse = g.toys[0];
    mouse.vx = 0;
    mouse.x = cat.x - 1;
    tap(g, {});
    expect(mouse.vx).toBeLessThan(0);
  });

  it('cats walking to a bowl from behind a building come forward first', () => {
    const g = lonely();
    const house = BUILDINGS[0];
    g.girl.x = house.x + house.halfWidth + 3;
    g.girl.y = groundY(g.girl.x);
    g.girl.z = -1;
    g.wardrobe.supplies.food = 1;
    const cat = g.cats[0];
    cat.x = house.x - house.halfWidth - 1;
    cat.z = 2.5;
    cat.timer = 0;
    tap(g, { feed: true });
    run(g, 8);
    expect(cat.z).toBeLessThan(house.front);
    expect(g.hearts).toBeGreaterThan(0);
  });

  it('magic skips hidden and packed cats', () => {
    const g = lonely();
    const [a, b] = g.cats;
    a.x = b.x = 201;
    a.z = b.z = 0;
    a.mood = 'hidden';
    b.mood = 'backpack';
    tap(g, { magic: true });
    expect(g.hearts).toBe(0);
  });

  it('hide-and-seek with only near bushes, a cat picked out of hiding, and stopping mid-game', () => {
    const g = lonely();
    g.girl.x = 30;
    for (const c of g.cats) {
      c.x = 30;
      c.z = 0;
    }
    tap(g, { seek: true });
    tap(g, { seek: true });
    expect(g.cats.every((c) => c.mood === 'sit')).toBe(true);
    tap(g, { seek: true });
    run(g, 3.2);
    const cat = g.cats[0];
    cat.mood = 'sit';
    tap(g, {});
    expect(g.seek?.found).toContain(cat.id);
    g.cats[1].mood = 'walk';
    tap(g, { seek: true });
    expect(g.cats[1].mood).toBe('walk');
  });

  it('saves: duplicate or unowned toys, extra backpack cats and empty bowls are dropped', () => {
    const cats = Array.from({ length: 5 }, (_, i) => ({ name: `K${i}`, place: 'garden', x: 30, z: 0 }));
    const g = restore({
      version: SAVE_VERSION,
      wardrobe: { toys: ['ball'], gear: ['backpack'], wearBackpack: true },
      cats,
      girl: { x: 30, z: 0, carrying: 0, backpack: [0, 1, 2, 3, 4, 'x'] },
      toys: [{ kind: 'ball', x: 31, z: 0 }, { kind: 'ball', x: 32 }, { kind: 'mouse', x: 33 }, { kind: 'rock' }],
      bowls: [{ kind: 'milk', portions: 0, x: 40 }, { kind: 'food', portions: 9, x: 41, place: 'garden' }, 'x'],
    });
    expect(g.toys.map((t) => t.kind)).toEqual(['ball']);
    expect(g.girl.carrying).toBe(g.cats[0].id);
    expect(g.girl.backpack.length).toBe(3);
    expect(g.bowls.filter((b) => !b.fixed).map((b) => b.portions)).toEqual([3]);
    const v1 = restore({ version: 1, cats, bowls: { milk: true, food: false } });
    expect(v1.kitchenBowl('milk').portions).toBe(2);
    expect(v1.kitchenBowl('food').portions).toBe(0);
  });
});
