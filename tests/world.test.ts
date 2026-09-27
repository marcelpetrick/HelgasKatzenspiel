// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { clampSize, cleanName, coat, COATS, sizeName } from '../src/core/cats';
import { BUILDINGS, doorAt, groundY, HOUSE_COIN_SPOTS, INTERIOR_X, maxZAt, placeOf, ROOMS, spot, SPOTS } from '../src/core/world';

describe('world layout', () => {
  it('the ground is flat under buildings and indoors', () => {
    for (const b of BUILDINGS) expect(groundY(b.x - b.halfWidth)).toBeCloseTo(groundY(b.x + b.halfWidth));
    expect(groundY(INTERIOR_X + 5)).toBe(0);
  });

  it('knows the places, walls and doors', () => {
    expect(placeOf(10)).toBe('garden');
    expect(placeOf(INTERIOR_X + 1)).toBe('house');
    const house = BUILDINGS[0];
    expect(maxZAt('garden', house.x)).toBeLessThan(house.front);
    expect(maxZAt('garden', 10)).toBeGreaterThan(house.front);
    expect(maxZAt('house', INTERIOR_X + 3)).toBeGreaterThan(1);
    expect(doorAt(house.x, house.front - 0.5)).toBe(house);
    expect(doorAt(house.x, -2)).toBeNull();
    expect(doorAt(house.x + 3, house.front - 0.5)).toBeNull();
  });

  it('every spot and coin place is inside a room', () => {
    for (const s of SPOTS) expect(ROOMS.some((r) => s.x >= r.from && s.x < r.to)).toBe(true);
    for (const p of HOUSE_COIN_SPOTS) expect(ROOMS.some((r) => p.x >= r.from && p.x < r.to)).toBe(true);
    expect(spot('wardrobe').searchable).toBe(true);
    expect(() => spot('nope' as never)).toThrow();
  });
});

describe('cat looks', () => {
  it('has twelve coats including green, and unknown coats fall back', () => {
    expect(COATS.length).toBe(12);
    expect(coat('gruen').name).toBe('Grün');
    expect(coat('kariert')).toBe(COATS[0]);
  });

  it('names sizes and keeps them in range', () => {
    expect(sizeName(0.6)).toBe('winzig');
    expect(sizeName(0.9)).toBe('klein');
    expect(sizeName(1)).toBe('mittel');
    expect(sizeName(1.3)).toBe('groß');
    expect(sizeName(1.6)).toBe('riesig');
    expect(clampSize(0)).toBe(0.6);
    expect(clampSize(5)).toBe(1.6);
    expect(clampSize(Number.NaN)).toBe(1);
  });

  it('tidies names', () => {
    expect(cleanName('  Mau   Mau ', 'x')).toBe('Mau Mau');
    expect(cleanName('', 'Mimi')).toBe('Mimi');
    expect(cleanName('a'.repeat(40), 'x').length).toBe(16);
  });
});
