// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Engine } from '@babylonjs/core/Engines/engine';
import { Sound, type SoundName } from './audio';
import type { Game, GameEvent, Input } from './core/game';
import { World } from './render/world';
import { CatsMenu } from './ui/catsMenu';
import { el } from './ui/dom';
import { Hud } from './ui/hud';
import { type SchoolEvent, SchoolMenu } from './ui/schoolMenu';
import { clearSave, hasSave, loadGame, saveGame } from './ui/save';
import { type ShopAction, ShopMenu } from './ui/shop';
import { TEXT } from './ui/text';

/** Keys the game uses; the browser's own reaction to them (scrolling, …) is suppressed. */
const KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'Enter',
  'NumpadEnter',
  'KeyZ',
  'KeyY',
  'KeyK',
  'KeyM',
  'KeyN',
  'KeyS',
  'KeyT',
  'Escape',
  'Digit1',
  'Digit2',
  'Digit3',
  'Numpad1',
  'Numpad2',
  'Numpad3',
]);

/** Keys that keep acting while held down. */
const HOLD_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

/** Wires keyboard, game rules, scene, sound and HUD together and runs the frame loop. */
export class App {
  readonly engine: Engine;
  readonly game: Game;
  readonly world: World;
  readonly sound = new Sound();
  private readonly hud: Hud;
  readonly shop: ShopMenu;
  readonly catsMenu: CatsMenu;
  readonly school: SchoolMenu;
  private readonly held = new Set<string>();
  private pressed = new Set<string>();
  private started = false;
  private twinkleIn = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly ui: HTMLElement,
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true }, true);
    this.game = loadGame();
    this.world = new World(this.engine, this.game);
    this.hud = new Hud(ui, this.game);
    this.shop = new ShopMenu(ui, this.game, (action) => {
      this.onShop(action);
    });
    this.catsMenu = new CatsMenu(ui, this.game, () => {
      this.world.syncCats();
      this.sound.play('click');
    });
    this.school = new SchoolMenu(ui, (e) => {
      this.onSchool(e);
    });
    this.showTitle();

    window.addEventListener('keydown', (e) => {
      this.onKey(e);
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.code));
    window.addEventListener('blur', () => {
      this.held.clear();
    });
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    window.addEventListener('pointerdown', () => {
      this.sound.unlock();
    });
    // Leaving the page keeps the progress too, in case S was forgotten.
    window.addEventListener('pagehide', () => {
      if (this.started) saveGame(this.game);
    });

    this.engine.runRenderLoop(() => {
      this.frame(Math.min(this.engine.getDeltaTime() / 1000, 1 / 20));
    });
  }

  private get menuOpen(): boolean {
    return this.shop.isOpen || this.catsMenu.isOpen || this.school.isOpen;
  }

  private onKey(e: KeyboardEvent): void {
    if (!KEYS.has(e.code)) return;
    e.preventDefault();
    this.sound.unlock();
    if (!this.started) {
      if (e.code === 'Enter' || e.code === 'Space') this.start();
      return;
    }
    if (e.repeat && !HOLD_KEYS.has(e.code)) return;
    if (e.code === 'Escape') {
      this.shop.close();
      this.catsMenu.close();
      this.school.close();
      return;
    }
    // In class there is only sums: no shopping, no cat menu.
    if (this.school.isOpen) return;
    if (e.code === 'KeyK' && !this.catsMenu.isOpen) {
      if (this.shop.isOpen) this.shop.close();
      else this.openShop('shop');
      return;
    }
    if (e.code === 'KeyM' && !this.shop.isOpen) {
      this.held.clear();
      this.catsMenu.toggle();
      this.sound.play('click');
      return;
    }
    if (e.code === 'KeyT') {
      this.hud.say(TEXT.muted(this.sound.toggleMute()));
      return;
    }
    if (e.code === 'KeyS') {
      if (saveGame(this.game)) {
        this.hud.say(TEXT.saved);
        this.sound.play('save');
      } else this.hud.say(TEXT.saveFailed);
      return;
    }
    if (this.menuOpen) return;
    if (!e.repeat) this.pressed.add(e.code);
    this.held.add(e.code);
  }

  private openShop(mode: 'shop' | 'wardrobe'): void {
    this.held.clear();
    this.shop.open(mode);
    this.sound.play(mode === 'shop' ? 'shopBell' : 'door');
  }

  private onShop(action: ShopAction): void {
    this.world.refreshOutfit();
    this.world.syncCats();
    const sounds: Record<ShopAction, SoundName> = { bought: 'buy', poor: 'nope', wear: 'click', newCat: 'kitten', full: 'nope' };
    this.sound.play(sounds[action]);
  }

  private onSchool(e: SchoolEvent): void {
    if (e.type === 'answer') {
      this.sound.play(e.right ? 'found' : 'nope');
      return;
    }
    if (e.type === 'home') {
      this.game.goHome();
      return;
    }
    this.game.earn(e.coins);
    this.sound.play(e.coins > 0 ? 'coin' : 'empty');
    if (e.grade <= 2) this.sound.play('magic');
  }

  private showTitle(): void {
    this.ui.classList.add('on-title');
    const screen = el('div', 'title-screen');
    const card = el('div', 'title-card');
    const saved = hasSave();
    const button = el('button', '', saved ? TEXT.continueGame : TEXT.start);
    button.addEventListener('click', () => {
      this.sound.unlock();
      this.start();
    });
    card.append(el('div', 'title-cats', '🐱 🐈 🐱'), el('h1', '', TEXT.title), el('p', '', TEXT.tagline), button, el('div', 'title-hint', TEXT.startHint));
    if (saved) {
      const fresh = el('button', 'title-new', TEXT.newGame);
      fresh.addEventListener('click', () => {
        if (window.confirm(TEXT.newGameConfirm)) {
          clearSave();
          window.location.reload();
        }
      });
      card.append(fresh);
    }
    screen.append(card);
    this.ui.append(screen);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.ui.classList.remove('on-title');
    this.ui.querySelector('.title-screen')?.remove();
  }

  /** Sounds and messages for what just happened in the game. */
  private react(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hearts':
          this.sound.play('heart');
          this.sound.play(e.count > 1 || Math.random() < 0.5 ? 'purr' : 'meow');
          break;
        case 'coin':
          this.sound.play('coin');
          break;
        case 'magic':
          this.sound.play('magic');
          break;
        case 'jump':
          this.sound.play('jump');
          break;
        case 'land':
          this.sound.play('land');
          break;
        case 'feed':
          this.sound.play('eat');
          break;
        case 'yarn':
          this.sound.play('throw');
          break;
        case 'place':
          this.sound.play('door');
          break;
        case 'openShop':
          this.openShop('shop');
          break;
        case 'openSchool':
          this.held.clear();
          this.school.open();
          this.sound.play('door');
          break;
        case 'openWardrobe':
          this.openShop('wardrobe');
          break;
        case 'search':
          this.sound.play(e.found > 0 ? 'found' : 'empty');
          this.hud.say(TEXT.searched(e.spot, e.found));
          break;
        case 'bowls':
          this.sound.play(e.milk || e.food ? 'pour' : 'nope');
          this.hud.say(TEXT.bowls(e.milk, e.food, e.noFood));
          break;
        case 'carry':
          this.sound.play('pickUp');
          break;
        case 'drop':
          this.sound.play('putDown');
          break;
        case 'kitten': {
          this.sound.play('kitten');
          const cat = this.game.cat(e.cat);
          if (cat) this.hud.say(TEXT.kitten(cat.name));
          break;
        }
        case 'newCat':
        case 'coinSpawn':
          break;
      }
    }
  }

  /** Advance one frame; exposed so tests can drive the game deterministically. */
  frame(dt: number): void {
    const has = (...codes: string[]) => codes.some((c) => this.held.has(c));
    const was = (...codes: string[]) => codes.some((c) => this.pressed.has(c));
    const active = this.started && !this.menuOpen;
    const input: Input = active
      ? {
          left: has('ArrowLeft'),
          right: has('ArrowRight'),
          up: has('ArrowUp'),
          down: has('ArrowDown'),
          enter: was('ArrowUp'),
          jump: was('Space'),
          fly: has('Space'),
          pet: was('Enter', 'NumpadEnter'),
          // Z sits where Y is on an English keyboard; accept both so it works either way.
          magic: was('KeyZ', 'KeyY'),
          feed: was('Digit1', 'Numpad1'),
          treat: was('Digit2', 'Numpad2'),
          yarn: was('Digit3', 'Numpad3'),
          carry: was('KeyN'),
        }
      : { left: false, right: false, jump: false, fly: false, pet: false, magic: false };
    this.pressed = new Set();
    if (this.menuOpen) this.held.clear();
    // The world keeps breathing behind a menu, but nobody moves.
    this.game.step(active ? dt : 0, input);
    const events = this.game.drainEvents();
    this.world.handleEvents(events);
    this.react(events);
    const flying = !this.game.girl.onGround && input.fly;
    if (flying) {
      this.twinkleIn -= dt;
      if (this.twinkleIn <= 0) {
        this.twinkleIn = 0.22;
        this.sound.play('twinkle');
      }
    }
    this.world.update(dt, flying);
    this.hud.update(this.world);
    this.world.render();
  }
}
