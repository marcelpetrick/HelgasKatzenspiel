// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { clampSize, cleanName, COATS, DEFAULT_NAMES } from './cats';
import { cook, MEAL_BOOST_TIME, missing, recipe } from './kitchen';
import { DECO_REFILL_BONUS, newWardrobe, type Supply, type Toy, type Wardrobe } from './shop';
import {
  BOWLS,
  bounds,
  BUILDINGS,
  type Building,
  BUSHES,
  doorAt,
  groundY,
  hideSpot,
  HOUSE_COIN_SPOTS,
  HOUSE_ENTRY,
  HOUSE_X,
  maxZAt,
  outsideDoor,
  type Place,
  type Shelf,
  SHELVES,
  SHOP_ENTRY,
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
/** How close the girl has to be to a cat (or a cupboard, or a toy) to use it. */
export const PET_RANGE = 2.2;
export const SPOT_RANGE = 1.8;
export const TOY_RANGE = 1.4;
/** A cat needs this long between two pets before it makes hearts again. */
export const PET_COOLDOWN = 0.5;
/** How long a cat stays happy after being petted. */
export const HAPPY_TIME = 1.6;
/** Every this many hearts, a happy cat drops a coin — at first; see `heartsPerCoin`. */
export const HEARTS_PER_COIN = 3;
/** The more hearts the cats have made in all, the fewer hearts a coin takes. */
export const COIN_SPEEDUPS: readonly { hearts: number; perCoin: number }[] = [
  { hearts: 0, perCoin: HEARTS_PER_COIN },
  { hearts: 60, perCoin: 2 },
  { hearts: 250, perCoin: 1 },
];

/** How many hearts make a coin, once the cats have made `total` hearts altogether. */
export function heartsPerCoin(total: number): number {
  let perCoin = HEARTS_PER_COIN;
  for (const s of COIN_SPEEDUPS) if (total >= s.hearts) perCoin = s.perCoin;
  return perCoin;
}
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
/** Hearts for a treat from the girl's hand, and for a portion from a bowl. */
export const SUPPLY_HEARTS: Record<Supply, number> = { food: 3, treat: 2, milk: 2 };
export const EAT_TIME = 2.5;
/** A bowl of food feeds three cats, a bowl of milk two. */
export const BOWL_PORTIONS: Record<'food' | 'milk', number> = { food: 3, milk: 2 };
/** Cats this far away in the garden still smell the food and come running. */
export const BOWL_CALL_RANGE = 22;
export const RUN_SPEED = 5;
/** When a hungry cat finds the bowl taken, this is how likely it squabbles before waiting. */
export const SQUABBLE_CHANCE = 0.5;
export const SQUABBLE_TIME = 1.1;
export const PLAY_SPEED = 4;
/** Cats notice a freshly thrown toy this far away and run after it. */
export const TOY_ATTENTION = 14;
/** After this long the cats lose interest in a throw; the toy then just lies there. */
export const TOY_PLAY_TIME = 10;
/** How each throwable toy flies and rolls. */
export const TOY_PHYSICS: Record<'yarn' | 'ball' | 'mouse', { speed: number; friction: number; bounce: number }> = {
  yarn: { speed: 10, friction: 4, bounce: 0.5 },
  ball: { speed: 13, friction: 1.6, bounce: 0.8 },
  mouse: { speed: 8, friction: 3, bounce: 0.5 },
};
export const THROWABLES: readonly ('yarn' | 'ball' | 'mouse')[] = ['yarn', 'ball', 'mouse'];
/** The toy mouse darts away from cats this many times per throw. */
export const MOUSE_DASHES = 4;
/** A cat sitting near a toy on the floor sometimes starts playing with it by itself. */
export const IDLE_PLAY_CHANCE = 0.35;
export const IDLE_PLAY_RANGE = 8;
export const FEATHER_RANGE = 4.5;
export const FEATHER_COOLDOWN = 1.5;
/** Cupboards fill up with a coin now and then, and faster when the house is decorated. */
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
/** Grown cats that are loved and fed keep growing slowly, up to this much bigger. */
export const MAX_GROWTH = 1.25;
export const ADULT_GROWTH_PER_HEART = 0.002;
export const GROWTH_PER_FOOD: Record<Supply, number> = { food: 0.01, treat: 0.004, milk: 0.004 };
/** Well-fed cats get rounder: food adds this much plumpness (0 slim … 1 very round). */
export const PLUMP_PER_FOOD: Record<Supply, number> = { food: 0.15, treat: 0.07, milk: 0.05 };
/** Chasing a toy is exercise and slims a cat down again. */
export const PLUMP_PER_POUNCE = 0.04;
export const BACKPACK_SIZE = 3;
/** Hide-and-seek: the girl counts to three, then the cats are hidden behind bushes. */
export const SEEK_COUNT = 3;
export const SEEK_FIND_RANGE = 1.9;
/** Hide-and-seek bushes closer to the girl than this are too easy, unless there are no others. */
export const SEEK_MIN_DISTANCE = 10;
export const SEEK_COINS_PER_CAT = 2;

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
  /** Cats in the backpack, first packed first. */
  backpack: number[];
  /** Seconds left of the "after a good meal" flying boost. */
  boost: number;
}

export type CatMood = 'walk' | 'sit' | 'happy' | 'play' | 'carried' | 'backpack' | 'toBowl' | 'eat' | 'wait' | 'squabble' | 'toHide' | 'hidden';

/** Moods in which a cat is free to notice food, toys or games. */
const IDLE: readonly CatMood[] = ['walk', 'sit', 'play'];

export interface Cat {
  id: number;
  name: string;
  /** Coat id from `cats.ts`. */
  coat: string;
  /** Grown-up size, chosen in the editor. */
  size: number;
  /** 0.5 for a new kitten, 1 when grown up, up to `MAX_GROWTH` when well cared for. The cat is drawn at size × growth. */
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
  /** The bowl the cat is running to, waiting at or eating from. */
  bowl: number | null;
  /** The toy on the floor it is playing with by itself. */
  toy: number | null;
  /** Where it hides during hide-and-seek. */
  hideAt: { x: number; z: number } | null;
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

/** A bowl on the floor. The two kitchen bowls stay; bowls put down with 1 or 4 go when empty. */
export interface Bowl {
  id: number;
  kind: 'food' | 'milk';
  x: number;
  z: number;
  place: Place;
  portions: number;
  fixed: boolean;
  /** The cat eating from it right now. */
  eater: number | null;
}

/** A thrown toy. It rolls, gets chased, and then lies on the floor until it is picked up. */
export interface GroundToy {
  id: number;
  kind: 'yarn' | 'ball' | 'mouse';
  x: number;
  y: number;
  z: number;
  place: Place;
  vx: number;
  spin: number;
  /** Seconds since it was thrown. */
  age: number;
  /** Dashes the mouse still has in it. */
  dashes: number;
  /** Cats that already made hearts for this throw. */
  fans: number[];
}

export interface Seek {
  phase: 'count' | 'seek';
  timer: number;
  cats: number[];
  found: number[];
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
  /** Edge-triggered: put down a bowl of food or milk, give a treat, throw a toy, wave the feather. */
  feed?: boolean;
  treat?: boolean;
  milk?: boolean;
  toy?: boolean;
  feather?: boolean;
  /** Edge-triggered: pick up the nearest cat or put it down; the backpack; hide-and-seek. */
  carry?: boolean;
  backpack?: boolean;
  seek?: boolean;
  /** Edge-triggered ↑, for walking through doors. */
  enter?: boolean;
}

/** What Enter (or ↑) would do right now; the HUD shows it as a hint. */
export type Focus =
  | { kind: 'cat'; cat: Cat }
  | { kind: 'toy'; toy: GroundToy }
  | { kind: 'spot'; spot: Spot }
  | { kind: 'shelf'; shelf: Shelf }
  | { kind: 'door'; building: Building }
  | null;

/** The pages of the shop menu; each shelf in the shop opens one. */
export type ShopTab = 'clothes' | 'cats' | 'kitchen' | 'deco';

export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'magic'; x: number; y: number }
  | { type: 'hearts'; cat: number; count: number }
  | { type: 'feed'; cat: number; supply: Supply; fromBowl: boolean }
  | { type: 'bowlPlaced'; bowl: number }
  | { type: 'bowlGone'; bowl: number }
  | { type: 'noSupply'; supply: Supply }
  | { type: 'eatStart'; cat: number }
  | { type: 'squabble'; cat: number; with: number }
  | { type: 'toyThrow'; toy: number }
  | { type: 'toyPickup'; toy: number }
  | { type: 'noToy'; reason: 'none' | 'lying' }
  | { type: 'feather' }
  | { type: 'coinSpawn'; coin: number }
  | { type: 'coinFaster'; perCoin: number }
  | { type: 'coin'; coin: number }
  | { type: 'place'; place: Place }
  | { type: 'openShop'; tab?: ShopTab }
  | { type: 'openSchool' }
  | { type: 'openWardrobe' }
  | { type: 'openKitchen' }
  | { type: 'search'; spot: SpotId; found: number }
  | { type: 'bowls'; milk: boolean; food: boolean; noFood: boolean }
  | { type: 'carry'; cat: number }
  | { type: 'drop'; cat: number }
  | { type: 'backpackIn'; cat: number }
  | { type: 'backpackOut'; cat: number }
  | { type: 'backpackFull' }
  | { type: 'noBackpack' }
  | { type: 'seekStart'; cats: number }
  | { type: 'seekGo' }
  | { type: 'found'; cat: number; left: number }
  | { type: 'seekDone'; coins: number }
  | { type: 'seekStop' }
  | { type: 'seekNoCats' }
  | { type: 'cooked'; recipe: string }
  | { type: 'meal'; recipe: string; ok: boolean }
  | { type: 'kitten'; cat: number }
  | { type: 'newCat'; cat: number };

export class Game {
  readonly girl: Girl;
  readonly cats: Cat[] = [];
  readonly coins: Coin[] = [];
  readonly bowls: Bowl[] = [];
  readonly toys: GroundToy[] = [];
  hearts = 0;
  /** Coins waiting in each cupboard. */
  readonly spotCoins = Object.fromEntries(SPOTS.map((s) => [s.id, 0])) as Record<SpotId, number>;
  /** The dish on the kitchen table, waiting to be eaten. */
  meal: string | null = null;
  seek: Seek | null = null;
  /** Seconds until the next spell is ready. */
  magicCooldown = 0;
  featherCooldown = 0;
  /** Progress towards the next dropped coin and the next kitten; saved so no progress is lost. */
  heartsSinceCoin = 0;
  heartsSinceKitten = 0;
  private refillIn = SPOT_REFILL_TIME;
  /** Set when she has just come through a door; ↑ has to be let go before it walks through one again. */
  private doorLock = false;
  private nextId = 1;
  private nextToy = 0;
  private events: GameEvent[] = [];
  private readonly rng: () => number;

  constructor(
    seed = 7,
    catCount = 6,
    readonly wardrobe: Wardrobe = newWardrobe(),
  ) {
    this.rng = createRng(seed);
    const startX = HOUSE_X - 14;
    this.girl = {
      x: startX,
      y: groundY(startX),
      z: -1,
      vx: 0,
      vy: 0,
      vz: 0,
      onGround: true,
      facing: 1,
      place: 'garden',
      carrying: null,
      backpack: [],
      boost: 0,
    };
    for (let i = 0; i < catCount; i++) {
      // Most cats play in the garden near home; every third one lives in the house.
      const place: Place = i % 3 === 2 ? 'house' : 'garden';
      const b = bounds(place);
      const x = place === 'garden' ? 6 + this.rng() * 110 : b.minX + 4 + this.rng() * (b.maxX - b.minX - 8);
      this.addCat({ coat: COATS[i % 6].id, size: i % 4 === 3 ? 0.75 : 1, growth: 1, x, z: b.minZ + this.rng() * (b.maxZ - b.minZ - 1), place });
    }
    for (const s of SPOTS) if (s.searchable) this.spotCoins[s.id] = 1;
    // The two kitchen bowls, empty at first.
    for (const kind of ['milk', 'food'] as const)
      this.bowls.push({ id: this.nextId++, kind, ...BOWLS[kind], place: 'house', portions: 0, fixed: true, eater: null });
    // A few coins are already lying around, so there is something to find straight away.
    for (const x of [HOUSE_X - 4, HOUSE_X + 9, 20, 100, 250, 505]) this.addFloorCoin('garden', x, -1 + this.rng() * 2);
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

  bowl(id: number): Bowl | undefined {
    return this.bowls.find((b) => b.id === id);
  }

  kitchenBowl(kind: 'milk' | 'food'): Bowl {
    const b = this.bowls.find((k) => k.fixed && k.kind === kind);
    if (!b) throw new Error(`no kitchen ${kind} bowl`);
    return b;
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
      toy: null,
      hideAt: null,
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
    // A cat bought in the shop waits outside the shop door; anywhere else it appears next to her.
    const shop = BUILDINGS.find((b) => b.id === 'shop');
    const at =
      g.place === 'shop' && shop
        ? { ...outsideDoor(shop), place: 'garden' as const }
        : { x: this.clampX(g.place, g.x + g.facing * 1.5), z: g.z, place: g.place };
    const cat = this.addCat({ coat, size: 1, growth: 1, ...at });
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
    if (look.size !== undefined && Number.isFinite(look.size)) cat.size = clampSize(look.size);
  }

  /** Put the backpack on or take it off; cats inside hop out when it comes off. */
  setBackpack(on: boolean): void {
    const g = this.girl;
    this.wardrobe.wearBackpack = on && this.wardrobe.gear.includes('backpack');
    if (this.wardrobe.wearBackpack) return;
    for (const id of g.backpack.splice(0)) {
      const cat = this.cat(id);
      if (cat) this.setDown(cat, (this.rng() - 0.5) * 2);
    }
  }

  /** Cook a recipe at the stove; the dish then waits on the kitchen table. */
  cookMeal(id: string): 'ok' | 'busy' | 'missing' | 'unknown' {
    const r = recipe(id);
    if (!r) return 'unknown';
    if (this.meal !== null) return 'busy';
    if (!cook(this.wardrobe, r)) return 'missing';
    this.meal = r.id;
    this.events.push({ type: 'cooked', recipe: r.id });
    return 'ok';
  }

  /** Can this recipe be cooked now? Lists what is missing. */
  missingFor(id: string): string[] {
    const r = recipe(id);
    return r ? missing(this.wardrobe, r) : ['unknown'];
  }

  private dist(a: { x: number; z: number; place: Place }, b: { x: number; z: number; place: Place }): number {
    return a.place === b.place ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }

  /** The cat the girl would pet if Enter were pressed now, or null. The cat in her arms counts last. */
  nearestCat(includeCarried = true): Cat | null {
    let best: Cat | null = null;
    let bestD = PET_RANGE;
    for (const c of this.cats) {
      if (c.mood === 'carried' || c.mood === 'backpack' || c.mood === 'hidden' || c.mood === 'toHide') continue;
      const d = this.dist(c, this.girl);
      if (d <= bestD && Math.abs(c.y - this.girl.y) < 2.5) {
        best = c;
        bestD = d;
      }
    }
    if (best || !includeCarried) return best;
    return this.cats.find((c) => c.id === this.girl.carrying) ?? null;
  }

  private nearestToy(): GroundToy | null {
    let best: GroundToy | null = null;
    let bestD = TOY_RANGE;
    for (const t of this.toys) {
      const d = this.dist(t, this.girl);
      if (d <= bestD && t.age > 0.5) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  /** What Enter or ↑ would do now: a cat, then a toy, then a cupboard or door; the cat in her arms last. */
  focus(): Focus {
    const cat = this.nearestCat(false);
    if (cat) return { kind: 'cat', cat };
    const toy = this.nearestToy();
    if (toy) return { kind: 'toy', toy };
    const place = this.placeFocus();
    if (place) return place;
    const carried = this.nearestCat();
    return carried ? { kind: 'cat', cat: carried } : null;
  }

  private placeFocus(): Focus {
    const g = this.girl;
    if (g.place !== 'garden') {
      const best = this.nearestSpot<Spot | Shelf>(g.place === 'house' ? SPOTS : SHELVES);
      if (!best) return null;
      return g.place === 'house' ? { kind: 'spot', spot: best as Spot } : { kind: 'shelf', shelf: best as Shelf };
    }
    const door = g.onGround ? doorAt(g.x, g.z) : null;
    return door ? { kind: 'door', building: door } : null;
  }

  private nearestSpot<T extends { x: number; z: number }>(spots: readonly T[]): T | null {
    const g = this.girl;
    let best: T | null = null;
    let bestD = SPOT_RANGE;
    for (const s of spots) {
      const d = Math.hypot(s.x - g.x, (s.z - g.z) * 0.6);
      if (d <= bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  step(dt: number, input: Input): void {
    this.stepGirl(dt, input);
    if (input.pet) this.use();
    else if (input.enter) this.useDoor();
    this.magicCooldown = Math.max(0, this.magicCooldown - dt);
    this.featherCooldown = Math.max(0, this.featherCooldown - dt);
    if (input.magic) this.castMagic();
    if (input.feed) this.placeBowl('food');
    if (input.milk) this.placeBowl('milk');
    if (input.treat) this.giveTreat();
    if (input.toy) this.throwToy();
    if (input.feather) this.waveFeather();
    if (input.carry) this.toggleCarry();
    if (input.backpack) this.useBackpack();
    if (input.seek) this.toggleSeek();
    this.stepToys(dt);
    this.stepSeek(dt);
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

  /**
   * Move something standing on the ground by (dx, dz). A building's front wall is solid: walking
   * sideways into it from behind is refused, instead of snapping to the front of the wall.
   */
  private slide(p: { x: number; z: number; place: Place }, dx: number, dz: number): boolean {
    const nx = this.clampX(p.place, p.x + dx);
    const blocked = p.z > maxZAt(p.place, nx) + 1e-6;
    if (!blocked) p.x = nx;
    p.z = this.clampZ(p.place, p.x, p.z + dz);
    return !blocked;
  }

  private stepGirl(dt: number, input: Input): void {
    const g = this.girl;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const depth = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    g.vx = dir * WALK_SPEED;
    g.vz = depth * DEPTH_SPEED;
    if (dir !== 0) g.facing = dir > 0 ? 1 : -1;
    g.boost = Math.max(0, g.boost - dt);
    if (input.jump && g.onGround) {
      g.vy = JUMP_SPEED;
      g.onGround = false;
      this.events.push({ type: 'jump' });
    }
    this.slide(g, g.vx * dt, g.vz * dt);
    const floor = groundY(g.x);
    if (g.onGround) g.y = floor;
    else {
      const ceiling = g.place !== 'garden' ? HOUSE_FLY_CEILING : FLY_CEILING * (g.boost > 0 ? 2 : 1);
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
    if (!input.up) this.doorLock = false;
    if (input.up && !input.enter && !this.doorLock && g.onGround && g.place === 'garden') {
      const door = doorAt(g.x, g.z);
      if (door && g.z >= door.front - 0.4) this.useDoor();
    }
  }

  /** Enter: pet a cat, pick up a toy, or use the cupboard, bowl or door in front of her. */
  private use(): void {
    const f = this.focus();
    if (!f) return;
    if (f.kind === 'cat') this.makeHappy(f.cat);
    else if (f.kind === 'toy') this.pickUpToy(f.toy);
    else if (f.kind === 'door') this.useDoor();
    else if (f.kind === 'shelf') {
      if (f.shelf.id === 'exit') this.useDoor();
      else this.events.push({ type: 'openShop', tab: f.shelf.id });
    } else this.useSpot(f.spot);
  }

  private useDoor(): void {
    const g = this.girl;
    if (!g.onGround) return;
    if (g.place === 'garden') {
      const door = doorAt(g.x, g.z);
      if (!door) return;
      if (door.id === 'school') {
        // School is a menu: she steps back out of the doorway while class is on.
        g.z = door.front - 1.2;
        this.events.push({ type: 'openSchool' });
      } else if (door.id === 'shop') this.moveGirl('shop', SHOP_ENTRY.x, SHOP_ENTRY.z - 0.6);
      else this.moveGirl('house', HOUSE_ENTRY.x, HOUSE_ENTRY.z - 0.6);
    } else {
      const exits: readonly { id: string; x: number }[] = g.place === 'house' ? SPOTS : SHELVES;
      const exit = exits.find((s) => s.id === 'exit');
      if (!exit || Math.abs(g.x - exit.x) > SPOT_RANGE) return;
      const out = outsideDoor(BUILDINGS.find((b) => b.id === g.place) ?? BUILDINGS[0]);
      this.moveGirl('garden', out.x, out.z);
    }
  }

  private moveGirl(place: Place, x: number, z: number): void {
    const g = this.girl;
    this.doorLock = true;
    g.place = place;
    g.x = x;
    g.z = z;
    g.y = groundY(x);
    g.vy = 0;
    g.onGround = true;
    for (const id of [...(g.carrying === null ? [] : [g.carrying]), ...g.backpack]) {
      const cat = this.cat(id);
      if (!cat) continue;
      cat.place = place;
      cat.x = x;
      cat.z = z;
    }
    this.events.push({ type: 'place', place });
  }

  private useSpot(s: Spot): void {
    if (s.id === 'exit') {
      this.useDoor();
      return;
    }
    if (s.id === 'stove') {
      this.events.push({ type: 'openKitchen' });
      return;
    }
    if (s.id === 'table') {
      this.eatMeal();
      return;
    }
    if (s.id === 'bowls') {
      const milkBowl = this.kitchenBowl('milk');
      const foodBowl = this.kitchenBowl('food');
      const milk = milkBowl.portions < BOWL_PORTIONS.milk;
      milkBowl.portions = BOWL_PORTIONS.milk;
      let food = false;
      const noFood = foodBowl.portions === 0 && this.wardrobe.supplies.food <= 0;
      if (foodBowl.portions === 0 && this.wardrobe.supplies.food > 0) {
        this.wardrobe.supplies.food--;
        foodBowl.portions = BOWL_PORTIONS.food;
        food = true;
      }
      this.events.push({ type: 'bowls', milk, food, noFood });
      return;
    }
    if (!s.searchable) return;
    const found = this.spotCoins[s.id];
    this.spotCoins[s.id] = 0;
    this.wardrobe.money += found;
    this.events.push({ type: 'search', spot: s.id, found });
    if (s.id === 'wardrobe') this.events.push({ type: 'openWardrobe' });
  }

  private eatMeal(): void {
    if (this.meal === null) return;
    const r = recipe(this.meal);
    if (!r) {
      this.meal = null;
      return;
    }
    if (r.cutlery && !this.wardrobe.gear.includes('cutlery')) {
      this.events.push({ type: 'meal', recipe: r.id, ok: false });
      return;
    }
    this.meal = null;
    this.girl.boost = MEAL_BOOST_TIME;
    this.events.push({ type: 'meal', recipe: r.id, ok: true });
  }

  /** Put a coin into a random cupboard that still has room. */
  private refillSpot(): void {
    const room = SPOTS.filter((s) => s.searchable && this.spotCoins[s.id] < SPOT_MAX_COINS);
    if (room.length === 0) return;
    const s = room[Math.floor(this.rng() * room.length)];
    this.spotCoins[s.id]++;
  }

  private stepSpots(dt: number): void {
    // A decorated house makes the cats happier, so coins turn up faster.
    this.refillIn -= dt * (1 + DECO_REFILL_BONUS * this.wardrobe.deco.length);
    if (this.refillIn <= 0) {
      this.refillIn = SPOT_REFILL_TIME;
      this.refillSpot();
    }
  }

  /** Put a cat down next to the girl. */
  private setDown(cat: Cat, offset: number): void {
    const g = this.girl;
    cat.place = g.place;
    cat.x = this.clampX(g.place, g.x + g.facing * 0.9 + offset);
    cat.z = this.clampZ(g.place, cat.x, g.z);
    cat.y = groundY(cat.x);
    cat.mood = 'sit';
    cat.timer = 1.5;
  }

  private toggleCarry(): void {
    const g = this.girl;
    if (g.carrying !== null) {
      const cat = this.cat(g.carrying);
      g.carrying = null;
      if (!cat) return;
      this.setDown(cat, 0);
      this.events.push({ type: 'drop', cat: cat.id });
      return;
    }
    const cat = this.nearestCat();
    if (!cat) return;
    this.pickUp(cat);
  }

  private pickUp(cat: Cat): void {
    this.leaveBowl(cat);
    this.girl.carrying = cat.id;
    cat.mood = 'carried';
    this.events.push({ type: 'carry', cat: cat.id });
  }

  /** R: the cat in her arms goes into the backpack; with empty arms, the last one comes out again. */
  private useBackpack(): void {
    const g = this.girl;
    if (!this.wardrobe.wearBackpack) {
      this.events.push({ type: 'noBackpack' });
      return;
    }
    if (g.carrying !== null) {
      if (g.backpack.length >= BACKPACK_SIZE) {
        this.events.push({ type: 'backpackFull' });
        return;
      }
      const cat = this.cat(g.carrying);
      g.carrying = null;
      if (!cat) return;
      cat.mood = 'backpack';
      g.backpack.push(cat.id);
      this.events.push({ type: 'backpackIn', cat: cat.id });
      return;
    }
    const id = g.backpack.pop();
    const cat = id === undefined ? undefined : this.cat(id);
    if (!cat) return;
    g.carrying = cat.id;
    cat.mood = 'carried';
    this.events.push({ type: 'backpackOut', cat: cat.id });
  }

  /** Sparkles around the girl; every cat nearby is delighted. */
  private castMagic(): void {
    if (this.magicCooldown > 0) return;
    this.magicCooldown = MAGIC_COOLDOWN;
    this.events.push({ type: 'magic', x: this.girl.x, y: this.girl.y });
    for (const c of this.cats) if (this.reachable(c) && this.dist(c, this.girl) <= MAGIC_RANGE) this.makeHappy(c);
  }

  /** Cats that are out and about: not carried, packed or hidden. */
  private reachable(c: Cat): boolean {
    return c.mood !== 'backpack' && c.mood !== 'hidden' && c.mood !== 'toHide';
  }

  /** 1 and 4: the girl puts a bowl of food or milk down in front of her; the cats come running. */
  private placeBowl(kind: 'food' | 'milk'): void {
    const w = this.wardrobe;
    if (w.supplies[kind] <= 0) {
      this.events.push({ type: 'noSupply', supply: kind });
      return;
    }
    w.supplies[kind]--;
    const g = this.girl;
    const x = this.clampX(g.place, g.x + g.facing * 1.2);
    const bowl: Bowl = {
      id: this.nextId++,
      kind,
      x,
      z: this.clampZ(g.place, x, g.z - 0.2),
      place: g.place,
      portions: BOWL_PORTIONS[kind],
      fixed: false,
      eater: null,
    };
    this.bowls.push(bowl);
    this.events.push({ type: 'bowlPlaced', bowl: bowl.id });
  }

  /** 2: a treat straight from the hand for the nearest cat. */
  private giveTreat(): void {
    const cat = this.nearestCat();
    if (!cat) return;
    if (this.wardrobe.supplies.treat <= 0) {
      this.events.push({ type: 'noSupply', supply: 'treat' });
      return;
    }
    this.wardrobe.supplies.treat--;
    this.fatten(cat, 'treat');
    this.events.push({ type: 'feed', cat: cat.id, supply: 'treat', fromBowl: false });
    cat.cooldown = 0;
    this.makeHappy(cat, SUPPLY_HEARTS.treat, HAPPY_TIME * 1.6);
  }

  private fatten(cat: Cat, food: Supply): void {
    cat.plump = Math.min(1, cat.plump + PLUMP_PER_FOOD[food]);
    this.grow(cat, GROWTH_PER_FOOD[food]);
  }

  /** Kittens grow up to 1; grown cats keep growing slowly up to `MAX_GROWTH`. */
  private grow(cat: Cat, amount: number): void {
    const cap = cat.growth < 1 ? 1 : MAX_GROWTH;
    cat.growth = Math.min(cap, cat.growth + amount);
  }

  /** 3: throw the next toy she still has in her hand; the rest lie wherever they were thrown. */
  private throwToy(): void {
    const owned = THROWABLES.filter((t) => this.wardrobe.toys.includes(t as Toy));
    if (owned.length === 0) {
      this.events.push({ type: 'noToy', reason: 'none' });
      return;
    }
    const inHand = owned.filter((t) => !this.toys.some((g) => g.kind === t));
    if (inHand.length === 0) {
      this.events.push({ type: 'noToy', reason: 'lying' });
      return;
    }
    const kind = inHand[this.nextToy++ % inHand.length];
    const g = this.girl;
    const x = this.clampX(g.place, g.x + g.facing * 0.8);
    const toy: GroundToy = {
      id: this.nextId++,
      kind,
      x,
      y: groundY(x) + 0.25,
      z: g.z,
      place: g.place,
      vx: g.facing * TOY_PHYSICS[kind].speed,
      spin: 0,
      age: 0,
      dashes: kind === 'mouse' ? MOUSE_DASHES : 0,
      fans: [],
    };
    this.toys.push(toy);
    this.events.push({ type: 'toyThrow', toy: toy.id });
  }

  private pickUpToy(toy: GroundToy): void {
    this.toys.splice(this.toys.indexOf(toy), 1);
    for (const c of this.cats) if (c.toy === toy.id) c.toy = null;
    this.events.push({ type: 'toyPickup', toy: toy.id });
  }

  /** 5: wave the feather wand; cats close by leap after it. */
  private waveFeather(): void {
    if (!this.wardrobe.toys.includes('feather')) {
      this.events.push({ type: 'noToy', reason: 'none' });
      return;
    }
    if (this.featherCooldown > 0) return;
    this.featherCooldown = FEATHER_COOLDOWN;
    this.events.push({ type: 'feather' });
    for (const c of this.cats) if (c.mood !== 'carried' && this.reachable(c) && this.dist(c, this.girl) <= FEATHER_RANGE) this.makeHappy(c);
  }

  private stepToys(dt: number): void {
    for (const t of this.toys) {
      t.age += dt;
      const physics = TOY_PHYSICS[t.kind];
      // The toy mouse darts away from any cat that gets close.
      if (t.kind === 'mouse' && t.dashes > 0) {
        const chaser = this.cats.find((c) => c.mood === 'play' && this.dist(c, t) < 2.2);
        if (chaser && Math.abs(t.vx) < 2) {
          t.vx = (t.x >= chaser.x ? 1 : -1) * 6;
          t.dashes--;
        }
      }
      const speed = Math.max(0, Math.abs(t.vx) - physics.friction * dt);
      t.vx = Math.sign(t.vx) * speed;
      const b = bounds(t.place);
      if (!this.slide(t, t.vx * dt, 0) || t.x <= b.minX || t.x >= b.maxX) t.vx = -t.vx * physics.bounce;
      t.y = groundY(t.x) + 0.25;
      t.spin += (t.vx / 0.25) * dt;
    }
  }

  private makeHappy(cat: Cat, count = 1, time = HAPPY_TIME): void {
    if (cat.cooldown > 0) return;
    if (cat.mood !== 'carried') {
      this.leaveBowl(cat);
      cat.toy = null;
      cat.mood = 'happy';
      cat.timer = time;
      // Cats turn to look at whoever pets them.
      cat.dir = this.girl.x < cat.x ? -1 : 1;
    }
    cat.cooldown = PET_COOLDOWN;
    cat.love += count;
    this.grow(cat, count * (cat.growth < 1 ? GROWTH_PER_HEART : ADULT_GROWTH_PER_HEART));
    const perCoin = heartsPerCoin(this.hearts);
    this.hearts += count;
    this.events.push({ type: 'hearts', cat: cat.id, count });
    if (heartsPerCoin(this.hearts) < perCoin) this.events.push({ type: 'coinFaster', perCoin: heartsPerCoin(this.hearts) });
    this.heartsSinceCoin += count;
    while (this.heartsSinceCoin >= heartsPerCoin(this.hearts)) {
      this.heartsSinceCoin -= heartsPerCoin(this.hearts);
      if (cat.place === 'house') this.addHouseCoin();
      else {
        const side = this.rng() < 0.5 ? -1 : 1;
        this.addFloorCoin(cat.place, cat.x + side * (1.2 + this.rng() * 1.5), cat.z);
      }
    }
    this.heartsSinceKitten += count;
    if (this.heartsSinceKitten >= KITTEN_HEARTS) {
      this.heartsSinceKitten -= KITTEN_HEARTS;
      this.maybeKitten(cat);
    }
  }

  /** With enough happy cats around, two grown-ups that love the girl get a kitten. */
  private maybeKitten(near: Cat): void {
    // Kittens are born at home or in the garden, not in the shop.
    if (this.cats.length < KITTEN_MIN_CATS || this.cats.length >= MAX_CATS || near.place === 'shop') return;
    const parents = this.cats.filter((c) => c.growth >= 1 && c.love >= PARENT_LOVE && c.place === near.place);
    if (parents.length < 2) return;
    const coat = parents[Math.floor(this.rng() * parents.length)].coat;
    const x = this.clampX(near.place, near.x + (this.rng() < 0.5 ? -1 : 1));
    const kitten = this.addCat({ coat, size: near.size, growth: KITTEN_GROWTH, x, z: this.clampZ(near.place, x, near.z), place: near.place });
    this.events.push({ type: 'kitten', cat: kitten.id });
  }

  /** A coin on the ground next to a happy cat, in the garden or in the shop. */
  private addFloorCoin(place: Place, x: number, z: number): void {
    const cx = this.clampX(place, x);
    this.pushCoin({ x: cx, y: groundY(cx) + 0.8, z: this.clampZ(place, cx, z), place });
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
    const coin = { id: this.nextId++, ...c };
    this.coins.push(coin);
    this.events.push({ type: 'coinSpawn', coin: coin.id });
    return coin;
  }

  /** Put a toy on the floor, e.g. from a save. */
  pushToy(t: Pick<GroundToy, 'kind' | 'x' | 'z' | 'place'>): GroundToy {
    const toy: GroundToy = { id: this.nextId++, ...t, y: groundY(t.x) + 0.25, vx: 0, spin: 0, age: TOY_PLAY_TIME, dashes: 0, fans: [] };
    this.toys.push(toy);
    return toy;
  }

  /** Put a bowl on the floor, e.g. from a save. */
  pushBowl(b: Omit<Bowl, 'id' | 'eater' | 'fixed'>): Bowl {
    const bowl: Bowl = { id: this.nextId++, ...b, fixed: false, eater: null };
    this.bowls.push(bowl);
    return bowl;
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

  /** A cat stops going for its bowl (it was petted, picked up, …). */
  private leaveBowl(cat: Cat): void {
    const bowl = cat.bowl === null ? undefined : this.bowl(cat.bowl);
    if (bowl?.eater === cat.id) bowl.eater = null;
    cat.bowl = null;
  }

  // ── Hide-and-seek ──

  private toggleSeek(): void {
    if (this.seek) {
      for (const id of this.seek.cats) {
        const c = this.cat(id);
        if (c && (c.mood === 'hidden' || c.mood === 'toHide')) this.unhide(c);
      }
      this.seek = null;
      this.events.push({ type: 'seekStop' });
      return;
    }
    const g = this.girl;
    const cats = this.cats.filter((c) => c.place === 'garden' && c.mood !== 'carried' && c.mood !== 'backpack');
    if (g.place !== 'garden' || cats.length === 0) {
      this.events.push({ type: 'seekNoCats' });
      return;
    }
    const far = BUSHES.filter((b) => Math.abs(b.x - g.x) >= SEEK_MIN_DISTANCE);
    const pool = [...(far.length >= cats.length ? far : BUSHES)];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // There are more bushes than cats can ever be, so every cat gets a bush of its own.
    for (const [i, c] of cats.entries()) {
      const bush = pool[i % pool.length];
      this.leaveBowl(c);
      c.toy = null;
      c.hideAt = hideSpot(bush);
      c.mood = 'toHide';
    }
    this.seek = { phase: 'count', timer: SEEK_COUNT, cats: cats.map((c) => c.id), found: [] };
    this.events.push({ type: 'seekStart', cats: cats.length });
  }

  private unhide(c: Cat): void {
    c.hideAt = null;
    c.mood = 'sit';
    c.timer = 1;
  }

  private stepSeek(dt: number): void {
    const s = this.seek;
    if (!s) return;
    if (s.phase === 'count') {
      s.timer -= dt;
      if (s.timer > 0) return;
      // Eyes open: whoever is not there yet slips into place.
      for (const c of this.cats) {
        if (c.mood !== 'toHide' || !c.hideAt) continue;
        c.x = c.hideAt.x;
        c.z = c.hideAt.z;
        c.y = groundY(c.x);
        c.mood = 'hidden';
      }
      s.phase = 'seek';
      this.events.push({ type: 'seekGo' });
      return;
    }
    const g = this.girl;
    for (const c of this.cats) {
      if (!s.cats.includes(c.id) || s.found.includes(c.id)) continue;
      if (c.mood !== 'hidden') {
        // Picked up or otherwise out of hiding: counts as found.
        s.found.push(c.id);
        continue;
      }
      if (g.place === 'garden' && Math.abs(c.x - g.x) < SEEK_FIND_RANGE && Math.abs(c.z - g.z) < 3) {
        s.found.push(c.id);
        this.unhide(c);
        c.cooldown = 0;
        this.makeHappy(c, 2);
        this.events.push({ type: 'found', cat: c.id, left: s.cats.length - s.found.length });
      }
    }
    if (s.found.length >= s.cats.length) {
      const coins = s.cats.length * SEEK_COINS_PER_CAT;
      this.wardrobe.money += coins;
      this.seek = null;
      this.events.push({ type: 'seekDone', coins });
    }
  }

  // ── Cats ──

  private stepCat(c: Cat, dt: number): void {
    c.cooldown = Math.max(0, c.cooldown - dt);
    if (c.mood === 'carried' || c.mood === 'backpack') {
      const g = this.girl;
      const held = c.mood === 'carried' ? g.carrying === c.id : g.backpack.includes(c.id);
      if (!held) {
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
    if (c.mood === 'hidden') return;
    if (c.mood === 'toHide') {
      const at = c.hideAt ?? c;
      this.walkTo(c, at.x, at.z, 12, dt);
      return;
    }
    if (c.mood === 'squabble') {
      c.timer -= dt;
      if (c.timer <= 0) c.mood = 'wait';
      return;
    }
    if (this.goEat(c, dt)) return;
    if (this.chaseToy(c, dt)) return;
    c.timer -= dt;
    if (c.timer <= 0) {
      if (c.mood === 'sit') {
        if (this.startIdlePlay(c)) return;
        c.mood = 'walk';
        c.timer = 2 + this.rng() * 3;
        c.dir = this.rng() < 0.5 ? -1 : 1;
        c.dz = (this.rng() - 0.5) * 1.2;
      } else {
        c.mood = 'sit';
        c.timer = 1.5 + this.rng() * 3;
        c.toy = null;
      }
    }
    if (c.mood === 'walk') {
      const b = bounds(c.place);
      const moved = this.slide(c, c.dir * c.speed * dt, c.dz * dt);
      if (!moved || c.x <= b.minX + 0.5 || c.x >= b.maxX - 0.5) c.dir = c.dir > 0 ? -1 : 1;
      if (c.z <= b.minZ || c.z >= maxZAt(c.place, c.x)) c.dz = -c.dz;
    }
    c.y = groundY(c.x);
  }

  /** Walk towards (x, z) at `speed`; true once there. Walls are respected. */
  private walkTo(c: Cat, x: number, z: number, speed: number, dt: number): boolean {
    const dx = x - c.x;
    const dz = z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.35) return true;
    const step = Math.min(d, speed * dt);
    // Blocked by a wall while behind a building: come forward first.
    if (!this.slide(c, (dx / d) * step, (dz / d) * step)) c.z = this.clampZ(c.place, c.x, c.z - step);
    if (Math.abs(dx) > 0.05) c.dir = dx < 0 ? -1 : 1;
    c.y = groundY(c.x);
    return false;
  }

  /** The nearest bowl this cat can smell that still has food in it. */
  private findBowl(c: Cat): Bowl | null {
    let best: Bowl | null = null;
    let bestD = c.place === 'garden' ? BOWL_CALL_RANGE : Infinity;
    for (const b of this.bowls) {
      if (b.portions <= 0) continue;
      const d = this.dist(c, b);
      if (d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  /** Hungry cats run to a full bowl; the first one eats, the next ones wait — and sometimes squabble. */
  private goEat(c: Cat, dt: number): boolean {
    if (c.bowl === null) {
      if (!IDLE.includes(c.mood)) return false;
      const bowl = this.findBowl(c);
      if (!bowl) return false;
      c.bowl = bowl.id;
      c.toy = null;
      c.mood = 'toBowl';
    }
    const bowl = this.bowl(c.bowl);
    if (!bowl || bowl.portions <= 0) {
      c.bowl = null;
      c.mood = 'sit';
      c.timer = 1 + this.rng();
      return true;
    }
    const side = c.x < bowl.x ? -1 : 1;
    if (c.mood === 'toBowl' || c.mood === 'wait') {
      const eater = bowl.eater;
      const spot = { x: bowl.x + side * (eater === null ? 0.6 : 1.4) * c.size, z: bowl.z + 0.1 };
      if (!this.walkTo(c, spot.x, spot.z, c.mood === 'toBowl' ? RUN_SPEED : 2, dt)) return true;
      c.dir = side > 0 ? -1 : 1;
      if (eater === null) {
        bowl.eater = c.id;
        c.mood = 'eat';
        c.timer = EAT_TIME;
        this.events.push({ type: 'eatStart', cat: c.id });
      } else if (c.mood === 'toBowl') {
        if (this.rng() < SQUABBLE_CHANCE) {
          c.mood = 'squabble';
          c.timer = SQUABBLE_TIME;
          this.events.push({ type: 'squabble', cat: c.id, with: eater });
        } else c.mood = 'wait';
      }
      return true;
    }
    // Eating.
    c.timer -= dt;
    if (c.timer > 0) return true;
    bowl.portions--;
    bowl.eater = null;
    c.bowl = null;
    this.fatten(c, bowl.kind);
    this.events.push({ type: 'feed', cat: c.id, supply: bowl.kind, fromBowl: true });
    c.cooldown = 0;
    this.makeHappy(c, SUPPLY_HEARTS[bowl.kind], HAPPY_TIME * 1.6);
    if (bowl.portions <= 0) {
      if (bowl.fixed) {
        // The computer puts a coin into the empty kitchen bowl because the cats were so happy.
        this.pushCoin({ x: bowl.x, y: 0.45, z: bowl.z, place: 'house' });
      } else {
        this.bowls.splice(this.bowls.indexOf(bowl), 1);
        this.events.push({ type: 'bowlGone', bowl: bowl.id });
      }
    }
    return true;
  }

  /** A cat sitting near a toy on the floor may start playing with it. */
  private startIdlePlay(c: Cat): boolean {
    if (this.rng() >= IDLE_PLAY_CHANCE) return false;
    const toy = this.toys.find((t) => this.dist(t, c) < IDLE_PLAY_RANGE);
    if (!toy) return false;
    c.toy = toy.id;
    c.mood = 'play';
    c.timer = 3 + this.rng() * 3;
    return true;
  }

  /** Chase a freshly thrown toy, or the toy this cat is playing with. True while playing. */
  private chaseToy(c: Cat, dt: number): boolean {
    let toy = c.toy === null ? undefined : this.toys.find((t) => t.id === c.toy);
    if (!toy && c.mood !== 'happy') toy = this.toys.find((t) => t.age < TOY_PLAY_TIME && this.dist(t, c) <= TOY_ATTENTION);
    if (!toy || c.mood === 'happy') {
      if (c.mood === 'play' && c.toy === null) {
        c.mood = 'sit';
        c.timer = 1;
      }
      return false;
    }
    if (c.toy !== null) {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.toy = null;
        c.mood = 'sit';
        c.timer = 1.5;
        return true;
      }
    }
    c.mood = 'play';
    if (this.walkTo(c, toy.x - (toy.x > c.x ? 0.5 : -0.5), toy.z, PLAY_SPEED, dt)) {
      // Pounce: the toy gets a little bat, and the first catch of each throw makes the cat happy.
      toy.vx = c.dir * (2 + this.rng() * 2);
      c.plump = Math.max(0, c.plump - PLUMP_PER_POUNCE * dt * 4);
      if (toy.age < TOY_PLAY_TIME && !toy.fans.includes(c.id)) {
        toy.fans.push(c.id);
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
