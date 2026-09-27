// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { createRng, groundY, HOUSE_X } from '../core/game';
import '@babylonjs/core/Meshes/instancedMesh';
import { material } from './shapes';

const X0 = -60;
const X1 = 180;
const STEP = 0.5;

function vertexColored(scene: Scene, name: string): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.White();
  m.specularColor = new Color3(0.04, 0.04, 0.04);
  m.backFaceCulling = false;
  m.twoSidedLighting = true;
  return m;
}

/** Sky, ground, hills, lake, trees, clouds and flowers. Returns a tick for the few moving parts. */
export function buildLandscape(scene: Scene, addCaster: (m: Mesh) => void): (t: number) => void {
  const rng = createRng(42);

  // Sky dome with a vertical gradient: deep blue on top, pale at the horizon.
  const sky = MeshBuilder.CreateSphere('sky', { diameter: 1200, segments: 24, sideOrientation: 1 }, scene);
  const skyPos = sky.getVerticesData('position') ?? [];
  const skyCol: number[] = [];
  const top = Color3.FromHexString('#5a9be0');
  const horizon = Color3.FromHexString('#cfe6f7');
  for (let i = 0; i < skyPos.length; i += 3) {
    const t = Math.max(0, Math.min(1, skyPos[i + 1] / 600 + 0.1));
    const c = Color3.Lerp(horizon, top, Math.pow(t, 0.6));
    skyCol.push(c.r, c.g, c.b, 1);
  }
  sky.setVerticesData('color', skyCol);
  const skyMat = new StandardMaterial('skyMat', scene);
  skyMat.disableLighting = true;
  skyMat.emissiveColor = Color3.White();
  skyMat.fogEnabled = false;
  sky.material = skyMat;
  sky.infiniteDistance = true;
  sky.isPickable = false;

  // The walkable strip: a band of grass along the gameplay plane.
  const grassA = Color3.FromHexString('#4fae3c');
  const grassB = Color3.FromHexString('#78c850');
  const zs = [-4, -2.5, -1, 0.5, 2, 4, 6, 9, 12];
  const paths: Vector3[][] = [];
  const colors: Color4[] = [];
  for (const z of zs) {
    const path: Vector3[] = [];
    for (let x = X0; x <= X1; x += STEP) {
      const lift = z > 3 ? (z - 3) * 0.25 + Math.sin(x * 0.13 + z) * 0.4 * (z / 12) : 0;
      path.push(new Vector3(x, groundY(x) + lift, z));
      const k = 0.5 + 0.5 * Math.sin(x * 0.7 + z * 1.3) * Math.cos(x * 0.23 - z);
      const c = Color3.Lerp(grassA, grassB, k);
      colors.push(new Color4(c.r, c.g, c.b, 1));
    }
    paths.push(path);
  }
  const grass = MeshBuilder.CreateRibbon('grass', { pathArray: paths, colors }, scene);
  grass.material = vertexColored(scene, 'grassMat');
  grass.receiveShadows = true;

  // The earthy front edge under the grass, like the cut-away islands in Allium Assault.
  const soilTop: Vector3[] = [];
  const soilBottom: Vector3[] = [];
  for (let x = X0; x <= X1; x += STEP) {
    soilTop.push(new Vector3(x, groundY(x), -4));
    soilBottom.push(new Vector3(x, groundY(x) - 9 - Math.sin(x * 0.3) * 1.2, -4.4));
  }
  const soil = MeshBuilder.CreateRibbon('soil', { pathArray: [soilBottom, soilTop] }, scene);
  const soilMat = material(scene, 'soilMat', '#8a5a36', 0.02, 0.05);
  soilMat.backFaceCulling = false;
  soilMat.twoSidedLighting = true;
  soil.material = soilMat;

  // Background hills, getting bluer and hazier with distance.
  const hill = (name: string, z: number, depth: number, base: number, amp: number, freq: number, hex: string) => {
    const hp: Vector3[][] = [];
    for (const dz of [0, depth * 0.5, depth]) {
      const p: Vector3[] = [];
      for (let x = X0 - 100; x <= X1 + 100; x += 2) {
        const h = base + amp * (0.6 + 0.4 * Math.sin(x * freq + z) * Math.cos(x * freq * 0.37 + 1.7 * z)) * (dz === depth ? 0.55 : 1);
        p.push(new Vector3(x, h, z + dz));
      }
      hp.push(p);
    }
    const mesh = MeshBuilder.CreateRibbon(name, { pathArray: hp }, scene);
    const m = material(scene, name + 'Mat', hex, 0.02, 0.02);
    m.backFaceCulling = false;
    m.twoSidedLighting = true;
    mesh.material = m;
    return (x: number) => base + amp * (0.6 + 0.4 * Math.sin(x * freq + z) * Math.cos(x * freq * 0.37 + 1.7 * z));
  };
  const near = hill('hillNear', 20, 12, -1.5, 4, 0.06, '#3f8f38');
  const lakeZ = 40;
  const far = hill('hillFar', 70, 20, -2, 9, 0.035, '#2f6b3c');
  hill('mountains', 140, 40, -4, 34, 0.02, '#6d82a0');

  const lake = MeshBuilder.CreateGround('lake', { width: 600, height: 60 }, scene);
  lake.position.set(60, -0.6, lakeZ + 5);
  const lakeMat = material(scene, 'lakeMat', '#5fb3d9', 0.9, 0.12);
  lakeMat.specularPower = 64;
  lake.material = lakeMat;

  // Pine trees, as instances of one trunk and one crown.
  const trunkMat = material(scene, 'trunkMat', '#6b4428', 0.05, 0);
  const crownMat = material(scene, 'crownMat', '#2f8f3a', 0.1, 0.03);
  const trunk = MeshBuilder.CreateCylinder('trunk', { height: 1.2, diameter: 0.35, tessellation: 8 }, scene);
  trunk.material = trunkMat;
  const crown = MeshBuilder.CreateCylinder('crown', { height: 3.6, diameterTop: 0, diameterBottom: 2.2, tessellation: 10 }, scene);
  crown.material = crownMat;
  const crown2 = MeshBuilder.CreateCylinder('crown2', { height: 2.6, diameterTop: 0, diameterBottom: 1.6, tessellation: 10 }, scene);
  crown2.material = crownMat;
  trunk.isVisible = crown.isVisible = crown2.isVisible = false;
  const tree = (x: number, y: number, z: number, s: number, cast: boolean) => {
    const root = new TransformNode('tree', scene);
    root.position.set(x, y, z);
    root.scaling.setAll(s);
    const a = trunk.createInstance('t');
    a.parent = root;
    a.position.y = 0.6;
    const b = crown.createInstance('c');
    b.parent = root;
    b.position.y = 2.6;
    const c = crown2.createInstance('c2');
    c.parent = root;
    c.position.y = 3.9;
    if (cast) for (const m of [a, b, c]) addCaster(m as unknown as Mesh);
  };
  for (let x = X0; x < X1; x += 3 + rng() * 5) {
    if (Math.abs(x - HOUSE_X) < 12) continue;
    const z = 7 + rng() * 5;
    tree(x, groundY(x) + (z - 3) * 0.25 - 0.3, z, 0.8 + rng() * 0.5, true);
  }
  for (let x = X0 - 40; x < X1 + 40; x += 2 + rng() * 4) tree(x, near(x) - 0.6, 20 + rng() * 5, 1 + rng() * 0.6, false);
  for (let x = X0 - 80; x < X1 + 80; x += 3 + rng() * 5) tree(x, far(x) - 1, 72 + rng() * 8, 1.6 + rng() * 0.8, false);

  // Flowers dotted over the grass.
  const petals = ['#ff8fb8', '#ffd166', '#b69cff', '#ffffff', '#ff6b6b'].map((c, i) => {
    const m = MeshBuilder.CreateSphere('flower' + i, { diameter: 0.22, segments: 6 }, scene);
    m.material = material(scene, 'flowerMat' + i, c, 0.1, 0.2);
    m.isVisible = false;
    return m;
  });
  for (let i = 0; i < 260; i++) {
    const x = X0 + rng() * (X1 - X0);
    const z = -3.5 + rng() * 9;
    if (z > -1 && z < 1) continue;
    const lift = z > 3 ? (z - 3) * 0.25 : 0;
    const f = petals[Math.floor(rng() * petals.length)].createInstance('f');
    f.position.set(x, groundY(x) + lift + 0.08, z);
  }

  // Fluffy clouds drifting slowly.
  const cloudMat = material(scene, 'cloudMat', '#ffffff', 0, 0.55);
  cloudMat.fogEnabled = false;
  const clouds: TransformNode[] = [];
  for (let i = 0; i < 14; i++) {
    const c = new TransformNode('cloud', scene);
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p++) {
      const s = MeshBuilder.CreateSphere('puff', { diameter: 5 + rng() * 5, segments: 10 }, scene);
      s.material = cloudMat;
      s.parent = c;
      s.position.set(p * 3.5 - puffs * 1.7, rng() * 1.5, rng() * 2);
      s.scaling.y = 0.6;
    }
    c.position.set(X0 + rng() * (X1 - X0 + 120), 26 + rng() * 14, 90 + rng() * 40);
    clouds.push(c);
  }

  scene.clearColor = new Color4(horizon.r, horizon.g, horizon.b, 1);
  return (dt: number) => {
    for (const c of clouds) {
      c.position.x += dt * 0.6;
      if (c.position.x > X1 + 80) c.position.x = X0 - 60;
    }
  };
}
