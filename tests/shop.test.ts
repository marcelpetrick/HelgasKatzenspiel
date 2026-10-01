// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { buy, CATALOG, owns, DEFAULT_OUTFIT, findItem, loadWardrobe, newWardrobe, outfitColor, wearItem } from '../src/core/shop';
import { TEXT } from '../src/ui/text';

describe('shop', () => {
  it('starts with the free outfit and no money', () => {
    const w = newWardrobe();
    expect(w.money).toBe(0);
    expect(w.outfit).toEqual(DEFAULT_OUTFIT);
    for (const id of Object.values(DEFAULT_OUTFIT)) expect(w.owned).toContain(id);
  });

  it('every item has a unique id and a German name', () => {
    const ids = CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of CATALOG) expect(i.name.length).toBeGreaterThanOrEqual(2);
    for (const i of CATALOG) if (i.kind !== 'wear') expect(TEXT.shop.itemDescriptions[i.id]).toBeTruthy();
  });

  it('refuses when there is not enough money', () => {
    const w = newWardrobe();
    expect(buy(w, 'top-lila')).toBe('poor');
    expect(w.owned).not.toContain('top-lila');
  });

  it('buys clothes, pays, and puts them on', () => {
    const w = newWardrobe();
    w.money = 10;
    expect(buy(w, 'top-lila')).toBe('ok');
    expect(w.money).toBe(5);
    expect(w.outfit.top).toBe('top-lila');
    expect(outfitColor(w, 'top')).toBe('#9b6bff');
    expect(buy(w, 'top-lila')).toBe('owned');
    expect(wearItem(w, 'top-rosa')).toBe(true);
    expect(w.outfit.top).toBe('top-rosa');
  });

  it('cannot wear what is not owned or not clothing', () => {
    const w = newWardrobe();
    expect(wearItem(w, 'top-lila')).toBe(false);
    expect(wearItem(w, 'food')).toBe(false);
    expect(wearItem(w, 'nope')).toBe(false);
    expect(buy(w, 'nope')).toBe('unknown');
    expect(findItem('nope')).toBeUndefined();
  });

  it('supplies stack, the yarn ball is bought once', () => {
    const w = newWardrobe();
    w.money = 20;
    expect(buy(w, 'food')).toBe('ok');
    expect(buy(w, 'food')).toBe('ok');
    expect(buy(w, 'treat')).toBe('ok');
    expect(w.supplies).toEqual({ food: 2, treat: 1, milk: 0 });
    expect(buy(w, 'yarn')).toBe('ok');
    expect(buy(w, 'yarn')).toBe('owned');
    expect(w.money).toBe(20 - 2 - 2 - 1 - 5);
  });

  it('loads a save and repairs rubbish', () => {
    const w = newWardrobe();
    w.money = 30;
    buy(w, 'skirt-jeans');
    buy(w, 'food');
    buy(w, 'yarn');
    const back = loadWardrobe(JSON.parse(JSON.stringify(w)));
    expect(back).toEqual(w);
    expect(loadWardrobe(null)).toEqual(newWardrobe());
    expect(loadWardrobe('x')).toEqual(newWardrobe());
    const broken = loadWardrobe({
      money: -3,
      owned: ['food', 42, 'top-lila'],
      outfit: { top: 'top-sonne' },
      supplies: { food: 'x', treat: 2.7 },
      hasYarn: 'yes',
      toys: ['ball', 'backpack', 7],
      gear: ['backpack', 'ball'],
      wearBackpack: true,
      pantry: { egg: 2, tomato: -1, leek: 'x' },
    });
    expect(broken.money).toBe(0);
    expect(broken.owned).toContain('top-lila');
    expect(broken.owned).not.toContain('food');
    expect(broken.outfit.top).toBe('top-rosa');
    expect(broken.supplies).toEqual({ food: 0, treat: 2, milk: 0 });
    expect(broken.toys).toEqual(['ball']);
    expect(broken.gear).toEqual(['backpack']);
    expect(broken.wearBackpack).toBe(true);
    expect(broken.pantry).toMatchObject({ egg: 2, tomato: 0, leek: 0 });
    expect(loadWardrobe({ hasYarn: true }).toys).toEqual(['yarn']);
  });

  it('toys, gear and groceries: one-off things are bought once, food stacks, a new backpack is put on', () => {
    const w = newWardrobe();
    w.money = 50;
    expect(buy(w, 'backpack')).toBe('ok');
    expect(w.wearBackpack).toBe(true);
    expect(buy(w, 'backpack')).toBe('owned');
    expect(buy(w, 'mouse')).toBe('ok');
    expect(buy(w, 'mouse')).toBe('owned');
    expect(buy(w, 'pan')).toBe('ok');
    expect(buy(w, 'egg')).toBe('ok');
    expect(buy(w, 'egg')).toBe('ok');
    expect(w.pantry.egg).toBe(2);
    expect(owns(w, 'egg')).toBe(false);
    expect(owns(w, 'nope')).toBe(false);
    expect(owns(w, 'pan')).toBe(true);
    expect(w.money).toBe(50 - 10 - 4 - 6 - 2);
  });
});
