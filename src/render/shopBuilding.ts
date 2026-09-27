// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { BUILDINGS, groundY } from '../core/world';
import { TEXT } from '../ui/text';
import { material, signMaterial } from './shapes';

const W = 10;
const H = 5.5;
const D = 5;

/** The little cat shop in the garden, with a striped awning and a sign. */
export function buildShop(scene: Scene, addCaster: (m: Mesh) => void): TransformNode {
  const shop = BUILDINGS.find((b) => b.id === 'shop');
  if (!shop) throw new Error('no shop in the world layout');
  const root = new TransformNode('shop', scene);
  root.position.set(shop.x, groundY(shop.x) - 0.1, shop.front + D / 2);
  const front = -D / 2;
  const put = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number, cast = true) => {
    m.material = mat;
    m.parent = root;
    m.position.set(x, y, z);
    m.receiveShadows = true;
    if (cast) addCaster(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => MeshBuilder.CreateBox('s', { width: w, height: h, depth: d }, scene);

  put(box(W, H, D), material(scene, 'shopWall', '#c9f0ff', 0.1, 0.08), 0, H / 2, 0);
  put(box(W + 0.6, 0.5, D + 0.6), material(scene, 'shopRoof', '#8f6bd8', 0.2, 0.05), 0, H + 0.25, 0);
  put(box(W + 0.4, 0.5, D + 0.4), material(scene, 'shopBase', '#a9b6c9', 0.05, 0), 0, 0.25, 0);

  // Striped awning over the shop window and door.
  const stripeA = material(scene, 'awningA', '#ff7eb6', 0.2, 0.12);
  const stripeB = material(scene, 'awningB', '#ffffff', 0.2, 0.2);
  const stripes = 10;
  for (let i = 0; i < stripes; i++) {
    const s = put(box(W / stripes, 0.12, 1.7), i % 2 === 0 ? stripeA : stripeB, -W / 2 + (i + 0.5) * (W / stripes), H - 0.75, front - 0.75);
    s.rotation.x = -0.45;
  }

  // Sign with the shop's name.
  const signMat = signMaterial(scene, 'shopSign', TEXT.signs.shop, '#e0567a', '#fff4fa');
  const sign = put(MeshBuilder.CreatePlane('sign', { width: 6, height: 1.5 }, scene), signMat, 0, H + 1.4, front - 0.05, false);
  put(box(6.3, 1.8, 0.15), material(scene, 'signFrame', '#8f6bd8', 0.2, 0.05), 0, H + 1.4, front + 0.05);
  sign.rotation.y = 0;

  // Door and a big shop window with cat food and a yarn ball on display.
  put(box(2, 3, 0.2), material(scene, 'shopDoor', '#ffffff', 0.3, 0.1), 0, 1.5 + 0.4, front - 0.05, false);
  put(box(1.6, 1.8, 0.1), material(scene, 'shopDoorGlass', '#bfe8ff', 0.9, 0.35), 0, 2.3, front - 0.15, false);
  put(MeshBuilder.CreateSphere('shopKnob', { diameter: 0.2 }, scene), material(scene, 'shopKnobMat', '#ffd166', 0.8, 0.3), 0.7, 1.8, front - 0.22, false);
  const glass = material(scene, 'shopWindow', '#dff5ff', 0.9, 0.45);
  for (const side of [-1, 1]) {
    const x = side * 3.1;
    put(box(3, 2.4, 0.15), material(scene, 'windowFrame', '#ffffff', 0.2, 0.15), x, 2.6, front - 0.05, false);
    put(box(2.7, 2.1, 0.1), glass, x, 2.6, front - 0.12, false);
    put(box(2.8, 0.2, 0.6), material(scene, 'sill', '#8f6bd8', 0.2, 0.05), x, 1.35, front - 0.35, false);
  }
  const can = material(scene, 'canMat', '#ff6b6b', 0.6, 0.15);
  for (let i = 0; i < 3; i++) put(MeshBuilder.CreateCylinder('can', { height: 0.45, diameter: 0.35 }, scene), can, -3.9 + i * 0.5, 1.7, front - 0.4, false);
  put(MeshBuilder.CreateSphere('yarnDisplay', { diameter: 0.55 }, scene), material(scene, 'yarnDisplay', '#b388ff', 0.2, 0.15), 3.1, 1.75, front - 0.4, false);
  put(MeshBuilder.CreateSphere('yarnDisplay2', { diameter: 0.45 }, scene), material(scene, 'yarnDisplay2', '#ffd166', 0.2, 0.15), 3.8, 1.7, front - 0.4, false);
  return root;
}
