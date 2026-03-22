// VFX Effect Library — all combat visual effects available for the fighter game
// Sources: ObjectStore sprites, local effects folder

// Use local effects as primary source — ObjectStore sprites are not yet deployed
const LOCAL_BASE = "/fighter2d/effects";

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

// All VFX use local sprites that actually exist in /fighter2d/effects/
// Three base effect strips are available; all VFX IDs map to one of them
// so the game never 404s. Replace with real sprites when ObjectStore is populated.
const SLASH = `${LOCAL_BASE}/slash_arc.png`;      // 6-frame melee slash
const BOLT  = `${LOCAL_BASE}/lightning-bolt.png`;  // 6-frame magic bolt
const SPARK = `${LOCAL_BASE}/electric-spark.png`;  // 4-frame impact spark

export const ALL_VFX: VfxDef[] = [
  // Hit impacts
  { id: "hit_effect_1",    name: "Hit Impact",        src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "melee", "physical", "counter"] },
  // Smear / slash
  { id: "smearH1",         name: "Smear Horizontal 1", src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "combo"] },
  { id: "smearH2",         name: "Smear Horizontal 2", src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "combo"] },
  { id: "smearH3",         name: "Smear Horizontal 3", src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "combo"] },
  { id: "smearV1",         name: "Smear Vertical 1",   src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "counter"] },
  { id: "smearV2",         name: "Smear Vertical 2",   src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "counter"] },
  { id: "smearV3",         name: "Smear Vertical 3",   src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical", "pixel"] },
  // Fire
  { id: "fireBreath",      name: "Fire Breath",        src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "fire", "pixel"] },
  { id: "fireBreathHit",   name: "Fire Breath Hit",    src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "projectile", "fire"] },
  // Ice / water
  { id: "iceShatter",      name: "Ice Shatter",        src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "ice", "magic"] },
  { id: "frostWave",       name: "Frost Wave",         src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "ice", "magic"] },
  { id: "waterSplash",     name: "Water Splash",       src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "water"] },
  // Lightning
  { id: "lightningStrike", name: "Lightning Strike",   src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "lightning", "magic"] },
  { id: "electricChain",   name: "Electric Chain",     src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "lightning"] },
  { id: "sparkBurst",      name: "Spark Burst",        src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "lightning", "pixel"] },
  // Dark
  { id: "shadowSlash",     name: "Shadow Slash",       src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "dark", "counter"] },
  { id: "voidPulse",       name: "Void Pulse",         src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "dark", "magic"] },
  { id: "darkMist",        name: "Dark Mist",          src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "dark"] },
  // Holy
  { id: "holySmite",       name: "Holy Smite",         src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "holy", "magic"] },
  { id: "divineShield",    name: "Divine Shield",      src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["buff", "holy"] },
  { id: "lightBeam",       name: "Light Beam",         src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "holy", "magic"] },
  // Earth / nature
  { id: "rockSmash",       name: "Rock Smash",         src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "earth", "physical"] },
  { id: "vineWhip",        name: "Vine Whip",          src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "nature"] },
  { id: "leafStorm",       name: "Leaf Storm",         src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "nature", "magic"] },
  // Explosions / combo
  { id: "explosionSmall",  name: "Small Explosion",    src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "fire", "combo"] },
  { id: "explosionBig",    name: "Big Explosion",      src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "fire", "super"] },
  { id: "dustCloud",       name: "Dust Cloud",         src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "physical", "combo"] },
  { id: "bloodSplat",      name: "Blood Splat",        src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "physical", "counter"] },
  { id: "energyBurst",     name: "Energy Burst",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "magic", "super"] },
  // Original local sprites
  { id: "slash_arc",       name: "Slash Arc",          src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "slash"] },
  { id: "lightning_bolt",  name: "Lightning Bolt",     src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["magic", "lightning"] },
  { id: "electric_spark",  name: "Electric Spark",     src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["magic", "lightning", "impact"] },
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
