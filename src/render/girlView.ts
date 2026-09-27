// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Girl } from '../core/game';
import type { Look } from '../core/look';
import { type Accessory, outfitColor, outfitStyle, type Wardrobe } from '../core/shop';
import { fanMesh, glowMaterial, heartOutline, material, starOutline } from './shapes';

/** Everything that decides how the girl is drawn: her look plus what she wears. */
export interface GirlLook extends Look {
  top: string;
  skirt: string;
  shoes: string;
  hairAcc: { style: Accessory; color: string };
  earrings: { style: Accessory; color: string };
  /** Nail polish colour, or null without polish. */
  nails: string | null;
}

export function girlLook(w: Wardrobe): GirlLook {
  return {
    ...w.look,
    top: outfitColor(w, 'top'),
    skirt: outfitColor(w, 'skirt'),
    shoes: outfitColor(w, 'shoes'),
    hairAcc: { style: outfitStyle(w, 'headband'), color: outfitColor(w, 'headband') },
    earrings: { style: outfitStyle(w, 'earrings'), color: outfitColor(w, 'earrings') },
    nails: outfitStyle(w, 'nails') === 'none' ? null : outfitColor(w, 'nails'),
  };
}

/** A tube along a little arc, for smiles and closed happy eyes. */
function arc(scene: Scene, name: string, radius: number, from: number, to: number, thickness: number): Mesh {
  const path: Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = from + ((to - from) * i) / 10;
    path.push(new Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return MeshBuilder.CreateTube(name, { path, radius: thickness, tessellation: 6 }, scene);
}

/** The little girl: a chunky, round-headed figure with hair jewellery and a magic wand. */
export class GirlView {
  readonly root: TransformNode;
  private readonly body: TransformNode;
  private readonly legs: TransformNode[] = [];
  private readonly arms: TransformNode[] = [];
  private readonly eyes: TransformNode[] = [];
  private readonly wandStar: Mesh;
  private readonly blinks: boolean;
  private walk = 0;
  private yaw = -0.6;
  private blinkIn = 2;
  private castTime = 0;
  private time = 0;

  constructor(scene: Scene, look: GirlLook, addCaster: (m: Mesh) => void) {
    this.root = new TransformNode('girl', scene);
    this.root.scaling.setAll(1.15);
    this.body = new TransformNode('girlBody', scene);
    this.body.parent = this.root;
    const skin = material(scene, 'girlSkin', look.skin, 0.15, 0.12);
    const hair = material(scene, 'girlHair', look.hair, 0.35, 0.05);
    const top = material(scene, 'girlTop', look.top, 0.2, 0.1);
    const skirt = material(scene, 'girlSkirt', look.skirt, 0.2, 0.1);
    const shoes = material(scene, 'girlShoes', look.shoes, 0.5, 0.05);
    const dark = material(scene, 'girlEye', '#2a1a2e', 0.9, 0);
    const white = material(scene, 'girlEyeShine', '#ffffff', 0, 1);
    const blush = material(scene, 'girlBlush', '#ff9fb2', 0, 0.3);
    const lips = material(scene, 'mouthMat', '#c2456a', 0.1, 0.1);
    const add = (m: Mesh, mat: StandardMaterial, parent: TransformNode = this.body) => {
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
      // Painted nails: a shiny cap on the tip of each hand.
      if (look.nails) {
        const nail = add(MeshBuilder.CreateSphere('nails', { diameter: 0.12, segments: 8 }, scene), material(scene, 'nailMat', look.nails, 0.9, 0.3), shoulder);
        nail.scaling.set(1, 0.5, 1);
        nail.position.set(0, -0.65, -0.02);
      }
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
    this.buildHair(scene, look, head, hair, add);

    // Eyes: round with a shine, big and sparkly with lashes, or happily closed.
    this.blinks = look.eyes !== 'froh';
    for (const side of [-1, 1]) {
      const eye = new TransformNode('eye', scene);
      eye.parent = head;
      eye.position.set(side * 0.16, 0.0, -0.37);
      this.eyes.push(eye);
      if (look.eyes === 'froh') {
        const closed = add(arc(scene, 'happyEye', 0.07, 0.2, Math.PI - 0.2, 0.018), dark, eye);
        closed.position.z = -0.01;
      } else {
        const big = look.eyes === 'glitzer' ? 1.25 : 1;
        const ball = add(MeshBuilder.CreateSphere('eyeBall', { diameter: 0.17 * big, segments: 12 }, scene), dark, eye);
        ball.scaling.set(0.85, 1.15, 0.5);
        add(MeshBuilder.CreateSphere('shine', { diameter: 0.06 * big, segments: 6 }, scene), white, eye).position.set(0.025, 0.04, -0.05);
        if (look.eyes === 'glitzer') {
          add(MeshBuilder.CreateSphere('shine2', { diameter: 0.03, segments: 6 }, scene), white, eye).position.set(-0.03, -0.04, -0.05);
          const lash = add(MeshBuilder.CreateBox('lash', { width: 0.05, height: 0.015, depth: 0.02 }, scene), dark, eye);
          lash.position.set(side * 0.1, 0.09, -0.01);
          lash.rotation.z = side * 0.6;
        }
      }
      const cheek = add(MeshBuilder.CreateSphere('cheek', { diameter: 0.14, segments: 8 }, scene), blush, head);
      cheek.scaling.set(1, 0.6, 0.3);
      cheek.position.set(side * 0.25, -0.13, -0.33);
      if (look.freckles) {
        const freckle = material(scene, 'freckle', '#a0633b', 0, 0.05);
        for (const [dx, dy] of [
          [-0.03, 0.03],
          [0.03, 0.01],
          [0, -0.03],
        ])
          add(MeshBuilder.CreateSphere('freckle', { diameter: 0.022, segments: 4 }, scene), freckle, head).position.set(side * 0.2 + dx, -0.06 + dy, -0.385);
      }
      this.buildEarring(scene, look, head, side, add);
    }
    if (look.mouth === 'offen') {
      const mouth = add(MeshBuilder.CreateSphere('mouthO', { diameter: 0.09, segments: 10 }, scene), lips, head);
      mouth.scaling.set(1, 1.2, 0.4);
      mouth.position.set(0, -0.19, -0.39);
    } else if (look.mouth === 'katze') {
      for (const side of [-1, 1])
        add(arc(scene, 'catMouth', 0.035, Math.PI + 0.2, 2 * Math.PI - 0.2, 0.012), lips, head).position.set(side * 0.035, -0.17, -0.405);
    } else {
      add(arc(scene, 'smile', 0.07, Math.PI + 0.5, 2 * Math.PI - 0.5, 0.016), lips, head).position.set(0, -0.12, -0.405);
    }
    this.buildHairAcc(scene, look, head, add);
  }

  private buildHair(
    scene: Scene,
    look: GirlLook,
    head: TransformNode,
    hair: StandardMaterial,
    add: (m: Mesh, mat: StandardMaterial, p?: TransformNode) => Mesh,
  ): void {
    const cap = add(MeshBuilder.CreateSphere('hairCap', { diameter: 0.95, segments: 20, slice: 0.62 }, scene), hair, head);
    cap.position.set(0, 0.04, 0.05);
    cap.rotation.x = -0.5;
    const back = add(MeshBuilder.CreateSphere('hairBack', { diameter: 0.9, segments: 16 }, scene), hair, head);
    back.position.set(0, -0.15, 0.2);
    back.scaling.set(1.05, 1.1, 0.8);
    const s = look.hairStyle;
    if (s === 'kurz') {
      back.scaling.set(1.05, 0.85, 0.75);
      back.position.y = -0.05;
    } else if (s === 'lang') {
      // Long hair falls down the back to below the shoulders.
      const fall = add(MeshBuilder.CreateSphere('hairLong', { diameter: 0.9, segments: 16 }, scene), hair, head);
      fall.scaling.set(1.1, 1.6, 0.6);
      fall.position.set(0, -0.55, 0.28);
    } else if (s === 'zoepfe') {
      for (const side of [-1, 1]) {
        const tail = add(MeshBuilder.CreateSphere('pigtail', { diameter: 0.36, segments: 12 }, scene), hair, head);
        tail.scaling.set(0.8, 1.3, 0.8);
        tail.position.set(side * 0.5, -0.2, 0.12);
      }
    } else if (s === 'pferdeschwanz') {
      const tail = add(MeshBuilder.CreateSphere('ponytail', { diameter: 0.34, segments: 12 }, scene), hair, head);
      tail.scaling.set(0.8, 1.9, 0.8);
      tail.position.set(0, -0.12, 0.52);
      tail.rotation.x = 0.4;
    } else {
      add(MeshBuilder.CreateSphere('bun', { diameter: 0.38, segments: 12 }, scene), hair, head).position.set(0, 0.5, 0.12);
    }
  }

  private buildHairAcc(scene: Scene, look: GirlLook, head: TransformNode, add: (m: Mesh, mat: StandardMaterial, p?: TransformNode) => Mesh): void {
    const { style, color } = look.hairAcc;
    const mat = material(scene, 'hairAccMat', color, 0.3, 0.15);
    if (style === 'ears') {
      // Cat-ear headband: a thin arc over the head with two pointy ears.
      add(arc(scene, 'headband', 0.5, 0.15 * Math.PI, 0.85 * Math.PI, 0.04), mat, head).position.z = -0.02;
      const inner = material(scene, 'girlEarInner', '#ffc7dc', 0.1, 0.2);
      for (const side of [-1, 1]) {
        const ear = add(MeshBuilder.CreateCylinder('catEar', { height: 0.34, diameterTop: 0, diameterBottom: 0.3, tessellation: 4 }, scene), mat, head);
        ear.position.set(side * 0.27, 0.48, -0.02);
        ear.rotation.set(0, Math.PI / 4, -side * 0.35);
        const earIn = add(MeshBuilder.CreateCylinder('catEarIn', { height: 0.22, diameterTop: 0, diameterBottom: 0.18, tessellation: 4 }, scene), inner, head);
        earIn.position.set(side * 0.255, 0.45, -0.09);
        earIn.rotation.set(0, Math.PI / 4, -side * 0.35);
      }
    } else if (style === 'bow') {
      // A big bow on top of the head: two loops and a knot.
      const bow = new TransformNode('bow', head.getScene());
      bow.parent = head;
      bow.position.set(0.18, 0.46, -0.02);
      bow.rotation.z = -0.3;
      for (const side of [-1, 1]) {
        const loop = add(MeshBuilder.CreateCylinder('bowLoop', { height: 0.1, diameterTop: 0.02, diameterBottom: 0.26, tessellation: 12 }, scene), mat, bow);
        loop.rotation.z = (side * Math.PI) / 2;
        loop.position.x = side * 0.13;
      }
      add(MeshBuilder.CreateSphere('bowKnot', { diameter: 0.1, segments: 8 }, scene), mat, bow);
    } else if (style === 'clip-star' || style === 'clip-heart') {
      const clip = fanMesh(scene, 'hairClip', style === 'clip-star' ? starOutline() : heartOutline());
      clip.material = glowMaterial(scene, 'hairClipMat', color);
      clip.parent = head;
      clip.scaling.setAll(style === 'clip-star' ? 0.28 : 0.2);
      clip.position.set(0.26, 0.24, -0.36);
      clip.rotation.set(0.35, -0.5, 0);
    }
  }

  private buildEarring(
    scene: Scene,
    look: GirlLook,
    head: TransformNode,
    side: number,
    add: (m: Mesh, mat: StandardMaterial, p?: TransformNode) => Mesh,
  ): void {
    const { style, color } = look.earrings;
    if (style === 'none') return;
    const x = side * 0.42;
    if (style === 'pearl') {
      add(MeshBuilder.CreateSphere('pearl', { diameter: 0.08, segments: 10 }, scene), material(scene, 'pearlMat', color, 1, 0.3), head).position.set(
        x,
        -0.12,
        -0.02,
      );
      return;
    }
    const charm = fanMesh(scene, 'earring', style === 'star' ? starOutline() : heartOutline());
    charm.material = glowMaterial(scene, 'earringMat', color);
    charm.parent = head;
    charm.scaling.setAll(0.12);
    charm.position.set(x, -0.16, -0.04);
    charm.billboardMode = TransformNode.BILLBOARDMODE_ALL;
  }

  dispose(): void {
    this.root.dispose(false, true);
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
    const carrying = girl.carrying !== null;
    this.time += dt;
    this.root.position.set(girl.x, girl.y, girl.z);
    // Turn mostly towards the camera so the face stays visible, like the garlic buddies do; walking
    // away into the scene she shows her back, walking towards the camera her face.
    const side = girl.facing > 0 ? -1 : 1;
    const targetYaw = girl.vz > 0 && girl.vx === 0 ? side * 2.6 : girl.vz < 0 && girl.vx === 0 ? side * 0.15 : side * 0.6;
    this.yaw += (targetYaw - this.yaw) * Math.min(1, dt * 10);
    this.body.rotation.y = this.yaw;

    const moving = (girl.vx !== 0 || girl.vz !== 0) && girl.onGround;
    this.walk = moving ? this.walk + dt * 11 : this.walk * Math.max(0, 1 - dt * 10);
    const swing = Math.sin(this.walk) * (moving ? 0.7 : 0);
    if (!girl.onGround) {
      // In the air: legs tucked, arms out; while flying, a gentle bob and arms spread wide.
      const bob = flying ? Math.sin(this.time * 6) * 0.15 : 0;
      this.legs[0].rotation.x = 0.4 + bob;
      this.legs[1].rotation.x = -0.2 - bob;
      this.arms[0].rotation.set(0, 0, -1.2 - bob);
      this.arms[1].rotation.set(0, 0, 1.2 + bob);
      this.body.position.y = 0;
    } else {
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.set(-swing * 0.8, 0, -0.25);
      this.arms[1].rotation.set(swing * 0.8, 0, 0.25);
      this.body.position.y = Math.abs(Math.sin(this.walk)) * (moving ? 0.08 : 0) + Math.sin(this.time * 2) * 0.012;
    }
    if (carrying) {
      // Both arms forward, holding the cat.
      this.arms[0].rotation.set(-1.25, 0, -0.35);
      this.arms[1].rotation.set(-1.25, 0, 0.35);
    }
    if (this.castTime > 0) {
      this.castTime -= dt;
      this.arms[1].rotation.set(0, 0, 2.4);
    }
    this.wandStar.scaling.setAll(0.32 * (1 + Math.max(0, this.castTime) * 2.5 + Math.sin(this.time * 5) * 0.08));
    this.wandStar.rotation.z += dt * 2;

    this.blinkIn -= dt;
    const closed = this.blinks && this.blinkIn < 0.12;
    if (this.blinkIn < 0) this.blinkIn = 2 + Math.random() * 3;
    for (const e of this.eyes) e.scaling.y = closed ? 0.15 : 1;
  }
}
