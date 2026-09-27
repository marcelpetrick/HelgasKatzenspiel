// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Game, GroundToy } from '../core/game';
import { groundY } from '../core/world';
import { material } from './shapes';

/**
 * Things lying on the floor that come and go: thrown toys and the bowls the girl puts down.
 * Each frame `sync` builds what is new, moves what is there and removes what is gone.
 */
export class Props {
  private readonly toys = new Map<number, TransformNode>();
  private readonly bowls = new Map<number, { node: TransformNode; fill: Mesh; age: number }>();
  private readonly mats: Record<string, StandardMaterial>;

  constructor(
    private readonly scene: Scene,
    private readonly addCaster: (m: Mesh) => void,
  ) {
    this.mats = {
      yarn: material(scene, 'yarnMat', '#ff6fa8', 0.15, 0.1),
      strand: material(scene, 'strandMat', '#d94a86', 0.15, 0.05),
      ball: material(scene, 'ballMat', '#ffffff', 0.6, 0.15),
      ballStripe: material(scene, 'ballStripe', '#4aa3ff', 0.6, 0.15),
      bell: material(scene, 'bellMat', '#ffd23f', 0.9, 0.3),
      mouse: material(scene, 'mouseMat', '#a9a2b3', 0.2, 0.05),
      pink: material(scene, 'mousePink', '#ff9fb8', 0.1, 0.2),
      dish: material(scene, 'groundDish', '#6ec6ff', 0.4, 0.1),
      food: material(scene, 'groundKibble', '#a0632f', 0.1, 0.05),
      milk: material(scene, 'groundMilk', '#ffffff', 0.4, 0.4),
    };
  }

  private part(m: Mesh, mat: StandardMaterial, parent: TransformNode): Mesh {
    m.material = mat;
    m.parent = parent;
    this.addCaster(m);
    return m;
  }

  private buildToy(t: GroundToy): TransformNode {
    const node = new TransformNode(`toy${t.id}`, this.scene);
    const s = this.scene;
    if (t.kind === 'yarn') {
      this.part(MeshBuilder.CreateSphere('yarn', { diameter: 0.5, segments: 14 }, s), this.mats.yarn, node);
      for (let i = 0; i < 3; i++)
        this.part(MeshBuilder.CreateTorus('strand', { diameter: 0.5, thickness: 0.045, tessellation: 20 }, s), this.mats.strand, node).rotation.set(
          i * 1.1,
          i * 0.7,
          i * 0.5,
        );
    } else if (t.kind === 'ball') {
      this.part(MeshBuilder.CreateSphere('ball', { diameter: 0.45, segments: 14 }, s), this.mats.ball, node);
      this.part(MeshBuilder.CreateTorus('stripe', { diameter: 0.46, thickness: 0.06, tessellation: 20 }, s), this.mats.ballStripe, node);
      this.part(MeshBuilder.CreateSphere('bell', { diameter: 0.14, segments: 8 }, s), this.mats.bell, node).position.y = 0.24;
    } else {
      const body = this.part(MeshBuilder.CreateSphere('mouse', { diameter: 0.4, segments: 12 }, s), this.mats.mouse, node);
      body.scaling.set(1.4, 0.7, 0.8);
      for (const side of [-1, 1])
        this.part(MeshBuilder.CreateSphere('ear', { diameter: 0.14, segments: 8 }, s), this.mats.pink, node).position.set(0.18, 0.13, side * 0.09);
      this.part(MeshBuilder.CreateSphere('nose', { diameter: 0.06 }, s), this.mats.pink, node).position.set(0.3, 0, 0);
      const tail = this.part(MeshBuilder.CreateCylinder('tail', { height: 0.4, diameter: 0.03 }, s), this.mats.pink, node);
      tail.rotation.z = Math.PI / 2.4;
      tail.position.set(-0.4, 0.05, 0);
    }
    return node;
  }

  private buildBowl(id: number, kind: 'food' | 'milk'): { node: TransformNode; fill: Mesh; age: number } {
    const node = new TransformNode(`bowl${id}`, this.scene);
    this.part(
      MeshBuilder.CreateCylinder('groundBowl', { height: 0.25, diameterTop: 0.9, diameterBottom: 0.65, tessellation: 24 }, this.scene),
      this.mats.dish,
      node,
    ).position.y = 0.13;
    const fill = this.part(MeshBuilder.CreateCylinder('groundFill', { height: 0.05, diameter: 0.78, tessellation: 24 }, this.scene), this.mats[kind], node);
    fill.position.y = 0.24;
    return { node, fill, age: 0 };
  }

  sync(game: Game, dt: number): void {
    const seen = new Set<number>();
    for (const t of game.toys) {
      seen.add(t.id);
      let node = this.toys.get(t.id);
      if (!node) {
        node = this.buildToy(t);
        this.toys.set(t.id, node);
      }
      node.position.set(t.x, t.y, t.z - 0.3);
      if (t.kind === 'mouse') node.rotation.y = t.vx < 0 ? Math.PI : 0;
      else node.rotation.z = -t.spin;
    }
    for (const [id, node] of this.toys)
      if (!seen.has(id)) {
        node.dispose(false, false);
        this.toys.delete(id);
      }

    seen.clear();
    for (const b of game.bowls) {
      if (b.fixed) continue;
      seen.add(b.id);
      let v = this.bowls.get(b.id);
      if (!v) {
        v = this.buildBowl(b.id, b.kind);
        this.bowls.set(b.id, v);
      }
      v.age += dt;
      // The bowl pops down with a little bounce; the food sinks as the portions go.
      v.node.position.set(b.x, groundY(b.x), b.z);
      v.node.scaling.setAll(Math.min(1, v.age * 5) * (1 + Math.max(0, 0.3 - v.age) * 1.5));
      v.fill.position.y = 0.12 + 0.12 * (b.portions / (b.kind === 'food' ? 3 : 2));
    }
    for (const [id, v] of this.bowls)
      if (!seen.has(id)) {
        v.node.dispose(false, false);
        this.bowls.delete(id);
      }
  }
}
