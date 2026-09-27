// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { groundY, HOUSE_X } from '../core/game';
import { fanMesh, glowMaterial, heartOutline, material } from './shapes';

const W = 12;
const H = 6.5;
const D = 6;
const Z = 4.2;

/** The girl's cosy house, standing just behind the path she walks along. */
export function buildHouse(scene: Scene, addCaster: (m: Mesh) => void): TransformNode {
  const root = new TransformNode('house', scene);
  root.position.set(HOUSE_X, groundY(HOUSE_X) - 0.1, Z);
  const wallMat = material(scene, 'wallMat', '#ffbfd6', 0.1, 0.05);
  const roofMat = material(scene, 'roofMat', '#e0567a', 0.25, 0.05);
  const woodMat = material(scene, 'doorMat', '#a0633b', 0.15, 0.02);
  const glassMat = material(scene, 'glassMat', '#bfe8ff', 0.9, 0.35);
  const frameMat = material(scene, 'frameMat', '#ffffff', 0.2, 0.2);
  const baseMat = material(scene, 'baseMat', '#c9a9b5', 0.05, 0);

  const part = (m: Mesh, mat = wallMat, cast = true) => {
    m.material = mat;
    m.parent = root;
    m.receiveShadows = true;
    if (cast) addCaster(m);
    return m;
  };

  part(MeshBuilder.CreateBox('walls', { width: W, height: H, depth: D }, scene)).position.y = H / 2;
  part(MeshBuilder.CreateBox('plinth', { width: W + 0.4, height: 0.6, depth: D + 0.4 }, scene), baseMat).position.y = 0.3;

  // Roof: two slabs meeting at a ridge that runs away from the camera, so the gable faces us.
  const pitch = 0.62;
  const half = W / 2 + 0.8;
  const slab = half / Math.cos(pitch);
  for (const side of [-1, 1]) {
    const r = part(MeshBuilder.CreateBox('roof', { width: slab, height: 0.45, depth: D + 1.2 }, scene), roofMat);
    r.rotation.z = -side * pitch;
    r.position.set((side * half) / 2, H + (Math.tan(pitch) * half) / 2 + 0.1, 0);
  }
  // Gable triangle filling the front and back of the attic.
  const peak = Math.tan(pitch) * (W / 2);
  const gable = new Mesh('gable', scene);
  const g = new VertexData();
  g.positions = [-W / 2, 0, 0, W / 2, 0, 0, 0, peak, 0, -W / 2, 0, D, W / 2, 0, D, 0, peak, D];
  g.indices = [0, 2, 1, 3, 4, 5];
  g.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
  g.applyToMesh(gable);
  part(gable).position.set(0, H, -D / 2);
  wallMat.backFaceCulling = false;

  // Round attic window with a heart in it.
  const round = part(MeshBuilder.CreateCylinder('atticWin', { diameter: 1.6, height: 0.2, tessellation: 32 }, scene), frameMat, false);
  round.rotation.x = Math.PI / 2;
  round.position.set(0, H + peak * 0.42, -D / 2 - 0.05);
  const heart = fanMesh(scene, 'houseHeart', heartOutline());
  heart.material = glowMaterial(scene, 'houseHeartMat', '#ff5c8a');
  heart.parent = root;
  heart.scaling.setAll(1.05);
  heart.position.set(0, H + peak * 0.42, -D / 2 - 0.17);

  // Door with a rounded top and a golden knob.
  const door = part(MeshBuilder.CreateBox('door', { width: 1.9, height: 2.8, depth: 0.2 }, scene), woodMat, false);
  door.position.set(0, 1.4 + 0.5, -D / 2 - 0.05);
  const arch = part(MeshBuilder.CreateCylinder('doorArch', { diameter: 1.9, height: 0.2, tessellation: 24, arc: 0.5 }, scene), woodMat, false);
  arch.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  arch.rotation.x = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 3.3, -D / 2 - 0.05);
  const knob = part(MeshBuilder.CreateSphere('knob', { diameter: 0.22 }, scene), material(scene, 'knobMat', '#ffd166', 0.8, 0.3), false);
  knob.position.set(0.6, 1.9, -D / 2 - 0.2);

  // Two windows with white frames and flower boxes.
  const boxMat = material(scene, 'flowerBoxMat', '#8bd450', 0.1, 0.05);
  const bloom = ['#ff6b9a', '#ffd166', '#b69cff'];
  for (const side of [-1, 1]) {
    const x = side * 3.6;
    const frame = part(MeshBuilder.CreateBox('frame', { width: 2.3, height: 2.1, depth: 0.15 }, scene), frameMat, false);
    frame.position.set(x, 3.8, -D / 2 - 0.05);
    const glass = part(MeshBuilder.CreateBox('glass', { width: 1.9, height: 1.7, depth: 0.1 }, scene), glassMat, false);
    glass.position.set(x, 3.8, -D / 2 - 0.12);
    const cross = part(MeshBuilder.CreateBox('crossV', { width: 0.12, height: 1.7, depth: 0.05 }, scene), frameMat, false);
    cross.position.set(x, 3.8, -D / 2 - 0.18);
    const crossH = part(MeshBuilder.CreateBox('crossH', { width: 1.9, height: 0.12, depth: 0.05 }, scene), frameMat, false);
    crossH.position.set(x, 3.8, -D / 2 - 0.18);
    const box = part(MeshBuilder.CreateBox('flowerBox', { width: 2.3, height: 0.45, depth: 0.5 }, scene), boxMat, false);
    box.position.set(x, 2.55, -D / 2 - 0.3);
    for (let i = 0; i < 5; i++) {
      const f = part(MeshBuilder.CreateSphere('bloom', { diameter: 0.34, segments: 8 }, scene), material(scene, 'bloomMat', bloom[i % 3], 0.1, 0.25), false);
      f.position.set(x - 0.9 + i * 0.45, 2.9, -D / 2 - 0.3);
    }
  }

  // Chimney.
  const chimney = part(MeshBuilder.CreateBox('chimney', { width: 1, height: 2.6, depth: 1 }, scene), material(scene, 'chimneyMat', '#b85c4a', 0.05, 0));
  chimney.position.set(3.2, H + 2.4, 1.2);

  // Stepping stones up to the door.
  const stoneMat = material(scene, 'stoneMat', '#d8d2c8', 0.1, 0.05);
  for (let i = 0; i < 3; i++) {
    const s = part(MeshBuilder.CreateCylinder('stone', { diameter: 1.1 - i * 0.1, height: 0.12, tessellation: 12 }, scene), stoneMat, false);
    s.position.set(0, 0.2, -D / 2 - 0.9 - i * 1.3);
  }
  return root;
}
