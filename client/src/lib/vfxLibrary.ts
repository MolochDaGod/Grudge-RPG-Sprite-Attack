// VFX Effect Library — info.grudge-studio.com ObjectStore (143+ effects) + local fallbacks
// Correct multi-row grid support (cols × rows), not horizontal strips only.
// NEVER use character body sheets as slash/impact — pure effect sprites only.

/** Production SSOT (info site + ObjectStore mirror + CDN). */
const INFO_API = "https://info.grudge-studio.com/api/v1/effectSprites.json";
const INFO_BASE = "https://info.grudge-studio.com";
/** Same-origin catalog (vite proxy / vercel rewrite). Prefer first. */
const LOCAL_API = "/cdn-api/effects.json";
const GITHUB_API = "https://molochdagod.github.io/ObjectStore/api/v1/effectSprites.json";
const LOCAL_BASE = "/fighter2d/effects";

/**
 * Prefer same-origin /cdn-effects proxy (vercel rewrite → info.grudge-studio.com)
 * so production CSP + CORS stay clean. Absolute http(s) kept as-is.
 * Paths under /sprites/effects/* map to /cdn-effects/*
 */
function remoteAssetUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    // Rewrite absolute info/objectstore effect URLs to same-origin proxy when possible
    try {
      const u = new URL(src);
      if (
        (u.hostname.includes("grudge-studio.com") || u.hostname.includes("github.io")) &&
        u.pathname.includes("/sprites/effects/")
      ) {
        const rel = u.pathname.replace(/^\/sprites\/effects\//, "");
        return `/cdn-effects/${rel}`;
      }
    } catch {
      /* keep absolute */
    }
    return src;
  }
  const path = src.startsWith("/") ? src : `/${src}`;
  if (path.startsWith("/sprites/effects/")) {
    return `/cdn-effects/${path.slice("/sprites/effects/".length)}`;
  }
  // Dev fallback: hit info host directly if proxy not available
  return `${INFO_BASE}${path}`;
}

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

// ─── Pure VFX via same-origin /cdn-effects (vercel → info.grudge-studio.com)
// Never character body sheets. Dev without proxy: vite proxies or absolute INFO_BASE.
const CDN = "/cdn-effects";
const SLASH_RED_MD = `${CDN}/slash/slash_red_md.png`;
const SLASH_RED_LG = `${CDN}/slash/slash_red_lg.png`;
const SLASH_RED_SM = `${CDN}/slash/slash_red_sm.png`;
const SLASH_BLUE_MD = `${CDN}/slash/slash_blue_md.png`;
const SLASH_BLUE_LG = `${CDN}/slash/slash_blue_lg.png`;
const SLASH_BLUE_SM = `${CDN}/slash/slash_blue_sm.png`;
const SLASH_GREEN_MD = `${CDN}/slash/slash_green_md.png`;
const SLASH_GREEN_LG = `${CDN}/slash/slash_green_lg.png`;
const SLASH_GREEN_SM = `${CDN}/slash/slash_green_sm.png`;
const SLASH_PURPLE_MD = `${CDN}/slash/slash_purple_md.png`;
const SLASH_PURPLE_LG = `${CDN}/slash/slash_purple_lg.png`;
const SLASH_PURPLE_SM = `${CDN}/slash/slash_purple_sm.png`;
const SLASH_ORANGE_MD = `${CDN}/slash/slash_orange_md.png`;
const SLASH_ORANGE_LG = `${CDN}/slash/slash_orange_lg.png`;
const SLASH_ORANGE_SM = `${CDN}/slash/slash_orange_sm.png`;
const SLASH_SHEET = `${CDN}/slash_spritesheet.png`;
const DEMON1 = `${CDN}/demon_slash_1.png`;
const DEMON2 = `${CDN}/demon_slash_2.png`;
const DEMON3 = `${CDN}/demon_slash_3.png`;
const HIT1 = `${CDN}/hit_effect_1.png`;
const HIT2 = `${CDN}/hit_effect_2.png`;
const HIT3 = `${CDN}/hit_effect_3.png`;
const HIT_BURST = `${CDN}/custom/hit.png`;
const CRIT = `${CDN}/custom/crit.png`;
const ARCANE_SLASH = `${CDN}/custom/arcaneslash.png`;
const WEAPON_HIT = `${CDN}/pixel/10_weaponhit_spritesheet.png`;
const SMEAR_H1 = `${CDN}/pixel/smear_h1.png`;
const SMEAR_H2 = `${CDN}/pixel/smear_h2.png`;
const SMEAR_H3 = `${CDN}/pixel/smear_h3.png`;
const SMEAR_V1 = `${CDN}/pixel/smear_v1.png`;
const SMEAR_V2 = `${CDN}/pixel/smear_v2.png`;
const SMEAR_V3 = `${CDN}/pixel/smear_v3.png`;
const IMPACT_FIRE_A = `${CDN}/retro_impact/impactFireA.png`;
const IMPACT_YELLOW_A = `${CDN}/retro_impact/impactYellowA.png`;
const IMPACT_RED_A = `${CDN}/retro_impact/impactRedA.png`;
const IMPACT_PURPLE_A = `${CDN}/retro_impact/impactPurpleA.png`;
const IMPACT_CYAN_A = `${CDN}/retro_impact/impactCyanA.png`;
const IMPACT_GREEN_A = `${CDN}/retro_impact/impactGreenA.png`;
const IMPACT_WHITE_A = `${CDN}/retro_impact/impactWhiteA.png`;
const IMPACT_MAGENTA_A = `${CDN}/retro_impact/impactMagentaA.png`;
const IMPACT_ORANGE_A = `${CDN}/retro_impact/impactOrangeA.png`;
const THUNDER_HIT = `${CDN}/thunder_hit.png`;
const HOLY_IMPACT = `${CDN}/holy_impact.png`;
const STAR_BURST = `${CDN}/star_burst.png`;
// Local-only strips still useful offline
const SLASH_LOCAL = `${LOCAL_BASE}/slash_arc.png`;
const BOLT = `${LOCAL_BASE}/lightning-bolt.png`;
const SPARK = `${LOCAL_BASE}/electric-spark.png`;
const SLASH_RANGED = `${LOCAL_BASE}/slash_ranged.png`;

function gridVfx(
  id: string,
  name: string,
  src: string,
  cols: number,
  rows: number,
  frameW: number,
  frameH: number,
  frames: number,
  categories: string[],
): VfxDef {
  return { id, name, src, cols, rows, frameW, frameH, frames, categories };
}

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
  return gridVfx(id, name, src, cols, 1, frameW, frameH, frames ?? cols, categories);
}

/** Combat-critical pure VFX — always available even if API is slow. */
const LOCAL_FALLBACKS: VfxDef[] = [
  localStrip("slash_arc", "Slash Arc", SLASH_LOCAL, 2, 100, 82, ["melee", "slash"]),
  localStrip("lightning_bolt", "Lightning Bolt", BOLT, 6, 96, 128, ["magic", "lightning"]),
  localStrip("electric_spark", "Electric Spark", SPARK, 3, 128, 128, ["magic", "lightning", "impact"]),
  localStrip("slash_ranged", "Ranged Slash", SLASH_RANGED, 11, 100, 100, ["melee", "slash"]),
  // Slash family (info CDN)
  gridVfx("slash", "Slash", SLASH_SHEET, 1, 8, 64, 64, 8, ["melee", "physical"]),
  localStrip("slashRedSm", "Slash Red Sm", SLASH_RED_SM, 8, 32, 32, ["melee", "slashColor"]),
  localStrip("slashRedMd", "Slash Red Md", SLASH_RED_MD, 8, 64, 64, ["melee", "slashColor"]),
  localStrip("slashRedLg", "Slash Red Lg", SLASH_RED_LG, 8, 96, 96, ["melee", "slashColor"]),
  localStrip("slashBlueSm", "Slash Blue Sm", SLASH_BLUE_SM, 8, 32, 32, ["melee", "slashColor"]),
  localStrip("slashBlueMd", "Slash Blue Md", SLASH_BLUE_MD, 8, 64, 64, ["melee", "slashColor"]),
  localStrip("slashBlueLg", "Slash Blue Lg", SLASH_BLUE_LG, 8, 96, 96, ["melee", "slashColor"]),
  localStrip("slashGreenSm", "Slash Green Sm", SLASH_GREEN_SM, 8, 32, 32, ["melee", "slashColor"]),
  localStrip("slashGreenMd", "Slash Green Md", SLASH_GREEN_MD, 8, 64, 64, ["melee", "slashColor"]),
  localStrip("slashGreenLg", "Slash Green Lg", SLASH_GREEN_LG, 8, 96, 96, ["melee", "slashColor"]),
  localStrip("slashPurpleSm", "Slash Purple Sm", SLASH_PURPLE_SM, 8, 32, 32, ["melee", "slashColor"]),
  localStrip("slashPurpleMd", "Slash Purple Md", SLASH_PURPLE_MD, 8, 64, 64, ["melee", "slashColor"]),
  localStrip("slashPurpleLg", "Slash Purple Lg", SLASH_PURPLE_LG, 8, 96, 96, ["melee", "slashColor"]),
  localStrip("slashOrangeSm", "Slash Orange Sm", SLASH_ORANGE_SM, 8, 32, 32, ["melee", "slashColor"]),
  localStrip("slashOrangeMd", "Slash Orange Md", SLASH_ORANGE_MD, 8, 64, 64, ["melee", "slashColor"]),
  localStrip("slashOrangeLg", "Slash Orange Lg", SLASH_ORANGE_LG, 8, 96, 96, ["melee", "slashColor"]),
  localStrip("demonSlash1", "Demon Slash 1", DEMON1, 7, 48, 48, ["melee", "physical"]),
  localStrip("demonSlash2", "Demon Slash 2", DEMON2, 7, 48, 48, ["melee", "physical"]),
  localStrip("demonSlash3", "Demon Slash 3", DEMON3, 7, 48, 48, ["melee", "physical"]),
  localStrip("hitEffect1", "Hit Impact 1", HIT1, 7, 48, 48, ["impact", "melee"]),
  localStrip("hitEffect2", "Hit Impact 2", HIT2, 7, 48, 48, ["impact", "melee"]),
  localStrip("hitEffect3", "Hit Impact 3", HIT3, 7, 48, 48, ["impact", "melee"]),
  localStrip("hit_effect_1", "Hit Impact", HIT1, 7, 48, 48, ["impact", "melee"]),
  localStrip("smearH1", "Smear H1", SMEAR_H1, 5, 48, 48, ["melee", "physical"]),
  localStrip("smearH2", "Smear H2", SMEAR_H2, 5, 48, 48, ["melee", "physical"]),
  localStrip("smearH3", "Smear H3", SMEAR_H3, 5, 48, 48, ["melee", "physical"]),
  localStrip("smearV1", "Smear V1", SMEAR_V1, 6, 48, 48, ["melee", "physical"]),
  localStrip("smearV2", "Smear V2", SMEAR_V2, 6, 48, 48, ["melee", "physical"]),
  localStrip("smearV3", "Smear V3", SMEAR_V3, 6, 48, 48, ["melee", "physical"]),
  gridVfx("hitBurst", "Hit Burst", HIT_BURST, 4, 2, 384, 512, 8, ["impact", "melee", "crit"]),
  gridVfx("critSlash", "Crit Slash", CRIT, 4, 1, 384, 394, 4, ["melee", "crit"]),
  gridVfx("arcaneslash", "Arcane Slash", ARCANE_SLASH, 4, 2, 384, 512, 8, ["melee", "arcane"]),
  gridVfx("weaponHit", "Weapon Hit", WEAPON_HIT, 6, 6, 100, 100, 36, ["impact", "melee"]),
  // Retro impacts
  gridVfx("impactFireA", "Impact Fire A", IMPACT_FIRE_A, 9, 6, 64, 64, 54, ["impact", "fire"]),
  gridVfx("impactFireB", "Impact Fire B", IMPACT_FIRE_A, 9, 6, 64, 64, 54, ["impact", "fire"]),
  gridVfx("impactYellowA", "Impact Yellow A", IMPACT_YELLOW_A, 9, 6, 64, 64, 54, ["impact", "lightning"]),
  gridVfx("impactYellowB", "Impact Yellow B", IMPACT_YELLOW_A, 9, 6, 64, 64, 54, ["impact", "lightning"]),
  gridVfx("impactRedA", "Impact Red A", IMPACT_RED_A, 9, 6, 64, 64, 54, ["impact", "fire"]),
  gridVfx("impactOrangeA", "Impact Orange A", IMPACT_ORANGE_A, 9, 6, 64, 64, 54, ["impact", "fire"]),
  gridVfx("impactPurpleA", "Impact Purple A", IMPACT_PURPLE_A, 9, 6, 64, 64, 54, ["impact", "arcane"]),
  gridVfx("impactCyanA", "Impact Cyan A", IMPACT_CYAN_A, 9, 6, 64, 64, 54, ["impact", "ice"]),
  gridVfx("impactCyanB", "Impact Cyan B", IMPACT_CYAN_A, 9, 6, 64, 64, 54, ["impact", "ice"]),
  gridVfx("impactGreenA", "Impact Green A", IMPACT_GREEN_A, 9, 6, 64, 64, 54, ["impact", "nature"]),
  gridVfx("impactGreenB", "Impact Green B", IMPACT_GREEN_A, 9, 6, 64, 64, 54, ["impact", "nature"]),
  gridVfx("impactWhiteA", "Impact White A", IMPACT_WHITE_A, 9, 6, 64, 64, 54, ["impact", "holy"]),
  gridVfx("impactMagentaA", "Impact Magenta A", IMPACT_MAGENTA_A, 9, 6, 64, 64, 54, ["impact", "dark"]),
  localStrip("thunderHit", "Thunder Hit", THUNDER_HIT, 6, 32, 32, ["impact", "lightning"]),
  localStrip("holyImpact", "Holy Impact", HOLY_IMPACT, 7, 32, 32, ["holy", "impact"]),
  localStrip("starBurst", "Star Burst", STAR_BURST, 7, 50, 50, ["impact"]),
  // Aliases for pool IDs that map to pure CDN VFX (no character art)
  localStrip("explosionSmall", "Small Explosion", HIT1, 7, 48, 48, ["impact", "fire"]),
  localStrip("dustCloud", "Dust Cloud", SMEAR_H1, 5, 48, 48, ["impact", "physical"]),
  localStrip("bloodSplat", "Blood Splat", HIT2, 7, 48, 48, ["impact", "physical"]),
  localStrip("energyBurst", "Energy Burst", STAR_BURST, 7, 50, 50, ["impact", "magic"]),
  localStrip("sparkBurst", "Spark Burst", THUNDER_HIT, 6, 32, 32, ["impact", "lightning"]),
  localStrip("fireBreath", "Fire Breath", BOLT, 6, 96, 128, ["projectile", "fire"]),
  localStrip("fireBreathHit", "Fire Breath Hit", HIT1, 7, 48, 48, ["impact", "fire"]),
  localStrip("iceShatter", "Ice Shatter", HIT3, 7, 48, 48, ["impact", "ice"]),
  localStrip("waterSplash", "Water Splash", HIT2, 7, 48, 48, ["impact", "water"]),
  localStrip("lightningStrike", "Lightning Strike", THUNDER_HIT, 6, 32, 32, ["impact", "lightning"]),
  localStrip("electricChain", "Electric Chain", BOLT, 6, 96, 128, ["projectile", "lightning"]),
  localStrip("shadowSlash", "Shadow Slash", SLASH_PURPLE_MD, 8, 64, 64, ["melee", "dark"]),
  localStrip("voidPulse", "Void Pulse", IMPACT_MAGENTA_A, 9, 64, 64, ["impact", "dark"]),
  localStrip("darkMist", "Dark Mist", IMPACT_PURPLE_A, 9, 64, 64, ["projectile", "dark"]),
  localStrip("holySmite", "Holy Smite", HOLY_IMPACT, 7, 32, 32, ["impact", "holy"]),
  localStrip("rockSmash", "Rock Smash", HIT3, 7, 48, 48, ["impact", "earth"]),
  localStrip("vineWhip", "Vine Whip", SLASH_GREEN_MD, 8, 64, 64, ["melee", "nature"]),
  localStrip("leafStorm", "Leaf Storm", SLASH_GREEN_LG, 8, 96, 96, ["projectile", "nature"]),
  localStrip("frostWave", "Frost Wave", IMPACT_CYAN_A, 9, 64, 64, ["projectile", "ice"]),
  localStrip("divineShield", "Divine Shield", IMPACT_WHITE_A, 9, 64, 64, ["buff", "holy"]),
  localStrip("lightBeam", "Light Beam", HOLY_IMPACT, 7, 32, 32, ["projectile", "holy"]),
  localStrip("explosionBig", "Big Explosion", IMPACT_FIRE_A, 9, 64, 64, ["impact", "fire"]),
  localStrip("arcanebolt", "Arcane Bolt", STAR_BURST, 7, 50, 50, ["arcane"]),
  localStrip("arcanelighting", "Arcane Lighting", THUNDER_HIT, 6, 32, 32, ["lightning", "arcane"]),
  localStrip("arcanemist", "Arcane Mist", IMPACT_PURPLE_A, 9, 64, 64, ["arcane", "dark"]),
  localStrip("flamestrike", "Flame Strike", IMPACT_FIRE_A, 9, 64, 64, ["fire"]),
  localStrip("flameLash", "Flame Lash", SLASH_ORANGE_LG, 8, 96, 96, ["fire"]),
  localStrip("fireSpin", "Fire Spin", IMPACT_ORANGE_A, 9, 64, 64, ["fire"]),
  localStrip("fireExplosion", "Fire Explosion", IMPACT_FIRE_A, 9, 64, 64, ["fire", "impact"]),
  localStrip("fireExplosion2", "Fire Explosion 2", IMPACT_RED_A, 9, 64, 64, ["fire", "impact"]),
  localStrip("frostbolt", "Frost Bolt", IMPACT_CYAN_A, 9, 64, 64, ["ice"]),
  localStrip("frozenIce", "Frozen Ice", IMPACT_CYAN_A, 9, 64, 64, ["ice"]),
  localStrip("iceHit", "Ice Hit", HIT1, 7, 48, 48, ["ice", "impact"]),
  localStrip("iceVfx1", "Ice Vfx", IMPACT_CYAN_A, 9, 64, 64, ["ice"]),
  localStrip("iceActive", "Ice Active", IMPACT_CYAN_A, 9, 64, 64, ["ice"]),
  localStrip("holyVfx", "Holy Vfx", IMPACT_WHITE_A, 9, 64, 64, ["holy"]),
  localStrip("holyRepeatable", "Holy Aura", IMPACT_WHITE_A, 9, 64, 64, ["holy", "block"]),
  localStrip("healEffect", "Heal Effect", STAR_BURST, 7, 50, 50, ["heal"]),
  localStrip("healingwave", "Healing Wave", IMPACT_GREEN_A, 9, 64, 64, ["heal"]),
  localStrip("healingregen", "Healing Regen", STAR_BURST, 7, 50, 50, ["heal"]),
  localStrip("protectionCircle", "Protection Circle", IMPACT_WHITE_A, 9, 64, 64, ["buff", "block"]),
  localStrip("casting", "Casting", STAR_BURST, 7, 50, 50, ["cast"]),
  localStrip("magickaHit", "Magicka Hit", IMPACT_PURPLE_A, 9, 64, 64, ["impact", "arcane"]),
  localStrip("felSpell", "Fel Spell", IMPACT_MAGENTA_A, 9, 64, 64, ["dark", "arcane"]),
  localStrip("midnight", "Midnight", IMPACT_PURPLE_A, 9, 64, 64, ["dark"]),
  localStrip("phantom", "Phantom", IMPACT_MAGENTA_A, 9, 64, 64, ["dark"]),
  localStrip("nebula", "Nebula", IMPACT_PURPLE_A, 9, 64, 64, ["dark", "cast"]),
  localStrip("windHit", "Wind Hit", HIT2, 7, 48, 48, ["wind", "impact"]),
  localStrip("windBreath", "Wind Breath", SLASH_GREEN_MD, 8, 64, 64, ["wind"]),
  localStrip("windProjectile", "Wind Projectile", SLASH_GREEN_SM, 8, 32, 32, ["wind", "projectile"]),
  localStrip("smokeVfx1", "Smoke 1", SMEAR_H1, 5, 48, 48, ["movement"]),
  localStrip("smokeVfx2", "Smoke 2", SMEAR_H2, 5, 48, 48, ["movement"]),
  localStrip("smokeVfx3", "Smoke 3", SMEAR_H3, 5, 48, 48, ["movement"]),
  localStrip("brightFire", "Bright Fire", IMPACT_FIRE_A, 9, 64, 64, ["fire"]),
  localStrip("resurrect", "Resurrect", IMPACT_WHITE_A, 9, 64, 64, ["holy", "heal"]),
  localStrip("worgeTornado", "Worge Tornado", SLASH_GREEN_LG, 8, 96, 96, ["nature"]),
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
  const src = remoteAssetUrl(entry.src);
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
  const endpoints = [LOCAL_API, INFO_API, GITHUB_API];
  for (const api of endpoints) {
    try {
      const res = await fetch(api);
      if (!res.ok) continue;
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
      if (remote.length > 0) {
        console.info(`[vfxLibrary] loaded ${remote.length} effects from ${api.includes("info.") ? "info.grudge-studio.com" : "github Pages"}`);
        return remote;
      }
    } catch {
      /* try next mirror */
    }
  }
  return [];
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

/**
 * Resolve a character *split-effect* strip (pure FX under /fighter2d/effects/).
 * Rejects character body paths (folders with race/dwarf/etc) — use catalog slash instead.
 */
export function resolveAttackEffectVfx(effectSrc: string | undefined, frames = 6): VfxDef {
  if (effectSrc) {
    const lower = effectSrc.toLowerCase();
    // Guard: never treat a character body sheet as slash/impact VFX
    if (
      /characters\//.test(lower) ||
      /dwarf|free-knight|idle|walk|hurt|death/.test(lower)
    ) {
      return getVfxById("slashRedMd") ?? getVfxById("slash_arc") ?? LOCAL_FALLBACKS[0];
    }
    const base = effectSrc.replace(/^.*\//, "").replace(/\.png$/i, "");
    // Prefer catalog pure VFX if this id exists there
    const known = getVfxById(base) ?? getVfxById(effectSrc);
    if (known && !/characters\//.test(known.src.toLowerCase())) return known;
    // Only allow local effect strips (Split Effects / slash_arc / lightning)
    if (effectSrc.includes("/effects/") || !effectSrc.includes("/characters/")) {
      const src = effectSrc.startsWith("http") || effectSrc.startsWith("/")
        ? effectSrc
        : `${LOCAL_BASE}/${effectSrc}`;
      return makeStripVfx(base, src, frames, 100, 100);
    }
  }
  return getVfxById("slashRedMd") ?? getVfxById("slash_arc") ?? LOCAL_FALLBACKS[0];
}

/** True if this VFX is a pure effect (safe for slash/impact overlay). */
export function isPureCombatVfx(vfx: VfxDef | undefined | null): boolean {
  if (!vfx) return false;
  const s = vfx.src.toLowerCase();
  if (/characters\//.test(s)) return false;
  if (/dwarf|free-knight/.test(s) && !/effect/.test(s)) return false;
  return true;
}

export { ALL_VFX };
