// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import {
  CAT_PRICE,
  type Cat,
  EAT_TIME,
  FLY_CEILING,
  Game,
  type GameEvent,
  HEARTS_PER_COIN,
  HOUSE_FLY_CEILING,
  type Input,
  JUMP_SPEED,
  KITTEN_HEARTS,
  MAX_CATS,
  PET_COOLDOWN,
  SPOT_REFILL_TIME,
  YARN_PLAY_TIME,
} from '../src/core/game';
import { BUILDINGS, groundY, HOUSE_ENTRY, INTERIOR_X, maxZAt, SHOP_X, spot, WORLD_MAX_X } from '../src/core/world';

const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
const run = (g: Game, seconds: number, input: Partial<Input> = {}) => {
  for (let t = 0; t < seconds; t += 1 / 60) g.step(1 / 60, { ...idle, ...input });
};
const tap = (g: Game, input: Partial<Input>) => {
  g.step(1 / 60, { ...idle, ...input });
};
const types = (events: GameEvent[]) => events.map((e) => e.type);

/** Park every cat far away and keep them still, so tests control who is near. */
function quiet(g: Game): void {
  for (const c of g.cats) {
    c.place = 'garden';
    c.x = WORLD_MAX_X - 0.5;
    c.z = -3;
    c.mood = 'sit';
    c.timer = 1e9;
  }
}

/** Put one cat right next to the girl and keep it sitting. */
function beside(g: Game, cat: Cat, dx = 1): Cat {
  cat.place = g.girl.place;
  cat.x = g.girl.x + dx;
  cat.z = g.girl.z;
  cat.y = groundY(cat.x);
  cat.mood = 'sit';
  cat.timer = 1e9;
  return cat;
}

function goInside(g: Game): void {
  const house = BUILDINGS[0];
  g.girl.x = house.x;
  g.girl.z = house.front - 0.5;
  tap(g, { enter: true });
}

describe('moving around', () => {
  it('walks right and stays on the ground', () => {
    const g = new Game();
    const x0 = g.girl.x;
    run(g, 1, { right: true });
    expect(g.girl.x).toBeGreaterThan(x0 + 5);
    expect(g.girl.y).toBeCloseTo(groundY(g.girl.x));
    expect(g.girl.facing).toBe(1);
    run(g, 0.2, { left: true });
    expect(g.girl.facing).toBe(-1);
  });

  it('walks further back and to the front, within the garden', () => {
    const g = new Game();
    g.girl.x = 20;
    run(g, 3, { up: true });
    expect(g.girl.z).toBeCloseTo(maxZAt('garden', 20));
    run(g, 5, { down: true });
    expect(g.girl.z).toBeCloseTo(-3.2);
  });

  it('cannot walk into a building’s wall', () => {
    const g = new Game();
    g.girl.x = BUILDINGS[0].x + 4;
    run(g, 3, { up: true });
    expect(g.girl.z).toBeLessThan(BUILDINGS[0].front);
    expect(g.girl.place).toBe('garden');
  });

  it('never leaves the world', () => {
    const g = new Game();
    run(g, 30, { right: true });
    expect(g.girl.x).toBe(WORLD_MAX_X);
  });

  it('jumps and lands again', () => {
    const g = new Game();
    tap(g, { jump: true });
    expect(g.girl.onGround).toBe(false);
    expect(g.girl.vy).toBeLessThanOrEqual(JUMP_SPEED);
    run(g, 2);
    expect(g.girl.onGround).toBe(true);
    expect(types(g.drainEvents())).toEqual(expect.arrayContaining(['jump', 'land']));
  });

  it('flies up while Space is held, but not past the ceiling, and floats down', () => {
    const g = new Game();
    tap(g, { jump: true, fly: true });
    run(g, 5, { fly: true });
    const floor = groundY(g.girl.x);
    expect(g.girl.y).toBeGreaterThan(floor + FLY_CEILING - 1);
    expect(g.girl.y).toBeLessThan(floor + FLY_CEILING + 0.5);
    run(g, 0.5);
    expect(g.girl.vy).toBeGreaterThanOrEqual(-3.6);
    run(g, 5);
    expect(g.girl.onGround).toBe(true);
  });

  it('flies lower indoors', () => {
    const g = new Game();
    goInside(g);
    tap(g, { jump: true, fly: true });
    run(g, 4, { fly: true });
    expect(g.girl.y).toBeLessThan(HOUSE_FLY_CEILING + 0.5);
  });
});

describe('doors and the house', () => {
  it('walking up into the front door goes inside, and the exit leads back out', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = BUILDINGS[0].x;
    g.girl.z = 0;
    run(g, 1.5, { up: true });
    expect(g.girl.place).toBe('house');
    expect(g.drainEvents()).toContainEqual({ type: 'place', place: 'house' });
    expect(g.focus()).toEqual({ kind: 'spot', spot: spot('exit') });
    tap(g, { pet: true });
    expect(g.girl.place).toBe('garden');
    expect(g.girl.x).toBeCloseTo(BUILDINGS[0].x);
  });

  it('↑ at the exit also leads out, but not from elsewhere in the house', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    g.girl.x = INTERIOR_X + 5;
    tap(g, { enter: true });
    expect(g.girl.place).toBe('house');
    g.girl.x = HOUSE_ENTRY.x;
    tap(g, { enter: true });
    expect(g.girl.place).toBe('garden');
  });

  it('the shop door opens the shop instead of going in', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = SHOP_X;
    g.girl.z = 1;
    expect(g.focus()?.kind).toBe('door');
    tap(g, { pet: true });
    expect(types(g.drainEvents())).toContain('openShop');
    expect(g.girl.place).toBe('garden');
  });

  it('↑ away from any door does nothing', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 20;
    tap(g, { enter: true });
    tap(g, { pet: true });
    expect(g.girl.place).toBe('garden');
    expect(g.focus()).toBeNull();
  });

  it('a carried cat comes along through the door', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    tap(g, { carry: true });
    goInside(g);
    expect(cat.place).toBe('house');
    run(g, 0.1);
    expect(cat.x).toBeCloseTo(g.girl.x);
  });
});

describe('petting, feeding and magic', () => {
  it('pets a nearby cat: hearts, happiness, cooldown', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    tap(g, { pet: true });
    expect(g.hearts).toBe(1);
    expect(cat.mood).toBe('happy');
    expect(cat.love).toBe(1);
    tap(g, { pet: true });
    expect(g.hearts).toBe(1);
    run(g, PET_COOLDOWN);
    tap(g, { pet: true });
    expect(g.hearts).toBe(2);
    run(g, 3);
    expect(cat.mood).toBe('sit');
  });

  it('does nothing when no cat is near', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 20;
    tap(g, { pet: true, feed: true, treat: true, carry: true });
    expect(g.hearts).toBe(0);
    expect(g.girl.carrying).toBeNull();
  });

  it('happy cats drop coins in the garden that can be collected', () => {
    const g = new Game();
    quiet(g);
    g.coins.length = 0;
    const cat = beside(g, g.cats[0]);
    for (let i = 0; i < HEARTS_PER_COIN; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.05);
    }
    expect(g.coins.length).toBe(1);
    const coin = g.coins[0];
    expect(coin.place).toBe('garden');
    g.girl.x = coin.x;
    g.girl.z = coin.z;
    tap(g, {});
    expect(g.money).toBe(1);
    expect(g.coins.length).toBe(0);
    expect(cat.love).toBe(HEARTS_PER_COIN);
  });

  it('feeding uses up food, gives hearts and makes the cat rounder', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.supplies.food = 1;
    const cat = beside(g, g.cats[0]);
    tap(g, { feed: true });
    expect(g.wardrobe.supplies.food).toBe(0);
    expect(g.hearts).toBe(3);
    expect(cat.plump).toBeGreaterThan(0);
    expect(types(g.drainEvents())).toContain('feed');
    tap(g, { feed: true });
    expect(g.hearts).toBe(3);
  });

  it('treats give two hearts even right after petting', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.supplies.treat = 1;
    beside(g, g.cats[0]);
    tap(g, { pet: true });
    tap(g, { treat: true });
    expect(g.hearts).toBe(3);
  });

  it('milk is a drink bought in the shop: two hearts', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.supplies.milk = 1;
    const cat = beside(g, g.cats[0]);
    tap(g, { milk: true });
    expect(g.hearts).toBe(2);
    expect(g.wardrobe.supplies.milk).toBe(0);
    expect(cat.plump).toBeCloseTo(0.05);
  });

  it('plumpness is capped at 1', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.supplies.food = 20;
    const cat = beside(g, g.cats[0]);
    for (let i = 0; i < 20; i++) tap(g, { feed: true });
    expect(cat.plump).toBe(1);
  });

  it('magic delights every cat in range and has a cooldown', () => {
    const g = new Game();
    quiet(g);
    for (const c of g.cats) beside(g, c, 2);
    tap(g, { magic: true });
    expect(g.hearts).toBe(g.cats.length);
    expect(types(g.drainEvents())).toContain('magic');
    run(g, 0.6);
    tap(g, { magic: true });
    expect(g.hearts).toBe(g.cats.length);
  });
});

describe('carrying a cat', () => {
  it('picks up the nearest cat, carries it while flying, and puts it down', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    tap(g, { carry: true });
    expect(g.girl.carrying).toBe(cat.id);
    expect(cat.mood).toBe('carried');
    tap(g, { jump: true, fly: true });
    run(g, 1, { fly: true, right: true });
    expect(cat.x).toBeCloseTo(g.girl.x);
    expect(cat.y).toBeCloseTo(g.girl.y);
    run(g, 5);
    tap(g, { carry: true });
    expect(g.girl.carrying).toBeNull();
    expect(cat.mood).toBe('sit');
    expect(cat.y).toBeCloseTo(groundY(cat.x));
    expect(types(g.drainEvents())).toEqual(expect.arrayContaining(['carry', 'drop']));
  });

  it('the carried cat can be cuddled, and other cats or doors come first', () => {
    const g = new Game();
    quiet(g);
    const carried = beside(g, g.cats[0]);
    tap(g, { carry: true });
    expect(g.focus()).toEqual({ kind: 'cat', cat: carried });
    tap(g, { pet: true });
    expect(g.hearts).toBe(1);
    expect(carried.mood).toBe('carried');
    const other = beside(g, g.cats[1], 1.5);
    expect(g.focus()).toEqual({ kind: 'cat', cat: other });
    other.x = 500;
    g.girl.x = BUILDINGS[0].x;
    g.girl.z = BUILDINGS[0].front - 0.5;
    expect(g.focus()?.kind).toBe('door');
  });

  it('a cat that is no longer held sits down', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    tap(g, { carry: true });
    g.girl.carrying = null;
    tap(g, {});
    expect(cat.mood).toBe('sit');
    g.girl.carrying = 999;
    tap(g, { carry: true });
    expect(g.girl.carrying).toBeNull();
  });
});

describe('the kitchen and the cupboards', () => {
  it('bowls: milk is free, food needs food, cats come to eat and leave a coin', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    const bowls = spot('bowls');
    g.girl.x = bowls.x;
    g.girl.z = bowls.z;
    g.drainEvents();
    tap(g, { pet: true });
    expect(g.bowls).toEqual({ milk: true, food: false });
    expect(g.drainEvents()).toContainEqual({ type: 'bowls', milk: true, food: false, noFood: true });
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'bowls', milk: false, food: false, noFood: true });
    g.wardrobe.supplies.food = 1;
    tap(g, { pet: true });
    expect(g.bowls).toEqual({ milk: true, food: true });
    expect(g.wardrobe.supplies.food).toBe(0);
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'bowls', milk: false, food: false, noFood: false });

    // Two cats in the house walk over and eat.
    g.girl.x = INTERIOR_X + 40;
    const [a, b] = g.cats;
    for (const c of [a, b]) {
      c.place = 'house';
      c.x = INTERIOR_X + 30;
      c.z = 0;
      c.timer = 0;
    }
    run(g, 0.5);
    expect([a.mood, b.mood].sort()).toEqual(['toBowl', 'toBowl']);
    run(g, 12 + EAT_TIME);
    expect(g.bowls).toEqual({ milk: false, food: false });
    expect(g.hearts).toBeGreaterThanOrEqual(5);
    expect(a.plump + b.plump).toBeGreaterThan(0.15);
    expect(g.coins.filter((c) => c.place === 'house').length).toBeGreaterThanOrEqual(2);
  });

  it('a cat on its way to the bowl can be distracted by petting or picked up', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    g.bowls.milk = true;
    const cat = g.cats[0];
    cat.place = 'house';
    cat.x = g.girl.x + 1;
    cat.z = g.girl.z;
    cat.timer = 0;
    run(g, 0.1);
    expect(cat.mood).toBe('toBowl');
    tap(g, { pet: true });
    expect(cat.mood).toBe('happy');
    expect(cat.bowl).toBeNull();
    run(g, 0.2);
    tap(g, { carry: true });
    expect(cat.mood).toBe('carried');
  });

  it('cupboards hold coins, refill over time, and the wardrobe opens the clothes', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    const cupboard = spot('cupboard');
    g.girl.x = cupboard.x;
    g.girl.z = cupboard.z;
    g.drainEvents();
    tap(g, { pet: true });
    expect(g.money).toBe(1);
    expect(g.drainEvents()).toContainEqual({ type: 'search', spot: 'cupboard', found: 1 });
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'search', spot: 'cupboard', found: 0 });
    run(g, SPOT_REFILL_TIME * 20);
    const total = Object.values(g.spotCoins).reduce((s, n) => s + n, 0);
    expect(total).toBe(4 * 3);
    const wardrobe = spot('wardrobe');
    g.girl.x = wardrobe.x;
    tap(g, { pet: true });
    expect(types(g.drainEvents())).toEqual(expect.arrayContaining(['search', 'openWardrobe']));
  });

  it('things you cannot use do nothing, and happy cats indoors put coins on the table or in cupboards', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    for (const id of ['table', 'bed', 'bathtub'] as const) {
      const s = spot(id);
      g.girl.x = s.x;
      g.girl.z = s.z;
      expect(g.focus()).toEqual({ kind: 'spot', spot: s });
      tap(g, { pet: true });
    }
    expect(g.money).toBe(0);
    const cat = beside(g, g.cats[0]);
    for (const k of Object.keys(g.spotCoins)) g.spotCoins[k as keyof typeof g.spotCoins] = 0;
    for (let i = 0; i < 30; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.02);
      cat.x = g.girl.x + 1;
    }
    expect(g.coins.filter((c) => c.place === 'house').length).toBe(5);
    expect(Object.values(g.spotCoins).some((n) => n > 0)).toBe(true);
  });
});

describe('the yarn ball', () => {
  it('needs to be owned, rolls, gets chased and is picked up again', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 20;
    tap(g, { yarn: true });
    expect(g.yarn).toBeNull();
    g.wardrobe.hasYarn = true;
    const cat = beside(g, g.cats[0], 6);
    cat.plump = 0.5;
    tap(g, { yarn: true });
    expect(g.yarn).not.toBeNull();
    const x0 = g.yarn?.x ?? 0;
    run(g, 0.5);
    expect(g.yarn?.x).toBeGreaterThan(x0);
    expect(['play', 'happy']).toContain(cat.mood);
    run(g, YARN_PLAY_TIME);
    expect(g.hearts).toBeGreaterThan(0);
    expect(cat.plump).toBeLessThan(0.5);
    run(g, 40);
    expect(g.yarn).toBeNull();
    expect(g.cats.every((c) => c.mood !== 'play')).toBe(true);
  });

  it('bounces off the edge of the world', () => {
    const g = new Game();
    quiet(g);
    for (const c of g.cats) c.x = 2;
    g.wardrobe.hasYarn = true;
    g.girl.x = WORLD_MAX_X - 1;
    tap(g, { yarn: true });
    run(g, 1);
    expect(g.yarn?.x).toBeLessThanOrEqual(WORLD_MAX_X);
    expect(g.yarn?.vx).toBeLessThanOrEqual(0);
  });
});

describe('the cats', () => {
  it('wander in both directions but stay inside their place', () => {
    const g = new Game(3);
    run(g, 120);
    for (const c of g.cats) {
      expect(c.y).toBeCloseTo(groundY(c.x));
      expect(c.z).toBeLessThanOrEqual(maxZAt(c.place, c.x) + 1e-9);
    }
    expect(g.cats.some((c) => c.place === 'house')).toBe(true);
  });

  it('are pushed back from the edges', () => {
    const g = new Game();
    quiet(g);
    const [a, b] = g.cats;
    a.x = 2.4;
    a.dir = -1;
    b.x = WORLD_MAX_X - 0.4;
    b.dir = 1;
    for (const c of [a, b]) {
      c.mood = 'walk';
      c.timer = 5;
      c.z = 0;
      c.dz = 1;
    }
    run(g, 0.5);
    expect(a.dir).toBe(1);
    expect(b.dir).toBe(-1);
  });

  it('can be restyled with a name, a coat and a size', () => {
    const g = new Game();
    const cat = g.cats[0];
    g.restyleCat(cat.id, { name: '  Wuschel  ', coat: 'gruen', size: 9 });
    expect(cat.name).toBe('Wuschel');
    expect(cat.coat).toBe('gruen');
    expect(cat.size).toBe(1.6);
    g.restyleCat(cat.id, { name: '   ', coat: 'kariert', size: Number.NaN });
    expect(cat.name).toBe('Wuschel');
    expect(cat.coat).toBe('gruen');
    expect(cat.size).toBe(1.6);
    g.restyleCat(999, { name: 'Niemand' });
  });

  it('a new cat costs 100 coins, and there is a limit', () => {
    const g = new Game();
    expect(g.buyCat()).toBeNull();
    g.wardrobe.money = CAT_PRICE + 5;
    const cat = g.buyCat();
    expect(cat).not.toBeNull();
    expect(g.money).toBe(5);
    expect(g.cats.length).toBe(7);
    expect(new Set(g.cats.map((c) => c.name)).size).toBe(7);
    g.wardrobe.money = 1e6;
    while (g.buyCat());
    expect(g.cats.length).toBe(MAX_CATS);
  });

  it('when enough cats are happy, a kitten is born and grows up with love', () => {
    const g = new Game();
    quiet(g);
    for (const c of g.cats) c.love = 20;
    const cat = beside(g, g.cats[0]);
    beside(g, g.cats[1], -1);
    for (let i = 0; i < KITTEN_HEARTS; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.02);
      cat.x = g.girl.x + 1;
    }
    expect(g.cats.length).toBe(7);
    const kitten = g.cats[6];
    expect(kitten.growth).toBe(0.5);
    expect(types(g.drainEvents())).toContain('kitten');
    quiet(g);
    beside(g, kitten);
    for (let i = 0; i < 30; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.02);
      kitten.x = g.girl.x + 1;
    }
    expect(kitten.growth).toBe(1);
  });

  it('no kitten without two loving grown-ups, or with too few cats', () => {
    const g = new Game(7, 3);
    quiet(g);
    for (const c of g.cats) c.love = 50;
    const cat = beside(g, g.cats[0]);
    for (let i = 0; i < KITTEN_HEARTS; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.02);
      cat.x = g.girl.x + 1;
    }
    expect(g.cats.length).toBe(3);
    const h = new Game();
    quiet(h);
    const lonely = beside(h, h.cats[0]);
    for (let i = 0; i < KITTEN_HEARTS; i++) {
      tap(h, { pet: true });
      run(h, PET_COOLDOWN + 0.02);
      lonely.x = h.girl.x + 1;
    }
    expect(h.cats.length).toBe(6);
  });
});
