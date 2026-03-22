// VFX Effect Library — dynamically loads 143+ effects from ObjectStore API
// Falls back to local sprite strips when offline

const OBJECT_STORE_API = "https://molochdagod.github.io/ObjectStore/api/v1/effectSprites.json";
const OBJECT_STORE_BASE = "https://molochdagod.github.io/ObjectStore";
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

// ─── Local fallback sprites (always available) ───────────────────
const SLASH = `${LOCAL_BASE}/slash_arc.png`;
const BOLT  = `${LOCAL_BASE}/lightning-bolt.png`;
const SPARK = `${LOCAL_BASE}/electric-spark.png`;

const LOCAL_FALLBACKS: VfxDef[] = [
  { id: "slash_arc",      name: "Slash Arc",      src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "slash"] },
  { id: "lightning_bolt",  name: "Lightning Bolt",  src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["magic", "lightning"] },
  { id: "electric_spark",  name: "Electric Spark",  src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["magic", "lightning", "impact"] },
  // Aliases for game VFX IDs so nothing 404s when offline
  { id: "hit_effect_1",    name: "Hit Impact",      src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "melee"] },
  { id: "smearH1",         name: "Smear H1",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "smearH2",         name: "Smear H2",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "smearH3",         name: "Smear H3",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "smearV1",         name: "Smear V1",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "smearV2",         name: "Smear V2",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "smearV3",         name: "Smear V3",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "physical"] },
  { id: "explosionSmall",  name: "Small Explosion",  src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "fire"] },
  { id: "dustCloud",       name: "Dust Cloud",       src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "physical"] },
  { id: "bloodSplat",      name: "Blood Splat",      src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "physical"] },
  { id: "energyBurst",     name: "Energy Burst",     src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "magic"] },
  { id: "sparkBurst",      name: "Spark Burst",      src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "lightning"] },
  { id: "fireBreath",      name: "Fire Breath",      src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "fire"] },
  { id: "fireBreathHit",   name: "Fire Breath Hit",  src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "fire"] },
  { id: "iceShatter",      name: "Ice Shatter",      src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "ice"] },
  { id: "waterSplash",     name: "Water Splash",     src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "water"] },
  { id: "lightningStrike", name: "Lightning Strike", src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "lightning"] },
  { id: "electricChain",   name: "Electric Chain",   src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "lightning"] },
  { id: "shadowSlash",     name: "Shadow Slash",     src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "dark"] },
  { id: "voidPulse",       name: "Void Pulse",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "dark"] },
  { id: "darkMist",        name: "Dark Mist",        src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "dark"] },
  { id: "holySmite",       name: "Holy Smite",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "holy"] },
  { id: "rockSmash",       name: "Rock Smash",       src: SPARK, cols: 4, rows: 1, frameW: 100, frameH: 100, frames: 4, categories: ["impact", "earth"] },
  { id: "vineWhip",        name: "Vine Whip",        src: SLASH, cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["melee", "nature"] },
  { id: "leafStorm",       name: "Leaf Storm",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "nature"] },
  { id: "frostWave",       name: "Frost Wave",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "ice"] },
  { id: "divineShield",    name: "Divine Shield",    src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["buff", "holy"] },
  { id: "lightBeam",       name: "Light Beam",       src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["projectile", "holy"] },
  { id: "explosionBig",    name: "Big Explosion",    src: BOLT,  cols: 6, rows: 1, frameW: 100, frameH: 100, frames: 6, categories: ["impact", "fire"] },
];

// ─── Dynamic VFX registry ────────────────────────────────────────
let ALL_VFX: VfxDef[] = [...LOCAL_FALLBACKS];
let vfxLoadPromise: Promise<void> | null = null;

/** Convert ObjectStore API effect entry to VfxDef */
function apiEffectToVfxDef(id: string, entry: any): VfxDef | null {
  if (!entry || !entry.src || !entry.frames) return null;
  const src = entry.src.startsWith("http") ? entry.src : OBJECT_STORE_BASE + entry.src;
  const cols = entry.cols ?? entry.frames;
  const rows = entry.rows ?? 1;
  const frameW = entry.frameW ?? entry.size ?? 48;
  const frameH = entry.frameH ?? entry.size ?? 48;
  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const name = id.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
  return { id, name, src, cols, rows, frameW, frameH, frames: entry.frames, categories };
}

/** Fetch all VFX from ObjectStore API */
async function fetchObjectStoreVfx(): Promise<VfxDef[]> {
  try {
    const res = await fetch(OBJECT_STORE_API);
    if (!res.ok) return [];
    const json = await res.json();
    const remote: VfxDef[] = [];
    const sections = ["effects", "projectiles", "buffVisuals", "weaponVisuals", "beamTrails"];
    for (const section of sections) {
      const entries = json[section] ?? {};
      for (const [id, entry] of Object.entries(entries)) {
        const def = apiEffectToVfxDef(id, entry);
        if (def) remote.push(def);
      }
    }
    return remote;
  } catch {
    return [];
  }
}

// ─── Public API ──────────────────────────────────────────────────

/** Preload VFX: fetch from ObjectStore, merge with local, preload priority images */
export function preloadVfx(): Promise<void> {
  if (vfxLoadPromise) return vfxLoadPromise;
  vfxLoadPromise = (async () => {
    const remote = await fetchObjectStoreVfx();
    if (remote.length > 0) {
      // Remote overrides local fallbacks with same ID; keep local-only entries
      const remoteIds = new Set(remote.map(r => r.id));
      ALL_VFX = [...remote, ...LOCAL_FALLBACKS.filter(l => !remoteIds.has(l.id))];
    }
    // Preload first 40 images
    await Promise.all(ALL_VFX.slice(0, 40).map(vfx => {
      if (vfxImageCache.has(vfx.id)) return Promise.resolve();
      return new Promise<void>(resolve => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { vfxImageCache.set(vfx.id, img); resolve(); };
        img.onerror = () => resolve();
        img.src = vfx.src;
      });
    }));
  })();
  return vfxLoadPromise;
}

export function getAllVfx(): VfxDef[] { return ALL_VFX; }

export function getVfxCategories(): string[] {
  const cats = new Set<string>();
  for (const v of ALL_VFX) for (const c of v.categories) cats.add(c);
  return Array.from(cats).sort();
}

export function getVfxById(id: string): VfxDef | undefined {
  return ALL_VFX.find(v => v.id === id);
}

export function getVfxByCategory(category: string): VfxDef[] {
  return ALL_VFX.filter(v => v.categories.includes(category));
}

export function searchVfx(query: string): VfxDef[] {
  const q = query.toLowerCase();
  return ALL_VFX.filter(v =>
    v.id.toLowerCase().includes(q) ||
    v.name.toLowerCase().includes(q) ||
    v.categories.some(c => c.includes(q))
  );
}

// ─── Image cache ─────────────────────────────────────────────────
const vfxImageCache = new Map<string, HTMLImageElement>();

export function getVfxImage(id: string): HTMLImageElement | null {
  const cached = vfxImageCache.get(id);
  if (cached?.complete) return cached;
  // Lazy load
  const def = getVfxById(id);
  if (!def) return null;
  if (!cached) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => vfxImageCache.set(id, img);
    img.onerror = () => {};
    img.src = def.src;
    vfxImageCache.set(id, img);
  }
  return null;
}

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
  if (flip) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
  ctx.drawImage(img, sx, sy, vfx.frameW, vfx.frameH, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();
}

export { ALL_VFX };
