// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import '@babylonjs/core/Meshes/instancedMesh';
import { fanMesh, glowMaterial, heartOutline, material, starOutline } from './shapes';

interface Particle {
  mesh: AbstractMesh;
  vel: Vector3;
  age: number;
  life: number;
  size: number;
  spin: number;
  /** Hearts wobble sideways as they rise; sparkles do not. */
  wobble: number;
}

const SPARKLE_COLORS = ['#ffe066', '#ff9fd8', '#9fe8ff', '#c7a6ff', '#ffffff'];

/** Floating hearts, magic sparkles and the coins lying around. */
export class Effects {
  private readonly particles: Particle[] = [];
  private readonly heart: Mesh;
  private readonly stars: Mesh[];
  private readonly coinTemplate: Mesh;
  private readonly coins = new Map<number, { node: TransformNode; age: number }>();
  private readonly collecting: { node: TransformNode; age: number }[] = [];

  constructor(
    private readonly scene: Scene,
    glow: GlowLayer,
  ) {
    this.heart = fanMesh(scene, 'heart', heartOutline());
    this.heart.material = glowMaterial(scene, 'heartMat', '#ff4f8b');
    this.heart.isVisible = false;
    glow.addIncludedOnlyMesh(this.heart);
    this.stars = SPARKLE_COLORS.map((c, i) => {
      const s = fanMesh(scene, 'star' + i, starOutline());
      s.material = glowMaterial(scene, 'starMat' + i, c);
      s.isVisible = false;
      glow.addIncludedOnlyMesh(s);
      return s;
    });
    this.coinTemplate = MeshBuilder.CreateCylinder('coin', { diameter: 0.62, height: 0.1, tessellation: 28 }, scene);
    const gold = material(scene, 'goldMat', '#ffc83d', 0.9, 0.35);
    gold.specularPower = 64;
    this.coinTemplate.material = gold;
    this.coinTemplate.isVisible = false;
    glow.addIncludedOnlyMesh(this.coinTemplate);
  }

  private spawn(template: Mesh, pos: Vector3, vel: Vector3, life: number, size: number, wobble = 0): void {
    const mesh = template.createInstance('p');
    mesh.position.copyFrom(pos);
    mesh.billboardMode = TransformNode.BILLBOARDMODE_ALL;
    mesh.scaling.setAll(0.01);
    this.particles.push({ mesh, vel, age: 0, life, size, spin: (Math.random() - 0.5) * 4, wobble });
  }

  /** A little burst of hearts rising from a happy cat. */
  hearts(at: Vector3): void {
    for (let i = 0; i < 5; i++) {
      const pos = at.add(new Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.3, -0.8));
      const vel = new Vector3((Math.random() - 0.5) * 0.8, 1.6 + Math.random() * 1.2, 0);
      this.spawn(this.heart, pos, vel, 1.3 + Math.random() * 0.5, 0.45 + Math.random() * 0.25, 1);
    }
  }

  /** A ring of colourful stars bursting out of the wand. */
  magic(at: Vector3): void {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      const vel = new Vector3(Math.cos(a) * speed, Math.sin(a) * speed, 0);
      const star = this.stars[i % this.stars.length];
      this.spawn(star, at.add(new Vector3(0, 0, -0.5)), vel, 0.9 + Math.random() * 0.5, 0.3 + Math.random() * 0.3);
    }
  }

  /** A single sparkle left behind while flying. */
  trail(at: Vector3): void {
    const star = this.stars[Math.floor(Math.random() * this.stars.length)];
    const pos = at.add(new Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4, -0.3));
    this.spawn(star, pos, new Vector3(0, -0.6, 0), 0.7, 0.2 + Math.random() * 0.15);
  }

  addCoin(id: number, x: number, y: number): void {
    const node = new TransformNode('coinNode', this.scene);
    node.position.set(x, y, -0.3);
    const m = this.coinTemplate.createInstance('coin' + id);
    m.parent = node;
    m.rotation.x = Math.PI / 2;
    this.coins.set(id, { node, age: 0 });
  }

  collectCoin(id: number): void {
    const c = this.coins.get(id);
    if (!c) return;
    this.coins.delete(id);
    c.age = 0;
    this.collecting.push(c);
    const p = c.node.position;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.spawn(this.stars[0], p.clone(), new Vector3(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0), 0.5, 0.22);
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        p.mesh.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.scaleInPlace(p.wobble ? 1 : Math.max(0, 1 - dt * 2.5));
      p.mesh.position.addInPlace(p.vel.scale(dt));
      if (p.wobble) p.mesh.position.x += Math.sin(p.age * 7 + i) * dt * 0.6;
      // Pop in, hold, shrink away.
      const grow = Math.min(1, t * 6);
      const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      p.mesh.scaling.setAll(p.size * grow * fade * (1 + Math.sin(p.age * 9) * 0.06 * p.wobble));
      p.mesh.rotation.z += p.spin * dt;
    }
    for (const c of this.coins.values()) {
      c.age += dt;
      const pop = Math.min(1, c.age * 4);
      c.node.scaling.setAll(pop * (1 + Math.max(0, 1 - c.age * 3) * 0.6));
      c.node.rotation.y += dt * 2.8;
      c.node.position.y += Math.sin(c.age * 3) * dt * 0.25;
    }
    for (let i = this.collecting.length - 1; i >= 0; i--) {
      const c = this.collecting[i];
      c.age += dt;
      c.node.position.y += dt * 5;
      c.node.rotation.y += dt * 14;
      c.node.scaling.setAll(Math.max(0.01, 1 - c.age * 2.5));
      if (c.age > 0.4) {
        c.node.dispose();
        this.collecting.splice(i, 1);
      }
    }
  }
}
