/**
 * Character ultimate catalog for Grudge Fighter 2D.
 * Each super is a multi-phase sequence: charge → hit(s) → finisher launch.
 * VFX IDs resolve via vfxLibrary (info.grudge-studio.com ObjectStore).
 */

import type { KnockbackAngle } from "./fighterRagdoll";

export type UltimateArchetype =
  | "sword"
  | "magic"
  | "fire"
  | "ice"
  | "dark"
  | "holy"
  | "ranger"
  | "brute"
  | "lightning"
  | "default";

export interface UltimateHit {
  /** ms after super start */
  atMs: number;
  /** Damage fraction of superDamage (sums can exceed 1 for multi-hit pressure) */
  damageMul: number;
  knockback: KnockbackAngle;
  hitVfx: string;
  swingVfx?: string;
  shake: number;
  /** Optional screen flash color */
  flashColor?: string;
}

export interface UltimateDef {
  id: string;
  name: string;
  archetype: UltimateArchetype;
  /** Total freeze/cinematic length ms */
  durationMs: number;
  /** When special anim holds peak pose */
  poseHoldMs: number;
  chargeVfx: string;
  auraVfx: string;
  hits: UltimateHit[];
  /** Finisher launches with heavy ragdoll */
  finisherLaunch: boolean;
  /** Camera zoom punch 0–1 */
  drama: number;
}

const SWORD_ULT: UltimateDef = {
  id: "steel_tempest",
  name: "Steel Tempest",
  archetype: "sword",
  durationMs: 1100,
  poseHoldMs: 700,
  chargeVfx: "slashRedLg",
  auraVfx: "smearH3",
  drama: 0.85,
  finisherLaunch: true,
  hits: [
    { atMs: 380, damageMul: 0.25, knockback: "forward", hitVfx: "hitEffect1", swingVfx: "slashRedMd", shake: 8 },
    { atMs: 520, damageMul: 0.25, knockback: "forward", hitVfx: "hitEffect2", swingVfx: "slashRedLg", shake: 9 },
    { atMs: 680, damageMul: 0.2, knockback: "up", hitVfx: "hitBurst", swingVfx: "demonSlash1", shake: 11 },
    { atMs: 820, damageMul: 0.45, knockback: "launch", hitVfx: "critSlash", swingVfx: "demonSlash2", shake: 16, flashColor: "rgba(255,220,120,0.35)" },
  ],
};

const MAGIC_ULT: UltimateDef = {
  id: "arcane_oblivion",
  name: "Arcane Oblivion",
  archetype: "magic",
  durationMs: 1200,
  poseHoldMs: 750,
  chargeVfx: "arcaneslash",
  auraVfx: "nebula",
  drama: 0.95,
  finisherLaunch: true,
  hits: [
    { atMs: 400, damageMul: 0.3, knockback: "neutral", hitVfx: "magickaHit", swingVfx: "arcanebolt", shake: 9 },
    { atMs: 580, damageMul: 0.3, knockback: "up", hitVfx: "impactPurpleA", swingVfx: "arcaneslash", shake: 12 },
    { atMs: 820, damageMul: 0.55, knockback: "launch", hitVfx: "impactMagentaA", swingVfx: "arcanelighting", shake: 18, flashColor: "rgba(180,120,255,0.4)" },
  ],
};

const FIRE_ULT: UltimateDef = {
  id: "meteor_rain",
  name: "Meteor Rain",
  archetype: "fire",
  durationMs: 1250,
  poseHoldMs: 800,
  chargeVfx: "flamestrike",
  auraVfx: "brightFire",
  drama: 1,
  finisherLaunch: true,
  hits: [
    { atMs: 360, damageMul: 0.22, knockback: "down", hitVfx: "impactFireA", swingVfx: "flameLash", shake: 10 },
    { atMs: 500, damageMul: 0.22, knockback: "down", hitVfx: "fireExplosion", swingVfx: "slashOrangeLg", shake: 11 },
    { atMs: 640, damageMul: 0.22, knockback: "forward", hitVfx: "impactRedA", swingVfx: "flamestrike", shake: 12 },
    { atMs: 900, damageMul: 0.5, knockback: "launch", hitVfx: "impactFireB", swingVfx: "explosionBig", shake: 20, flashColor: "rgba(255,100,40,0.4)" },
  ],
};

const ICE_ULT: UltimateDef = {
  id: "glacial_prison",
  name: "Glacial Prison",
  archetype: "ice",
  durationMs: 1150,
  poseHoldMs: 720,
  chargeVfx: "frostbolt",
  auraVfx: "iceVfx1",
  drama: 0.9,
  finisherLaunch: true,
  hits: [
    { atMs: 400, damageMul: 0.28, knockback: "neutral", hitVfx: "iceHit", swingVfx: "slashBlueMd", shake: 8 },
    { atMs: 600, damageMul: 0.32, knockback: "forward", hitVfx: "impactCyanA", swingVfx: "frostbolt", shake: 12 },
    { atMs: 850, damageMul: 0.5, knockback: "launch", hitVfx: "frozenIce", swingVfx: "impactCyanB", shake: 17, flashColor: "rgba(140,220,255,0.4)" },
  ],
};

const DARK_ULT: UltimateDef = {
  id: "void_collapse",
  name: "Void Collapse",
  archetype: "dark",
  durationMs: 1200,
  poseHoldMs: 760,
  chargeVfx: "midnight",
  auraVfx: "phantom",
  drama: 0.95,
  finisherLaunch: true,
  hits: [
    { atMs: 380, damageMul: 0.25, knockback: "forward", hitVfx: "hitEffect3", swingVfx: "slashPurpleMd", shake: 9 },
    { atMs: 560, damageMul: 0.3, knockback: "up", hitVfx: "impactPurpleA", swingVfx: "felSpell", shake: 12 },
    { atMs: 860, damageMul: 0.55, knockback: "launch", hitVfx: "impactMagentaA", swingVfx: "voidPulse", shake: 19, flashColor: "rgba(120,40,160,0.45)" },
  ],
};

const HOLY_ULT: UltimateDef = {
  id: "divine_judgment",
  name: "Divine Judgment",
  archetype: "holy",
  durationMs: 1150,
  poseHoldMs: 740,
  chargeVfx: "holyVfx",
  auraVfx: "holyRepeatable",
  drama: 0.92,
  finisherLaunch: true,
  hits: [
    { atMs: 400, damageMul: 0.3, knockback: "neutral", hitVfx: "holyImpact", swingVfx: "slashBlueLg", shake: 10 },
    { atMs: 620, damageMul: 0.3, knockback: "up", hitVfx: "impactYellowA", swingVfx: "holySmite", shake: 13 },
    { atMs: 860, damageMul: 0.5, knockback: "launch", hitVfx: "impactWhiteA", swingVfx: "resurrect", shake: 18, flashColor: "rgba(255,240,180,0.4)" },
  ],
};

const RANGER_ULT: UltimateDef = {
  id: "arrow_storm",
  name: "Arrow Storm",
  archetype: "ranger",
  durationMs: 1100,
  poseHoldMs: 700,
  chargeVfx: "windBreath",
  auraVfx: "slashGreenLg",
  drama: 0.8,
  finisherLaunch: true,
  hits: [
    { atMs: 340, damageMul: 0.18, knockback: "forward", hitVfx: "hitEffect1", swingVfx: "slashGreenSm", shake: 6 },
    { atMs: 440, damageMul: 0.18, knockback: "forward", hitVfx: "hitEffect2", swingVfx: "slashGreenMd", shake: 7 },
    { atMs: 540, damageMul: 0.18, knockback: "forward", hitVfx: "windHit", swingVfx: "slashGreenLg", shake: 8 },
    { atMs: 700, damageMul: 0.22, knockback: "up", hitVfx: "impactGreenA", swingVfx: "leafStorm", shake: 11 },
    { atMs: 900, damageMul: 0.4, knockback: "launch", hitVfx: "impactGreenB", swingVfx: "demonSlash3", shake: 15, flashColor: "rgba(120,255,140,0.3)" },
  ],
};

const BRUTE_ULT: UltimateDef = {
  id: "berserker_fury",
  name: "Berserker Fury",
  archetype: "brute",
  durationMs: 1050,
  poseHoldMs: 680,
  chargeVfx: "rockSmash",
  auraVfx: "smearV2",
  drama: 0.88,
  finisherLaunch: true,
  hits: [
    { atMs: 360, damageMul: 0.35, knockback: "forward", hitVfx: "hitBurst", swingVfx: "smearH1", shake: 12 },
    { atMs: 540, damageMul: 0.3, knockback: "down", hitVfx: "explosionSmall", swingVfx: "smearV1", shake: 13 },
    { atMs: 780, damageMul: 0.5, knockback: "launch", hitVfx: "impactOrangeA", swingVfx: "demonSlash1", shake: 18, flashColor: "rgba(255,140,60,0.35)" },
  ],
};

const LIGHTNING_ULT: UltimateDef = {
  id: "thunder_god",
  name: "Thunder God",
  archetype: "lightning",
  durationMs: 1100,
  poseHoldMs: 700,
  chargeVfx: "lightningStrike",
  auraVfx: "electricChain",
  drama: 0.95,
  finisherLaunch: true,
  hits: [
    { atMs: 360, damageMul: 0.28, knockback: "neutral", hitVfx: "thunderHit", swingVfx: "sparkBurst", shake: 10 },
    { atMs: 540, damageMul: 0.32, knockback: "up", hitVfx: "impactYellowA", swingVfx: "arcanelighting", shake: 13 },
    { atMs: 800, damageMul: 0.55, knockback: "launch", hitVfx: "impactYellowB", swingVfx: "lightningStrike", shake: 19, flashColor: "rgba(200,230,255,0.45)" },
  ],
};

const DEFAULT_ULT: UltimateDef = {
  id: "grudge_finisher",
  name: "Grudge Finisher",
  archetype: "default",
  durationMs: 1000,
  poseHoldMs: 650,
  chargeVfx: "slashRedLg",
  auraVfx: "energyBurst",
  drama: 0.8,
  finisherLaunch: true,
  hits: [
    { atMs: 400, damageMul: 0.4, knockback: "forward", hitVfx: "hitBurst", swingVfx: "slashRedMd", shake: 10 },
    { atMs: 720, damageMul: 0.7, knockback: "launch", hitVfx: "critSlash", swingVfx: "slashRedLg", shake: 16, flashColor: "rgba(255,200,100,0.35)" },
  ],
};

const BY_ARCHETYPE: Record<UltimateArchetype, UltimateDef> = {
  sword: SWORD_ULT,
  magic: MAGIC_ULT,
  fire: FIRE_ULT,
  ice: ICE_ULT,
  dark: DARK_ULT,
  holy: HOLY_ULT,
  ranger: RANGER_ULT,
  brute: BRUTE_ULT,
  lightning: LIGHTNING_ULT,
  default: DEFAULT_ULT,
};

/** Map character id / name / superName heuristics → archetype */
export function resolveUltimateArchetype(
  charId: string,
  charName: string,
  superName: string,
): UltimateArchetype {
  const blob = `${charId} ${charName} ${superName}`.toLowerCase();
  if (/fire|inferno|meteor|flame|ember/.test(blob)) return "fire";
  if (/ice|frost|glacial|frozen|tidal|water/.test(blob)) return "ice";
  if (/thunder|lightning|spark|storm|electric/.test(blob)) return "lightning";
  if (/void|shadow|dark|night|necrom|death|fel|soul/.test(blob)) return "dark";
  if (/holy|divine|judgment|crusade|silver|templar|priest|heal/.test(blob)) return "holy";
  if (/arrow|ranger|archer|gale|wind|leaf|nature|bow/.test(blob)) return "ranger";
  if (/berserk|orc|bear|brute|smash|waaagh|fury|warrior|axe/.test(blob)) return "brute";
  if (/arcane|mage|wizard|magic|spell|oblivion|cataclysm/.test(blob)) return "magic";
  if (/sword|blade|knight|steel|cut|tempest|cleave|samurai/.test(blob)) return "sword";
  return "default";
}

export function getUltimateForCharacter(
  charId: string,
  charName: string,
  superName: string,
): UltimateDef {
  const arch = resolveUltimateArchetype(charId, charName, superName);
  const base = BY_ARCHETYPE[arch];
  // Prefer roster superName for UI while keeping hit choreography
  return {
    ...base,
    name: superName || base.name,
  };
}

export interface SuperSequenceState {
  attacker: "p1" | "p2";
  ultimate: UltimateDef;
  startedAt: number;
  until: number;
  /** Indices of hits already applied */
  hitsDealt: number[];
  chargeSpawned: boolean;
}

export function beginSuperSequence(
  attacker: "p1" | "p2",
  ultimate: UltimateDef,
  now: number,
): SuperSequenceState {
  return {
    attacker,
    ultimate,
    startedAt: now,
    until: now + ultimate.durationMs,
    hitsDealt: [],
    chargeSpawned: false,
  };
}

export function superElapsed(seq: SuperSequenceState, now: number): number {
  return now - seq.startedAt;
}

export function pendingSuperHits(seq: SuperSequenceState, now: number): UltimateHit[] {
  const t = superElapsed(seq, now);
  return seq.ultimate.hits.filter(
    (h, i) => t >= h.atMs && !seq.hitsDealt.includes(i),
  ).map((h) => h);
}

export function markSuperHitDealt(seq: SuperSequenceState, hit: UltimateHit): SuperSequenceState {
  const idx = seq.ultimate.hits.indexOf(hit);
  if (idx < 0 || seq.hitsDealt.includes(idx)) return seq;
  return { ...seq, hitsDealt: [...seq.hitsDealt, idx] };
}

export function listUltimateArchetypes(): UltimateArchetype[] {
  return Object.keys(BY_ARCHETYPE) as UltimateArchetype[];
}
