// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { Game, type Input, SPOT_REFILL_TIME } from '../src/core/game';
import { cleanLook, DEFAULT_LOOK, HAIR_COLORS, SKINS } from '../src/core/look';
import { buy, CATALOG, loadWardrobe, newWardrobe, outfitStyle, SLOT_NAMES } from '../src/core/shop';

describe('the girl’s look', () => {
  it('cleans saved looks', () => {
    expect(cleanLook(null)).toEqual(DEFAULT_LOOK);
    const look = { skin: SKINS[4].color, hair: HAIR_COLORS[5].color, hairStyle: 'dutt', eyes: 'glitzer', mouth: 'katze', freckles: true };
    expect(cleanLook(look)).toEqual(look);
    expect(cleanLook({ skin: '#000', hair: 1, hairStyle: 'glatze', eyes: 'x', mouth: null, freckles: 'ja' })).toEqual(DEFAULT_LOOK);
  });

  it('is saved with the wardrobe', () => {
    const w = newWardrobe();
    w.look.hairStyle = 'lang';
    w.look.freckles = true;
    expect(loadWardrobe(JSON.parse(JSON.stringify(w))).look).toMatchObject({ hairStyle: 'lang', freckles: true });
  });
});

describe('jewellery, nail polish and decorations', () => {
  it('every slot has a free default and something to buy', () => {
    const w = newWardrobe();
    for (const slot of Object.keys(SLOT_NAMES)) {
      const items = CATALOG.filter((i) => i.kind === 'wear' && i.slot === slot);
      expect(items.some((i) => i.price === 0)).toBe(true);
      expect(items.some((i) => i.price > 0)).toBe(true);
    }
    expect(outfitStyle(w, 'headband')).toBe('ears');
    expect(outfitStyle(w, 'earrings')).toBe('none');
    expect(outfitStyle(w, 'top')).toBe('none');
    w.outfit.nails = 'nope';
    expect(outfitStyle(w, 'nails')).toBe('none');
  });

  it('trousers are worn instead of a skirt', () => {
    const w = newWardrobe();
    expect(outfitStyle(w, 'skirt')).toBe('none');
    w.money = 10;
    expect(buy(w, 'pants-jeans')).toBe('ok');
    expect(w.outfit.skirt).toBe('pants-jeans');
    expect(outfitStyle(w, 'skirt')).toBe('pants');
  });

  it('bows, earrings and polish are bought and worn', () => {
    const w = newWardrobe();
    w.money = 20;
    expect(buy(w, 'bow-rosa')).toBe('ok');
    expect(buy(w, 'ear-herz')).toBe('ok');
    expect(buy(w, 'nails-gold')).toBe('ok');
    expect(outfitStyle(w, 'headband')).toBe('bow');
    expect(outfitStyle(w, 'earrings')).toBe('heart');
    expect(w.outfit.nails).toBe('nails-gold');
  });

  it('decorations are bought once, saved, and make cupboards fill faster', () => {
    const w = newWardrobe();
    w.money = 100;
    expect(buy(w, 'deco-kratzbaum')).toBe('ok');
    expect(buy(w, 'deco-kratzbaum')).toBe('owned');
    expect(buy(w, 'deco-lichter')).toBe('ok');
    const back = loadWardrobe(JSON.parse(JSON.stringify({ ...w, deco: [...w.deco, 'top-rosa', 3, 'deco-lichter'] })));
    expect(back.deco).toEqual(['deco-kratzbaum', 'deco-lichter']);

    const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
    const count = (g: Game) => Object.values(g.spotCoins).reduce((s, n) => s + n, 0);
    const plain = new Game();
    const decorated = new Game(7, 6, back);
    for (let t = 0; t < SPOT_REFILL_TIME * 0.9; t += 0.1) {
      plain.step(0.1, idle);
      decorated.step(0.1, idle);
    }
    expect(count(decorated)).toBeGreaterThan(count(plain));
  });
});
