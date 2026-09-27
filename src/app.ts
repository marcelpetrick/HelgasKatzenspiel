// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Engine } from '@babylonjs/core/Engines/engine';
import { Game, type Input } from './core/game';
import { World } from './render/world';
import { Hud } from './ui/hud';
import { loadSaved, save } from './ui/save';
import { ShopMenu } from './ui/shop';
import { TEXT } from './ui/text';

const KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Enter',
  'NumpadEnter',
  'KeyZ',
  'KeyY',
  'KeyK',
  'Escape',
  'Digit1',
  'Digit2',
  'Digit3',
  'Numpad1',
  'Numpad2',
  'Numpad3',
]);

/** Wires keyboard, game rules, scene and HUD together and runs the frame loop. */
export class App {
  readonly engine: Engine;
  readonly game = new Game(7, 6, loadSaved());
  readonly world: World;
  private readonly hud: Hud;
  readonly shop: ShopMenu;
  private saveIn = 0;
  private readonly held = new Set<string>();
  private pressed = new Set<string>();
  private started = false;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }, true);
    this.world = new World(this.engine, this.game);
    this.hud = new Hud(ui, this.game);
    this.shop = new ShopMenu(ui, this.game.wardrobe, () => {
      this.world.refreshOutfit();
      save(this.game.wardrobe);
    });
    this.showTitle(ui);

    window.addEventListener('keydown', (e) => {
      if (!KEYS.has(e.code)) return;
      e.preventDefault();
      if (!this.started) {
        if (e.code === 'Enter' || e.code === 'Space') this.start(ui);
        return;
      }
      if (e.code === 'KeyK' || (e.code === 'Escape' && this.shop.isOpen)) {
        if (!e.repeat) this.shop.toggle();
        return;
      }
      if (this.shop.isOpen) return;
      if (!e.repeat) this.pressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => {
      this.held.clear();
    });
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    this.engine.runRenderLoop(() => {
      this.frame(Math.min(this.engine.getDeltaTime() / 1000, 1 / 20));
    });
  }

  private showTitle(ui: HTMLElement): void {
    ui.classList.add('on-title');
    const screen = document.createElement('div');
    screen.className = 'title-screen';
    const card = document.createElement('div');
    card.className = 'title-card';
    const make = (tag: string, className: string, text: string) => {
      const e = document.createElement(tag);
      e.className = className;
      e.textContent = text;
      return e;
    };
    const button = make('button', '', TEXT.start);
    button.addEventListener('click', () => {
      this.start(ui);
    });
    card.append(
      make('div', 'title-cats', '🐱 🐈 🐱'),
      make('h1', '', TEXT.title),
      make('p', '', TEXT.tagline),
      button,
      make('div', 'title-hint', TEXT.startHint),
    );
    screen.append(card);
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
    const input: Input =
      this.started && !this.shop.isOpen
        ? {
            left: has('ArrowLeft'),
            right: has('ArrowRight'),
            jump: was('Space'),
            fly: has('Space'),
            pet: was('Enter', 'NumpadEnter'),
            // Z sits where Y is on an English keyboard; accept both so it works either way.
            magic: was('KeyZ', 'KeyY'),
            feed: was('Digit1', 'Numpad1'),
            treat: was('Digit2', 'Numpad2'),
            yarn: was('Digit3', 'Numpad3'),
          }
        : { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
    this.pressed = new Set();
    if (this.shop.isOpen) this.held.clear();
    // The world keeps breathing behind the shop window, but nobody moves.
    this.game.step(this.shop.isOpen ? 0 : dt, input);
    this.saveIn -= dt;
    if (this.saveIn <= 0) {
      this.saveIn = 1;
      save(this.game.wardrobe);
    }
    this.world.handleEvents(this.game.drainEvents());
    const flying = !this.game.girl.onGround && input.fly;
    this.world.update(dt, flying);
    this.hud.update(this.world);
    this.world.render();
  }
}
