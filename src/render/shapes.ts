// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Scene } from '@babylonjs/core/scene';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
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

/** Every sign, so it can be drawn again once the rounded Fredoka font has finished loading. */
const signs: (() => void)[] = [];
let fontWatch = false;

/**
 * A sign drawn onto a texture, for building names and pictures. `aspect` is the width/height of the
 * plane it goes on, so the lettering is not stretched.
 */
export function signMaterial(scene: Scene, name: string, text: string, ink: string, paper: string, aspect = 4): StandardMaterial {
  const height = 256;
  const tex = new DynamicTexture(name, { width: Math.round(height * aspect), height }, scene, true);
  const draw = () => {
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const { width } = tex.getSize();
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = ink;
    ctx.font = `bold ${Math.min(130, (width / Math.max(1, text.length)) * 1.6)}px Fredoka, "Nunito", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, 136);
    tex.update();
  };
  draw();
  signs.push(draw);
  if (!fontWatch && typeof document !== 'undefined' && 'fonts' in document) {
    fontWatch = true;
    void document.fonts.load('bold 130px Fredoka').then(() => {
      for (const redraw of signs) redraw();
    });
  }
  const m = new StandardMaterial(`${name}Mat`, scene);
  m.diffuseTexture = tex;
  m.emissiveColor = new Color3(0.45, 0.45, 0.45);
  m.specularColor = Color3.Black();
  return m;
}
