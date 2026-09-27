// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** School: sums to solve, a German grade (1 best … 6) and coins for good grades. */

export type Level = 'leicht' | 'mittel' | 'schwer';
export type Op = '+' | '−' | '×';

export interface Task {
  a: number;
  b: number;
  op: Op;
  answer: number;
  /** Four answers to pick from, the right one among them, all different and never negative. */
  choices: number[];
}

export const TASKS_PER_LESSON = 5;

export const LEVELS: readonly { id: Level; name: string; hint: string }[] = [
  { id: 'leicht', name: 'Leicht', hint: 'Plus bis 10' },
  { id: 'mittel', name: 'Mittel', hint: 'Plus und Minus bis 20' },
  { id: 'schwer', name: 'Schwer', hint: 'Plus und Minus bis 100, kleines Einmaleins' },
];

const int = (rng: () => number, from: number, to: number): number => from + Math.floor(rng() * (to - from + 1));

export function makeTask(rng: () => number, level: Level): Task {
  let a: number;
  let b: number;
  let op: Op;
  if (level === 'leicht') {
    op = '+';
    a = int(rng, 0, 9);
    b = int(rng, 1, 10 - a);
  } else if (level === 'mittel') {
    op = rng() < 0.5 ? '+' : '−';
    a = int(rng, 2, 20);
    b = op === '+' ? int(rng, 1, 20 - a || 1) : int(rng, 1, a);
    if (op === '+' && a + b > 20) b = 20 - a;
  } else {
    const r = rng();
    op = r < 0.35 ? '+' : r < 0.7 ? '−' : '×';
    if (op === '×') {
      a = int(rng, 2, 10);
      b = int(rng, 2, 10);
    } else {
      a = int(rng, 10, 99);
      b = op === '+' ? int(rng, 1, 100 - a) : int(rng, 1, a);
    }
  }
  const answer = op === '+' ? a + b : op === '−' ? a - b : a * b;
  return { a, b, op, answer, choices: choicesFor(rng, answer) };
}

function choicesFor(rng: () => number, answer: number): number[] {
  const set = new Set([answer]);
  const spread = Math.max(3, Math.round(answer * 0.2));
  let guard = 0;
  while (set.size < 4 && guard++ < 100) {
    const wrong = answer + (rng() < 0.5 ? -1 : 1) * int(rng, 1, spread);
    if (wrong >= 0) set.add(wrong);
  }
  // Tiny answers (0, 1) may not have enough neighbours below; fill upwards.
  for (let n = answer + 1; set.size < 4; n++) set.add(n);
  const list = [...set];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function lesson(rng: () => number, level: Level): Task[] {
  return Array.from({ length: TASKS_PER_LESSON }, () => makeTask(rng, level));
}

/** A German school grade: 1 (sehr gut) … 6 (ungenügend). */
export function grade(correct: number, total: number): number {
  const share = total > 0 ? correct / total : 0;
  if (share >= 1) return 1;
  if (share >= 0.8) return 2;
  if (share >= 0.6) return 3;
  if (share >= 0.4) return 4;
  if (share >= 0.2) return 5;
  return 6;
}

export const GRADE_NAMES = ['', 'sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend'] as const;

/** Coins for a grade; harder lessons pay more. */
export function coinsFor(g: number, level: Level): number {
  const base = [0, 10, 7, 5, 3, 1, 0][g] ?? 0;
  return base * (level === 'leicht' ? 1 : level === 'mittel' ? 2 : 3);
}

export function taskText(t: Task): string {
  return `${t.a} ${t.op} ${t.b} = ?`;
}
