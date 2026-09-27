// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * The layout of the world: where you can walk, where the buildings stand, where the doors and the
 * cupboards are. x runs left to right, z runs away from the camera (up arrow = further back), y is up.
 *
 * There are two places. The garden is the meadow with the house and the shop. The house interior is
 * built far off to the side of the garden at `INTERIOR_X`, so both share one coordinate system and
 * one scene; walking through a door simply moves the girl from one to the other.
 */

export type Place = 'garden' | 'house';

export const WORLD_MIN_X = 2;
export const WORLD_MAX_X = 118;
export const GARDEN_MIN_Z = -3.2;
export const GARDEN_MAX_Z = 2.6;

export const HOUSE_X = 60;
export const HOUSE_HALF_WIDTH = 8;
export const SHOP_X = 96;
export const SCHOOL_X = 22;

export const INTERIOR_X = 400;
export const INTERIOR_WIDTH = 52;
export const INTERIOR_MIN_Z = -2.6;
export const INTERIOR_MAX_Z = 1.9;

/** A building in the garden. Its front wall blocks the way; its door lets you in. */
export interface Building {
  id: 'house' | 'shop' | 'school';
  x: number;
  halfWidth: number;
  /** z of the front wall. */
  front: number;
}

export const BUILDINGS: readonly Building[] = [
  { id: 'house', x: HOUSE_X, halfWidth: 6, front: 1.2 },
  { id: 'shop', x: SHOP_X, halfWidth: 5, front: 1.4 },
  { id: 'school', x: SCHOOL_X, halfWidth: 6, front: 1.3 },
];

/** How close in x to a door's middle you have to be to walk through it. */
export const DOOR_HALF_WIDTH = 1.1;

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function bounds(place: Place): Bounds {
  return place === 'garden'
    ? { minX: WORLD_MIN_X, maxX: WORLD_MAX_X, minZ: GARDEN_MIN_Z, maxZ: GARDEN_MAX_Z }
    : { minX: INTERIOR_X + 0.8, maxX: INTERIOR_X + INTERIOR_WIDTH - 0.8, minZ: INTERIOR_MIN_Z, maxZ: INTERIOR_MAX_Z };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function hills(x: number): number {
  return 1.2 * Math.sin(x * 0.08) + 0.6 * Math.sin(x * 0.21 + 1.3) + 0.25 * Math.sin(x * 0.5 + 0.4);
}

/** Height of the garden ground: gentle hills, flattened where a building stands. */
export function groundY(x: number): number {
  if (x >= INTERIOR_X - 50) return 0;
  let y = hills(x);
  for (const b of BUILDINGS) {
    const flat = 1 - smoothstep(b.halfWidth + 2, b.halfWidth + 8, Math.abs(x - b.x));
    y = y * (1 - flat) + hills(b.x) * flat;
  }
  return y;
}

export function placeOf(x: number): Place {
  return x >= INTERIOR_X - 50 ? 'house' : 'garden';
}

/** The furthest back you may stand at x, so nobody walks into a building's wall. */
export function maxZAt(place: Place, x: number): number {
  const b = bounds(place);
  if (place === 'house') return b.maxZ;
  for (const building of BUILDINGS) if (Math.abs(x - building.x) < building.halfWidth + 0.4) return building.front - 0.35;
  return b.maxZ;
}

/** The building whose door is right in front of (x, z), if any. */
export function doorAt(x: number, z: number): Building | null {
  for (const b of BUILDINGS) if (Math.abs(x - b.x) < DOOR_HALF_WIDTH && z >= b.front - 0.8) return b;
  return null;
}

/** Something in the house you can use with Enter (or ↑ for the exit door). */
export type SpotId = 'exit' | 'bowls' | 'cupboard' | 'fridge' | 'table' | 'bathCabinet' | 'bathtub' | 'wardrobe' | 'bed';

export interface Spot {
  id: SpotId;
  x: number;
  z: number;
  /** Cupboards you can search for coins. */
  searchable: boolean;
}

/** Rooms from left to right: kitchen, hall with the front door, bathroom, bedroom. */
export const ROOMS = [
  { name: 'Küche', from: INTERIOR_X, to: INTERIOR_X + 17 },
  { name: 'Flur', from: INTERIOR_X + 17, to: INTERIOR_X + 27 },
  { name: 'Bad', from: INTERIOR_X + 27, to: INTERIOR_X + 39 },
  { name: 'Schlafzimmer', from: INTERIOR_X + 39, to: INTERIOR_X + INTERIOR_WIDTH },
] as const;

export const SPOTS: readonly Spot[] = [
  { id: 'fridge', x: INTERIOR_X + 2.2, z: 1.9, searchable: true },
  { id: 'cupboard', x: INTERIOR_X + 5.5, z: 1.9, searchable: true },
  { id: 'bowls', x: INTERIOR_X + 9, z: -0.6, searchable: false },
  { id: 'table', x: INTERIOR_X + 13, z: 0.6, searchable: false },
  { id: 'exit', x: INTERIOR_X + 22, z: 1.9, searchable: false },
  { id: 'bathtub', x: INTERIOR_X + 30.5, z: 1.2, searchable: false },
  { id: 'bathCabinet', x: INTERIOR_X + 36, z: 1.9, searchable: true },
  { id: 'wardrobe', x: INTERIOR_X + 43, z: 1.9, searchable: true },
  { id: 'bed', x: INTERIOR_X + 48.5, z: 1.5, searchable: false },
];

export function spot(id: SpotId): Spot {
  const s = SPOTS.find((p) => p.id === id);
  if (!s) throw new Error(`unknown spot ${id}`);
  return s;
}

/** Where a coin can appear in the house when the cats are happy: on the table, in the bowls, on the tub. */
export const HOUSE_COIN_SPOTS: readonly { x: number; y: number; z: number }[] = [
  { x: INTERIOR_X + 12.4, y: 1.35, z: 0.6 },
  { x: INTERIOR_X + 13.6, y: 1.35, z: 0.6 },
  { x: INTERIOR_X + 8.3, y: 0.45, z: -0.6 },
  { x: INTERIOR_X + 9.7, y: 0.45, z: -0.6 },
  { x: INTERIOR_X + 30.5, y: 1.25, z: 0.2 },
];

/** The two bowls in the kitchen: where they stand and which one is which. */
export const BOWLS = { milk: { x: INTERIOR_X + 8.3, z: -0.6 }, food: { x: INTERIOR_X + 9.7, z: -0.6 } } as const;

/** Where you come out when walking through a door. */
export const HOUSE_ENTRY = { x: INTERIOR_X + 22, z: 1.0 };
export function outsideDoor(b: Building): { x: number; z: number } {
  return { x: b.x, z: b.front - 1.4 };
}
