// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { createRng } from '../core/game';
import { coinsFor, grade, GRADE_NAMES, lesson, type Level, LEVELS, type Task, taskText } from '../core/school';
import { el } from './dom';
import { TEXT } from './text';

/** What happened in class, for sounds and paying out coins. */
export type SchoolEvent = { type: 'answer'; right: boolean } | { type: 'done'; grade: number; coins: number } | { type: 'home' };

/** The classroom: pick how hard, solve five sums, get a report card with a grade and coins. */
export class SchoolMenu {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private readonly rng = createRng(Date.now() % 100000);
  private tasks: Task[] = [];
  private index = 0;
  private correct = 0;
  private level: Level = 'leicht';
  /** The pending "next sum" timer, cleared whenever the lesson changes or the classroom closes. */
  private nextTimer = 0;
  private answers: HTMLButtonElement[] = [];
  isOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly onEvent: (e: SchoolEvent) => void,
  ) {
    this.root = el('div', 'shop school');
    const card = el('div', 'shop-card school-card');
    const head = el('div', 'shop-head');
    const close = el('button', 'shop-close', TEXT.school.close);
    close.type = 'button';
    close.addEventListener('click', () => {
      this.close();
    });
    head.append(el('h2', '', TEXT.school.title), close);
    this.body = el('div', 'school-body');
    card.append(head, this.body);
    this.root.append(card);
    parent.append(this.root);
  }

  open(): void {
    this.isOpen = true;
    this.root.classList.add('open');
    this.chooseLevel();
  }

  close(): void {
    this.isOpen = false;
    window.clearTimeout(this.nextTimer);
    this.answers = [];
    this.root.classList.remove('open');
  }

  /** Keys 1–4 pick the answers from left to right. */
  key(code: string): void {
    const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'].indexOf(code) % 4;
    const b = n >= 0 ? this.answers[n] : undefined;
    if (b && !b.disabled) b.click();
  }

  private button(text: string, className: string, onClick: () => void): HTMLButtonElement {
    const b = el('button', className, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  private chooseLevel(): void {
    this.answers = [];
    const grid = el('div', 'level-grid');
    for (const l of LEVELS) {
      const b = this.button('', 'level-btn', () => {
        this.start(l.id);
      });
      b.append(el('span', 'level-name', l.name), el('span', 'level-hint', TEXT.school.levelHints[l.id]));
      grid.append(b);
    }
    this.body.replaceChildren(el('p', 'school-intro', TEXT.school.intro), grid);
  }

  private start(level: Level): void {
    window.clearTimeout(this.nextTimer);
    this.level = level;
    this.tasks = lesson(this.rng, level);
    this.index = 0;
    this.correct = 0;
    this.showTask();
  }

  private showTask(): void {
    const task = this.tasks[this.index];
    const progress = el('div', 'school-progress', TEXT.school.progress(this.index + 1, this.tasks.length));
    const sum = el('div', 'school-sum', taskText(task));
    const answers = el('div', 'answer-grid');
    const feedback = el('div', 'school-feedback');
    for (const choice of task.choices) {
      const b = this.button(String(choice), 'answer-btn', () => {
        const right = choice === task.answer;
        if (right) this.correct++;
        for (const other of answers.querySelectorAll('button')) other.disabled = true;
        b.classList.add(right ? 'right' : 'wrong');
        feedback.textContent = right ? TEXT.school.right : TEXT.school.wrong(task.answer);
        feedback.classList.toggle('bad', !right);
        this.onEvent({ type: 'answer', right });
        this.nextTimer = window.setTimeout(
          () => {
            this.index++;
            if (this.index < this.tasks.length) this.showTask();
            else this.finish();
          },
          right ? 900 : 1700,
        );
      });
      answers.append(b);
    }
    this.answers = [...answers.querySelectorAll('button')];
    this.body.replaceChildren(progress, sum, answers, feedback);
  }

  private finish(): void {
    const g = grade(this.correct, this.tasks.length);
    const coins = coinsFor(g, this.level);
    this.onEvent({ type: 'done', grade: g, coins });
    const report = el('div', 'report');
    report.append(
      el('div', 'report-title', TEXT.school.report),
      el('div', 'report-grade', String(g)),
      el('div', 'report-name', GRADE_NAMES[g]),
      el('div', 'report-line', TEXT.school.score(this.correct, this.tasks.length)),
      el('div', 'report-coins', coins > 0 ? TEXT.school.coins(coins) : TEXT.school.noCoins),
    );
    const again = this.button(TEXT.school.again, 'level-btn small', () => {
      this.chooseLevel();
    });
    const home = this.button(TEXT.school.home, 'level-btn small', () => {
      this.close();
      this.onEvent({ type: 'home' });
    });
    const actions = el('div', 'report-actions');
    actions.append(again, home);
    this.body.replaceChildren(report, actions);
  }
}
