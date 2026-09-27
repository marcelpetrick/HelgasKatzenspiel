// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { newWardrobe, type Supply, type Wardrobe } from './shop';

/**
 * The rules of the game, free of Babylon and the DOM so they can be unit tested headless.
 * The world is a 2D side view: x runs left to right, y is up.
 */

export const WORLD_MIN_X = 2;
export const WORLD_MAX_X = 118;
export const HOUSE_X = 60;
export const HOUSE_HALF_WIDTH = 8;

export const WALK_SPEED = 6;
export const GRAVITY = 32;
export const JUMP_SPEED = 11.5;
/** How close (horizontally) the girl has to be to a cat to pet it. */
export const PET_RANGE = 2.2;
/** A cat needs this long between two pets before it makes hearts again. */
export const PET_COOLDOWN = 0.5;
/** How long a cat stays happy after being petted. */
export const HAPPY_TIME = 1.6;
/** Every this many hearts, a happy cat drops a coin. */
export const HEARTS_PER_COIN = 3;
export const COIN_PICKUP_RANGE = 1.1;
/** Holding Space in the air lifts the girl with this acceleration (magic flight). */
export const FLY_LIFT = 52;
export const FLY_MAX_RISE = 6;
/** Released in the air she floats down no faster than this. */
export const FLOAT_FALL = 3.5;
export const FLY_CEILING = 9;
/** Above this height over the ground the fall is gentle; a plain jump never gets this high. */
export const FLOAT_HEIGHT = 2.5;
/** Magic makes every cat within this range happy, once per cooldown. */
export const MAGIC_RANGE = 6;
export const MAGIC_COOLDOWN = 1.2;
/** Hearts a cat gives for a bowl of food or a treat. */
export const SUPPLY_HEARTS: Record<Supply, number> = { food: 3, treat: 2 };
export const YARN_THROW_SPEED = 10;
export const YARN_FRICTION = 4;
/** Cats notice a yarn ball this far away and run after it. */
export const YARN_ATTENTION = 14;
export const PLAY_SPEED = 4;
/** A ball lying still for this long is picked up again. */
export const YARN_REST_TIME = 6;
/** After this long the cats lose interest in a throw and the ball comes to rest. */
export const YARN_PLAY_TIME = 10;

export const CAT_NAMES = ['Mimi', 'Minka', 'Felix', 'Luna', 'Tiger', 'Schnurri', 'Moritz', 'Kitty'] as const;
export const CAT_COATS = ['orange', 'grau', 'schwarz', 'weiß', 'creme', 'dreifarbig'] as const;
export type CatCoat = (typeof CAT_COATS)[number];

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Height of the walkable ground; gentle hills, flattened where the house stands. */
export function groundY(x: number): number {
  const hills = 1.2 * Math.sin(x * 0.08) + 0.6 * Math.sin(x * 0.21 + 1.3) + 0.25 * Math.sin(x * 0.5 + 0.4);
  const d = Math.abs(x - HOUSE_X);
  const flat = 1 - smoothstep(HOUSE_HALF_WIDTH, HOUSE_HALF_WIDTH + 6, d);
  return hills * (1 - flat) + groundY0() * flat;
}

function groundY0(): number {
  return 1.2 * Math.sin(HOUSE_X * 0.08) + 0.6 * Math.sin(HOUSE_X * 0.21 + 1.3);
}

/** Small deterministic PRNG (mulberry32), so a seed always gives the same cats. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Girl {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  /** +1 looks right, -1 looks left. */
  facing: 1 | -1;
}

export type CatMood = 'walk' | 'sit' | 'happy' | 'play';

export interface Cat {
  id: number;
  name: string;
  coat: CatCoat;
  /** Body size; kittens are smaller. */
  size: number;
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  mood: CatMood;
  /** Seconds left in the current mood. */
  timer: number;
  cooldown: number;
  /** Hearts this cat has made so far. */
  love: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
}

export interface Yarn {
  x: number;
  y: number;
  vx: number;
  /** Seconds the ball has been lying still. */
  rest: number;
  spin: number;
  /** Seconds since the throw. */
  age: number;
}

export interface Input {
  left: boolean;
  right: boolean;
  /** Edge-triggered: true for the one step in which the key went down. */
  jump: boolean;
  /** Space is being held: in the air this is magic flight. */
  fly: boolean;
  pet: boolean;
  /** Edge-triggered: cast a spell. */
  magic: boolean;
  /** Edge-triggered: give the nearest cat food, a treat, or throw the yarn ball. */
  feed?: boolean;
  treat?: boolean;
  yarn?: boolean;
}

export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'magic'; x: number; y: number }
  | { type: 'hearts'; cat: number; x: number; y: number; count: number }
  | { type: 'feed'; cat: number; supply: Supply; x: number; y: number }
  | { type: 'yarn'; x: number; y: number }
  | { type: 'coinSpawn'; coin: number; x: number; y: number }
  | { type: 'coin'; coin: number; x: number; y: number };

export class Game {
  readonly girl: Girl;
  readonly cats: Cat[] = [];
  readonly coins: Coin[] = [];
  hearts = 0;
  yarn: Yarn | null = null;
  /** Cats that already made hearts for the current throw. */
  private yarnFans = new Set<number>();
  /** Seconds until the next spell is ready. */
  magicCooldown = 0;
  private heartsSinceCoin = 0;
  private nextCoinId = 1;
  private events: GameEvent[] = [];
  private readonly rng: () => number;

  constructor(
    seed = 7,
    catCount = 6,
    readonly wardrobe: Wardrobe = newWardrobe(),
  ) {
    this.rng = createRng(seed);
    const startX = HOUSE_X - 14;
    this.girl = { x: startX, y: groundY(startX), vx: 0, vy: 0, onGround: true, facing: 1 };
    for (let i = 0; i < catCount; i++) {
      const x = WORLD_MIN_X + 6 + this.rng() * (WORLD_MAX_X - WORLD_MIN_X - 12);
      this.cats.push({
        id: i,
        name: CAT_NAMES[i % CAT_NAMES.length],
        coat: CAT_COATS[i % CAT_COATS.length],
        size: i % 4 === 3 ? 0.7 : 1,
        x,
        y: groundY(x),
        dir: this.rng() < 0.5 ? -1 : 1,
        speed: 1 + this.rng() * 1.2,
        mood: 'sit',
        timer: 0.5 + this.rng() * 2,
        cooldown: 0,
        love: 0,
      });
    }
    // A few coins are already lying around, so there is something to find straight away.
    for (const x of [HOUSE_X - 4, HOUSE_X + 5, 20, 100]) this.addCoin(x);
  }

  get money(): number {
    return this.wardrobe.money;
  }

  /** Events since the last call, for the renderer and the HUD. */
  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** The cat the girl would pet if Enter were pressed now, or null. */
  nearestCat(): Cat | null {
    let best: Cat | null = null;
    let bestD = PET_RANGE;
    for (const c of this.cats) {
      const d = Math.abs(c.x - this.girl.x);
      if (d <= bestD && Math.abs(c.y - this.girl.y) < 2) {
        best = c;
        bestD = d;
      }
    }
    return best;
  }

  step(dt: number, input: Input): void {
    this.stepGirl(dt, input);
    if (input.pet) this.pet();
    this.magicCooldown = Math.max(0, this.magicCooldown - dt);
    if (input.magic) this.castMagic();
    if (input.feed) this.give('food');
    if (input.treat) this.give('treat');
    if (input.yarn) this.throwYarn();
    this.stepYarn(dt);
    for (const c of this.cats) this.stepCat(c, dt);
    this.collectCoins();
  }

  private stepGirl(dt: number, input: Input): void {
    const g = this.girl;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    g.vx = dir * WALK_SPEED;
    if (dir !== 0) g.facing = dir > 0 ? 1 : -1;
    if (input.jump && g.onGround) {
      g.vy = JUMP_SPEED;
      g.onGround = false;
      this.events.push({ type: 'jump' });
    }
    g.x = Math.min(WORLD_MAX_X, Math.max(WORLD_MIN_X, g.x + g.vx * dt));
    const floor = groundY(g.x);
    if (g.onGround) {
      g.y = floor;
      return;
    }
    if (input.fly && g.y < floor + FLY_CEILING) {
      // The jump's own push fades normally; after that the magic carries her up at a steady pace.
      g.vy = g.vy > FLY_MAX_RISE ? g.vy - GRAVITY * dt : Math.min(FLY_MAX_RISE, g.vy + (FLY_LIFT - GRAVITY) * dt);
    } else {
      g.vy -= GRAVITY * dt;
      // High up (only reachable by flying) she floats down like a feather; ordinary jumps stay snappy.
      if (g.y > floor + FLOAT_HEIGHT) g.vy = Math.max(-FLOAT_FALL, g.vy);
    }
    g.y += g.vy * dt;
    if (g.y <= floor) {
      g.y = floor;
      g.vy = 0;
      g.onGround = true;
      this.events.push({ type: 'land' });
    }
  }

  private pet(): void {
    const cat = this.nearestCat();
    if (cat) this.makeHappy(cat);
  }

  /** Sparkles around the girl; every cat nearby is delighted. */
  private castMagic(): void {
    if (this.magicCooldown > 0) return;
    this.magicCooldown = MAGIC_COOLDOWN;
    this.events.push({ type: 'magic', x: this.girl.x, y: this.girl.y });
    for (const c of this.cats) if (Math.abs(c.x - this.girl.x) <= MAGIC_RANGE) this.makeHappy(c);
  }

  /** Food or a treat for the nearest cat, if there is one and the pantry is not empty. */
  private give(supply: Supply): void {
    const cat = this.nearestCat();
    if (!cat || this.wardrobe.supplies[supply] <= 0) return;
    this.wardrobe.supplies[supply]--;
    this.events.push({ type: 'feed', cat: cat.id, supply, x: cat.x, y: cat.y });
    cat.cooldown = 0;
    this.makeHappy(cat, SUPPLY_HEARTS[supply], HAPPY_TIME * 1.6);
  }

  private throwYarn(): void {
    if (!this.wardrobe.hasYarn) return;
    const g = this.girl;
    const x = Math.min(WORLD_MAX_X, Math.max(WORLD_MIN_X, g.x + g.facing * 0.8));
    this.yarn = { x, y: groundY(x) + 0.25, vx: g.facing * YARN_THROW_SPEED, rest: 0, spin: 0, age: 0 };
    this.yarnFans.clear();
    this.events.push({ type: 'yarn', x, y: this.yarn.y });
  }

  private stepYarn(dt: number): void {
    const y = this.yarn;
    if (!y) return;
    y.age += dt;
    const speed = Math.max(0, Math.abs(y.vx) - YARN_FRICTION * dt);
    y.vx = Math.sign(y.vx) * speed;
    y.x += y.vx * dt;
    if (y.x < WORLD_MIN_X || y.x > WORLD_MAX_X) {
      y.x = Math.min(WORLD_MAX_X, Math.max(WORLD_MIN_X, y.x));
      y.vx = -y.vx * 0.5;
    }
    y.y = groundY(y.x) + 0.25;
    y.spin += (y.vx / 0.25) * dt;
    y.rest = speed === 0 ? y.rest + dt : 0;
    if (y.rest > YARN_REST_TIME) this.yarn = null;
  }

  private makeHappy(cat: Cat, count = 1, time = HAPPY_TIME): void {
    if (cat.cooldown > 0) return;
    cat.mood = 'happy';
    cat.timer = time;
    cat.cooldown = PET_COOLDOWN;
    cat.love += count;
    this.hearts += count;
    this.events.push({ type: 'hearts', cat: cat.id, x: cat.x, y: cat.y, count });
    // Cats turn to look at whoever pets them.
    cat.dir = this.girl.x < cat.x ? -1 : 1;
    this.heartsSinceCoin += count;
    while (this.heartsSinceCoin >= HEARTS_PER_COIN) {
      this.heartsSinceCoin -= HEARTS_PER_COIN;
      const side = this.rng() < 0.5 ? -1 : 1;
      this.addCoin(cat.x + side * (1.2 + this.rng() * 1.5));
    }
  }

  private addCoin(x: number): void {
    const cx = Math.min(WORLD_MAX_X, Math.max(WORLD_MIN_X, x));
    const coin = { id: this.nextCoinId++, x: cx, y: groundY(cx) + 0.8 };
    this.coins.push(coin);
    this.events.push({ type: 'coinSpawn', coin: coin.id, x: coin.x, y: coin.y });
  }

  private collectCoins(): void {
    const g = this.girl;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (Math.abs(c.x - g.x) < COIN_PICKUP_RANGE && c.y - g.y > -0.5 && c.y - g.y < 2.2) {
        this.coins.splice(i, 1);
        this.wardrobe.money++;
        this.events.push({ type: 'coin', coin: c.id, x: c.x, y: c.y });
      }
    }
  }

  private stepCat(c: Cat, dt: number): void {
    c.cooldown = Math.max(0, c.cooldown - dt);
    if (this.chaseYarn(c, dt)) return;
    c.timer -= dt;
    if (c.timer <= 0) {
      if (c.mood === 'walk' || c.mood === 'happy') {
        c.mood = 'sit';
        c.timer = 1.5 + this.rng() * 3;
      } else {
        c.mood = 'walk';
        c.timer = 2 + this.rng() * 3;
        c.dir = this.rng() < 0.5 ? -1 : 1;
      }
    }
    if (c.mood === 'walk') {
      c.x += c.dir * c.speed * dt;
      if (c.x < WORLD_MIN_X + 1) {
        c.x = WORLD_MIN_X + 1;
        c.dir = 1;
      } else if (c.x > WORLD_MAX_X - 1) {
        c.x = WORLD_MAX_X - 1;
        c.dir = -1;
      }
    }
    c.y = groundY(c.x);
  }

  /** A rolling or freshly thrown yarn ball is irresistible. Returns true while the cat is playing. */
  private chaseYarn(c: Cat, dt: number): boolean {
    const y = this.yarn;
    if (!y || y.age > YARN_PLAY_TIME || c.mood === 'happy' || Math.abs(y.x - c.x) > YARN_ATTENTION) {
      if (c.mood === 'play') {
        c.mood = 'sit';
        c.timer = 1;
      }
      return false;
    }
    c.mood = 'play';
    const d = y.x - c.x;
    c.dir = d < 0 ? -1 : 1;
    if (Math.abs(d) > 0.6) {
      c.x += c.dir * Math.min(Math.abs(d), PLAY_SPEED * dt);
    } else {
      // Pounce: the ball gets a little bat, and the first catch of each throw makes the cat happy.
      y.vx = c.dir * (2 + this.rng() * 2);
      y.rest = 0;
      if (!this.yarnFans.has(c.id)) {
        this.yarnFans.add(c.id);
        this.makeHappy(c, 1);
      }
    }
    c.y = groundY(c.x);
    return true;
  }
}
