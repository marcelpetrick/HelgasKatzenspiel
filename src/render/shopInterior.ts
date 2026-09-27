// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Cat } from '../core/game';
import { CATALOG } from '../core/shop';
import { INTERIOR_MAX_Z, SHELVES, SHOP_INTERIOR_WIDTH, SHOP_INTERIOR_X, SHOP_TILL_X, type ShelfId } from '../core/world';
import { TEXT } from '../ui/text';
import { CatView } from './catView';
import { fanMesh, glowMaterial, heartOutline, material, signMaterial } from './shapes';

const BACK = INTERIOR_MAX_Z + 0.7;
const WALL_H = 12;
const FRONT = -7;
const SHELF_W = 3;
const SHELF_H = 3.6;

export interface ShopInterior {
  root: TransformNode;
  /** Let the shopkeeper cat breathe, blink and look around. */
  tick(dt: number): void;
}

/** Inside the cat shop: four shelves, one per page of the shop menu, a door, and a cat at the till. */
export function buildShopInterior(scene: Scene, addCaster: (m: Mesh) => void): ShopInterior {
  const root = new TransformNode('shopInterior', scene);
  const put = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number, cast = true) => {
    m.material = mat;
    m.parent = root;
    m.position.set(x, y, z);
    m.receiveShadows = true;
    if (cast) addCaster(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => MeshBuilder.CreateBox('sb', { width: w, height: h, depth: d }, scene);
  const ball = (d: number) => MeshBuilder.CreateSphere('sball', { diameter: d, segments: 10 }, scene);
  const white = material(scene, 'shopInWhite', '#fbf8f4', 0.2, 0.08);
  const wood = material(scene, 'shopInWood', '#c98a57', 0.1, 0.05);
  const gold = material(scene, 'shopInGold', '#ffc83d', 0.8, 0.2);
  const mid = SHOP_INTERIOR_X + SHOP_INTERIOR_WIDTH / 2;

  // Walls, a checked floor and the end walls, in the colours of the shop outside.
  put(box(SHOP_INTERIOR_WIDTH, WALL_H, 0.3), material(scene, 'shopInWall', '#c9f0ff', 0.05, 0.04), mid, WALL_H / 2, BACK, false);
  put(box(SHOP_INTERIOR_WIDTH, 0.3, BACK - FRONT), material(scene, 'shopInFloor', '#fff4fa', 0.15, 0.05), mid, -0.15, (BACK + FRONT) / 2, false);
  const tile = material(scene, 'shopInTile', '#ffc4de', 0.15, 0.05);
  for (let tx = 0; tx < SHOP_INTERIOR_WIDTH / 2; tx++)
    for (let tz = 0; tz < 5; tz++) if ((tx + tz) % 2 === 0) put(box(2, 0.02, 2), tile, SHOP_INTERIOR_X + 1 + tx * 2, 0.01, BACK - 1 - tz * 2, false);
  put(box(SHOP_INTERIOR_WIDTH, 0.35, 0.1), white, mid, 0.17, BACK - 0.2, false);
  put(box(SHOP_INTERIOR_WIDTH, 0.25, 0.1), material(scene, 'shopInBorder', '#ff7eb6', 0.1, 0.15), mid, 5.4, BACK - 0.2, false);
  for (const x of [SHOP_INTERIOR_X - 0.2, SHOP_INTERIOR_X + SHOP_INTERIOR_WIDTH + 0.2])
    put(box(0.4, WALL_H, BACK - FRONT), white, x, WALL_H / 2, (BACK + FRONT) / 2, false);

  const goods: Record<Exclude<ShelfId, 'exit'>, (x: number, y: number, i: number) => void> = {
    // Shirts and skirts in all the colours the shop sells.
    clothes: (x, y, i) => {
      const wear = CATALOG.filter((item) => item.kind === 'wear' && (item.slot === 'top' || item.slot === 'skirt'));
      const item = wear[i % wear.length];
      if (item.kind === 'wear') put(box(0.55, 0.6, 0.3), material(scene, `shopShirt${i}`, item.color, 0.1, 0.12), x, y + 0.32, BACK - 0.9);
    },
    // Tins of cat food and balls of yarn.
    cats: (x, y, i) => {
      if (i % 2 === 0)
        put(
          MeshBuilder.CreateCylinder('tin', { height: 0.45, diameter: 0.4, tessellation: 14 }, scene),
          material(scene, `shopTin${i}`, ['#ff9f43', '#6ec6ff', '#8bd450'][i % 3], 0.4, 0.1),
          x,
          y + 0.24,
          BACK - 0.9,
        );
      else put(ball(0.45), material(scene, `shopYarn${i}`, ['#ff5c8a', '#b388ff', '#ffd23f'][i % 3], 0.1, 0.12), x, y + 0.24, BACK - 0.9);
    },
    // Tomatoes, apples, oranges and leeks.
    kitchen: (x, y, i) => {
      const colours = ['#ff4d3d', '#ff6b6b', '#ffa531', '#fff8e8'];
      if (i % 5 === 4)
        put(
          MeshBuilder.CreateCylinder('leek', { height: 0.7, diameter: 0.14 }, scene),
          material(scene, 'shopLeek', '#7ccf5a', 0.1, 0.1),
          x,
          y + 0.36,
          BACK - 0.9,
        ).rotation.z = 1.3;
      else put(ball(0.34), material(scene, `shopVeg${i % 4}`, colours[i % 4], 0.3, 0.1), x, y + 0.18, BACK - 0.9);
    },
    // Flower pots and little pictures.
    deco: (x, y, i) => {
      if (i % 2 === 0) {
        put(
          MeshBuilder.CreateCylinder('pot', { height: 0.35, diameterTop: 0.4, diameterBottom: 0.3, tessellation: 14 }, scene),
          material(scene, 'shopPot', '#d9794a', 0.1, 0.05),
          x,
          y + 0.18,
          BACK - 0.9,
        );
        put(ball(0.3), material(scene, `shopFlower${i}`, ['#ff7eb6', '#ffd23f', '#b388ff'][i % 3], 0.1, 0.3), x, y + 0.5, BACK - 0.9, false);
      } else {
        put(box(0.5, 0.6, 0.06), gold, x, y + 0.32, BACK - 0.7, false);
        put(box(0.4, 0.5, 0.04), material(scene, `shopPic${i}`, ['#8bd450', '#6ec6ff'][i % 2], 0.1, 0.35), x, y + 0.32, BACK - 0.74, false);
      }
    },
  };

  for (const shelf of SHELVES) {
    if (shelf.id === 'exit') continue;
    // A shelf with three boards, filled with what that page of the shop sells, and a sign on top.
    put(box(SHELF_W, SHELF_H, 0.15), wood, shelf.x, SHELF_H / 2, BACK - 0.35);
    for (const side of [-1, 1]) put(box(0.15, SHELF_H, 1.1), wood, shelf.x + side * (SHELF_W / 2), SHELF_H / 2, BACK - 0.85);
    let i = 0;
    for (const y of [0.25, 1.35, 2.45]) {
      put(box(SHELF_W, 0.1, 1.1), wood, shelf.x, y, BACK - 0.85, false);
      for (const dx of [-0.95, -0.3, 0.35, 1.0]) goods[shelf.id](shelf.x + dx, y + 0.05, i++);
    }
    const sign = put(
      MeshBuilder.CreatePlane('shelfSign', { width: 2.8, height: 0.7 }, scene),
      signMaterial(scene, `shelfSign-${shelf.id}`, TEXT.signs[shelf.id], '#e0567a', '#fff4fa'),
      shelf.x,
      SHELF_H + 0.7,
      BACK - 0.45,
      false,
    );
    sign.rotation.y = 0;
  }

  // The door back out into the garden, with a heart above it.
  const exit = SHELVES.find((s) => s.id === 'exit');
  if (exit) {
    put(box(2.4, 3.8, 0.3), material(scene, 'shopInDoorFrame', '#8f6bd8', 0.2, 0.05), exit.x, 1.9, BACK - 0.2);
    put(box(2.0, 3.4, 0.1), white, exit.x, 1.8, BACK - 0.4, false);
    put(box(1.6, 1.6, 0.05), material(scene, 'shopInDoorGlass', '#bfe8ff', 0.9, 0.4), exit.x, 2.4, BACK - 0.47, false);
    put(ball(0.18), gold, exit.x + 0.7, 1.7, BACK - 0.5, false);
    put(box(2.4, 0.04, 1.2), material(scene, 'shopInMat', '#8f6bd8', 0.05, 0.05), exit.x, 0.02, BACK - 1.3, false);
    const heart = fanMesh(scene, 'shopInHeart', heartOutline());
    heart.material = glowMaterial(scene, 'shopInHeartMat', '#ff5c8a');
    heart.parent = root;
    heart.scaling.setAll(0.6);
    heart.position.set(exit.x, 4.3, BACK - 0.4);
  }

  // The till: a small counter between the cat shelf and the door, with a friendly shopkeeper cat on it.
  const tillX = SHOP_TILL_X;
  put(box(1.3, 1.2, 1.0), material(scene, 'shopInTill', '#ff9fc6', 0.2, 0.1), tillX, 0.6, BACK - 0.75);
  put(box(1.4, 0.1, 1.1), wood, tillX, 1.25, BACK - 0.75);
  const keeper: Cat = {
    id: -1,
    name: '',
    coat: 'orange',
    size: 0.8,
    growth: 1,
    x: tillX,
    y: 1.3,
    z: BACK - 0.75,
    place: 'shop',
    dir: 1,
    dz: 0,
    speed: 0,
    mood: 'sit',
    timer: 1e9,
    cooldown: 0,
    love: 0,
    bowl: null,
    toy: null,
    hideAt: null,
    plump: 0.3,
  };
  const keeperView = new CatView(scene, keeper, addCaster);
  keeperView.root.parent = root;

  return {
    root,
    tick(dt: number) {
      keeperView.update(keeper, dt, -1);
    },
  };
}
