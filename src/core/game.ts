// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { cleanName, COATS, DEFAULT_NAMES } from './cats';
import { newWardrobe, type Supply, type Wardrobe } from './shop';
import {
  BOWLS,
  bounds,
  BUILDINGS,
  type Building,
  doorAt,
  groundY,
  HOUSE_COIN_SPOTS,
  HOUSE_ENTRY,
  HOUSE_X,
  maxZAt,
  outsideDoor,
  type Place,
  type Spot,
  type SpotId,
  SPOTS,
  WORLD_MAX_X,
  WORLD_MIN_X,
} from './world';

export { groundY, HOUSE_X, WORLD_MAX_X, WORLD_MIN_X };
export type { Place };

/**
 * The rules of the game, free of Babylon and the DOM so they can be unit tested headless.
 * See `world.ts` for the layout: x left→right, z away from the camera, y up.
 */

export const WALK_SPEED = 6;
export const DEPTH_SPEED = 4.5;
export const GRAVITY = 32;
export const JUMP_SPEED = 11.5;
/** How close the girl has to be to a cat (or a cupboard) to use it. */
export const PET_RANGE = 2.2;
export const SPOT_RANGE = 1.8;
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
/** Indoors the ceiling is lower. */
export const HOUSE_FLY_CEILING = 3.4;
/** Above this height over the ground the fall is gentle; a plain jump never gets this high. */
export const FLOAT_HEIGHT = 2.5;
/** Magic makes every cat within this range happy, once per cooldown. */
export const MAGIC_RANGE = 6;
export const MAGIC_COOLDOWN = 1.2;
/** Hearts a cat gives for a bowl of food or a treat. */
export const SUPPLY_HEARTS: Record<Supply, number> = { food: 3, treat: 2 };
export const MILK_HEARTS = 2;
export const EAT_TIME = 2.5;
export const YARN_THROW_SPEED = 10;
export const YARN_FRICTION = 4;
/** Cats notice a yarn ball this far away and run after it. */
export const YARN_ATTENTION = 14;
export const PLAY_SPEED = 4;
/** A ball lying still for this long is picked up again. */
export const YARN_REST_TIME = 6;
/** After this long the cats lose interest in a throw and the ball comes to rest. */
export const YARN_PLAY_TIME = 10;
/** Cupboards fill up with a coin now and then, and faster when the cats are happy indoors. */
export const SPOT_REFILL_TIME = 20;
export const SPOT_MAX_COINS = 3;
/** A new cat from the shop. */
export const CAT_PRICE = 100;
export const MAX_CATS = 16;
/** Once there are this many cats, happy grown-ups have kittens. */
export const KITTEN_MIN_CATS = 4;
/** Hearts made between two kittens. */
export const KITTEN_HEARTS = 30;
/** Love a grown cat needs before it becomes a parent. */
export const PARENT_LOVE = 10;
export const KITTEN_GROWTH = 0.5;
/** How much a kitten grows per heart. */
export const GROWTH_PER_HEART = 0.02;
/** Well-fed cats get rounder: food adds this much plumpness (0 slim … 1 very round). */
export const PLUMP_PER_FOOD: Record<Supply | 'milk', number> = { food: 0.15, treat: 0.07, milk: 0.05 };
/** Chasing the yarn ball is exercise and slims a cat down again. */
export const PLUMP_PER_POUNCE = 0.04;

export interface Girl {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  /** +1 looks right, -1 looks left. */
  facing: 1 | -1;
  place: Place;
  /** The cat in her arms. */
  carrying: number | null;
}

export type CatMood = 'walk' | 'sit' | 'happy' | 'play' | 'carried' | 'toBowl' | 'eat';

export interface Cat {
  id: number;
  name: string;
  /** Coat id from `cats.ts`. */
  coat: string;
  /** Grown-up size, chosen in the editor. */
  size: number;
  /** 0.5 for a new kitten, 1 when fully grown. The cat is drawn at size × growth. */
  growth: number;
  x: number;
  y: number;
  z: number;
  place: Place;
  dir: 1 | -1;
  /** Sideways drift while walking. */
  dz: number;
  speed: number;
  mood: CatMood;
  /** Seconds left in the current mood. */
  timer: number;
  cooldown: number;
  /** Hearts this cat has made so far. */
  love: number;
  /** The bowl the cat is heading to or eating from. */
  bowl: 'milk' | 'food' | null;
  /** 0 slim … 1 very round, from lots of food. */
  plump: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  z: number;
  place: Place;
}

export interface Yarn {
  x: number;
  y: number;
  z: number;
  place: Place;
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
  /** Up and down arrows: walk further back and further to the front. */
  up?: boolean;
  down?: boolean;
  /** Edge-triggered: true for the one step in which the key went down. */
  jump: boolean;
  /** Space is being held: in the air this is magic flight. */
  fly: boolean;
  /** Enter: pet a cat, or use whatever is in front of her. */
  pet: boolean;
  /** Edge-triggered: cast a spell. */
  magic: boolean;
  /** Edge-triggered: give the nearest cat food, a treat, or throw the yarn ball. */
  feed?: boolean;
  treat?: boolean;
  yarn?: boolean;
  /** Edge-triggered: pick up the nearest cat, or put it down. */
  carry?: boolean;
  /** Edge-triggered ↑, for walking through doors. */
  enter?: boolean;
}

/** What Enter (or ↑) would do right now; the HUD shows it as a hint. */
export type Focus = { kind: 'cat'; cat: Cat } | { kind: 'spot'; spot: Spot } | { kind: 'door'; building: Building } | null;

export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'magic'; x: number; y: number }
  | { type: 'hearts'; cat: number; count: number }
  | { type: 'feed'; cat: number; supply: Supply | 'milk'; fromBowl: boolean }
  | { type: 'yarn' }
  | { type: 'coinSpawn'; coin: number }
  | { type: 'coin'; coin: number }
  | { type: 'place'; place: Place }
  | { type: 'openShop' }
  | { type: 'openSchool' }
  | { type: 'openWardrobe' }
  | { type: 'search'; spot: SpotId; found: number }
  | { type: 'bowls'; milk: boolean; food: boolean; noFood: boolean }
  | { type: 'carry'; cat: number }
  | { type: 'drop'; cat: number }
  | { type: 'kitten'; cat: number }
  | { type: 'newCat'; cat: number };

export type BowlState = Record<'milk' | 'food', boolean>;

export class Game {
  readonly girl: Girl;
  readonly cats: Cat[] = [];
  readonly coins: Coin[] = [];
  hearts = 0;
  yarn: Yarn | null = null;
  readonly bowls: BowlState = { milk: false, food: false };
  /** Coins waiting in each cupboard. */
  readonly spotCoins: Partial<Record<SpotId, number>> = {};
  /** Seconds until the next spell is ready. */
  magicCooldown = 0;
  /** Cats that already made hearts for the current throw. */
  private readonly yarnFans = new Set<number>();
  private heartsSinceCoin = 0;
  private heartsSinceKitten = 0;
  private refillIn = SPOT_REFILL_TIME;
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
    this.girl = { x: startX, y: groundY(startX), z: -1, vx: 0, vy: 0, vz: 0, onGround: true, facing: 1, place: 'garden', carrying: null };
    for (let i = 0; i < catCount; i++) {
      // Most cats play in the garden; every third one lives in the house.
      const place: Place = i % 3 === 2 ? 'house' : 'garden';
      const b = bounds(place);
      const x = b.minX + 4 + this.rng() * (b.maxX - b.minX - 8);
      this.addCat({ coat: COATS[i % 6].id, size: i % 4 === 3 ? 0.75 : 1, growth: 1, x, z: b.minZ + this.rng() * (b.maxZ - b.minZ - 1), place });
    }
    for (const s of SPOTS) if (s.searchable) this.spotCoins[s.id] = 1;
    // A few coins are already lying around, so there is something to find straight away.
    for (const x of [HOUSE_X - 4, HOUSE_X + 9, 20, 100]) this.addGardenCoin(x, -1 + this.rng() * 2);
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

  cat(id: number): Cat | undefined {
    return this.cats.find((c) => c.id === id);
  }

  /** Put a cat into the world, e.g. from a save or the shop. */
  addCat(c: { name?: string; coat: string; size: number; growth: number; x: number; z: number; place: Place; love?: number; plump?: number }): Cat {
    const id = this.cats.reduce((m, k) => Math.max(m, k.id + 1), 0);
    const used = new Set(this.cats.map((k) => k.name));
    const free = DEFAULT_NAMES.find((n) => !used.has(n)) ?? `Katze ${id + 1}`;
    const cat: Cat = {
      id,
      name: cleanName(c.name ?? '', free),
      coat: c.coat,
      size: c.size,
      growth: c.growth,
      x: c.x,
      y: groundY(c.x),
      z: c.z,
      place: c.place,
      dir: this.rng() < 0.5 ? -1 : 1,
      dz: 0,
      speed: 1 + this.rng() * 1.2,
      mood: 'sit',
      timer: 0.5 + this.rng() * 2,
      cooldown: 0,
      love: c.love ?? 0,
      bowl: null,
      plump: c.plump ?? 0,
    };
    this.cats.push(cat);
    return cat;
  }

  /** Buy a new cat for `CAT_PRICE` coins; it appears next to the girl. */
  buyCat(): Cat | null {
    if (this.wardrobe.money < CAT_PRICE || this.cats.length >= MAX_CATS) return null;
    this.wardrobe.money -= CAT_PRICE;
    const g = this.girl;
    const coat = COATS[Math.floor(this.rng() * COATS.length)].id;
    const cat = this.addCat({ coat, size: 1, growth: 1, x: this.clampX(g.place, g.x + g.facing * 1.5), z: g.z, place: g.place });
    this.events.push({ type: 'newCat', cat: cat.id });
    return cat;
  }

  /** After school she goes straight home into the hall. */
  goHome(): void {
    this.moveGirl('house', HOUSE_ENTRY.x, HOUSE_ENTRY.z - 0.6);
  }

  /** Coins for a good grade at school. */
  earn(coins: number): void {
    this.wardrobe.money += Math.max(0, Math.floor(coins));
  }

  /** Change how a cat looks and what it is called. */
  restyleCat(id: number, look: { name?: string; coat?: string; size?: number }): void {
    const cat = this.cat(id);
    if (!cat) return;
    if (look.name !== undefined) cat.name = cleanName(look.name, cat.name);
    if (look.coat !== undefined && COATS.some((c) => c.id === look.coat)) cat.coat = look.coat;
    if (look.size !== undefined && Number.isFinite(look.size)) cat.size = Math.min(1.6, Math.max(0.6, look.size));
  }

  private dist(a: { x: number; z: number; place: Place }, b: { x: number; z: number; place: Place }): number {
    return a.place === b.place ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }

  /** The cat the girl would pet if Enter were pressed now, or null. The cat in her arms counts last. */
  nearestCat(includeCarried = true): Cat | null {
    let best: Cat | null = null;
    let bestD = PET_RANGE;
    for (const c of this.cats) {
      if (c.mood === 'carried') continue;
      const d = this.dist(c, this.girl);
      if (d <= bestD && Math.abs(c.y - this.girl.y) < 2.5) {
        best = c;
        bestD = d;
      }
    }
    if (best || !includeCarried || this.girl.carrying === null) return best;
    return this.cat(this.girl.carrying) ?? null;
  }

  /** What Enter or ↑ would do now: a cat beats a cupboard or a door; the cat in her arms comes last. */
  focus(): Focus {
    const cat = this.nearestCat(false);
    if (cat) return { kind: 'cat', cat };
    const place = this.placeFocus();
    if (place) return place;
    const carried = this.nearestCat();
    return carried ? { kind: 'cat', cat: carried } : null;
  }

  private placeFocus(): Focus {
    const g = this.girl;
    if (g.place === 'house') {
      let best: Spot | null = null;
      let bestD = SPOT_RANGE;
      for (const s of SPOTS) {
        const d = Math.hypot(s.x - g.x, (s.z - g.z) * 0.6);
        if (d <= bestD) {
          best = s;
          bestD = d;
        }
      }
      return best ? { kind: 'spot', spot: best } : null;
    }
    const door = doorAt(g.x, g.z);
    return door ? { kind: 'door', building: door } : null;
  }

  step(dt: number, input: Input): void {
    this.stepGirl(dt, input);
    if (input.pet) this.use();
    else if (input.enter) this.useDoor();
    this.magicCooldown = Math.max(0, this.magicCooldown - dt);
    if (input.magic) this.castMagic();
    if (input.feed) this.give('food');
    if (input.treat) this.give('treat');
    if (input.yarn) this.throwYarn();
    if (input.carry) this.toggleCarry();
    this.stepYarn(dt);
    for (const c of this.cats) this.stepCat(c, dt);
    this.stepSpots(dt);
    this.collectCoins();
  }

  private clampX(place: Place, x: number): number {
    const b = bounds(place);
    return Math.min(b.maxX, Math.max(b.minX, x));
  }

  private clampZ(place: Place, x: number, z: number): number {
    return Math.min(maxZAt(place, x), Math.max(bounds(place).minZ, z));
  }

  private stepGirl(dt: number, input: Input): void {
    const g = this.girl;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const depth = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    g.vx = dir * WALK_SPEED;
    g.vz = depth * DEPTH_SPEED;
    if (dir !== 0) g.facing = dir > 0 ? 1 : -1;
    if (input.jump && g.onGround) {
      g.vy = JUMP_SPEED;
      g.onGround = false;
      this.events.push({ type: 'jump' });
    }
    g.x = this.clampX(g.place, g.x + g.vx * dt);
    g.z = this.clampZ(g.place, g.x, g.z + g.vz * dt);
    const floor = groundY(g.x);
    if (g.onGround) g.y = floor;
    else {
      const ceiling = g.place === 'house' ? HOUSE_FLY_CEILING : FLY_CEILING;
      if (input.fly && g.y < floor + ceiling) {
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
    // Pushing on into a door while standing in front of it walks through.
    if (input.up && !input.enter && g.onGround && g.place === 'garden') {
      const door = doorAt(g.x, g.z);
      if (door && g.z >= door.front - 0.4) this.useDoor();
    }
  }

  /** Enter: pet a cat if one is close, otherwise use the cupboard, bowl or door in front of her. */
  private use(): void {
    const f = this.focus();
    if (!f) return;
    if (f.kind === 'cat') this.makeHappy(f.cat);
    else if (f.kind === 'door') this.useDoor();
    else this.useSpot(f.spot);
  }

  private useDoor(): void {
    const g = this.girl;
    if (g.place === 'garden') {
      const door = doorAt(g.x, g.z);
      if (!door) return;
      if (door.id !== 'house') {
        // Shop and school are menus: she steps back out of the doorway while one is open.
        g.z = door.front - 1.2;
        this.events.push({ type: door.id === 'shop' ? 'openShop' : 'openSchool' });
      } else this.moveGirl('house', HOUSE_ENTRY.x, HOUSE_ENTRY.z - 0.6);
    } else {
      const exit = SPOTS.find((s) => s.id === 'exit');
      if (!exit || Math.abs(g.x - exit.x) > SPOT_RANGE) return;
      const house = BUILDINGS[0];
      const out = outsideDoor(house);
      this.moveGirl('garden', out.x, out.z);
    }
  }

  private moveGirl(place: Place, x: number, z: number): void {
    const g = this.girl;
    g.place = place;
    g.x = x;
    g.z = z;
    g.y = groundY(x);
    g.vy = 0;
    g.onGround = true;
    const carried = g.carrying === null ? undefined : this.cat(g.carrying);
    if (carried) {
      carried.place = place;
      carried.x = x;
      carried.z = z;
    }
    this.events.push({ type: 'place', place });
  }

  private useSpot(s: Spot): void {
    if (s.id === 'exit') {
      this.useDoor();
      return;
    }
    if (s.id === 'bowls') {
      const milk = !this.bowls.milk;
      this.bowls.milk = true;
      let food = false;
      const noFood = !this.bowls.food && this.wardrobe.supplies.food <= 0;
      if (!this.bowls.food && this.wardrobe.supplies.food > 0) {
        this.wardrobe.supplies.food--;
        this.bowls.food = true;
        food = true;
      }
      this.events.push({ type: 'bowls', milk, food, noFood });
      return;
    }
    if (!s.searchable) return;
    const found = this.spotCoins[s.id] ?? 0;
    this.spotCoins[s.id] = 0;
    this.wardrobe.money += found;
    this.events.push({ type: 'search', spot: s.id, found });
    if (s.id === 'wardrobe') this.events.push({ type: 'openWardrobe' });
  }

  /** Put a coin into a random cupboard that still has room. */
  private refillSpot(): void {
    const room = SPOTS.filter((s) => s.searchable && (this.spotCoins[s.id] ?? 0) < SPOT_MAX_COINS);
    if (room.length === 0) return;
    const s = room[Math.floor(this.rng() * room.length)];
    this.spotCoins[s.id] = (this.spotCoins[s.id] ?? 0) + 1;
  }

  private stepSpots(dt: number): void {
    this.refillIn -= dt;
    if (this.refillIn <= 0) {
      this.refillIn = SPOT_REFILL_TIME;
      this.refillSpot();
    }
  }

  private toggleCarry(): void {
    const g = this.girl;
    if (g.carrying !== null) {
      const cat = this.cat(g.carrying);
      g.carrying = null;
      if (!cat) return;
      cat.x = this.clampX(g.place, g.x + g.facing * 0.9);
      cat.z = this.clampZ(g.place, cat.x, g.z);
      cat.y = groundY(cat.x);
      cat.mood = 'sit';
      cat.timer = 1.5;
      this.events.push({ type: 'drop', cat: cat.id });
      return;
    }
    const cat = this.nearestCat();
    if (!cat) return;
    this.releaseBowl(cat);
    g.carrying = cat.id;
    cat.mood = 'carried';
    this.events.push({ type: 'carry', cat: cat.id });
  }

  /** Sparkles around the girl; every cat nearby is delighted. */
  private castMagic(): void {
    if (this.magicCooldown > 0) return;
    this.magicCooldown = MAGIC_COOLDOWN;
    this.events.push({ type: 'magic', x: this.girl.x, y: this.girl.y });
    for (const c of this.cats) if (this.dist(c, this.girl) <= MAGIC_RANGE) this.makeHappy(c);
  }

  /** Food or a treat for the nearest cat, if there is one and the pantry is not empty. */
  private give(supply: Supply): void {
    const cat = this.nearestCat();
    if (!cat || this.wardrobe.supplies[supply] <= 0) return;
    this.wardrobe.supplies[supply]--;
    this.fatten(cat, supply);
    this.events.push({ type: 'feed', cat: cat.id, supply, fromBowl: false });
    cat.cooldown = 0;
    this.makeHappy(cat, SUPPLY_HEARTS[supply], HAPPY_TIME * 1.6);
  }

  private fatten(cat: Cat, food: Supply | 'milk'): void {
    cat.plump = Math.min(1, cat.plump + PLUMP_PER_FOOD[food]);
  }

  private throwYarn(): void {
    if (!this.wardrobe.hasYarn) return;
    const g = this.girl;
    const x = this.clampX(g.place, g.x + g.facing * 0.8);
    this.yarn = { x, y: groundY(x) + 0.25, z: g.z, place: g.place, vx: g.facing * YARN_THROW_SPEED, rest: 0, spin: 0, age: 0 };
    this.yarnFans.clear();
    this.events.push({ type: 'yarn' });
  }

  private stepYarn(dt: number): void {
    const y = this.yarn;
    if (!y) return;
    y.age += dt;
    const speed = Math.max(0, Math.abs(y.vx) - YARN_FRICTION * dt);
    y.vx = Math.sign(y.vx) * speed;
    y.x += y.vx * dt;
    const b = bounds(y.place);
    if (y.x < b.minX || y.x > b.maxX) {
      y.x = this.clampX(y.place, y.x);
      y.vx = -y.vx * 0.5;
    }
    y.y = groundY(y.x) + 0.25;
    y.spin += (y.vx / 0.25) * dt;
    y.rest = speed === 0 ? y.rest + dt : 0;
    if (y.rest > YARN_REST_TIME) this.yarn = null;
  }

  private makeHappy(cat: Cat, count = 1, time = HAPPY_TIME): void {
    if (cat.cooldown > 0) return;
    if (cat.mood !== 'carried') {
      this.releaseBowl(cat);
      cat.mood = 'happy';
      cat.timer = time;
      // Cats turn to look at whoever pets them.
      cat.dir = this.girl.x < cat.x ? -1 : 1;
    }
    cat.cooldown = PET_COOLDOWN;
    cat.love += count;
    if (cat.growth < 1) cat.growth = Math.min(1, cat.growth + count * GROWTH_PER_HEART);
    this.hearts += count;
    this.events.push({ type: 'hearts', cat: cat.id, count });
    this.heartsSinceCoin += count;
    while (this.heartsSinceCoin >= HEARTS_PER_COIN) {
      this.heartsSinceCoin -= HEARTS_PER_COIN;
      if (cat.place === 'garden') {
        const side = this.rng() < 0.5 ? -1 : 1;
        this.addGardenCoin(cat.x + side * (1.2 + this.rng() * 1.5), cat.z);
      } else this.addHouseCoin();
    }
    this.heartsSinceKitten += count;
    if (this.heartsSinceKitten >= KITTEN_HEARTS) {
      this.heartsSinceKitten = 0;
      this.maybeKitten(cat);
    }
  }

  /** With enough happy cats around, two grown-ups that love the girl get a kitten. */
  private maybeKitten(near: Cat): void {
    if (this.cats.length < KITTEN_MIN_CATS || this.cats.length >= MAX_CATS) return;
    const parents = this.cats.filter((c) => c.growth >= 1 && c.love >= PARENT_LOVE && c.place === near.place);
    if (parents.length < 2) return;
    const coat = parents[Math.floor(this.rng() * parents.length)].coat;
    const x = this.clampX(near.place, near.x + (this.rng() < 0.5 ? -1 : 1));
    const kitten = this.addCat({ coat, size: near.size, growth: KITTEN_GROWTH, x, z: near.z, place: near.place });
    this.events.push({ type: 'kitten', cat: kitten.id });
  }

  private addGardenCoin(x: number, z: number): void {
    const cx = this.clampX('garden', x);
    this.pushCoin({ x: cx, y: groundY(cx) + 0.8, z: this.clampZ('garden', cx, z), place: 'garden' });
  }

  /** Happy cats indoors put a coin on the table, into a bowl or on the tub — or into a cupboard. */
  private addHouseCoin(): void {
    const free = HOUSE_COIN_SPOTS.filter((p) => !this.coins.some((c) => c.place === 'house' && Math.abs(c.x - p.x) < 0.3 && Math.abs(c.z - p.z) < 0.3));
    if (free.length === 0) {
      this.refillSpot();
      return;
    }
    const p = free[Math.floor(this.rng() * free.length)];
    this.pushCoin({ x: p.x, y: p.y, z: p.z, place: 'house' });
  }

  pushCoin(c: Omit<Coin, 'id'>): Coin {
    const coin = { id: this.nextCoinId++, ...c };
    this.coins.push(coin);
    this.events.push({ type: 'coinSpawn', coin: coin.id });
    return coin;
  }

  private collectCoins(): void {
    const g = this.girl;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      const dy = c.y - g.y;
      if (c.place === g.place && Math.abs(c.x - g.x) < COIN_PICKUP_RANGE && Math.abs(c.z - g.z) < 1 && dy > -0.5 && dy < 2.2) {
        this.coins.splice(i, 1);
        this.wardrobe.money++;
        this.events.push({ type: 'coin', coin: c.id });
      }
    }
  }

  private releaseBowl(cat: Cat): void {
    cat.bowl = null;
  }

  private stepCat(c: Cat, dt: number): void {
    c.cooldown = Math.max(0, c.cooldown - dt);
    if (c.mood === 'carried') {
      const g = this.girl;
      if (g.carrying !== c.id) {
        c.mood = 'sit';
        return;
      }
      c.place = g.place;
      c.x = g.x;
      c.z = g.z;
      c.y = g.y;
      c.dir = g.facing;
      return;
    }
    if (this.goEat(c, dt)) return;
    if (this.chaseYarn(c, dt)) return;
    c.timer -= dt;
    if (c.timer <= 0) {
      if (c.mood === 'sit') {
        c.mood = 'walk';
        c.timer = 2 + this.rng() * 3;
        c.dir = this.rng() < 0.5 ? -1 : 1;
        c.dz = (this.rng() - 0.5) * 1.2;
      } else {
        c.mood = 'sit';
        c.timer = 1.5 + this.rng() * 3;
      }
    }
    if (c.mood === 'walk') {
      const b = bounds(c.place);
      c.x += c.dir * c.speed * dt;
      if (c.x < b.minX + 0.5) {
        c.x = b.minX + 0.5;
        c.dir = 1;
      } else if (c.x > b.maxX - 0.5) {
        c.x = b.maxX - 0.5;
        c.dir = -1;
      }
      const z = c.z + c.dz * dt;
      const clamped = this.clampZ(c.place, c.x, z);
      if (clamped !== z) c.dz = -c.dz;
      c.z = clamped;
    }
    c.z = this.clampZ(c.place, c.x, c.z);
    c.y = groundY(c.x);
  }

  /** Walk towards (x, z) at `speed`; true once there. */
  private walkTo(c: Cat, x: number, z: number, speed: number, dt: number): boolean {
    const dx = x - c.x;
    const dz = z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.35) return true;
    const step = Math.min(d, speed * dt);
    c.x += (dx / d) * step;
    c.z += (dz / d) * step;
    if (Math.abs(dx) > 0.05) c.dir = dx < 0 ? -1 : 1;
    c.y = groundY(c.x);
    return false;
  }

  /** Indoor cats go to a filled bowl, eat, and are delighted — and leave a coin in the bowl. */
  private goEat(c: Cat, dt: number): boolean {
    if (c.place !== 'house' || c.mood === 'happy') return false;
    if (c.bowl === null) {
      const claimed = new Set(this.cats.map((k) => k.bowl));
      const bowl = (['food', 'milk'] as const).find((b) => this.bowls[b] && !claimed.has(b));
      if (!bowl) return false;
      c.bowl = bowl;
      c.mood = 'toBowl';
    }
    const target = BOWLS[c.bowl];
    if (c.mood === 'toBowl') {
      if (this.walkTo(c, target.x - c.dir * 0.2, target.z + 0.5, 2.5, dt)) {
        c.mood = 'eat';
        c.timer = EAT_TIME;
        c.dir = target.x > c.x ? 1 : -1;
      }
      return true;
    }
    c.timer -= dt;
    if (c.timer > 0) return true;
    const bowl = c.bowl;
    this.bowls[bowl] = false;
    this.fatten(c, bowl);
    c.bowl = null;
    this.events.push({ type: 'feed', cat: c.id, supply: bowl, fromBowl: true });
    c.cooldown = 0;
    this.makeHappy(c, bowl === 'food' ? SUPPLY_HEARTS.food : MILK_HEARTS, HAPPY_TIME * 1.6);
    // The computer puts a coin into the empty bowl because the cat was so happy.
    this.pushCoin({ x: target.x, y: 0.45, z: target.z, place: 'house' });
    return true;
  }

  /** A rolling or freshly thrown yarn ball is irresistible. Returns true while the cat is playing. */
  private chaseYarn(c: Cat, dt: number): boolean {
    const y = this.yarn;
    if (!y || y.age > YARN_PLAY_TIME || c.mood === 'happy' || this.dist(c, y) > YARN_ATTENTION) {
      if (c.mood === 'play') {
        c.mood = 'sit';
        c.timer = 1;
      }
      return false;
    }
    c.mood = 'play';
    if (this.walkTo(c, y.x - (y.x > c.x ? 0.5 : -0.5), y.z, PLAY_SPEED, dt)) {
      // Pounce: the ball gets a little bat, and the first catch of each throw makes the cat happy.
      y.vx = c.dir * (2 + this.rng() * 2);
      y.rest = 0;
      c.plump = Math.max(0, c.plump - PLUMP_PER_POUNCE);
      if (!this.yarnFans.has(c.id)) {
        this.yarnFans.add(c.id);
        this.makeHappy(c, 1);
      }
    }
    return true;
  }
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
