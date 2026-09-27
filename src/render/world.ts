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
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import type { Game, GameEvent } from '../core/game';
import { bounds, SPOTS } from '../core/world';
import { CatView } from './catView';
import { Effects } from './effects';
import { GirlView, girlLook } from './girlView';
import { buildHouse } from './house';
import { buildInterior, type Interior } from './interior';
import { buildLandscape } from './landscape';
import { buildSchool } from './schoolBuilding';
import { Props } from './props';
import { buildShop } from './shopBuilding';
import { buildShopInterior, type ShopInterior } from './shopInterior';

/** Camera distance and height above the girl, outdoors, in the house and in the shop. */
const VIEW = {
  garden: { distance: 20, lift: 2.2, look: 2.4, halfWidth: 3, sun: 1.6, ambient: 0.75, bloom: 0.3 },
  house: { distance: 14, lift: 1.2, look: 2.6, halfWidth: 9, sun: 0.75, ambient: 0.5, bloom: 0.08 },
  shop: { distance: 14, lift: 1.2, look: 2.6, halfWidth: 9, sun: 0.75, ambient: 0.5, bloom: 0.08 },
} as const;
const SUN_DIR = new Vector3(-0.45, -0.8, 0.55).normalize();

/** One Babylon scene showing the game: garden, house, shop, girl, cats, effects and a following camera. */
export class World {
  readonly scene: Scene;
  readonly camera: FreeCamera;
  private girl: GirlView;
  /** The look the girl was last built with, to rebuild her only when something changed. */
  private girlKey = '';
  private readonly cats = new Map<number, CatView>();
  private readonly effects: Effects;
  private readonly interior: Interior;
  private readonly shopInterior: ShopInterior;
  private readonly tickLandscape: (dt: number) => void;
  private readonly focus: Vector3;
  private readonly sun: DirectionalLight;
  private readonly hemi: HemisphericLight;
  private readonly pipeline: DefaultRenderingPipeline;
  private readonly addCaster: (m: Mesh) => void;
  private readonly props: Props;
  private trailIn = 0;
  private sparkleIn = 0;

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

    const g = game.girl;
    this.focus = new Vector3(g.x, g.y + 2.5, 0);
    this.camera = new FreeCamera('camera', new Vector3(g.x, g.y + 5, -20), scene);
    this.camera.fov = 0.72;
    this.camera.minZ = 0.3;
    this.camera.maxZ = 2500;
    this.camera.inputs.clear();

    const hemi = (this.hemi = new HemisphericLight('ambient', new Vector3(0.2, 1, -0.4), scene));
    hemi.diffuse = Color3.FromHexString('#fff6ec');
    hemi.groundColor = Color3.FromHexString('#7d8fb0');
    hemi.intensity = 0.75;
    hemi.specular = Color3.Black();

    // The sun's shadow box follows the girl, so garden and house both get crisp shadows.
    this.sun = new DirectionalLight('sun', SUN_DIR, scene);
    this.sun.diffuse = Color3.FromHexString('#fff1d6');
    this.sun.intensity = 1.6;
    this.sun.autoUpdateExtends = false;
    this.sun.shadowFrustumSize = 60;
    this.sun.shadowMinZ = 1;
    this.sun.shadowMaxZ = 160;
    const shadows = new ShadowGenerator(2048, this.sun);
    shadows.usePercentageCloserFiltering = true;
    shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    shadows.darkness = 0.35;
    shadows.normalBias = 0.02;
    this.addCaster = (m: Mesh) => {
      shadows.addShadowCaster(m, false);
    };

    const glow = new GlowLayer('glow', scene, { blurKernelSize: 32, mainTextureRatio: 0.5 });
    glow.intensity = 0.7;

    this.tickLandscape = buildLandscape(scene, this.addCaster);
    buildHouse(scene, this.addCaster);
    buildShop(scene, this.addCaster);
    buildSchool(scene, this.addCaster);
    this.interior = buildInterior(scene, this.addCaster);
    this.shopInterior = buildShopInterior(scene, this.addCaster);
    this.girl = new GirlView(scene, girlLook(game.wardrobe), this.addCaster);
    this.girlKey = JSON.stringify(girlLook(game.wardrobe));
    this.effects = new Effects(scene, glow);
    this.syncCats();
    for (const coin of game.coins) this.effects.addCoin(coin.id, coin.x, coin.y, coin.z);
    // The start-up coins were reported as events too; the scene already shows them.
    game.drainEvents();

    this.props = new Props(scene, this.addCaster);

    // The same look as Allium Assault: ACES tone mapping, a little bloom and a soft vignette.
    const pipeline = (this.pipeline = new DefaultRenderingPipeline('post', true, scene, [this.camera]));
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
    this.snapCamera();
  }

  /** Create views for new cats, rebuild the ones whose coat changed, drop the ones that left. */
  syncCats(): void {
    const ids = new Set(this.game.cats.map((c) => c.id));
    for (const [id, view] of this.cats)
      if (!ids.has(id)) {
        view.dispose();
        this.cats.delete(id);
      }
    for (const c of this.game.cats) {
      const view = this.cats.get(c.id);
      if (view?.coat === c.coat) continue;
      view?.dispose();
      this.cats.set(c.id, new CatView(this.scene, c, this.addCaster));
    }
  }

  handleEvents(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hearts': {
          const view = this.cats.get(e.cat);
          if (view) this.effects.hearts(view.top(), e.count);
          break;
        }
        case 'bowlPlaced':
          this.girl.pour();
          break;
        case 'feather':
          this.girl.cast();
          this.effects.hearts(new Vector3(this.game.girl.x, this.game.girl.y + 1.6, this.game.girl.z), 2);
          break;
        case 'toyThrow':
          this.girl.cast();
          break;
        case 'squabble': {
          const view = this.cats.get(e.cat);
          if (view) this.effects.puff(view.top());
          break;
        }
        case 'magic':
          this.girl.cast();
          this.effects.magic(this.girl.wandTip());
          break;
        case 'feed': {
          const cat = this.game.cat(e.cat);
          // Cats eating from the kitchen bowls already have a bowl; food from the girl's hand gets a dish.
          if (cat && !e.fromBowl) this.effects.feed(cat.x + cat.dir * 0.9 * cat.size, cat.y, cat.z, e.supply === 'treat');
          break;
        }
        case 'coinSpawn': {
          const coin = this.game.coins.find((c) => c.id === e.coin);
          if (coin) this.effects.addCoin(coin.id, coin.x, coin.y, coin.z);
          break;
        }
        case 'coin':
          this.effects.collectCoin(e.coin);
          break;
        case 'search':
          if (e.found > 0) {
            const s = SPOTS.find((p) => p.id === e.spot);
            if (s) this.effects.magic(new Vector3(s.x, 2, s.z - 1));
          }
          break;
        case 'kitten':
        case 'newCat':
          this.syncCats();
          break;
        case 'place':
          this.snapCamera();
          break;
        default:
          break;
      }
    }
  }

  update(dt: number, flying: boolean): void {
    const g = this.game.girl;
    this.girl.update(g, dt, flying);
    for (const c of this.game.cats) this.cats.get(c.id)?.update(c, dt, g.facing, g.backpack.indexOf(c.id));
    if (flying) {
      this.trailIn -= dt;
      if (this.trailIn <= 0) {
        this.trailIn = 0.03;
        this.effects.trail(new Vector3(g.x, g.y + 0.6, g.z));
      }
    }
    // Cupboards with coins inside twinkle now and then, as a hint.
    this.sparkleIn -= dt;
    if (this.sparkleIn <= 0 && g.place === 'house') {
      this.sparkleIn = 0.9;
      for (const s of SPOTS) if (this.game.spotCoins[s.id] > 0) this.effects.trail(new Vector3(s.x + (Math.random() - 0.5), 2 + Math.random() * 1.5, s.z - 1));
    }
    this.props.sync(this.game, dt);
    this.interior.setBowls(this.game.kitchenBowl('milk').portions > 0, this.game.kitchenBowl('food').portions > 0);
    this.interior.setMeal(this.game.meal);
    this.interior.setDeco(this.game.wardrobe.deco);
    this.shopInterior.tick(dt);
    this.effects.update(dt);
    this.tickLandscape(dt);
    this.followGirl(Math.min(1, dt * 3));
  }

  private followGirl(k: number): void {
    const g = this.game.girl;
    const view = VIEW[g.place];
    const b = bounds(g.place);
    const tx = Math.min(b.maxX - view.halfWidth, Math.max(b.minX + view.halfWidth, g.x + g.facing * 1.5));
    const ty = g.y + view.look;
    this.focus.x += (tx - this.focus.x) * k;
    this.focus.y += (ty - this.focus.y) * k;
    this.camera.position.set(this.focus.x, this.focus.y + view.lift, -view.distance);
    this.camera.setTarget(new Vector3(this.focus.x, this.focus.y, 0));
    this.sun.position = new Vector3(this.focus.x, this.focus.y, 0).subtract(SUN_DIR.scale(70));
    // Indoors the light is softer, so the pale walls do not glow.
    this.scene.fogDensity = g.place === 'garden' ? 0.006 : 0;
    this.sun.intensity = view.sun;
    this.hemi.intensity = view.ambient;
    this.pipeline.bloomWeight = view.bloom;
  }

  /** Jump the camera straight to the girl, e.g. after walking through a door. */
  private snapCamera(): void {
    this.followGirl(1);
  }

  /** Dress the girl in whatever the wardrobe says she wears; she is rebuilt when anything changed. */
  refreshOutfit(): void {
    const look = girlLook(this.game.wardrobe);
    const key = JSON.stringify(look);
    if (key === this.girlKey) return;
    this.girlKey = key;
    this.girl.dispose();
    this.girl = new GirlView(this.scene, look, this.addCaster);
    this.girl.update(this.game.girl, 0, false);
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
