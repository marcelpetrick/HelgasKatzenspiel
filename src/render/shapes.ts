// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';

/** A soft, slightly shiny material in the Allium Assault look. */
export function material(scene: Scene, name: string, hex: string, spec = 0.2, emissive = 0.06): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor = new Color3(spec, spec, spec);
  m.specularPower = 32;
  m.emissiveColor = m.diffuseColor.scale(emissive);
  return m;
}

/** A glowing, unlit material for hearts, stars and sparkles. */
export function glowMaterial(scene: Scene, name: string, hex: string): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.disableLighting = true;
  m.emissiveColor = Color3.FromHexString(hex);
  m.backFaceCulling = false;
  return m;
}

/** A flat shape triangulated as a fan around the origin, which must see every outline point. */
export function fanMesh(scene: Scene, name: string, outline: readonly [number, number][]): Mesh {
  const positions = [0, 0, 0];
  for (const [x, y] of outline) positions.push(x, y, 0);
  const indices: number[] = [];
  const n = outline.length;
  for (let i = 0; i < n; i++) indices.push(0, 1 + i, 1 + ((i + 1) % n));
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.normals = normals;
  const mesh = new Mesh(name, scene);
  data.applyToMesh(mesh);
  return mesh;
}

/** Outline of a heart about one unit tall, centred on its middle. */
export function heartOutline(points = 48): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push([x / 34, (y + 3) / 34]);
  }
  return out;
}

/** Outline of a five-pointed star with outer radius 0.5. */
export function starOutline(): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.5 : 0.22;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}
