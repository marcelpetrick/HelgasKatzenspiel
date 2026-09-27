// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Engine } from '@babylonjs/core/Engines/engine';
import { Game, type Input } from './core/game';
import { World } from './render/world';
import { Hud } from './ui/hud';
import { TEXT } from './ui/text';

const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'NumpadEnter', 'KeyZ', 'KeyY']);

/** Wires keyboard, game rules, scene and HUD together and runs the frame loop. */
export class App {
  readonly engine: Engine;
  readonly game = new Game();
  readonly world: World;
  private readonly hud: Hud;
  private readonly held = new Set<string>();
  private pressed = new Set<string>();
  private started = false;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }, true);
    this.world = new World(this.engine, this.game);
    this.hud = new Hud(ui, this.game);
    this.showTitle(ui);

    window.addEventListener('keydown', (e) => {
      if (!KEYS.has(e.code)) return;
      e.preventDefault();
      if (!this.started) {
        if (e.code === 'Enter' || e.code === 'Space') this.start(ui);
        return;
      }
      if (!e.repeat) this.pressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => this.held.clear());
    window.addEventListener('resize', () => this.engine.resize());

    this.engine.runRenderLoop(() => this.frame(Math.min(this.engine.getDeltaTime() / 1000, 1 / 20)));
  }

  private showTitle(ui: HTMLElement): void {
    ui.classList.add('on-title');
    const screen = document.createElement('div');
    screen.className = 'title-screen';
    screen.innerHTML = `
      <div class="title-card">
        <div class="title-cats">🐱 🐈 🐱</div>
        <h1></h1>
        <p></p>
        <button type="button"></button>
        <div class="title-hint"></div>
      </div>`;
    screen.querySelector('h1')!.textContent = TEXT.title;
    screen.querySelector('p')!.textContent = TEXT.tagline;
    const button = screen.querySelector('button')!;
    button.textContent = TEXT.start;
    button.addEventListener('click', () => this.start(ui));
    screen.querySelector('.title-hint')!.textContent = TEXT.startHint;
    ui.append(screen);
  }

  start(ui: HTMLElement): void {
    if (this.started) return;
    this.started = true;
    ui.classList.remove('on-title');
    ui.querySelector('.title-screen')?.remove();
  }

  /** Advance one frame; exposed so tests can drive the game deterministically. */
  frame(dt: number): void {
    const has = (...codes: string[]) => codes.some((c) => this.held.has(c));
    const was = (...codes: string[]) => codes.some((c) => this.pressed.has(c));
    const input: Input = this.started
      ? {
          left: has('ArrowLeft'),
          right: has('ArrowRight'),
          jump: was('Space'),
          fly: has('Space'),
          pet: was('Enter', 'NumpadEnter'),
          // Z sits where Y is on an English keyboard; accept both so it works either way.
          magic: was('KeyZ', 'KeyY'),
        }
      : { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
    this.pressed = new Set();
    this.game.step(dt, input);
    this.world.handleEvents(this.game.drainEvents());
    const flying = !this.game.girl.onGround && input.fly;
    this.world.update(dt, flying);
    this.hud.update(this.world);
    this.world.render();
  }
}
