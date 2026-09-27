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
  heartsPerCoin,
  MAX_GROWTH,
  HOUSE_FLY_CEILING,
  type Input,
  JUMP_SPEED,
  KITTEN_HEARTS,
  MAX_CATS,
  PET_COOLDOWN,
  SPOT_REFILL_TIME,
  TOY_PLAY_TIME,
  BOWL_PORTIONS,
  SUPPLY_HEARTS,
  MOUSE_DASHES,
  FEATHER_COOLDOWN,
  SEEK_COUNT,
  SEEK_MIN_DISTANCE,
  SEEK_COINS_PER_CAT,
} from '../src/core/game';
import { MEAL_BOOST_TIME } from '../src/core/kitchen';
import { BUILDINGS, groundY, HOUSE_COIN_SPOTS, HOUSE_ENTRY, INTERIOR_X, maxZAt, SHELVES, SHOP_ENTRY, SHOP_X, spot, WORLD_MAX_X } from '../src/core/world';

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
    g.girl.x = WORLD_MAX_X - 20;
    run(g, 10, { right: true });
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

  it('walks into the shop, where each shelf opens its page of the shop, and out again', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    tap(g, { carry: true });
    g.girl.x = SHOP_X;
    g.girl.z = 1;
    expect(g.focus()?.kind).toBe('door');
    tap(g, { pet: true });
    expect(g.girl).toMatchObject({ place: 'shop', x: SHOP_ENTRY.x });
    expect(cat.place).toBe('shop');
    expect(types(g.drainEvents())).toContain('place');
    for (const shelf of SHELVES.filter((s) => s.id !== 'exit')) {
      g.girl.x = shelf.x;
      g.girl.z = shelf.z;
      expect(g.focus()).toEqual({ kind: 'shelf', shelf });
      tap(g, { pet: true });
      expect(g.drainEvents()).toContainEqual({ type: 'openShop', tab: shelf.id });
    }
    g.girl.x = 3000 + 12.5;
    tap(g, { enter: true });
    expect(g.girl.place).toBe('garden');
    expect(Math.abs(g.girl.x - SHOP_X)).toBeLessThan(1);
    // Enter on the door works too.
    g.girl.z = 1;
    tap(g, { pet: true });
    expect(g.girl.place).toBe('shop');
    const exit = SHELVES.find((s) => s.id === 'exit');
    g.girl.x = exit?.x ?? 0;
    g.girl.z = exit?.z ?? 0;
    tap(g, { pet: true });
    expect(g.girl.place).toBe('garden');
  });

  it('in the shop she flies no higher than indoors, and happy cats drop coins on the floor', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = SHOP_X;
    g.girl.z = 1;
    tap(g, { enter: true });
    expect(g.girl.place).toBe('shop');
    g.girl.x = SHOP_ENTRY.x - 4;
    const cat = beside(g, g.cats[0]);
    g.coins.length = 0;
    const money = g.money;
    for (let i = 0; i < HEARTS_PER_COIN; i++) {
      tap(g, { pet: true });
      run(g, PET_COOLDOWN + 0.05);
      cat.x = g.girl.x + 1;
    }
    expect(g.coins.filter((c) => c.place === 'shop').length + g.money - money).toBe(1);
    tap(g, { jump: true, fly: true });
    run(g, 5, { fly: true });
    expect(g.girl.y).toBeLessThan(HOUSE_FLY_CEILING + 0.5);
    // Away from the door, ↑ does not leave the shop.
    g.girl.x = SHOP_ENTRY.x - 6;
    run(g, 5);
    tap(g, { enter: true });
    expect(g.girl.place).toBe('shop');
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

  it('1 puts a bowl of food down: the cats come running, eat, get rounder, and the empty bowl goes', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 200;
    tap(g, { feed: true });
    expect(types(g.drainEvents())).toContain('noSupply');
    g.wardrobe.supplies.food = 1;
    const cats = g.cats.slice(0, 4).map((c, i) => beside(g, c, 5 + i * 3));
    for (const c of cats) c.timer = 0;
    tap(g, { feed: true });
    expect(g.wardrobe.supplies.food).toBe(0);
    const bowl = g.bowls.find((b) => !b.fixed);
    expect(bowl).toMatchObject({ kind: 'food', portions: BOWL_PORTIONS.food, place: 'garden' });
    run(g, 0.3);
    expect(cats.filter((c) => c.mood === 'toBowl').length).toBe(4);
    run(g, 20);
    expect(g.bowls.some((b) => !b.fixed)).toBe(false);
    expect(g.hearts).toBe(3 * SUPPLY_HEARTS.food);
    expect(cats.filter((c) => c.plump > 0).length).toBe(3);
    expect(types(g.drainEvents())).toEqual(expect.arrayContaining(['bowlPlaced', 'eatStart', 'feed', 'bowlGone']));
  });

  it('hungry cats that find the bowl taken wait, and sometimes squabble', () => {
    let squabbles = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const g = new Game(seed);
      quiet(g);
      g.girl.x = 200;
      g.wardrobe.supplies.food = 1;
      const [a, b] = [beside(g, g.cats[0], 3), beside(g, g.cats[1], 3.2)];
      a.timer = b.timer = 0;
      tap(g, { feed: true });
      run(g, 1.5);
      expect([a.mood, b.mood]).toContain('eat');
      expect(['wait', 'squabble']).toContain(a.mood === 'eat' ? b.mood : a.mood);
      squabbles += g.drainEvents().filter((e) => e.type === 'squabble').length;
      // Both get their turn; the bowl is licked clean.
      run(g, 30);
      expect(g.bowls.some((k) => !k.fixed)).toBe(false);
      expect(g.hearts).toBe(BOWL_PORTIONS.food * SUPPLY_HEARTS.food);
    }
    expect(squabbles).toBeGreaterThan(0);
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

  it('4 puts down a bowl of milk: two portions, two hearts each', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 200;
    g.wardrobe.supplies.milk = 1;
    const cat = beside(g, g.cats[0], 2);
    cat.timer = 0;
    tap(g, { milk: true });
    expect(g.bowls.find((b) => !b.fixed)?.portions).toBe(BOWL_PORTIONS.milk);
    run(g, 8);
    expect(g.hearts).toBe(2 * SUPPLY_HEARTS.milk);
    expect(cat.plump).toBeCloseTo(0.1);
  });

  it('treats from the hand make a cat rounder, up to a point', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.supplies.treat = 30;
    const cat = beside(g, g.cats[0]);
    for (let i = 0; i < 30; i++) tap(g, { treat: true });
    expect(cat.plump).toBe(1);
    tap(g, { treat: true });
    g.wardrobe.supplies.treat = 0;
    tap(g, { treat: true });
    expect(types(g.drainEvents())).toContain('noSupply');
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
    const portions = () => [g.kitchenBowl('milk').portions, g.kitchenBowl('food').portions];
    tap(g, { pet: true });
    expect(portions()).toEqual([2, 0]);
    expect(g.drainEvents()).toContainEqual({ type: 'bowls', milk: true, food: false, noFood: true });
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'bowls', milk: false, food: false, noFood: true });
    g.wardrobe.supplies.food = 1;
    tap(g, { pet: true });
    expect(portions()).toEqual([2, 3]);
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
    run(g, 30 + 5 * EAT_TIME);
    expect(portions()).toEqual([0, 0]);
    expect(g.hearts).toBe(2 * 2 + 3 * 3);
    expect(a.plump + b.plump).toBeGreaterThan(0.15);
    expect(g.coins.filter((c) => c.place === 'house').length).toBeGreaterThanOrEqual(2);
  });

  it('a cat on its way to the bowl can be distracted by petting or picked up', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    g.kitchenBowl('milk').portions = 2;
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
    expect(g.coins.filter((c) => c.place === 'house').length).toBe(HOUSE_COIN_SPOTS.length);
    expect(Object.values(g.spotCoins).some((n) => n > 0)).toBe(true);
  });
});

describe('toys', () => {
  it('need to be owned; thrown ones roll, get chased, stay on the floor and are picked up with Enter', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 200;
    tap(g, { toy: true, feather: true });
    expect(g.drainEvents()).toEqual(expect.arrayContaining([{ type: 'noToy', reason: 'none' }]));
    g.wardrobe.toys.push('yarn', 'ball');
    const cat = beside(g, g.cats[0], 6);
    cat.plump = 0.5;
    tap(g, { toy: true });
    tap(g, { toy: true });
    tap(g, { toy: true });
    expect(g.toys.map((t) => t.kind).sort()).toEqual(['ball', 'yarn']);
    expect(g.drainEvents()).toContainEqual({ type: 'noToy', reason: 'lying' });
    run(g, 0.5);
    expect(['play', 'happy']).toContain(cat.mood);
    run(g, TOY_PLAY_TIME);
    expect(g.hearts).toBeGreaterThan(0);
    expect(cat.plump).toBeLessThan(0.5);
    run(g, 30);
    expect(g.toys.length).toBe(2);
    const toy = g.toys[0];
    quiet(g);
    g.girl.x = toy.x;
    g.girl.z = toy.z;
    expect(g.focus()).toEqual({ kind: 'toy', toy });
    tap(g, { pet: true });
    expect(g.toys.length).toBe(1);
  });

  it('the ball bounces off the end of the world; the mouse darts away from cats', () => {
    const g = new Game();
    quiet(g);
    g.wardrobe.toys.push('ball', 'mouse');
    g.girl.x = WORLD_MAX_X - 1;
    tap(g, { toy: true });
    run(g, 0.5);
    const ball = g.toys[0];
    expect(ball.x).toBeLessThanOrEqual(WORLD_MAX_X);
    expect(ball.vx).toBeLessThanOrEqual(0);
    g.girl.x = 200;
    g.girl.facing = 1;
    const cat = beside(g, g.cats[0], 3);
    tap(g, { toy: true });
    const mouse = g.toys[1];
    run(g, 6);
    expect(mouse.kind).toBe('mouse');
    expect(mouse.dashes).toBeLessThan(MOUSE_DASHES);
    expect(cat.love).toBeGreaterThan(0);
  });

  it('cats play with toys lying around all by themselves', () => {
    const g = new Game(11);
    quiet(g);
    g.wardrobe.toys.push('yarn');
    const toy = g.pushToy({ kind: 'yarn', x: 200, z: 0, place: 'garden' });
    const cat = g.cats[0];
    cat.x = 202;
    cat.z = 0;
    cat.timer = 0;
    let played = false;
    for (let i = 0; i < 600 && !played; i++) {
      tap(g, {});
      played = cat.mood === 'play' && cat.toy === toy.id;
      if (cat.mood === 'sit' && cat.timer > 5) cat.timer = 0;
    }
    expect(played).toBe(true);
    run(g, 10);
    expect(cat.toy).toBeNull();
  });

  it('the feather wand makes nearby cats leap, with a cooldown', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 200;
    g.wardrobe.toys.push('feather');
    beside(g, g.cats[0], 2);
    beside(g, g.cats[1], -3);
    tap(g, { feather: true });
    expect(g.hearts).toBe(2);
    tap(g, { feather: true });
    expect(g.hearts).toBe(2);
    run(g, FEATHER_COOLDOWN);
    tap(g, { feather: true });
    expect(g.hearts).toBe(4);
  });
});

describe('the backpack', () => {
  it('has to be bought and worn; R packs the carried cat, up to three, and unpacks them again', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = 200;
    const cats = g.cats.slice(0, 4);
    tap(g, { backpack: true });
    expect(types(g.drainEvents())).toContain('noBackpack');
    g.wardrobe.gear.push('backpack');
    g.setBackpack(true);
    for (const c of cats) {
      beside(g, c);
      tap(g, { carry: true });
      tap(g, { backpack: true });
    }
    expect(g.girl.backpack).toEqual(cats.slice(0, 3).map((c) => c.id));
    expect(g.girl.carrying).toBe(cats[3].id);
    expect(types(g.drainEvents())).toContain('backpackFull');
    run(g, 1, { right: true });
    for (const c of cats.slice(0, 3)) expect(c).toMatchObject({ mood: 'backpack', x: g.girl.x });
    goInside(g);
    expect(cats.every((c) => c.place === 'house')).toBe(true);
    tap(g, { carry: true });
    tap(g, { backpack: true });
    expect(g.girl.carrying).toBe(cats[2].id);
    g.setBackpack(false);
    expect(g.girl.backpack).toEqual([]);
    expect(cats[0].mood).toBe('sit');
    expect(g.nearestCat()).not.toBeNull();
  });
});

describe('hide-and-seek', () => {
  it('V: the garden cats hide behind bushes; walking past a bush finds them; all found pays coins', () => {
    const g = new Game();
    g.girl.x = 200;
    for (const c of g.cats) {
      c.place = 'garden';
      c.x = 190 + c.id;
      c.z = 0;
      c.mood = 'sit';
    }
    tap(g, { seek: true });
    expect(g.seek?.phase).toBe('count');
    run(g, SEEK_COUNT + 0.1);
    expect(g.seek?.phase).toBe('seek');
    const hidden = g.cats.filter((c) => c.mood === 'hidden');
    expect(hidden.length).toBe(6);
    expect(g.nearestCat()).toBeNull();
    for (const c of hidden) expect(Math.abs(c.x - g.girl.x)).toBeGreaterThanOrEqual(SEEK_MIN_DISTANCE);
    for (const c of hidden) {
      g.girl.x = c.x;
      g.girl.z = c.z - 1;
      tap(g, {});
    }
    expect(g.seek).toBeNull();
    expect(g.money).toBe(6 * SEEK_COINS_PER_CAT);
    expect(types(g.drainEvents())).toEqual(expect.arrayContaining(['seekStart', 'seekGo', 'found', 'seekDone']));
  });

  it('V again stops the game; it needs cats in the garden', () => {
    const g = new Game();
    tap(g, { seek: true });
    tap(g, { seek: true });
    expect(g.seek).toBeNull();
    expect(g.cats.every((c) => c.mood !== 'hidden' && c.mood !== 'toHide')).toBe(true);
    goInside(g);
    tap(g, { seek: true });
    expect(types(g.drainEvents())).toContain('seekNoCats');
  });
});

describe('cooking', () => {
  it('cooks at the stove with groceries and a pan, eats at the table with cutlery, then flies higher', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    const stove = spot('stove');
    g.girl.x = stove.x;
    g.girl.z = stove.z;
    g.drainEvents();
    tap(g, { pet: true });
    expect(types(g.drainEvents())).toContain('openKitchen');
    expect(g.cookMeal('spiegelei')).toBe('missing');
    expect(g.missingFor('spiegelei')).toEqual(['egg', 'pan']);
    expect(g.cookMeal('nope')).toBe('unknown');
    expect(g.missingFor('nope')).toEqual(['unknown']);
    g.wardrobe.pantry.egg = 2;
    g.wardrobe.gear.push('pan');
    expect(g.cookMeal('spiegelei')).toBe('ok');
    expect(g.cookMeal('spiegelei')).toBe('busy');
    expect(g.wardrobe.pantry.egg).toBe(1);
    const table = spot('table');
    g.girl.x = table.x;
    g.girl.z = table.z;
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'meal', recipe: 'spiegelei', ok: false });
    g.wardrobe.gear.push('cutlery');
    tap(g, { pet: true });
    expect(g.meal).toBeNull();
    expect(g.girl.boost).toBe(MEAL_BOOST_TIME);
    tap(g, { pet: true });
    g.meal = 'verschwunden';
    tap(g, { pet: true });
    expect(g.meal).toBeNull();

    // A good meal: flying twice as high outdoors.
    const out = new Game();
    quiet(out);
    out.girl.boost = MEAL_BOOST_TIME;
    tap(out, { jump: true, fly: true });
    run(out, 8, { fly: true });
    expect(out.girl.y).toBeGreaterThan(groundY(out.girl.x) + FLY_CEILING + 2);
  });

  it('makes cocoa in the pot and orange juice, and drinks them at the table without cutlery', () => {
    const g = new Game();
    quiet(g);
    goInside(g);
    expect(g.missingFor('kakao')).toEqual(['dairy', 'cocoa', 'pot']);
    g.wardrobe.pantry.dairy = 1;
    g.wardrobe.pantry.cocoa = 1;
    g.wardrobe.gear.push('pot');
    expect(g.cookMeal('kakao')).toBe('ok');
    expect(g.wardrobe.pantry).toMatchObject({ dairy: 0, cocoa: 0 });
    const table = spot('table');
    g.girl.x = table.x;
    g.girl.z = table.z;
    g.drainEvents();
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'meal', recipe: 'kakao', ok: true });
    g.wardrobe.pantry.orange = 2;
    expect(g.cookMeal('orangensaft')).toBe('ok');
    tap(g, { pet: true });
    expect(g.meal).toBeNull();
  });
});

describe('walls', () => {
  it('walking sideways into a building from behind is blocked instead of snapping to the front', () => {
    const g = new Game();
    quiet(g);
    const house = BUILDINGS[0];
    g.girl.x = house.x - house.halfWidth - 3;
    g.girl.z = 2.5;
    run(g, 2, { right: true });
    expect(g.girl.z).toBe(2.5);
    expect(g.girl.x).toBeLessThan(house.x - house.halfWidth);
    run(g, 2, { down: true, right: true });
    expect(g.girl.x).toBeGreaterThan(house.x - house.halfWidth);
  });

  it('no walking through doors while flying', () => {
    const g = new Game();
    quiet(g);
    g.girl.x = BUILDINGS[0].x;
    g.girl.y = groundY(g.girl.x);
    g.girl.z = BUILDINGS[0].front - 0.5;
    tap(g, { jump: true });
    tap(g, { enter: true });
    expect(g.girl.onGround).toBe(false);
    expect(g.girl.place).toBe('garden');
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
    expect(kitten.growth).toBeGreaterThanOrEqual(1);
    expect(kitten.growth).toBeLessThan(1.05);
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

describe('care', () => {
  it('grown cats keep growing a little from petting and food, up to a limit', () => {
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    expect(cat.growth).toBe(1);
    tap(g, { pet: true });
    expect(cat.growth).toBeGreaterThan(1);
    const petted = cat.growth;
    g.wardrobe.supplies.treat = 1;
    tap(g, { treat: true });
    expect(cat.growth).toBeGreaterThan(petted);
    for (let i = 0; i < 400; i++) {
      run(g, PET_COOLDOWN + 0.02);
      tap(g, { pet: true });
    }
    expect(cat.growth).toBe(MAX_GROWTH);
  });

  it('the more hearts the cats have made, the fewer hearts a coin takes', () => {
    expect(heartsPerCoin(0)).toBe(HEARTS_PER_COIN);
    expect(heartsPerCoin(59)).toBe(HEARTS_PER_COIN);
    expect(heartsPerCoin(60)).toBe(2);
    expect(heartsPerCoin(250)).toBe(1);
    const g = new Game();
    quiet(g);
    const cat = beside(g, g.cats[0]);
    g.hearts = 59;
    g.drainEvents();
    tap(g, { pet: true });
    expect(g.drainEvents()).toContainEqual({ type: 'coinFaster', perCoin: 2 });
    g.coins.length = 0;
    g.heartsSinceCoin = 0;
    const money = g.money;
    for (let i = 0; i < 4; i++) {
      run(g, PET_COOLDOWN + 0.02);
      cat.x = g.girl.x + 1;
      tap(g, { pet: true });
    }
    // A coin that lands at her feet is picked up straight away.
    expect(g.coins.length + g.money - money).toBe(2);
    expect(types(g.drainEvents())).not.toContain('coinFaster');
  });
});
