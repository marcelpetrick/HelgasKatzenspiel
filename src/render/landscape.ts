// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { createRng } from '../core/game';
import { BEACH_X, BUILDINGS, BUSHES, groundY, sandiness, SEA_X } from '../core/world';
import { fanMesh, starOutline } from './shapes';
import '@babylonjs/core/Meshes/instancedMesh';
import { material } from './shapes';

const X0 = -60;
const X1 = 640;
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
  const sandA = Color3.FromHexString('#f2d59a');
  const sandB = Color3.FromHexString('#ffe7b8');
  const zs = [-4, -2.5, -1, 0.5, 2, 4, 6, 9, 12];
  const paths: Vector3[][] = [];
  const colors: Color4[] = [];
  for (const z of zs) {
    const path: Vector3[] = [];
    for (let x = X0; x <= X1; x += STEP) {
      const lift = z > 3 ? (z - 3) * 0.25 + Math.sin(x * 0.13 + z) * 0.4 * (z / 12) : 0;
      path.push(new Vector3(x, groundY(x) + lift, z));
      const k = 0.5 + 0.5 * Math.sin(x * 0.7 + z * 1.3) * Math.cos(x * 0.23 - z);
      // The meadow turns into warm sand towards the sea.
      const c = Color3.Lerp(Color3.Lerp(grassA, grassB, k), Color3.Lerp(sandA, sandB, k), sandiness(x));
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
        // Near the beach the hills sink below the sea, so the view opens up to the water.
        const sink = 1 - sandiness(x - 30);
        const h = (base + amp * (0.6 + 0.4 * Math.sin(x * freq + z) * Math.cos(x * freq * 0.37 + 1.7 * z)) * (dz === depth ? 0.55 : 1)) * sink - 4 * (1 - sink);
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

  const lake = MeshBuilder.CreateGround('lake', { width: 1200, height: 60 }, scene);
  lake.position.set(200, -0.6, lakeZ + 5);
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
  // Between the shop and the beach there is a wood: trees stand much closer there.
  const forest = (x: number) => x > 320 && x < 450;
  for (let x = X0; x < BEACH_X - 15; x += forest(x) ? 1.2 + rng() * 1.8 : 3 + rng() * 5) {
    if (BUILDINGS.some((b) => Math.abs(x - b.x) < b.halfWidth + 5)) continue;
    const z = 7 + rng() * 5;
    tree(x, groundY(x) + (z - 3) * 0.25 - 0.3, z, 0.8 + rng() * (forest(x) ? 0.9 : 0.5), true);
  }
  for (let x = X0 - 40; x < BEACH_X; x += 2 + rng() * 4) tree(x, near(x) - 0.6, 20 + rng() * 5, 1 + rng() * 0.6, false);
  for (let x = X0 - 80; x < BEACH_X - 20; x += 3 + rng() * 5) tree(x, far(x) - 1, 72 + rng() * 8, 1.6 + rng() * 0.8, false);

  buildBushes(scene, addCaster);
  buildBeach(scene, addCaster, rng);

  // Flowers dotted over the grass.
  const petals = ['#ff8fb8', '#ffd166', '#b69cff', '#ffffff', '#ff6b6b'].map((c, i) => {
    const m = MeshBuilder.CreateSphere(`flower${i}`, { diameter: 0.22, segments: 6 }, scene);
    m.material = material(scene, `flowerMat${i}`, c, 0.1, 0.2);
    m.isVisible = false;
    return m;
  });
  for (let i = 0; i < 2600; i++) {
    const x = X0 + rng() * (BEACH_X - 10 - X0);
    const z = -3.5 + rng() * 9;
    if (z > -1 && z < 1) continue;
    const lift = z > 3 ? (z - 3) * 0.25 : 0;
    const f = petals[Math.floor(rng() * petals.length)].createInstance('f');
    f.position.set(x, groundY(x) + lift + 0.08, z);
  }

  // Bigger blossoms: five petals round a yellow heart, on a little green stem.
  const stemMat = material(scene, 'stemMat', '#3c9a36', 0.05, 0.05);
  const heartMat = material(scene, 'blossomHeart', '#ffd23f', 0.2, 0.3);
  const blossoms = ['#ff7eb6', '#ffffff', '#b388ff', '#ff6b6b', '#6ec6ff', '#ffb347'].map((c, i) => {
    const parts: Mesh[] = [];
    const stem = MeshBuilder.CreateCylinder('stem', { height: 0.5, diameter: 0.05, tessellation: 5 }, scene);
    stem.position.y = 0.25;
    stem.material = stemMat;
    parts.push(stem);
    const mid = MeshBuilder.CreateSphere('mid', { diameter: 0.14, segments: 6 }, scene);
    mid.position.set(0, 0.52, -0.03);
    mid.material = heartMat;
    parts.push(mid);
    const petalMat = material(scene, `petal${i}`, c, 0.1, 0.2);
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const petal = MeshBuilder.CreateSphere('petal', { diameter: 0.16, segments: 6 }, scene);
      petal.scaling.set(1, 1, 0.4);
      petal.position.set(Math.cos(a) * 0.12, 0.52 + Math.sin(a) * 0.12, 0);
      petal.material = petalMat;
      parts.push(petal);
    }
    const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, true) ?? stem;
    merged.isVisible = false;
    return merged;
  });
  for (let i = 0; i < 900; i++) {
    const x = X0 + rng() * (BEACH_X - 10 - X0);
    const z = -3.6 + rng() * 10;
    if (z > -1.2 && z < 1.2) continue;
    if (z > 1 && BUILDINGS.some((b) => Math.abs(x - b.x) < b.halfWidth + 1)) continue;
    const lift = z > 3 ? (z - 3) * 0.25 : 0;
    const b = blossoms[Math.floor(rng() * blossoms.length)].createInstance('b');
    b.position.set(x, groundY(x) + lift - 0.02, z);
    b.scaling.setAll(0.8 + rng() * 0.7);
    b.rotation.y = (rng() - 0.5) * 0.8;
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

/** The hide-and-seek bushes: clusters of round green puffs in front of the path. */
function buildBushes(scene: Scene, addCaster: (m: Mesh) => void): void {
  const leaf = material(scene, 'bushMat', '#3f9f45', 0.1, 0.05);
  const leaf2 = material(scene, 'bushMat2', '#57b94d', 0.1, 0.06);
  const berry = material(scene, 'berryMat', '#ff5c8a', 0.3, 0.3);
  for (const b of BUSHES) {
    const root = new TransformNode('bush', scene);
    root.position.set(b.x, groundY(b.x) - 0.15, b.z);
    root.scaling.setAll(b.size);
    for (const [dx, dy, dz, d, m] of [
      [0, 0.7, 0, 1.7, leaf],
      [-0.75, 0.5, 0.1, 1.2, leaf2],
      [0.75, 0.5, 0.05, 1.3, leaf2],
      [0.2, 1.25, 0.1, 1.1, leaf],
    ] as const) {
      const puff = MeshBuilder.CreateSphere('bushPuff', { diameter: d, segments: 10 }, scene);
      puff.material = m;
      puff.parent = root;
      puff.position.set(dx, dy, dz);
      puff.receiveShadows = true;
      addCaster(puff);
    }
    for (let i = 0; i < 4; i++) {
      const bb = MeshBuilder.CreateSphere('berry', { diameter: 0.14, segments: 6 }, scene);
      bb.material = berry;
      bb.parent = root;
      bb.position.set(-0.6 + i * 0.4, 0.6 + (i % 2) * 0.5, -0.75);
    }
  }
}

/** The beach at the far end: the sea, palm trees, a sunshade, a towel and starfish. */
function buildBeach(scene: Scene, addCaster: (m: Mesh) => void, rng: () => number): void {
  const sea = MeshBuilder.CreateGround('sea', { width: 800, height: 700 }, scene);
  sea.position.set(SEA_X + 400 - 8, -0.35, 150);
  const seaMat = material(scene, 'seaMat', '#3fb6e0', 0.9, 0.15);
  seaMat.specularPower = 80;
  seaMat.alpha = 0.92;
  sea.material = seaMat;
  // A strip of foam where the waves meet the sand.
  const foam = MeshBuilder.CreateGround('foam', { width: 3, height: 700 }, scene);
  foam.position.set(SEA_X - 6.5, -0.3, 150);
  foam.material = material(scene, 'foamMat', '#ffffff', 0.2, 0.5);

  const trunkMat = material(scene, 'palmTrunk', '#a8784a', 0.05, 0.03);
  const leafMat = material(scene, 'palmLeaf', '#3fae4a', 0.15, 0.06);
  const nutMat = material(scene, 'coconut', '#6b4428', 0.2, 0);
  for (let i = 0; i < 12; i++) {
    const x = BEACH_X + 5 + i * 6.5 + rng() * 3;
    if (x > SEA_X - 10) break;
    const z = 3.5 + rng() * 6;
    const palm = new TransformNode('palm', scene);
    palm.position.set(x, groundY(x) + (z - 3) * 0.1 - 0.2, z);
    const lean = (rng() - 0.5) * 0.5;
    let top = new Vector3(0, 0, 0);
    // A trunk of stacked, slightly leaning rings.
    for (let k = 0; k < 7; k++) {
      const ring = MeshBuilder.CreateCylinder(
        'palmRing',
        { height: 0.9, diameterTop: 0.36 - k * 0.02, diameterBottom: 0.42 - k * 0.02, tessellation: 8 },
        scene,
      );
      ring.material = trunkMat;
      ring.parent = palm;
      top = new Vector3(Math.sin(lean) * k * 0.85, 0.45 + k * 0.85, 0);
      ring.position.copyFrom(top);
      ring.rotation.z = -lean;
      addCaster(ring);
    }
    for (let f = 0; f < 7; f++) {
      const a = (f / 7) * Math.PI * 2;
      const frond = MeshBuilder.CreateSphere('frond', { diameter: 1, segments: 8 }, scene);
      frond.material = leafMat;
      frond.parent = palm;
      frond.scaling.set(2.6, 0.12, 0.6);
      frond.position.set(top.x + Math.cos(a) * 1.1, top.y + 0.2, Math.sin(a) * 1.1);
      frond.rotation.set(0, -a, -0.35);
      addCaster(frond);
    }
    for (let n = 0; n < 3; n++) {
      const nut = MeshBuilder.CreateSphere('coconut', { diameter: 0.3, segments: 8 }, scene);
      nut.material = nutMat;
      nut.parent = palm;
      nut.position.set(top.x + (n - 1) * 0.2, top.y - 0.15, -0.15);
    }
  }

  // A striped sunshade with a towel under it.
  const shadeX = BEACH_X + 42;
  const shade = new TransformNode('sunshade', scene);
  shade.position.set(shadeX, groundY(shadeX), 3.2);
  const pole = MeshBuilder.CreateCylinder('pole', { height: 3.2, diameter: 0.08 }, scene);
  pole.material = material(scene, 'poleMat', '#ffffff', 0.4, 0.2);
  pole.parent = shade;
  pole.position.y = 1.6;
  const stripes = ['#ff5c8a', '#ffffff', '#ffd23f', '#ffffff'];
  for (let i = 0; i < 8; i++) {
    const slice = MeshBuilder.CreateCylinder('shadeSlice', { height: 0.6, diameterTop: 0.05, diameterBottom: 3.4, tessellation: 24, arc: 1 / 8 }, scene);
    slice.material = material(scene, `shade${i}`, stripes[i % stripes.length], 0.2, 0.15);
    slice.parent = shade;
    slice.position.y = 3.2;
    slice.rotation.y = (i / 8) * Math.PI * 2;
    addCaster(slice);
  }
  const towel = MeshBuilder.CreateBox('towel', { width: 2.6, height: 0.03, depth: 1.3 }, scene);
  towel.material = material(scene, 'towelMat', '#6ec6ff', 0.1, 0.15);
  towel.position.set(shadeX + 1.2, groundY(shadeX + 1.2) + 0.02, 2.4);
  towel.rotation.y = 0.2;
  // Starfish and shells in the sand.
  const starMat = material(scene, 'starfishMat', '#ff8a3d', 0.2, 0.2);
  starMat.backFaceCulling = false;
  const shellMat = material(scene, 'shellMat', '#ffe0ee', 0.5, 0.2);
  for (let i = 0; i < 26; i++) {
    const x = BEACH_X + 3 + rng() * (SEA_X - BEACH_X - 10);
    const z = -3.4 + rng() * 9;
    if (z > -1.3 && z < 1.3) continue;
    if (i % 2 === 0) {
      const star = fanMesh(scene, 'starfish', starOutline());
      star.material = starMat;
      star.rotation.x = Math.PI / 2;
      star.scaling.setAll(0.6);
      star.position.set(x, groundY(x) + 0.03, z);
    } else {
      const shell = MeshBuilder.CreateSphere('shell', { diameter: 0.3, segments: 8, slice: 0.5 }, scene);
      shell.material = shellMat;
      shell.position.set(x, groundY(x), z);
    }
  }
}
