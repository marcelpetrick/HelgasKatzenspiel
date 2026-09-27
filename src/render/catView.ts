// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Cat, CatCoat } from '../core/game';
import { material } from './shapes';

const COATS: Record<CatCoat, { fur: string; patch?: string; patch2?: string; eye: string }> = {
  orange: { fur: '#f5a54a', patch: '#ffe2b8', eye: '#6fcf5f' },
  grau: { fur: '#9ea6b3', patch: '#dfe3ea', eye: '#ffc93c' },
  schwarz: { fur: '#34303a', patch: '#4a4552', eye: '#ffd23f' },
  weiß: { fur: '#f7f4ef', patch: '#ffd9e4', eye: '#4fb3ff' },
  creme: { fur: '#f1d9b0', patch: '#fff3dc', eye: '#7ad07a' },
  dreifarbig: { fur: '#fbf7f0', patch: '#f09a3e', patch2: '#3a3438', eye: '#8fd35a' },
};

/** A round, friendly cat seen from the side, turned a little towards the camera. */
export class CatView {
  readonly root: TransformNode;
  private readonly body: TransformNode;
  private readonly head: TransformNode;
  private readonly legs: TransformNode[] = [];
  private readonly tail: TransformNode[] = [];
  private readonly eyes: Mesh[] = [];
  private walk = Math.random() * 6;
  private yaw = 0.5;
  private time = Math.random() * 10;
  private blinkIn = 1 + Math.random() * 4;
  private happyBounce = 0;

  constructor(scene: Scene, cat: Cat, addCaster: (m: Mesh) => void) {
    const coat = COATS[cat.coat];
    const fur = material(scene, 'fur', coat.fur, 0.12, 0.1);
    const patch = material(scene, 'patch', coat.patch ?? coat.fur, 0.12, 0.1);
    const pink = material(scene, 'catPink', '#ff9fb8', 0.1, 0.25);
    const iris = material(scene, 'iris', coat.eye, 0.6, 0.35);
    const pupil = material(scene, 'catPupil', '#141018', 0.9, 0);
    const shine = material(scene, 'catShine', '#ffffff', 0, 1);

    this.root = new TransformNode('cat', scene);
    this.root.scaling.setAll(cat.size * 1.05);
    this.body = new TransformNode('catBody', scene);
    this.body.parent = this.root;
    const add = (m: Mesh, mat: StandardMaterial, parent: TransformNode = this.body) => {
      m.material = mat;
      m.parent = parent;
      addCaster(m);
      return m;
    };

    const torso = add(MeshBuilder.CreateSphere('catTorso', { diameter: 1, segments: 16 }, scene), fur);
    torso.scaling.set(1.15, 0.62, 0.6);
    torso.position.y = 0.52;
    const belly = add(MeshBuilder.CreateSphere('catBelly', { diameter: 0.8, segments: 12 }, scene), patch);
    belly.scaling.set(1.1, 0.5, 0.62);
    belly.position.set(0.05, 0.42, 0);
    if (coat.patch2) {
      const spot = add(MeshBuilder.CreateSphere('spot', { diameter: 0.5, segments: 10 }, scene), material(scene, 'spot', coat.patch2, 0.12, 0.08));
      spot.scaling.set(1, 0.5, 0.9);
      spot.position.set(-0.25, 0.72, 0);
      const spot2 = add(MeshBuilder.CreateSphere('spot2', { diameter: 0.42, segments: 10 }, scene), patch);
      spot2.scaling.set(1, 0.5, 0.9);
      spot2.position.set(0.2, 0.74, -0.02);
    }

    for (const [x, z] of [
      [0.33, -0.16],
      [0.33, 0.16],
      [-0.33, -0.16],
      [-0.33, 0.16],
    ]) {
      const hip = new TransformNode('catHip', scene);
      hip.parent = this.body;
      hip.position.set(x, 0.42, z);
      add(MeshBuilder.CreateCylinder('catLeg', { height: 0.36, diameter: 0.15, tessellation: 8 }, scene), fur, hip).position.y = -0.2;
      add(MeshBuilder.CreateSphere('paw', { diameter: 0.18, segments: 8 }, scene), patch, hip).position.set(0.03, -0.38, 0);
      this.legs.push(hip);
    }

    // The tail is a chain of beads; each bead is a child of the last so it curls as a whole.
    let parent: TransformNode = this.body;
    for (let i = 0; i < 7; i++) {
      const seg = new TransformNode('tailSeg', scene);
      seg.parent = parent;
      if (i === 0) seg.position.set(-0.6, 0.6, 0);
      else seg.position.set(-0.03, 0.13, 0);
      add(MeshBuilder.CreateSphere('tailBead', { diameter: 0.17 - i * 0.008, segments: 8 }, scene), i === 6 ? patch : fur, seg);
      this.tail.push(seg);
      parent = seg;
    }

    this.head = new TransformNode('catHead', scene);
    this.head.parent = this.body;
    this.head.position.set(0.58, 0.9, 0);
    const skull = add(MeshBuilder.CreateSphere('catSkull', { diameter: 0.66, segments: 16 }, scene), fur, this.head);
    skull.scaling.set(1, 0.9, 1.05);
    const muzzle = add(MeshBuilder.CreateSphere('muzzle', { diameter: 0.3, segments: 10 }, scene), patch, this.head);
    muzzle.scaling.set(0.7, 0.6, 1);
    muzzle.position.set(0.24, -0.1, 0);
    add(MeshBuilder.CreateSphere('nose', { diameter: 0.08, segments: 6 }, scene), pink, this.head).position.set(0.33, -0.03, 0);
    for (const side of [-1, 1]) {
      const ear = add(MeshBuilder.CreateCylinder('catEar', { height: 0.26, diameterTop: 0, diameterBottom: 0.24, tessellation: 4 }, scene), fur, this.head);
      ear.position.set(0.02, 0.3, side * 0.17);
      ear.rotation.set(side * 0.35, Math.PI / 4, 0);
      const inner = add(MeshBuilder.CreateCylinder('catEarIn', { height: 0.16, diameterTop: 0, diameterBottom: 0.14, tessellation: 4 }, scene), pink, this.head);
      inner.position.set(0.07, 0.28, side * 0.16);
      inner.rotation.set(side * 0.35, Math.PI / 4, 0);

      const eye = new TransformNode('catEye', scene);
      eye.parent = this.head;
      eye.position.set(0.25, 0.05, side * 0.14);
      const white = add(MeshBuilder.CreateSphere('iris', { diameter: 0.15, segments: 10 }, scene), iris, eye);
      white.scaling.set(0.6, 1.1, 1);
      const p = add(MeshBuilder.CreateSphere('pupil', { diameter: 0.09, segments: 8 }, scene), pupil, eye);
      p.scaling.set(0.5, 1.3, 0.6);
      p.position.x = 0.04;
      add(MeshBuilder.CreateSphere('glint', { diameter: 0.035, segments: 6 }, scene), shine, eye).position.set(0.07, 0.03, -side * 0.02);
      this.eyes.push(white, p);
    }
  }

  /** Where hearts and the name label float above the cat, in world space. */
  top(): Vector3 {
    return this.root.position.add(new Vector3(0, 1.5 * this.root.scaling.y, 0));
  }

  update(cat: Cat, dt: number): void {
    this.time += dt;
    this.root.position.set(cat.x, cat.y, -0.6 + (cat.id % 3) * 0.6);
    const targetYaw = cat.dir > 0 ? 0.55 : Math.PI - 0.55;
    this.yaw += (targetYaw - this.yaw) * Math.min(1, dt * 6);
    this.root.rotation.y = this.yaw;

    const walking = cat.mood === 'walk';
    const happy = cat.mood === 'happy';
    this.walk += walking ? dt * cat.speed * 7 : 0;
    const legPairs = [0, Math.PI, Math.PI, 0];
    this.legs.forEach((leg, i) => (leg.rotation.z = walking ? Math.sin(this.walk + legPairs[i]) * 0.5 : 0));

    this.happyBounce = happy ? this.happyBounce + dt * 14 : 0;
    this.body.position.y = happy ? Math.abs(Math.sin(this.happyBounce)) * 0.12 : walking ? Math.abs(Math.sin(this.walk)) * 0.04 : 0;
    this.head.rotation.x = happy ? Math.sin(this.happyBounce * 0.5) * 0.25 : Math.sin(this.time * 0.7) * 0.06;

    // Tail: sways lazily, stands straight up when the cat is happy.
    this.tail.forEach((seg, i) => {
      const sway = Math.sin(this.time * (happy ? 7 : 2) - i * 0.6) * (happy ? 0.12 : 0.22);
      seg.rotation.z = (happy ? 0.05 : -0.18) + (i === 0 ? (happy ? 0.2 : 0.6) : 0);
      seg.rotation.x = sway;
    });

    // Happy cats squeeze their eyes shut; everyone blinks now and then.
    this.blinkIn -= dt;
    const blink = this.blinkIn < 0.12;
    if (this.blinkIn < 0) this.blinkIn = 1.5 + Math.random() * 4;
    for (const e of this.eyes) e.scaling.y = happy ? 0.25 : blink ? 0.15 : e.name === 'pupil' ? 1.3 : 1.1;
  }
}
