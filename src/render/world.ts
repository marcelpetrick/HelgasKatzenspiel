// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { type Game, type GameEvent, WORLD_MAX_X, WORLD_MIN_X } from '../core/game';
import { outfitColor } from '../core/shop';
import { CatView } from './catView';
import { Effects } from './effects';
import { DEFAULT_STYLE, GirlView } from './girlView';
import { buildHouse } from './house';
import { buildLandscape } from './landscape';
import { material } from './shapes';

const CAMERA_DISTANCE = 20;

/** One Babylon scene showing the game: landscape, house, girl, cats, effects and a following camera. */
export class World {
  readonly scene: Scene;
  readonly camera: FreeCamera;
  private readonly girl: GirlView;
  private readonly cats = new Map<number, CatView>();
  private readonly effects: Effects;
  private readonly tickLandscape: (dt: number) => void;
  private readonly focus: Vector3;
  private trailIn = 0;
  private readonly yarn: Mesh;

  constructor(
    private readonly engine: AbstractEngine,
    private readonly game: Game,
  ) {
    const scene = new Scene(engine);
    this.scene = scene;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = Color3.FromHexString('#cfe6f7');
    scene.clearColor = new Color4(0.8, 0.9, 0.97, 1);

    this.focus = new Vector3(game.girl.x, game.girl.y + 2.5, 0);
    this.camera = new FreeCamera('camera', new Vector3(this.focus.x, this.focus.y + 3, -CAMERA_DISTANCE), scene);
    this.camera.fov = 0.72;
    this.camera.minZ = 0.3;
    this.camera.maxZ = 2500;
    this.camera.inputs.clear();

    const hemi = new HemisphericLight('ambient', new Vector3(0.2, 1, -0.4), scene);
    hemi.diffuse = Color3.FromHexString('#fff6ec');
    hemi.groundColor = Color3.FromHexString('#7d8fb0');
    hemi.intensity = 0.75;
    hemi.specular = Color3.Black();

    const sun = new DirectionalLight('sun', new Vector3(-0.45, -0.8, 0.55).normalize(), scene);
    sun.diffuse = Color3.FromHexString('#fff1d6');
    sun.intensity = 1.6;
    sun.position = new Vector3(60, 40, -30);
    sun.autoUpdateExtends = true;
    const shadows = new ShadowGenerator(2048, sun);
    shadows.usePercentageCloserFiltering = true;
    shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    shadows.darkness = 0.35;
    shadows.normalBias = 0.02;
    const addCaster = (m: Mesh) => shadows.addShadowCaster(m, false);

    const glow = new GlowLayer('glow', scene, { blurKernelSize: 32, mainTextureRatio: 0.5 });
    glow.intensity = 0.7;

    this.tickLandscape = buildLandscape(scene, addCaster);
    buildHouse(scene, addCaster);
    this.girl = new GirlView(scene, DEFAULT_STYLE, addCaster);
    this.refreshOutfit();

    // The yarn ball: a pink sphere wrapped in a few darker strands.
    this.yarn = MeshBuilder.CreateSphere('yarn', { diameter: 0.5, segments: 14 }, scene);
    this.yarn.material = material(scene, 'yarnMat', '#ff6fa8', 0.15, 0.1);
    const strandMat = material(scene, 'strandMat', '#d94a86', 0.15, 0.05);
    for (let i = 0; i < 3; i++) {
      const strand = MeshBuilder.CreateTorus('strand', { diameter: 0.5, thickness: 0.045, tessellation: 20 }, scene);
      strand.material = strandMat;
      strand.parent = this.yarn;
      strand.rotation.set(i * 1.1, i * 0.7, i * 0.5);
    }
    this.yarn.setEnabled(false);
    addCaster(this.yarn);
    for (const c of game.cats) this.cats.set(c.id, new CatView(scene, c, addCaster));
    this.effects = new Effects(scene, glow);
    for (const coin of game.coins) this.effects.addCoin(coin.id, coin.x, coin.y);
    // The start-up coins were reported as events too; the scene already shows them.
    game.drainEvents();

    // The same look as Allium Assault: ACES tone mapping, a little bloom and a soft vignette.
    const pipeline = new DefaultRenderingPipeline('post', true, scene, [this.camera]);
    pipeline.fxaaEnabled = true;
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.8;
    pipeline.bloomWeight = 0.3;
    pipeline.bloomKernel = 64;
    pipeline.bloomScale = 0.5;
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    pipeline.imageProcessing.exposure = 1.0;
    pipeline.imageProcessing.contrast = 1.12;
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = 1.4;
    pipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0);
  }

  handleEvents(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hearts': {
          const view = this.cats.get(e.cat);
          if (view) this.effects.hearts(view.top(), e.count);
          break;
        }
        case 'magic':
          this.girl.cast();
          this.effects.magic(this.girl.wandTip());
          break;
        case 'feed': {
          const view = this.cats.get(e.cat);
          const cat = this.game.cats.find((c) => c.id === e.cat);
          if (view && cat) this.effects.feed(e.x + cat.dir * 0.9 * cat.size, e.y, view.root.position.z, e.supply === 'treat');
          break;
        }
        case 'yarn':
        case 'coinSpawn':
          if (e.type === 'coinSpawn') this.effects.addCoin(e.coin, e.x, e.y);
          break;
        case 'coin':
          this.effects.collectCoin(e.coin);
          break;
        case 'jump':
        case 'land':
          break;
      }
    }
  }

  update(dt: number, flying: boolean): void {
    const g = this.game.girl;
    this.girl.update(g, dt, flying);
    for (const c of this.game.cats) this.cats.get(c.id)?.update(c, dt);
    if (flying) {
      this.trailIn -= dt;
      if (this.trailIn <= 0) {
        this.trailIn = 0.03;
        this.effects.trail(new Vector3(g.x, g.y + 0.6, 0));
      }
    }
    const y = this.game.yarn;
    this.yarn.setEnabled(y !== null);
    if (y) {
      this.yarn.position.set(y.x, y.y, -0.4);
      this.yarn.rotation.z = -y.spin;
    }
    this.effects.update(dt);
    this.tickLandscape(dt);

    // Follow the girl smoothly, staying inside the world and rising when she flies.
    const half = 12;
    const tx = Math.min(WORLD_MAX_X - half + 4, Math.max(WORLD_MIN_X + half - 4, g.x + g.facing * 1.5));
    const ty = g.y + 2.4;
    const k = Math.min(1, dt * 3);
    this.focus.x += (tx - this.focus.x) * k;
    this.focus.y += (ty - this.focus.y) * k;
    this.camera.position.set(this.focus.x, this.focus.y + 2.2, -CAMERA_DISTANCE);
    this.camera.setTarget(new Vector3(this.focus.x, this.focus.y, 0));
  }

  /** Dress the girl in whatever the wardrobe says she wears. */
  refreshOutfit(): void {
    const w = this.game.wardrobe;
    this.girl.applyStyle({
      top: outfitColor(w, 'top'),
      skirt: outfitColor(w, 'skirt'),
      headband: outfitColor(w, 'headband'),
      shoes: outfitColor(w, 'shoes'),
    });
  }

  /** World position → CSS pixels on the canvas, for labels drawn in the DOM. */
  project(p: Vector3): { x: number; y: number; visible: boolean } {
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const v = Vector3.Project(p, Matrix.Identity(), this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, h));
    const scale = this.engine.getHardwareScalingLevel();
    return { x: v.x * scale, y: v.y * scale, visible: v.z > 0 && v.z < 1 };
  }

  catTop(id: number): Vector3 | null {
    return this.cats.get(id)?.top() ?? null;
  }

  render(): void {
    this.scene.render();
  }
}
