// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Girl } from '../core/game';
import { fanMesh, glowMaterial, material, starOutline } from './shapes';

/** How the girl looks; the character editor will change these later. */
export interface GirlStyle {
  skin: string;
  hair: string;
  top: string;
  skirt: string;
  shoes: string;
  headband: string;
}

export const DEFAULT_STYLE: GirlStyle = {
  skin: '#ffd9c2',
  hair: '#8a4b2a',
  top: '#ff7eb6',
  skirt: '#b388ff',
  shoes: '#e0567a',
  headband: '#ff9fc6',
};

/** The little girl: a chunky, round-headed figure with a cat-ear headband and a magic wand. */
export class GirlView {
  readonly root: TransformNode;
  private readonly body: TransformNode;
  private readonly legs: TransformNode[] = [];
  private readonly arms: TransformNode[] = [];
  private readonly eyes: Mesh[] = [];
  private readonly wandStar: Mesh;
  private walk = 0;
  private yaw = -0.6;
  private blinkIn = 2;
  private castTime = 0;
  private time = 0;
  private readonly styled: Partial<Record<keyof GirlStyle, StandardMaterial>> = {};

  constructor(scene: Scene, style: GirlStyle, addCaster: (m: Mesh) => void) {
    this.root = new TransformNode('girl', scene);
    this.root.scaling.setAll(1.15);
    this.body = new TransformNode('girlBody', scene);
    this.body.parent = this.root;
    const skin = material(scene, 'girlSkin', style.skin, 0.15, 0.12);
    const hair = material(scene, 'girlHair', style.hair, 0.35, 0.05);
    const top = material(scene, 'girlTop', style.top, 0.2, 0.1);
    const skirt = material(scene, 'girlSkirt', style.skirt, 0.2, 0.1);
    const shoes = material(scene, 'girlShoes', style.shoes, 0.5, 0.05);
    const band = material(scene, 'girlBand', style.headband, 0.3, 0.15);
    Object.assign(this.styled, { skin, hair, top, skirt, shoes, headband: band });
    const inner = material(scene, 'girlEarInner', '#ffc7dc', 0.1, 0.2);
    const dark = material(scene, 'girlEye', '#2a1a2e', 0.9, 0);
    const white = material(scene, 'girlEyeShine', '#ffffff', 0, 1);
    const blush = material(scene, 'girlBlush', '#ff9fb2', 0, 0.3);
    const add = (m: Mesh, mat: typeof skin, parent: TransformNode = this.body) => {
      m.material = mat;
      m.parent = parent;
      addCaster(m);
      return m;
    };

    for (const side of [-1, 1]) {
      const hip = new TransformNode('hip', scene);
      hip.parent = this.body;
      hip.position.set(side * 0.14, 0.72, 0);
      add(MeshBuilder.CreateCylinder('leg', { height: 0.62, diameter: 0.17, tessellation: 10 }, scene), skin, hip).position.y = -0.33;
      const shoe = add(MeshBuilder.CreateSphere('shoe', { diameter: 0.28, segments: 10 }, scene), shoes, hip);
      shoe.scaling.set(0.9, 0.6, 1.3);
      shoe.position.set(0, -0.66, -0.05);
      this.legs.push(hip);

      const shoulder = new TransformNode('shoulder', scene);
      shoulder.parent = this.body;
      shoulder.position.set(side * 0.3, 1.62, 0);
      shoulder.rotation.z = side * 0.25;
      add(MeshBuilder.CreateCylinder('sleeve', { height: 0.3, diameterTop: 0.2, diameterBottom: 0.17, tessellation: 10 }, scene), top, shoulder).position.y =
        -0.12;
      add(MeshBuilder.CreateCylinder('arm', { height: 0.34, diameter: 0.13, tessellation: 10 }, scene), skin, shoulder).position.y = -0.4;
      add(MeshBuilder.CreateSphere('hand', { diameter: 0.17, segments: 8 }, scene), skin, shoulder).position.y = -0.58;
      this.arms.push(shoulder);
    }

    // Magic wand in the right hand, topped with a glowing star.
    const wand = add(
      MeshBuilder.CreateCylinder('wand', { height: 0.55, diameter: 0.05, tessellation: 6 }, scene),
      material(scene, 'wandMat', '#ffffff', 0.5, 0.3),
      this.arms[1],
    );
    wand.position.set(0, -0.62, -0.18);
    wand.rotation.x = -1.1;
    this.wandStar = fanMesh(scene, 'wandStar', starOutline());
    this.wandStar.material = glowMaterial(scene, 'wandStarMat', '#ffe066');
    this.wandStar.parent = this.arms[1];
    this.wandStar.position.set(0, -0.72, -0.43);
    this.wandStar.scaling.setAll(0.32);
    this.wandStar.billboardMode = TransformNode.BILLBOARDMODE_ALL;

    const dress = add(MeshBuilder.CreateCylinder('skirt', { height: 0.62, diameterTop: 0.5, diameterBottom: 1.05, tessellation: 20 }, scene), skirt);
    dress.position.y = 0.98;
    const torso = add(MeshBuilder.CreateCylinder('torso', { height: 0.5, diameterTop: 0.46, diameterBottom: 0.52, tessellation: 16 }, scene), top);
    torso.position.y = 1.52;
    add(MeshBuilder.CreateCylinder('neck', { height: 0.15, diameter: 0.14 }, scene), skin).position.y = 1.82;

    const head = new TransformNode('head', scene);
    head.parent = this.body;
    head.position.y = 2.22;
    add(MeshBuilder.CreateSphere('face', { diameter: 0.86, segments: 20 }, scene), skin, head);
    const hairCap = add(MeshBuilder.CreateSphere('hairCap', { diameter: 0.95, segments: 20, slice: 0.62 }, scene), hair, head);
    hairCap.position.set(0, 0.04, 0.05);
    hairCap.rotation.x = -0.5;
    const back = add(MeshBuilder.CreateSphere('hairBack', { diameter: 0.9, segments: 16 }, scene), hair, head);
    back.scaling.set(1.05, 1.1, 0.8);
    back.position.set(0, -0.15, 0.2);
    for (const side of [-1, 1]) {
      const tail = add(MeshBuilder.CreateSphere('pigtail', { diameter: 0.36, segments: 12 }, scene), hair, head);
      tail.scaling.set(0.8, 1.3, 0.8);
      tail.position.set(side * 0.5, -0.2, 0.12);
      const bow = add(MeshBuilder.CreateSphere('bobble', { diameter: 0.14, segments: 8 }, scene), band, head);
      bow.position.set(side * 0.44, 0.02, 0.1);
      const eye = add(MeshBuilder.CreateSphere('eye', { diameter: 0.17, segments: 12 }, scene), dark, head);
      eye.scaling.set(0.85, 1.15, 0.5);
      eye.position.set(side * 0.16, 0.0, -0.37);
      this.eyes.push(eye);
      const shine = add(MeshBuilder.CreateSphere('shine', { diameter: 0.06, segments: 6 }, scene), white, eye);
      shine.position.set(0.12, 0.2, -0.4);
      const cheek = add(MeshBuilder.CreateSphere('cheek', { diameter: 0.14, segments: 8 }, scene), blush, head);
      cheek.scaling.set(1, 0.6, 0.3);
      cheek.position.set(side * 0.25, -0.13, -0.33);
    }
    const mouth = add(
      MeshBuilder.CreateTorus('mouth', { diameter: 0.1, thickness: 0.025, tessellation: 12 }, scene),
      material(scene, 'mouthMat', '#c2456a', 0.1, 0.1),
      head,
    );
    mouth.rotation.x = Math.PI / 2;
    mouth.scaling.set(1, 1, 0.5);
    mouth.position.set(0, -0.19, -0.39);

    // Cat-ear headband: a thin arc over the head with two pointy ears.
    const arc: Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = 0.15 * Math.PI + (i / 16) * 0.7 * Math.PI;
      arc.push(new Vector3(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0));
    }
    add(MeshBuilder.CreateTube('headband', { path: arc, radius: 0.04, tessellation: 8 }, scene), band, head).position.z = -0.02;
    for (const side of [-1, 1]) {
      const ear = add(MeshBuilder.CreateCylinder('catEar', { height: 0.34, diameterTop: 0, diameterBottom: 0.3, tessellation: 4 }, scene), band, head);
      ear.position.set(side * 0.27, 0.48, -0.02);
      ear.rotation.set(0, Math.PI / 4, -side * 0.35);
      const earIn = add(MeshBuilder.CreateCylinder('catEarIn', { height: 0.22, diameterTop: 0, diameterBottom: 0.18, tessellation: 4 }, scene), inner, head);
      earIn.position.set(side * 0.255, 0.45, -0.09);
      earIn.rotation.set(0, Math.PI / 4, -side * 0.35);
    }
  }

  /** Change colours in place, e.g. after buying new clothes. */
  applyStyle(style: Partial<GirlStyle>): void {
    for (const [key, hex] of Object.entries(style) as [keyof GirlStyle, string][]) {
      const m = this.styled[key];
      if (!m) continue;
      m.diffuseColor = Color3.FromHexString(hex);
      m.emissiveColor = m.diffuseColor.scale(key === 'headband' ? 0.15 : 0.1);
    }
  }

  /** Flash the wand and raise the arm for a moment. */
  cast(): void {
    this.castTime = 0.5;
  }

  /** World position of the wand's star, where the magic sparkles start. */
  wandTip(): Vector3 {
    return this.wandStar.getAbsolutePosition();
  }

  update(girl: Girl, dt: number, flying: boolean): void {
    this.time += dt;
    this.root.position.set(girl.x, girl.y, 0);
    // Turn mostly towards the camera so the face stays visible, like the garlic buddies do.
    const targetYaw = girl.facing > 0 ? -0.6 : 0.6;
    this.yaw += (targetYaw - this.yaw) * Math.min(1, dt * 10);
    this.body.rotation.y = this.yaw;

    const moving = girl.vx !== 0 && girl.onGround;
    this.walk = moving ? this.walk + dt * 11 : this.walk * Math.max(0, 1 - dt * 10);
    const swing = Math.sin(this.walk) * (moving ? 0.7 : 0);
    if (!girl.onGround) {
      // In the air: legs tucked, arms out; while flying, a gentle bob and arms spread wide.
      const bob = flying ? Math.sin(this.time * 6) * 0.15 : 0;
      this.legs[0].rotation.x = 0.4 + bob;
      this.legs[1].rotation.x = -0.2 - bob;
      this.arms[0].rotation.z = -1.2 - bob;
      this.arms[1].rotation.z = 1.2 + bob;
      this.body.position.y = 0;
    } else {
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.x = -swing * 0.8;
      this.arms[1].rotation.x = swing * 0.8;
      this.arms[0].rotation.z = -0.25;
      this.arms[1].rotation.z = 0.25;
      this.body.position.y = Math.abs(Math.sin(this.walk)) * (moving ? 0.08 : 0) + Math.sin(this.time * 2) * 0.012;
    }
    if (this.castTime > 0) {
      this.castTime -= dt;
      this.arms[1].rotation.z = 2.4;
      this.arms[1].rotation.x = 0;
    }
    this.wandStar.scaling.setAll(0.32 * (1 + Math.max(0, this.castTime) * 2.5 + Math.sin(this.time * 5) * 0.08));
    this.wandStar.rotation.z += dt * 2;

    this.blinkIn -= dt;
    const closed = this.blinkIn < 0.12;
    if (this.blinkIn < 0) this.blinkIn = 2 + Math.random() * 3;
    for (const e of this.eyes) e.scaling.y = closed ? 0.15 : 1.15;
  }
}
