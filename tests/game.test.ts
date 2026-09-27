// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { FLY_CEILING, Game, groundY, HEARTS_PER_COIN, type Input, JUMP_SPEED, PET_COOLDOWN, WORLD_MAX_X } from '../src/core/game';

const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
const run = (g: Game, seconds: number, input: Partial<Input> = {}) => {
  for (let t = 0; t < seconds; t += 1 / 60) g.step(1 / 60, { ...idle, ...input });
};

describe('Game', () => {
  it('walks right and stays on the ground', () => {
    const g = new Game();
    const x0 = g.girl.x;
    run(g, 1, { right: true });
    expect(g.girl.x).toBeGreaterThan(x0 + 5);
    expect(g.girl.y).toBeCloseTo(groundY(g.girl.x));
    expect(g.girl.facing).toBe(1);
  });

  it('never leaves the world', () => {
    const g = new Game();
    run(g, 30, { right: true });
    expect(g.girl.x).toBe(WORLD_MAX_X);
  });

  it('jumps and lands again', () => {
    const g = new Game();
    g.step(1 / 60, { ...idle, jump: true });
    expect(g.girl.onGround).toBe(false);
    expect(g.girl.vy).toBeLessThanOrEqual(JUMP_SPEED);
    run(g, 2);
    expect(g.girl.onGround).toBe(true);
    expect(g.drainEvents().map((e) => e.type)).toEqual(expect.arrayContaining(['jump', 'land']));
  });

  it('flies up while Space is held, but not past the ceiling, and floats down', () => {
    const g = new Game();
    g.step(1 / 60, { ...idle, jump: true, fly: true });
    run(g, 5, { fly: true });
    const floor = groundY(g.girl.x);
    expect(g.girl.y).toBeGreaterThan(floor + FLY_CEILING - 1);
    expect(g.girl.y).toBeLessThan(floor + FLY_CEILING + 0.5);
    run(g, 0.5);
    expect(g.girl.vy).toBeGreaterThanOrEqual(-3.6);
    run(g, 5);
    expect(g.girl.onGround).toBe(true);
  });

  it('pets a nearby cat: hearts, happiness, cooldown', () => {
    const g = new Game();
    const cat = g.cats[0];
    g.girl.x = cat.x - 1;
    g.step(1 / 60, { ...idle, pet: true });
    expect(g.hearts).toBe(1);
    expect(cat.mood).toBe('happy');
    expect(cat.love).toBe(1);
    g.step(1 / 60, { ...idle, pet: true });
    expect(g.hearts).toBe(1);
    run(g, PET_COOLDOWN);
    g.step(1 / 60, { ...idle, pet: true });
    expect(g.hearts).toBe(2);
  });

  it('does nothing when no cat is near', () => {
    const g = new Game();
    for (const c of g.cats) c.x = 500;
    g.step(1 / 60, { ...idle, pet: true });
    expect(g.hearts).toBe(0);
  });

  it('happy cats drop coins that can be collected', () => {
    const g = new Game();
    const cat = g.cats[0];
    const before = g.coins.length;
    for (let i = 0; i < HEARTS_PER_COIN; i++) {
      g.girl.x = cat.x - 1;
      g.step(1 / 60, { ...idle, pet: true });
      run(g, PET_COOLDOWN + 0.05);
    }
    expect(g.coins.length).toBe(before + 1);
    const coin = g.coins[g.coins.length - 1];
    g.girl.x = coin.x;
    g.step(1 / 60, idle);
    expect(g.money).toBeGreaterThanOrEqual(1);
  });

  it('magic delights every cat in range and has a cooldown', () => {
    const g = new Game();
    for (const c of g.cats) c.x = g.girl.x + 2;
    g.step(1 / 60, { ...idle, magic: true });
    expect(g.hearts).toBe(g.cats.length);
    expect(g.drainEvents().some((e) => e.type === 'magic')).toBe(true);
    run(g, 0.6);
    g.step(1 / 60, { ...idle, magic: true });
    expect(g.hearts).toBe(g.cats.length);
  });

  it('cats wander but stay inside the world', () => {
    const g = new Game(3);
    run(g, 120);
    for (const c of g.cats) {
      expect(c.x).toBeGreaterThan(2);
      expect(c.x).toBeLessThan(WORLD_MAX_X);
      expect(c.y).toBeCloseTo(groundY(c.x));
    }
  });
});
