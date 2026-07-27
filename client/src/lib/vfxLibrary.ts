// VFX Effect Library — ObjectStore API (143+ effects) + local fallbacks
// Correct multi-row grid support (cols × rows), not horizontal strips only.

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

// ─── Local sheets (measured from actual PNG dimensions) ──────────
// slash_arc.png      200×82  → 2×1 @ 100×82
// lightning-bolt.png 576×128 → 6×1 @ 96×128
// electric-spark.png 384×128 → 3×1 @ 128×128
// character effects  N×100   → N×1 @ 100×100
const SLASH = `${LOCAL_BASE}/slash_arc.png`;
const BOLT = `${LOCAL_BASE}/lightning-bolt.png`;
const SPARK = `${LOCAL_BASE}/electric-spark.png`;
const SLASH_RANGED = `${LOCAL_BASE}/slash_ranged.png`;

function localStrip(
  id: string,
  name: string,
  src: string,
  cols: number,
  frameW: number,
  frameH: number,
  categories: string[],
  frames?: number,
): VfxDef {
  return {
    id,
    name,
    src,
    cols,
    rows: 1,
    frameW,
    frameH,
    frames: frames ?? cols,
    categories,
  };
}

const LOCAL_FALLBACKS: VfxDef[] = [
  localStrip("slash_arc", "Slash Arc", SLASH, 2, 100, 82, ["melee", "slash"]),
  localStrip("lightning_bolt", "Lightning Bolt", BOLT, 6, 96, 128, ["magic", "lightning"]),
  localStrip("electric_spark", "Electric Spark", SPARK, 3, 128, 128, ["magic", "lightning", "impact"]),
  localStrip("slash_ranged", "Ranged Slash", SLASH_RANGED, 11, 100, 100, ["melee", "slash"]),

  // Canonical IDs used by HIT/SWING pools + defaultVfx (offline aliases)
  localStrip("hitEffect1", "Hit Impact 1", SPARK, 3, 128, 128, ["impact", "melee"]),
  localStrip("hitEffect2", "Hit Impact 2", SPARK, 3, 128, 128, ["impact", "melee"]),
  localStrip("hitEffect3", "Hit Impact 3", BOLT, 6, 96, 128, ["impact", "melee"]),
  localStrip("hit_effect_1", "Hit Impact", SPARK, 3, 128, 128, ["impact", "melee"]),
  localStrip("smearH1", "Smear H1", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("smearH2", "Smear H2", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("smearH3", "Smear H3", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("smearV1", "Smear V1", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("smearV2", "Smear V2", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("smearV3", "Smear V3", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("explosionSmall", "Small Explosion", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("dustCloud", "Dust Cloud", SPARK, 3, 128, 128, ["impact", "physical"]),
  localStrip("bloodSplat", "Blood Splat", SPARK, 3, 128, 128, ["impact", "physical"]),
  localStrip("energyBurst", "Energy Burst", BOLT, 6, 96, 128, ["impact", "magic"]),
  localStrip("sparkBurst", "Spark Burst", SPARK, 3, 128, 128, ["impact", "lightning"]),
  localStrip("fireBreath", "Fire Breath", BOLT, 6, 96, 128, ["projectile", "fire"]),
  localStrip("fireBreathHit", "Fire Breath Hit", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("iceShatter", "Ice Shatter", SPARK, 3, 128, 128, ["impact", "ice"]),
  localStrip("waterSplash", "Water Splash", SPARK, 3, 128, 128, ["impact", "water"]),
  localStrip("lightningStrike", "Lightning Strike", BOLT, 6, 96, 128, ["impact", "lightning"]),
  localStrip("electricChain", "Electric Chain", BOLT, 6, 96, 128, ["projectile", "lightning"]),
  localStrip("shadowSlash", "Shadow Slash", SLASH, 2, 100, 82, ["melee", "dark"]),
  localStrip("voidPulse", "Void Pulse", BOLT, 6, 96, 128, ["impact", "dark"]),
  localStrip("darkMist", "Dark Mist", BOLT, 6, 96, 128, ["projectile", "dark"]),
  localStrip("holySmite", "Holy Smite", BOLT, 6, 96, 128, ["impact", "holy"]),
  localStrip("rockSmash", "Rock Smash", SPARK, 3, 128, 128, ["impact", "earth"]),
  localStrip("vineWhip", "Vine Whip", SLASH, 2, 100, 82, ["melee", "nature"]),
  localStrip("leafStorm", "Leaf Storm", BOLT, 6, 96, 128, ["projectile", "nature"]),
  localStrip("frostWave", "Frost Wave", BOLT, 6, 96, 128, ["projectile", "ice"]),
  localStrip("divineShield", "Divine Shield", BOLT, 6, 96, 128, ["buff", "holy"]),
  localStrip("lightBeam", "Light Beam", BOLT, 6, 96, 128, ["projectile", "holy"]),
  localStrip("explosionBig", "Big Explosion", BOLT, 6, 96, 128, ["impact", "fire"]),

  // defaultVfx color slash IDs (local stand-ins until ObjectStore loads)
  localStrip("slashRedSm", "Slash Red Sm", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashRedMd", "Slash Red Md", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashRedLg", "Slash Red Lg", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashBlueSm", "Slash Blue Sm", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashBlueMd", "Slash Blue Md", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashBlueLg", "Slash Blue Lg", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashGreenSm", "Slash Green Sm", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashGreenMd", "Slash Green Md", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashGreenLg", "Slash Green Lg", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashPurpleSm", "Slash Purple Sm", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashPurpleMd", "Slash Purple Md", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashPurpleLg", "Slash Purple Lg", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashOrangeSm", "Slash Orange Sm", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashOrangeMd", "Slash Orange Md", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("slashOrangeLg", "Slash Orange Lg", SLASH, 2, 100, 82, ["melee", "slashColor"]),
  localStrip("demonSlash1", "Demon Slash 1", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("demonSlash2", "Demon Slash 2", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("demonSlash3", "Demon Slash 3", SLASH, 2, 100, 82, ["melee", "physical"]),
  localStrip("critSlash", "Crit Slash", SLASH, 2, 100, 82, ["melee", "crit"]),
  localStrip("hitBurst", "Hit Burst", SPARK, 3, 128, 128, ["impact", "melee"]),
  localStrip("weaponHit", "Weapon Hit", SPARK, 3, 128, 128, ["impact", "melee"]),
  localStrip("arcaneslash", "Arcane Slash", BOLT, 6, 96, 128, ["melee", "arcane"]),
  localStrip("arcanebolt", "Arcane Bolt", BOLT, 6, 96, 128, ["arcane"]),
  localStrip("arcanelighting", "Arcane Lighting", BOLT, 6, 96, 128, ["lightning", "arcane"]),
  localStrip("arcanemist", "Arcane Mist", BOLT, 6, 96, 128, ["arcane", "dark"]),
  localStrip("flamestrike", "Flame Strike", BOLT, 6, 96, 128, ["fire"]),
  localStrip("flameLash", "Flame Lash", BOLT, 6, 96, 128, ["fire"]),
  localStrip("fireSpin", "Fire Spin", BOLT, 6, 96, 128, ["fire"]),
  localStrip("fireExplosion", "Fire Explosion", SPARK, 3, 128, 128, ["fire", "impact"]),
  localStrip("fireExplosion2", "Fire Explosion 2", SPARK, 3, 128, 128, ["fire", "impact"]),
  localStrip("frostbolt", "Frost Bolt", BOLT, 6, 96, 128, ["ice"]),
  localStrip("frozenIce", "Frozen Ice", SPARK, 3, 128, 128, ["ice"]),
  localStrip("iceHit", "Ice Hit", SPARK, 3, 128, 128, ["ice", "impact"]),
  localStrip("iceVfx1", "Ice Vfx", BOLT, 6, 96, 128, ["ice"]),
  localStrip("iceActive", "Ice Active", SPARK, 3, 128, 128, ["ice"]),
  localStrip("thunderHit", "Thunder Hit", BOLT, 6, 96, 128, ["lightning", "impact"]),
  localStrip("holyImpact", "Holy Impact", SPARK, 3, 128, 128, ["holy", "impact"]),
  localStrip("holyVfx", "Holy Vfx", BOLT, 6, 96, 128, ["holy"]),
  localStrip("holyRepeatable", "Holy Aura", BOLT, 6, 96, 128, ["holy", "block"]),
  localStrip("healEffect", "Heal Effect", SPARK, 3, 128, 128, ["heal"]),
  localStrip("healingwave", "Healing Wave", BOLT, 6, 96, 128, ["heal"]),
  localStrip("healingregen", "Healing Regen", SPARK, 3, 128, 128, ["heal"]),
  localStrip("protectionCircle", "Protection Circle", BOLT, 6, 96, 128, ["buff", "block"]),
  localStrip("casting", "Casting", BOLT, 6, 96, 128, ["cast"]),
  localStrip("magickaHit", "Magicka Hit", SPARK, 3, 128, 128, ["impact", "arcane"]),
  localStrip("felSpell", "Fel Spell", BOLT, 6, 96, 128, ["dark", "arcane"]),
  localStrip("midnight", "Midnight", BOLT, 6, 96, 128, ["dark"]),
  localStrip("phantom", "Phantom", BOLT, 6, 96, 128, ["dark"]),
  localStrip("nebula", "Nebula", BOLT, 6, 96, 128, ["dark", "cast"]),
  localStrip("windHit", "Wind Hit", SPARK, 3, 128, 128, ["wind", "impact"]),
  localStrip("windBreath", "Wind Breath", BOLT, 6, 96, 128, ["wind"]),
  localStrip("windProjectile", "Wind Projectile", BOLT, 6, 96, 128, ["wind", "projectile"]),
  localStrip("smokeVfx1", "Smoke 1", SPARK, 3, 128, 128, ["movement"]),
  localStrip("smokeVfx2", "Smoke 2", SPARK, 3, 128, 128, ["movement"]),
  localStrip("smokeVfx3", "Smoke 3", SPARK, 3, 128, 128, ["movement"]),
  localStrip("impactFireA", "Impact Fire A", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("impactFireB", "Impact Fire B", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("impactYellowA", "Impact Yellow A", SPARK, 3, 128, 128, ["impact", "lightning"]),
  localStrip("impactYellowB", "Impact Yellow B", SPARK, 3, 128, 128, ["impact", "lightning"]),
  localStrip("impactRedA", "Impact Red A", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("impactOrangeA", "Impact Orange A", SPARK, 3, 128, 128, ["impact", "fire"]),
  localStrip("impactPurpleA", "Impact Purple A", SPARK, 3, 128, 128, ["impact", "arcane"]),
  localStrip("impactCyanA", "Impact Cyan A", SPARK, 3, 128, 128, ["impact", "ice"]),
  localStrip("impactCyanB", "Impact Cyan B", SPARK, 3, 128, 128, ["impact", "ice"]),
  localStrip("impactGreenA", "Impact Green A", SPARK, 3, 128, 128, ["impact", "nature"]),
  localStrip("impactGreenB", "Impact Green B", SPARK, 3, 128, 128, ["impact", "nature"]),
  localStrip("impactWhiteA", "Impact White A", SPARK, 3, 128, 128, ["impact", "holy"]),
  localStrip("impactMagentaA", "Impact Magenta A", SPARK, 3, 128, 128, ["impact", "dark"]),
  localStrip("brightFire", "Bright Fire", BOLT, 6, 96, 128, ["fire"]),
  localStrip("resurrect", "Resurrect", BOLT, 6, 96, 128, ["holy", "heal"]),
  localStrip("worgeTornado", "Worge Tornado", BOLT, 6, 96, 128, ["nature"]),
];

// Character-specific attack effect sheets under /fighter2d/effects/
const CHAR_ATTACK_EFFECTS: VfxDef[] = [
  localStrip("Knight-Attack01_Effect", "Knight Slash 1", `${LOCAL_BASE}/Knight-Attack01_Effect.png`, 7, 100, 100, ["melee"]),
  localStrip("Knight-Attack02_Effect", "Knight Slash 2", `${LOCAL_BASE}/Knight-Attack02_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Knight-Attack03_Effect", "Knight Slash 3", `${LOCAL_BASE}/Knight-Attack03_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Swordsman-Attack01_Effect", "Swordsman Slash 1", `${LOCAL_BASE}/Swordsman-Attack01_Effect.png`, 7, 100, 100, ["melee"]),
  localStrip("Swordsman-Attack02_Effect", "Swordsman Slash 2", `${LOCAL_BASE}/Swordsman-Attack02_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Swordsman-Attack3_Effect", "Swordsman Slash 3", `${LOCAL_BASE}/Swordsman-Attack3_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Archer-Attack01_Effect", "Archer Effect 1", `${LOCAL_BASE}/Archer-Attack01_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Archer-Attack02_Effect", "Archer Effect 2", `${LOCAL_BASE}/Archer-Attack02_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Wizard-Attack01_Effect", "Wizard Effect 1", `${LOCAL_BASE}/Wizard-Attack01_Effect.png`, 10, 100, 100, ["magic"]),
  localStrip("Wizard-Attack02_Effect", "Wizard Effect 2", `${LOCAL_BASE}/Wizard-Attack02_Effect.png`, 10, 100, 100, ["magic"]),
  localStrip("Orc-attack01_Effect", "Orc Effect 1", `${LOCAL_BASE}/Orc-attack01_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Orc-attack02_Effect", "Orc Effect 2", `${LOCAL_BASE}/Orc-attack02_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Armored Skeleton-Attack01_Effect", "Skeleton Effect 1", `${LOCAL_BASE}/Armored Skeleton-Attack01_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Armored Skeleton-Attack02_Effect", "Skeleton Effect 2", `${LOCAL_BASE}/Armored Skeleton-Attack02_Effect.png`, 6, 100, 100, ["melee"]),
  localStrip("Priest-Attack_effect", "Priest Attack", `${LOCAL_BASE}/Priest-Attack_effect.png`, 8, 100, 100, ["holy"]),
  localStrip("Priest-Heal_Effect", "Priest Heal", `${LOCAL_BASE}/Priest-Heal_Effect.png`, 4, 100, 100, ["heal"]),
];

// ─── Dynamic VFX registry ────────────────────────────────────────
let ALL_VFX: VfxDef[] = [...LOCAL_FALLBACKS, ...CHAR_ATTACK_EFFECTS];
let vfxLoadPromise: Promise<void> | null = null;
const vfxImageCache = new Map<string, HTMLImageElement>();
const vfxByIdCache = new Map<string, VfxDef>();

function rebuildIdIndex() {
  vfxByIdCache.clear();
  for (const v of ALL_VFX) vfxByIdCache.set(v.id, v);
}
rebuildIdIndex();

/**
 * ObjectStore pixel packs often only declare `size` + `frames` for square N×N grids
 * where `size` is the full sheet edge (e.g. 900px / 81 frames → 9×9 of 100px).
 * Explicit cols/rows/frameW always win.
 */
function apiEffectToVfxDef(id: string, entry: any): VfxDef | null {
  if (!entry || !entry.src || !entry.frames) return null;
  const src = entry.src.startsWith("http") ? entry.src : OBJECT_STORE_BASE + entry.src;
  const frames = entry.frames as number;
  let cols = entry.cols as number | undefined;
  let rows = entry.rows as number | undefined;
  let frameW = (entry.frameW ?? entry.frameWidth) as number | undefined;
  let frameH = (entry.frameH ?? entry.frameHeight) as number | undefined;

  if (cols == null || rows == null) {
    const side = Math.round(Math.sqrt(frames));
    if (side * side === frames) {
      cols = side;
      rows = side;
      if (entry.size != null && frameW == null) {
        // size = total sheet edge for square grids
        frameW = entry.size / side;
        frameH = entry.size / side;
      }
    } else {
      cols = frames;
      rows = 1;
    }
  }

  frameW = frameW ?? entry.size ?? 48;
  frameH = frameH ?? entry.size ?? frameW;

  // Guard against absurd "size was frame size" mis-parse (frame > 512 on pixel packs)
  if (entry.size != null && entry.cols == null && frameW > 256 && frames > 1) {
    const side = Math.round(Math.sqrt(frames));
    if (side * side === frames) {
      cols = side;
      rows = side;
      frameW = entry.size / side;
      frameH = entry.size / side;
    }
  }

  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const name = id.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  return {
    id,
    name,
    src,
    cols: cols!,
    rows: rows!,
    frameW: Math.max(1, Math.round(frameW!)),
    frameH: Math.max(1, Math.round(frameH!)),
    frames,
    categories,
  };
}

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

function loadVfxImage(vfx: VfxDef): Promise<HTMLImageElement | null> {
  const existing = vfxImageCache.get(vfx.id);
  if (existing?.complete && existing.naturalWidth > 0) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const img = existing ?? new Image();
    img.crossOrigin = "anonymous";
    const done = () => {
      vfxImageCache.set(vfx.id, img);
      // Snap frame dims to actual sheet when metadata is off
      refineVfxDimsFromImage(vfx, img);
      resolve(img);
    };
    if (img.complete && img.naturalWidth > 0) {
      done();
      return;
    }
    img.onload = done;
    img.onerror = () => resolve(null);
    if (!existing) {
      img.src = vfx.src;
      vfxImageCache.set(vfx.id, img);
    }
  });
}

/** When image loads, correct frameW/frameH if sheet doesn't match declared grid */
function refineVfxDimsFromImage(vfx: VfxDef, img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h || !vfx.cols || !vfx.rows) return;
  const expectedW = vfx.cols * vfx.frameW;
  const expectedH = vfx.rows * vfx.frameH;
  // Tolerate 1px rounding; otherwise re-derive
  if (Math.abs(w - expectedW) > 2 || Math.abs(h - expectedH) > 2) {
    vfx.frameW = Math.max(1, Math.round(w / vfx.cols));
    vfx.frameH = Math.max(1, Math.round(h / vfx.rows));
  }
}

// ─── Public API ──────────────────────────────────────────────────

export function preloadVfx(): Promise<void> {
  if (vfxLoadPromise) return vfxLoadPromise;
  vfxLoadPromise = (async () => {
    const remote = await fetchObjectStoreVfx();
    if (remote.length > 0) {
      const remoteIds = new Set(remote.map((r) => r.id));
      // Remote wins for shared IDs; keep local-only (char attack effects, offline aliases)
      ALL_VFX = [
        ...remote,
        ...LOCAL_FALLBACKS.filter((l) => !remoteIds.has(l.id)),
        ...CHAR_ATTACK_EFFECTS.filter((l) => !remoteIds.has(l.id)),
      ];
      rebuildIdIndex();
    }
    // Priority preload: combat-critical IDs first
    const priorityIds = [
      "smearH1", "smearH2", "smearH3", "smearV1", "smearV2", "smearV3",
      "hitEffect1", "hitEffect2", "hitEffect3", "hit_effect_1",
      "slashRedMd", "slashRedLg", "slashBlueMd", "slashGreenMd", "slashPurpleMd", "slashOrangeMd",
      "demonSlash1", "demonSlash2", "explosionSmall", "dustCloud", "sparkBurst",
      "slash_arc", "lightning_bolt", "electric_spark",
    ];
    const priority = priorityIds.map((id) => vfxByIdCache.get(id)).filter(Boolean) as VfxDef[];
    const rest = ALL_VFX.filter((v) => !priorityIds.includes(v.id)).slice(0, 50);
    await Promise.all([...priority, ...rest].map((v) => loadVfxImage(v)));
  })();
  return vfxLoadPromise;
}

export function getAllVfx(): VfxDef[] {
  return ALL_VFX;
}

export function getVfxCategories(): string[] {
  const cats = new Set<string>();
  for (const v of ALL_VFX) for (const c of v.categories) cats.add(c);
  return Array.from(cats).sort();
}

export function getVfxById(id: string): VfxDef | undefined {
  if (!id) return undefined;
  return vfxByIdCache.get(id) ?? ALL_VFX.find((v) => v.id === id);
}

export function getVfxByCategory(category: string): VfxDef[] {
  return ALL_VFX.filter((v) => v.categories.includes(category));
}

export function searchVfx(query: string): VfxDef[] {
  const q = query.toLowerCase();
  return ALL_VFX.filter(
    (v) =>
      v.id.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q) ||
      v.categories.some((c) => c.includes(q)),
  );
}

/**
 * Return cached image (even while loading). Kick off load if needed.
 * Drawers must check img.complete / naturalWidth.
 */
export function getVfxImage(id: string): HTMLImageElement | null {
  const cached = vfxImageCache.get(id);
  if (cached) return cached;
  const def = getVfxById(id);
  if (!def) return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    vfxImageCache.set(id, img);
    refineVfxDimsFromImage(def, img);
  };
  img.onerror = () => {};
  img.src = def.src;
  vfxImageCache.set(id, img);
  return img;
}

/** Register an already-loaded HTMLImageElement under a VfxDef (for strip effects). */
export function registerVfxImage(vfx: VfxDef, img: HTMLImageElement) {
  if (!vfxByIdCache.has(vfx.id)) {
    ALL_VFX.push(vfx);
    vfxByIdCache.set(vfx.id, vfx);
  }
  vfxImageCache.set(vfx.id, img);
  if (img.complete && img.naturalWidth > 0) {
    refineVfxDimsFromImage(vfx, img);
  }
}

/** Ensure image is fully loaded before drawing (for attack startup VFX). */
export function ensureVfxLoaded(id: string): Promise<HTMLImageElement | null> {
  const def = getVfxById(id);
  if (!def) return Promise.resolve(null);
  return loadVfxImage(def);
}

/** Auto scale so a frame is roughly `targetPx` on its longer edge. */
export function vfxDisplayScale(vfx: VfxDef, targetPx = 110): number {
  const longest = Math.max(vfx.frameW, vfx.frameH, 1);
  return Math.max(0.8, Math.min(5, targetPx / longest));
}

export type VfxComposite =
  | "source-over"
  | "lighter"
  | "screen"
  | "soft-light"
  | "multiply";

export function drawVfxFrame(
  ctx: CanvasRenderingContext2D,
  vfx: VfxDef,
  frame: number,
  x: number,
  y: number,
  scale: number = 3,
  flip: boolean = false,
  opts?: {
    alpha?: number;
    /** Additive/screen blend for skill pop + projectile glow */
    composite?: VfxComposite;
    /** Soft colored bloom under the sheet */
    glowColor?: string;
    glowRadius?: number;
  },
) {
  const img = vfxImageCache.get(vfx.id);
  if (!img || !img.complete || !img.naturalWidth) return;

  // Live refine if needed
  refineVfxDimsFromImage(vfx, img);

  const safeFrame = ((frame % vfx.frames) + vfx.frames) % vfx.frames;
  const col = safeFrame % vfx.cols;
  const row = Math.floor(safeFrame / vfx.cols) % vfx.rows;
  const sx = col * vfx.frameW;
  const sy = row * vfx.frameH;
  const dw = vfx.frameW * scale;
  const dh = vfx.frameH * scale;

  // Clamp source rect to sheet bounds
  const maxW = img.naturalWidth || img.width;
  const maxH = img.naturalHeight || img.height;
  if (sx >= maxW || sy >= maxH) return;
  const sw = Math.min(vfx.frameW, maxW - sx);
  const sh = Math.min(vfx.frameH, maxH - sy);
  const alpha = opts?.alpha ?? 1;
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  if (opts?.composite) ctx.globalCompositeOperation = opts.composite;

  if (opts?.glowColor) {
    const r = opts.glowRadius ?? Math.max(dw, dh) * 0.45;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, opts.glowColor);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();
}

/** Heuristic: magic / impact sheets look better additive; dust / blood stay normal. */
export function vfxPreferredComposite(vfx: VfxDef): VfxComposite {
  const cats = vfx.categories.join(" ").toLowerCase();
  const id = vfx.id.toLowerCase();
  if (/dust|smoke|blood|water|mist|physical/.test(cats + " " + id)) return "source-over";
  if (/magic|fire|lightning|arcane|holy|ice|impact|slash|energy|projectile|cast/.test(cats + " " + id)) {
    return "lighter";
  }
  return "source-over";
}

/**
 * Build a one-shot VfxDef from a raw horizontal strip image path
 * (character attack effects under /fighter2d/effects/).
 */
export function makeStripVfx(
  id: string,
  src: string,
  frames: number,
  frameW = 100,
  frameH = 100,
): VfxDef {
  return {
    id,
    name: id,
    src,
    cols: frames,
    rows: 1,
    frameW,
    frameH,
    frames,
    categories: ["melee"],
  };
}

/** Resolve a character effect filename to a VfxDef (local char sheet or generic slash). */
export function resolveAttackEffectVfx(effectSrc: string | undefined, frames = 6): VfxDef {
  if (effectSrc) {
    const base = effectSrc.replace(/^.*\//, "").replace(/\.png$/i, "");
    const known = getVfxById(base) ?? getVfxById(effectSrc);
    if (known) return known;
    return makeStripVfx(base, effectSrc.startsWith("/") ? effectSrc : `${LOCAL_BASE}/${effectSrc}`, frames, 100, 100);
  }
  return getVfxById("slash_arc") ?? LOCAL_FALLBACKS[0];
}

export { ALL_VFX };
