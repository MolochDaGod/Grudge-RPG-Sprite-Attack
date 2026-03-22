// VFX Effect Library — all combat visual effects available for the fighter game
// Sources: ObjectStore sprites, local effects folder

const OBJECT_STORE_BASE = "https://molochdagod.github.io/ObjectStore/sprites/effects";

export interface VfxDef {
  id: string;
  name: string;
  src: string;
  cols: number;
  rows: number;
  frameW: number;
  frameH: number;
  frames: number;
  categories: string[];
}

// ─── Hit Impact Effects ──────────────────────────────────────
export const HIT_EFFECTS: VfxDef[] = [
  {
    id: "hit_effect_1", name: "Hit Impact",
    src: `${OBJECT_STORE_BASE}/hit_effect_1.png`,
    cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7,
    categories: ["impact", "melee", "physical", "counter"],
  },
];

// ─── Smear / Slash Effects ───────────────────────────────────
export const SMEAR_EFFECTS: VfxDef[] = [
  { id: "smearH1", name: "Smear Horizontal 1", src: `${OBJECT_STORE_BASE}/smearH1.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["melee", "physical", "combo"] },
  { id: "smearH2", name: "Smear Horizontal 2", src: `${OBJECT_STORE_BASE}/smearH2.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["melee", "physical", "combo"] },
  { id: "smearH3", name: "Smear Horizontal 3", src: `${OBJECT_STORE_BASE}/smearH3.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["melee", "physical", "combo"] },
  { id: "smearV1", name: "Smear Vertical 1", src: `${OBJECT_STORE_BASE}/smearV1.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["melee", "physical", "counter"] },
  { id: "smearV2", name: "Smear Vertical 2", src: `${OBJECT_STORE_BASE}/smearV2.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["melee", "physical", "counter"] },
  { id: "smearV3", name: "Smear Vertical 3", src: `${OBJECT_STORE_BASE}/smearV3.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["melee", "physical", "pixel"] },
];

// ─── Fire Effects ────────────────────────────────────────────
export const FIRE_EFFECTS: VfxDef[] = [
  { id: "fireBreath", name: "Fire Breath", src: `${OBJECT_STORE_BASE}/fireBreath.png`, cols: 8, rows: 3, frameW: 48, frameH: 48, frames: 24, categories: ["projectile", "fire", "pixel"] },
  { id: "fireBreathHit", name: "Fire Breath Hit", src: `${OBJECT_STORE_BASE}/fireBreathHit.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["impact", "projectile", "fire"] },
];

// ─── Ice / Water Effects ──────────────────────────────
export const ICE_EFFECTS: VfxDef[] = [
  { id: "iceShatter", name: "Ice Shatter", src: `${OBJECT_STORE_BASE}/iceShatter.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["impact", "ice", "magic"] },
  { id: "frostWave", name: "Frost Wave", src: `${OBJECT_STORE_BASE}/frostWave.png`, cols: 8, rows: 1, frameW: 48, frameH: 48, frames: 8, categories: ["projectile", "ice", "magic"] },
  { id: "waterSplash", name: "Water Splash", src: `${OBJECT_STORE_BASE}/waterSplash.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["impact", "water"] },
];

// ─── Lightning / Electric Effects ───────────────────────
export const LIGHTNING_EFFECTS: VfxDef[] = [
  { id: "lightningStrike", name: "Lightning Strike", src: `${OBJECT_STORE_BASE}/lightningStrike.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["impact", "lightning", "magic"] },
  { id: "electricChain", name: "Electric Chain", src: `${OBJECT_STORE_BASE}/electricChain.png`, cols: 8, rows: 1, frameW: 48, frameH: 48, frames: 8, categories: ["projectile", "lightning"] },
  { id: "sparkBurst", name: "Spark Burst", src: `${OBJECT_STORE_BASE}/sparkBurst.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["impact", "lightning", "pixel"] },
];

// ─── Dark / Shadow Effects ─────────────────────────────
export const DARK_EFFECTS: VfxDef[] = [
  { id: "shadowSlash", name: "Shadow Slash", src: `${OBJECT_STORE_BASE}/shadowSlash.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["melee", "dark", "counter"] },
  { id: "voidPulse", name: "Void Pulse", src: `${OBJECT_STORE_BASE}/voidPulse.png`, cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7, categories: ["impact", "dark", "magic"] },
  { id: "darkMist", name: "Dark Mist", src: `${OBJECT_STORE_BASE}/darkMist.png`, cols: 8, rows: 1, frameW: 48, frameH: 48, frames: 8, categories: ["projectile", "dark"] },
];

// ─── Holy / Light Effects ──────────────────────────────
export const HOLY_EFFECTS: VfxDef[] = [
  { id: "holySmite", name: "Holy Smite", src: `${OBJECT_STORE_BASE}/holySmite.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["impact", "holy", "magic"] },
  { id: "divineShield", name: "Divine Shield", src: `${OBJECT_STORE_BASE}/divineShield.png`, cols: 8, rows: 1, frameW: 48, frameH: 48, frames: 8, categories: ["buff", "holy"] },
  { id: "lightBeam", name: "Light Beam", src: `${OBJECT_STORE_BASE}/lightBeam.png`, cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7, categories: ["projectile", "holy", "magic"] },
];

// ─── Earth / Nature Effects ────────────────────────────
export const EARTH_EFFECTS: VfxDef[] = [
  { id: "rockSmash", name: "Rock Smash", src: `${OBJECT_STORE_BASE}/rockSmash.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["impact", "earth", "physical"] },
  { id: "vineWhip", name: "Vine Whip", src: `${OBJECT_STORE_BASE}/vineWhip.png`, cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7, categories: ["melee", "nature"] },
  { id: "leafStorm", name: "Leaf Storm", src: `${OBJECT_STORE_BASE}/leafStorm.png`, cols: 8, rows: 1, frameW: 48, frameH: 48, frames: 8, categories: ["projectile", "nature", "magic"] },
];

// ─── Explosion / Combo Effects ─────────────────────────
export const EXPLOSION_EFFECTS: VfxDef[] = [
  { id: "explosionSmall", name: "Small Explosion", src: `${OBJECT_STORE_BASE}/explosionSmall.png`, cols: 6, rows: 1, frameW: 48, frameH: 48, frames: 6, categories: ["impact", "fire", "combo"] },
  { id: "explosionBig", name: "Big Explosion", src: `${OBJECT_STORE_BASE}/explosionBig.png`, cols: 8, rows: 1, frameW: 64, frameH: 64, frames: 8, categories: ["impact", "fire", "super"] },
  { id: "dustCloud", name: "Dust Cloud", src: `${OBJECT_STORE_BASE}/dustCloud.png`, cols: 5, rows: 1, frameW: 48, frameH: 48, frames: 5, categories: ["impact", "physical", "combo"] },
  { id: "bloodSplat", name: "Blood Splat", src: `${OBJECT_STORE_BASE}/bloodSplat.png`, cols: 4, rows: 1, frameW: 48, frameH: 48, frames: 4, categories: ["impact", "physical", "counter"] },
  { id: "energyBurst", name: "Energy Burst", src: `${OBJECT_STORE_BASE}/energyBurst.png`, cols: 7, rows: 1, frameW: 48, frameH: 48, frames: 7, categories: ["impact", "magic", "super"] },
];

// ─── Local Effects (already in /fighter2d/effects/) ──────────────
export const LOCAL_EFFECTS: VfxDef[] = [
  { id: "slash_arc", name: "Slash Arc", src: "/fighter2d/effects/slash_arc.png", cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "slash"] },
  { id: "lightning_bolt", name: "Lightning Bolt", src: "/fighter2d/effects/lightning-bolt.png", cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["magic", "lightning"] },
  { id: "electric_spark", name: "Electric Spark", src: "/fighter2d/effects/electric-spark.png", cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["magic", "lightning", "impact"] },
];

// ─── All VFX combined ────────────────────────────────────────
export const ALL_VFX: VfxDef[] = [
  ...HIT_EFFECTS,
  ...SMEAR_EFFECTS,
  ...FIRE_EFFECTS,
  ...ICE_EFFECTS,
  ...LIGHTNING_EFFECTS,
  ...DARK_EFFECTS,
  ...HOLY_EFFECTS,
  ...EARTH_EFFECTS,
  ...EXPLOSION_EFFECTS,
  ...LOCAL_EFFECTS,
];

// Get VFX by ID
export function getVfxById(id: string): VfxDef | undefined {
  return ALL_VFX.find(v => v.id === id);
}

// Get VFX by category
export function getVfxByCategory(category: string): VfxDef[] {
  return ALL_VFX.filter(v => v.categories.includes(category));
}

// Preload all VFX images — call on game init
const vfxImageCache = new Map<string, HTMLImageElement>();

export function preloadVfx(): Promise<void> {
  const promises = ALL_VFX.map(vfx => {
    if (vfxImageCache.has(vfx.id)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { vfxImageCache.set(vfx.id, img); resolve(); };
      img.onerror = () => { resolve(); }; // don't block on missing
      img.src = vfx.src;
    });
  });
  return Promise.all(promises).then(() => {});
}

export function getVfxImage(id: string): HTMLImageElement | null {
  return vfxImageCache.get(id) ?? null;
}

// Draw a VFX frame onto a canvas context
export function drawVfxFrame(
  ctx: CanvasRenderingContext2D,
  vfx: VfxDef,
  frame: number,
  x: number, y: number,
  scale: number = 3,
  flip: boolean = false,
) {
  const img = vfxImageCache.get(vfx.id);
  if (!img || !img.complete) return;

  const col = frame % vfx.cols;
  const row = Math.floor(frame / vfx.cols);
  const sx = col * vfx.frameW;
  const sy = row * vfx.frameH;
  const dw = vfx.frameW * scale;
  const dh = vfx.frameH * scale;

  ctx.save();
  if (flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }
  ctx.drawImage(img, sx, sy, vfx.frameW, vfx.frameH, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();
}
