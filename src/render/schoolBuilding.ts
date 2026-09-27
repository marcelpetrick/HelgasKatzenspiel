// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { BUILDINGS, groundY } from '../core/world';
import { material, signMaterial } from './shapes';

const W = 12;
const H = 6;
const D = 6;

/** The school at the left end of the garden: warm walls, a bell tower and a clock. */
export function buildSchool(scene: Scene, addCaster: (m: Mesh) => void): TransformNode {
  const school = BUILDINGS.find((b) => b.id === 'school');
  if (!school) throw new Error('no school in the world layout');
  const root = new TransformNode('school', scene);
  root.position.set(school.x, groundY(school.x) - 0.1, school.front + D / 2);
  const front = -D / 2;
  const put = (m: Mesh, mat: StandardMaterial, x: number, y: number, z: number, cast = true) => {
    m.material = mat;
    m.parent = root;
    m.position.set(x, y, z);
    m.receiveShadows = true;
    if (cast) addCaster(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => MeshBuilder.CreateBox('sc', { width: w, height: h, depth: d }, scene);
  const white = material(scene, 'schoolTrim', '#ffffff', 0.2, 0.15);
  const roof = material(scene, 'schoolRoof', '#3f7bd9', 0.25, 0.05);

  put(box(W, H, D), material(scene, 'schoolWall', '#ffb86b', 0.1, 0.08), 0, H / 2, 0);
  put(box(W + 0.4, 0.5, D + 0.4), material(scene, 'schoolBase', '#b9a48f', 0.05, 0), 0, 0.25, 0);
  put(box(W + 0.8, 0.5, D + 0.8), roof, 0, H + 0.25, 0);
  // Bell tower with a golden bell and a pointed roof.
  put(box(2.6, 2.6, 2.6), material(scene, 'tower', '#ffc98f', 0.1, 0.08), 0, H + 1.8, 0.5);
  put(MeshBuilder.CreateCylinder('towerRoof', { height: 2.2, diameterTop: 0, diameterBottom: 3.6, tessellation: 4 }, scene), roof, 0, H + 4.2, 0.5).rotation.y =
    Math.PI / 4;
  put(MeshBuilder.CreateSphere('bell', { diameter: 0.9, slice: 0.6 }, scene), material(scene, 'bellMat', '#ffd23f', 0.9, 0.3), 0, H + 2.1, 0.5 - 1.25, false);
  // Clock on the front of the tower.
  const clock = put(MeshBuilder.CreateCylinder('clock', { height: 0.1, diameter: 1.3, tessellation: 32 }, scene), white, 0, H + 1.4, 0.5 - 1.35, false);
  clock.rotation.x = Math.PI / 2;
  const hand = material(scene, 'clockHand', '#2a2a40', 0.2, 0);
  put(box(0.08, 0.5, 0.05), hand, 0, H + 1.6, 0.5 - 1.42, false);
  put(box(0.35, 0.08, 0.05), hand, 0.15, H + 1.4, 0.5 - 1.42, false);

  put(
    MeshBuilder.CreatePlane('schoolSign', { width: 5, height: 1.25 }, scene),
    signMaterial(scene, 'schoolSign', '✏️ Schule', '#3f7bd9', '#fffbe8'),
    0,
    H - 0.8,
    front - 0.06,
    false,
  );
  // Door and a row of windows with white frames.
  put(box(2.2, 3.2, 0.2), material(scene, 'schoolDoor', '#3f7bd9', 0.3, 0.08), 0, 1.9, front - 0.05, false);
  put(MeshBuilder.CreateSphere('schoolKnob', { diameter: 0.2 }, scene), material(scene, 'schoolKnobMat', '#ffd166', 0.8, 0.3), 0.75, 1.8, front - 0.2, false);
  const glass = material(scene, 'schoolGlass', '#bfe8ff', 0.9, 0.35);
  for (const x of [-4.3, -2.3, 2.3, 4.3]) {
    put(box(1.6, 1.9, 0.12), white, x, 3.2, front - 0.05, false);
    put(box(1.3, 1.6, 0.1), glass, x, 3.2, front - 0.1, false);
  }
  // A little chalk board by the door with a sum on it.
  put(box(2.2, 1.4, 0.15), material(scene, 'chalkFrame', '#a0633b', 0.1, 0.03), -3.3, 1.2, front - 0.6);
  put(
    MeshBuilder.CreatePlane('chalk', { width: 2, height: 1.2 }, scene),
    signMaterial(scene, 'chalkText', '2 + 3 = 5', '#ffffff', '#2f5d3a'),
    -3.3,
    1.2,
    front - 0.69,
    false,
  );
  return root;
}
