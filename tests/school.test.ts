// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { createRng, Game, type Input } from '../src/core/game';
import { coinsFor, grade, lesson, LEVELS, makeTask, TASKS_PER_LESSON, taskText } from '../src/core/school';
import { BUILDINGS } from '../src/core/world';

describe('school', () => {
  it('makes fair sums for every level', () => {
    const rng = createRng(1);
    for (const { id } of LEVELS) {
      for (let i = 0; i < 400; i++) {
        const t = makeTask(rng, id);
        const value = t.op === '+' ? t.a + t.b : t.op === '−' ? t.a - t.b : t.a * t.b;
        expect(t.answer).toBe(value);
        expect(t.answer).toBeGreaterThanOrEqual(0);
        expect(t.choices).toContain(t.answer);
        expect(new Set(t.choices).size).toBe(4);
        expect(Math.min(...t.choices)).toBeGreaterThanOrEqual(0);
        if (id === 'leicht') {
          expect(t.op).toBe('+');
          expect(t.answer).toBeLessThanOrEqual(10);
        }
        if (id === 'mittel') expect(Math.max(t.a, t.answer)).toBeLessThanOrEqual(20);
        if (id === 'schwer') expect(t.answer).toBeLessThanOrEqual(100);
      }
    }
    expect(taskText({ a: 3, b: 4, op: '+', answer: 7, choices: [] })).toBe('3 + 4 = ?');
  });

  it('a lesson has five tasks', () => {
    expect(lesson(createRng(2), 'mittel').length).toBe(TASKS_PER_LESSON);
  });

  it('gives German grades and coins for them', () => {
    expect([5, 4, 3, 2, 1, 0].map((n) => grade(n, 5))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(grade(0, 0)).toBe(6);
    expect(coinsFor(1, 'leicht')).toBe(10);
    expect(coinsFor(1, 'mittel')).toBe(20);
    expect(coinsFor(2, 'schwer')).toBe(21);
    expect(coinsFor(6, 'schwer')).toBe(0);
    expect(coinsFor(9, 'leicht')).toBe(0);
  });

  it('the school door opens the classroom, and grades pay out', () => {
    const g = new Game();
    const school = BUILDINGS.find((b) => b.id === 'school');
    if (!school) throw new Error('no school');
    for (const c of g.cats) c.x = 118;
    g.girl.x = school.x;
    g.girl.z = school.front - 0.5;
    const idle: Input = { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
    g.drainEvents();
    g.step(1 / 60, { ...idle, enter: true });
    expect(g.drainEvents().map((e) => e.type)).toContain('openSchool');
    g.earn(7.9);
    g.earn(-3);
    expect(g.money).toBe(7);
    g.goHome();
    expect(g.girl.place).toBe('house');
  });
});
