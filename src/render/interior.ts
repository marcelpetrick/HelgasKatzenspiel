// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { recipe } from '../core/kitchen';
import { BOWLS, INTERIOR_MAX_Z, INTERIOR_WIDTH, INTERIOR_X, ROOMS, spot } from '../core/world';
import { fanMesh, glowMaterial, heartOutline, material, signMaterial } from './shapes';

const BACK = INTERIOR_MAX_Z + 0.7;
const WALL_H = 9;
const FRONT = -7;

export interface Interior {
  root: TransformNode;
  /** Show milk and food in the kitchen bowls. */
  setBowls(milk: boolean, food: boolean): void;
  /** Show the decorations that were bought. */
  setDeco(owned: readonly string[]): void;
  /** Show the cooked dish on the kitchen table, or nothing. */
  setMeal(recipeId: string | null): void;
}

/** Inside the girl's house: kitchen, hall, bathroom and bedroom, side by side like a doll's house. */
export function buildInterior(scene: Scene, addCaster: (m: Mesh) => void): Interior {
  const root = new TransformNode('interior', scene);
  const put = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number, cast = true) => {
    m.material = mat;
    m.parent = root;
    m.position.set(x, y, z);
    m.receiveShadows = true;
    if (cast) addCaster(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => MeshBuilder.CreateBox('b', { width: w, height: h, depth: d }, scene);
  const white = material(scene, 'inWhite', '#fbf8f4', 0.2, 0.08);
  const wood = material(scene, 'inWood', '#c98a57', 0.1, 0.05);
  const darkWood = material(scene, 'inDarkWood', '#8f5a36', 0.1, 0.03);
  const pink = material(scene, 'inPink', '#ff9fc6', 0.2, 0.1);
  const gold = material(scene, 'inGold', '#ffc83d', 0.8, 0.2);
  const metal = material(scene, 'inMetal', '#c9d2dc', 0.8, 0.1);

  // Walls and floors, one colour per room.
  const walls = ['#ffe58a', '#a8ebc6', '#a9d8ff', '#d6c2ff'];
  const floors = ['#e0b07e', '#d9a877', '#f4f7fb', '#d7a37a'];
  ROOMS.forEach((room, i) => {
    const w = room.to - room.from;
    const cx = (room.from + room.to) / 2;
    put(box(w, WALL_H, 0.3), material(scene, `wall${i}`, walls[i], 0.05, 0.04), cx, WALL_H / 2, BACK, false);
    const floorMat = material(scene, `floor${i}`, floors[i], 0.15, 0.05);
    put(box(w, 0.3, BACK - FRONT), floorMat, cx, -0.15, (BACK + FRONT) / 2, false);
    // A skirting board and a strip of wallpaper border for a cosy look.
    put(box(w, 0.35, 0.1), white, cx, 0.17, BACK - 0.2, false);
    put(box(w, 0.25, 0.1), material(scene, `border${i}`, ['#ffb347', '#6fd3a0', '#7fbfff', '#c3a3ff'][i], 0.1, 0.15), cx, 4.6, BACK - 0.2, false);
    // Low divider walls at the back between rooms, so each room reads as its own space.
    if (i > 0) put(box(0.4, WALL_H, 1.0), material(scene, `divider${i}`, walls[i], 0.05, 0.04), room.from, WALL_H / 2, BACK - 0.5);
  });
  // End walls.
  for (const x of [INTERIOR_X - 0.2, INTERIOR_X + INTERIOR_WIDTH + 0.2]) put(box(0.4, WALL_H, BACK - FRONT), white, x, WALL_H / 2, (BACK + FRONT) / 2, false);

  // ── Kitchen ──
  const fridge = spot('fridge');
  put(box(1.8, 3.6, 1.2), white, fridge.x, 1.8, BACK - 0.7);
  put(box(0.08, 0.9, 0.1), metal, fridge.x + 0.6, 2.4, BACK - 1.35, false);
  put(box(0.08, 0.6, 0.1), metal, fridge.x + 0.6, 1.0, BACK - 1.35, false);
  put(box(1.8, 0.05, 0.05), metal, fridge.x, 1.6, BACK - 1.32, false);
  const cup = spot('cupboard');
  // Counter with cupboard doors below and a row of wall cupboards above.
  put(box(4.4, 1.6, 1.2), material(scene, 'counter', '#ffd6e6', 0.2, 0.1), cup.x, 0.8, BACK - 0.7);
  put(box(4.6, 0.15, 1.3), wood, cup.x, 1.65, BACK - 0.7);
  put(box(4.4, 1.4, 0.8), material(scene, 'upper', '#ffd6e6', 0.2, 0.1), cup.x, 3.9, BACK - 0.5);
  for (const dx of [-1.1, 0, 1.1]) {
    put(box(0.95, 1.2, 0.05), white, cup.x + dx, 0.8, BACK - 1.32, false);
    put(MeshBuilder.CreateSphere('knob', { diameter: 0.12 }, scene), gold, cup.x + dx + 0.3, 1.1, BACK - 1.38, false);
    put(box(0.95, 1.1, 0.05), white, cup.x + dx, 3.9, BACK - 0.92, false);
  }
  // Sink tap and a pot on the counter.
  put(MeshBuilder.CreateCylinder('tap', { height: 0.5, diameter: 0.08 }, scene), metal, cup.x - 1.2, 1.95, BACK - 0.4);
  put(
    MeshBuilder.CreateCylinder('pot', { height: 0.45, diameter: 0.6, tessellation: 20 }, scene),
    material(scene, 'pot', '#ff6b6b', 0.5, 0.1),
    cup.x + 1.3,
    1.95,
    BACK - 0.7,
  );

  // Bowls for milk and food, filled when the girl puts something in.
  const dish = material(scene, 'dishMat', '#ff7eb6', 0.4, 0.1);
  const milkMat = material(scene, 'milk', '#ffffff', 0.4, 0.4);
  const foodMat = material(scene, 'kibbleMat', '#a0632f', 0.1, 0.05);
  const fills: Mesh[] = [];
  for (const [b, fill] of [
    [BOWLS.milk, milkMat],
    [BOWLS.food, foodMat],
  ] as const) {
    put(MeshBuilder.CreateCylinder('bowl', { height: 0.25, diameterTop: 0.9, diameterBottom: 0.65, tessellation: 24 }, scene), dish, b.x, 0.13, b.z);
    const f = put(MeshBuilder.CreateCylinder('fill', { height: 0.05, diameter: 0.78, tessellation: 24 }, scene), fill, b.x, 0.24, b.z, false);
    f.setEnabled(false);
    fills.push(f);
  }
  // A heart-shaped mat under the bowls.
  const mat = fanMesh(scene, 'bowlMat', heartOutline());
  mat.material = glowMaterial(scene, 'bowlMatMat', '#ff9fc6');
  mat.parent = root;
  mat.rotation.x = Math.PI / 2;
  mat.scaling.setAll(3.2);
  mat.position.set((BOWLS.milk.x + BOWLS.food.x) / 2, 0.02, BOWLS.milk.z - 0.1);

  // The stove with four hot plates and an oven door.
  const stove = spot('stove');
  put(box(1.7, 1.6, 1.2), white, stove.x, 0.8, BACK - 0.7);
  put(box(1.5, 0.9, 0.05), material(scene, 'ovenGlass', '#3a3440', 0.8, 0.05), stove.x, 0.75, BACK - 1.32, false);
  put(box(1.2, 0.08, 0.08), metal, stove.x, 1.3, BACK - 1.35, false);
  const plate = material(scene, 'hotPlate', '#2a2a30', 0.6, 0);
  for (const [dx, dz] of [
    [-0.4, -0.25],
    [0.4, -0.25],
    [-0.4, 0.25],
    [0.4, 0.25],
  ])
    put(MeshBuilder.CreateCylinder('hotplate', { height: 0.04, diameter: 0.5, tessellation: 20 }, scene), plate, stove.x + dx, 1.62, BACK - 0.7 + dz, false);

  const table = spot('table');
  // The plate for cooked meals; the food on it takes the colour of the dish.
  const dinner = new TransformNode('dinner', scene);
  dinner.parent = root;
  dinner.position.set(table.x + 0.4, 1.3, table.z - 0.2);
  const dinnerPlate = MeshBuilder.CreateCylinder('dinnerPlate', { height: 0.05, diameter: 0.9, tessellation: 28 }, scene);
  dinnerPlate.material = white;
  dinnerPlate.parent = dinner;
  const food = MeshBuilder.CreateSphere('dinnerFood', { diameter: 0.55, segments: 12 }, scene);
  food.scaling.y = 0.35;
  food.position.y = 0.07;
  food.parent = dinner;
  const dinnerMat = material(scene, 'dinnerFoodMat', '#ffd23f', 0.3, 0.2);
  food.material = dinnerMat;
  dinner.setEnabled(false);
  put(MeshBuilder.CreateCylinder('tableTop', { height: 0.15, diameter: 2.6, tessellation: 32 }, scene), wood, table.x, 1.2, table.z);
  put(MeshBuilder.CreateCylinder('tableLeg', { height: 1.2, diameter: 0.25 }, scene), darkWood, table.x, 0.6, table.z);
  put(MeshBuilder.CreateCylinder('tableFoot', { height: 0.1, diameter: 1.2 }, scene), darkWood, table.x, 0.05, table.z);
  for (const dx of [-1.9, 1.9]) {
    put(box(0.9, 0.12, 0.9), pink, table.x + dx, 0.75, table.z);
    put(box(0.12, 1.2, 0.9), pink, table.x + dx * 1.22, 1.3, table.z);
    for (const lx of [-0.35, 0.35]) put(box(0.1, 0.75, 0.1), darkWood, table.x + dx + lx, 0.37, table.z);
  }
  put(
    MeshBuilder.CreateCylinder('vase', { height: 0.5, diameterTop: 0.2, diameterBottom: 0.3 }, scene),
    material(scene, 'vase', '#6ec6ff', 0.5, 0.1),
    table.x - 0.6,
    1.52,
    table.z + 0.3,
  );
  for (const [dx, c] of [
    [-0.7, '#ff6b9a'],
    [-0.5, '#ffd166'],
  ] as const)
    put(MeshBuilder.CreateSphere('bloom', { diameter: 0.25 }, scene), material(scene, 'bloomIn', c, 0.1, 0.3), table.x + dx, 1.9, table.z + 0.3);

  // ── Hall with the front door ──
  const exit = spot('exit');
  put(box(2.4, 3.8, 0.3), darkWood, exit.x, 1.9, BACK - 0.2);
  put(box(2.0, 3.4, 0.1), material(scene, 'doorIn', '#b8744a', 0.1, 0.05), exit.x, 1.8, BACK - 0.4, false);
  put(
    MeshBuilder.CreateCylinder('doorWin', { diameter: 0.8, height: 0.1 }, scene),
    material(scene, 'doorGlass', '#bfe8ff', 0.9, 0.4),
    exit.x,
    2.8,
    BACK - 0.48,
    false,
  ).rotation.x = Math.PI / 2;
  put(MeshBuilder.CreateSphere('doorKnob', { diameter: 0.18 }, scene), gold, exit.x + 0.7, 1.7, BACK - 0.5, false);
  const doormat = put(box(2.4, 0.04, 1.2), material(scene, 'doormat', '#c0392b', 0.05, 0.05), exit.x, 0.02, BACK - 1.3, false);
  doormat.receiveShadows = true;
  // A cat basket and a few picture frames.
  put(MeshBuilder.CreateCylinder('basket', { height: 0.5, diameterTop: 1.7, diameterBottom: 1.4, tessellation: 24 }, scene), wood, exit.x - 3.2, 0.25, 0.8);
  put(MeshBuilder.CreateCylinder('cushion', { height: 0.2, diameter: 1.4, tessellation: 24 }, scene), pink, exit.x - 3.2, 0.5, 0.8, false);
  for (const [dx, c] of [
    [2.8, '#ff9fc6'],
    [3.9, '#8bd450'],
  ] as const) {
    put(box(0.9, 1.1, 0.08), gold, exit.x + dx, 3.6, BACK - 0.2, false);
    put(box(0.7, 0.9, 0.05), material(scene, 'pic', c, 0.1, 0.35), exit.x + dx, 3.6, BACK - 0.26, false);
  }

  // ── Bathroom ──
  const tub = spot('bathtub');
  const porcelain = material(scene, 'porcelain', '#ffffff', 0.6, 0.12);
  put(box(4, 1.1, 1.9), porcelain, tub.x, 0.55, tub.z + 0.2);
  put(box(3.5, 0.05, 1.5), material(scene, 'water', '#7fd3ff', 0.9, 0.35), tub.x, 1.0, tub.z + 0.2, false);
  for (let i = 0; i < 6; i++)
    put(
      MeshBuilder.CreateSphere('bubble', { diameter: 0.3 + (i % 3) * 0.12 }, scene),
      porcelain,
      tub.x - 1.2 + i * 0.45,
      1.1,
      tub.z + 0.3 + ((i * 7) % 3) * 0.2,
      false,
    );
  // A rubber duck.
  const duck = material(scene, 'duck', '#ffd23f', 0.3, 0.2);
  put(MeshBuilder.CreateSphere('duckBody', { diameter: 0.45 }, scene), duck, tub.x + 1.1, 1.15, tub.z + 0.1);
  put(MeshBuilder.CreateSphere('duckHead', { diameter: 0.3 }, scene), duck, tub.x + 1.25, 1.45, tub.z + 0.1);
  put(MeshBuilder.CreateSphere('duckBeak', { diameter: 0.12 }, scene), material(scene, 'beak', '#ff8c2a', 0.2, 0.2), tub.x + 1.42, 1.43, tub.z + 0.1, false);
  const cab = spot('bathCabinet');
  put(box(1.6, 1.0, 0.9), porcelain, cab.x, 1.5, BACK - 0.6);
  put(MeshBuilder.CreateCylinder('sinkFoot', { height: 1.0, diameter: 0.4 }, scene), porcelain, cab.x, 0.5, BACK - 0.6);
  put(box(1.8, 1.6, 0.4), material(scene, 'cabinet', '#9fd8ff', 0.3, 0.12), cab.x, 3.4, BACK - 0.35);
  put(box(1.5, 1.3, 0.05), material(scene, 'mirror', '#e8f7ff', 1, 0.45), cab.x, 3.4, BACK - 0.56, false);
  // Blue and white wall tiles behind the tub.
  const tile = material(scene, 'tile', '#e6f4ff', 0.4, 0.1);
  for (let tx = 0; tx < 10; tx++)
    for (let ty = 0; ty < 4; ty++)
      if ((tx + ty) % 2 === 0) put(box(0.95, 0.95, 0.04), tile, ROOMS[2].from + 0.8 + tx * 1.0, 0.8 + ty * 1.0, BACK - 0.17, false);

  // ── Bedroom ──
  const ward = spot('wardrobe');
  const wardMat = material(scene, 'wardrobe', '#ffe3f0', 0.2, 0.08);
  put(box(3.6, 5, 1.4), wardMat, ward.x, 2.5, BACK - 0.8);
  for (const dx of [-0.9, 0.9]) {
    put(box(1.65, 4.5, 0.05), white, ward.x + dx, 2.55, BACK - 1.52, false);
    put(box(0.1, 0.7, 0.1), gold, ward.x + dx * 0.15, 2.6, BACK - 1.58, false);
  }
  const crown = fanMesh(scene, 'wardHeart', heartOutline());
  crown.material = glowMaterial(scene, 'wardHeartMat', '#ff5c8a');
  crown.parent = root;
  crown.scaling.setAll(0.8);
  crown.position.set(ward.x, 4.55, BACK - 1.56);
  // The bed stands lengthways against the back wall, so the girl can walk past in front of it.
  const bed = spot('bed');
  const bedZ = BACK - 1.1;
  put(box(3.6, 0.7, 1.9), darkWood, bed.x, 0.35, bedZ);
  put(box(3.5, 0.35, 1.8), white, bed.x, 0.85, bedZ);
  put(box(2.6, 0.22, 1.95), material(scene, 'blanket', '#ff7eb6', 0.1, 0.12), bed.x - 0.45, 1.1, bedZ);
  put(box(0.7, 0.35, 1.3), white, bed.x + 1.3, 1.2, bedZ);
  put(box(0.25, 1.8, 1.9), darkWood, bed.x + 1.9, 1.2, bedZ);
  put(
    MeshBuilder.CreateCylinder('rug', { height: 0.03, diameter: 3.2, tessellation: 40 }, scene),
    material(scene, 'rug', '#c3a3ff', 0.05, 0.1),
    ward.x + 1,
    0.02,
    -1.4,
    false,
  );

  // A window with sky in every room.
  const sky = material(scene, 'winSky', '#aee0ff', 0.2, 0.6);
  for (const room of ROOMS) {
    const x = room === ROOMS[0] ? room.to - 2.2 : room === ROOMS[1] ? room.from + 1.6 : room === ROOMS[2] ? room.to - 1.8 : room.to - 1.8;
    put(box(1.9, 1.9, 0.12), white, x, 5.9, BACK - 0.2, false);
    put(box(1.6, 1.6, 0.1), sky, x, 5.9, BACK - 0.27, false);
  }

  const deco = buildDeco(scene, root, put, box);
  return {
    root,
    setBowls(milk: boolean, food: boolean) {
      fills[0].setEnabled(milk);
      fills[1].setEnabled(food);
    },
    setDeco(owned: readonly string[]) {
      for (const [id, node] of deco) node.setEnabled(owned.includes(id));
    },
    setMeal(recipeId: string | null) {
      const r = recipeId === null ? undefined : recipe(recipeId);
      dinner.setEnabled(r !== undefined);
      if (r) dinnerMat.diffuseColor = Color3.FromHexString(r.color);
    },
  };
}

type Put = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number, cast?: boolean) => Mesh;

/** Decorations from the shop, each hidden in its own node until it has been bought. */
function buildDeco(scene: Scene, root: TransformNode, put: Put, box: (w: number, h: number, d: number) => Mesh): Map<string, TransformNode> {
  const nodes = new Map<string, TransformNode>();
  const group = (id: string, build: (p: Put) => void) => {
    const node = new TransformNode(id, scene);
    node.parent = root;
    // Build into the group node instead of the interior root.
    build((m, mat, x, y, z, cast) => {
      const mesh = put(m, mat, x, y, z, cast);
      mesh.parent = node;
      return mesh;
    });
    node.setEnabled(false);
    nodes.set(id, node);
  };
  const sisal = material(scene, 'sisal', '#d9b98a', 0.05, 0.05);
  const plush = material(scene, 'plush', '#b388ff', 0.1, 0.1);

  group('deco-kratzbaum', (p) => {
    const x = INTERIOR_X + 25.3;
    const z = BACK - 1.2;
    p(MeshBuilder.CreateCylinder('post', { height: 3.4, diameter: 0.35 }, scene), sisal, x, 1.7, z);
    p(MeshBuilder.CreateCylinder('post2', { height: 2.0, diameter: 0.3 }, scene), sisal, x + 0.9, 1.0, z);
    for (const [dx, y, d] of [
      [0.4, 0.1, 1.9],
      [0.45, 2.0, 1.3],
      [0.0, 3.45, 1.1],
    ] as const)
      p(MeshBuilder.CreateCylinder('platform', { height: 0.15, diameter: d, tessellation: 24 }, scene), plush, x + dx, y, z);
    p(MeshBuilder.CreateSphere('toyBall', { diameter: 0.25 }, scene), material(scene, 'toyBall', '#ffd23f', 0.3, 0.2), x + 1.1, 1.75, z - 0.3);
  });
  group('deco-kissen', (p) => {
    const colours = ['#ff9fc6', '#8bd4ff', '#ffe066'];
    colours.forEach((c, i) => {
      const cushion = p(
        MeshBuilder.CreateSphere('cushion', { diameter: 0.9, segments: 12 }, scene),
        material(scene, `cushion${i}`, c, 0.1, 0.12),
        INTERIOR_X + 18 + i * 0.8,
        0.3,
        BACK - 1.0 - (i % 2) * 0.5,
      );
      cushion.scaling.set(1, 0.5, 1);
    });
  });
  group('deco-blumen', (p) => {
    const pot = material(scene, 'pot', '#d9774a', 0.1, 0.05);
    ['#ff6b9a', '#ffd166', '#b388ff'].forEach((c, i) => {
      const x = INTERIOR_X + 14.6 + i * 0.8;
      p(MeshBuilder.CreateCylinder('pot', { height: 0.5, diameterTop: 0.55, diameterBottom: 0.4 }, scene), pot, x, 0.25, BACK - 0.6);
      p(MeshBuilder.CreateCylinder('stalk', { height: 0.6, diameter: 0.05 }, scene), material(scene, 'stalk', '#3c9a36', 0.05, 0.05), x, 0.8, BACK - 0.6);
      p(MeshBuilder.CreateSphere('blossom', { diameter: 0.35, segments: 8 }, scene), material(scene, `potBloom${i}`, c, 0.1, 0.3), x, 1.15, BACK - 0.6);
    });
  });
  group('deco-bild', (p) => {
    const x = INTERIOR_X + 46.5;
    p(box(1.6, 1.3, 0.08), material(scene, 'catFrame', '#ffc83d', 0.6, 0.2), x, 4.2, BACK - 0.22, false);
    const canvas = p(
      MeshBuilder.CreatePlane('catPic', { width: 1.35, height: 1.05 }, scene),
      signMaterial(scene, 'catPicture', '🐱', '#ff7eb6', '#fff4fa'),
      x,
      4.2,
      BACK - 0.28,
      false,
    );
    canvas.scaling.x = 1;
  });
  group('deco-teppich', (p) => {
    const rug = fanMesh(scene, 'heartRug', heartOutline());
    rug.material = glowMaterial(scene, 'heartRugMat', '#ff9fc6');
    p(rug, rug.material as StandardMaterial, INTERIOR_X + 34, 0.03, -0.6, false);
    rug.rotation.x = Math.PI / 2;
    rug.scaling.setAll(2.6);
  });
  group('deco-lichter', (p) => {
    const colours = ['#ff6b9a', '#ffd166', '#6fe0b5', '#6ec6ff', '#c3a3ff'].map((c, i) => glowMaterial(scene, `fairy${i}`, c));
    for (let i = 0; i < 70; i++) {
      const x = INTERIOR_X + 0.5 + i * (INTERIOR_WIDTH / 70);
      p(
        MeshBuilder.CreateSphere('fairy', { diameter: 0.16, segments: 6 }, scene),
        colours[i % colours.length],
        x,
        5.4 + Math.sin(i * 0.9) * 0.18,
        BACK - 0.25,
        false,
      );
    }
  });
  return nodes;
}
