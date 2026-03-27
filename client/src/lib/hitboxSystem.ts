// Hitbox System — structured hitbox definitions for fighting game
// Replaces inline weapon rect calculations with data-driven hitbox lookups
// Per-character per-move hitboxes can be edited in ToonAdmin and stored in charConfig overrides

import type { ActionOverride, KnockbackAngle, ColliderOverrides } from "./charConfig";
import type { FighterState } from "./animationStateMachine";

// ─── Types ──────────────────────────────────────────────────────

/** A single hitbox definition relative to the character's foot position */
export interface HitboxDef {
  /** Horizontal offset from character center (positive = forward/facing direction) */
  relativeX: number;
  /** Vertical offset from character feet (negative = up) */
  relativeY: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** First active frame (inclusive) */
  activeStartFrame: number;
  /** Last active frame (inclusive) */
  activeEndFrame: number;
  /** Damage multiplier on base ATK (default 1.0) */
  damageMult: number;
  /** Knockback launch angle */
  knockbackAngle: KnockbackAngle;
  /** Knockback force multiplier (default 1.0) */
  knockbackScale: number;
}

/** Body hurtbox zones — scale factors relative to base collision size */
export interface HurtboxConfig {
  head: { xScale: number; yScale: number; yOffset: number };
  body: { xScale: number; yScale: number; yOffset: number };
  legs: { xScale: number; yScale: number; yOffset: number };
}

/** Resolved hitbox in world space */
export interface WorldHitbox {
  x: number;
  y: number;
  w: number;
  h: number;
  damageMult: number;
  knockbackAngle: KnockbackAngle;
  knockbackScale: number;
}

// ─── Default hitbox profiles by move type ────────────────────────

const DEFAULT_MELEE_HITBOX: HitboxDef = {
  relativeX: 30,
  relativeY: -0.78,  // fraction of height
  width: 80,
  height: 0.5,       // fraction of height
  activeStartFrame: 4,
  activeEndFrame: 6,
  damageMult: 1.0,
  knockbackAngle: "neutral",
  knockbackScale: 1.0,
};

const DEFAULT_HITBOXES: Partial<Record<FighterState, HitboxDef>> = {
  attack: {
    ...DEFAULT_MELEE_HITBOX,
    damageMult: 1.0,
    knockbackAngle: "neutral",
  },
  attack2: {
    ...DEFAULT_MELEE_HITBOX,
    activeStartFrame: 4,
    activeEndFrame: 7,
    damageMult: 1.0,
    knockbackAngle: "neutral",
  },
  comboQ2: {
    ...DEFAULT_MELEE_HITBOX,
    relativeX: 35,
    activeStartFrame: 3,
    activeEndFrame: 6,
    damageMult: 1.1,
    knockbackAngle: "neutral",
  },
  comboQ3: {
    ...DEFAULT_MELEE_HITBOX,
    relativeX: 40,
    width: 100,
    activeStartFrame: 3,
    activeEndFrame: 8,
    damageMult: 1.4,
    knockbackAngle: "forward",
    knockbackScale: 1.3,
  },
  dashAttack: {
    ...DEFAULT_MELEE_HITBOX,
    relativeX: 20,
    width: 100,
    activeStartFrame: 2,
    activeEndFrame: 5,
    damageMult: 1.2,
    knockbackAngle: "forward",
    knockbackScale: 1.1,
  },
  special: {
    ...DEFAULT_MELEE_HITBOX,
    width: 90,
    activeStartFrame: 4,
    activeEndFrame: 8,
    damageMult: 1.1,
    knockbackAngle: "up",
    knockbackScale: 1.0,
  },
};

const DEFAULT_HURTBOX: HurtboxConfig = {
  head: { xScale: 0.6, yScale: 0.25, yOffset: -1.0 },
  body: { xScale: 0.8, yScale: 0.4, yOffset: -0.75 },
  legs: { xScale: 0.7, yScale: 0.35, yOffset: -0.35 },
};

// ─── Public API ──────────────────────────────────────────────────

/** Get the hitbox definition for a move, merging ToonAdmin overrides */
export function getHitbox(
  state: FighterState,
  scaleX: number,
  actionOverride?: ActionOverride,
  colliderOverrides?: ColliderOverrides,
): HitboxDef | null {
  const base = DEFAULT_HITBOXES[state];
  if (!base) return null;

  const hitbox = { ...base };

  // Apply ToonAdmin action overrides
  if (actionOverride) {
    if (actionOverride.hitFrame !== undefined) {
      hitbox.activeStartFrame = actionOverride.hitFrame;
    }
    if (actionOverride.activeFrameEnd !== undefined) {
      hitbox.activeEndFrame = actionOverride.activeFrameEnd;
    }
    if (actionOverride.damageMult !== undefined) {
      hitbox.damageMult = actionOverride.damageMult;
    }
    if (actionOverride.knockbackAngle !== undefined) {
      hitbox.knockbackAngle = actionOverride.knockbackAngle;
    }
  }

  // Apply collider weapon reach override
  if (colliderOverrides?.weaponReach !== undefined) {
    hitbox.width = colliderOverrides.weaponReach;
  }

  // Scale hitbox width by character's render scale
  hitbox.width = Math.round(hitbox.width * scaleX);

  return hitbox;
}

/** Resolve a hitbox definition to world-space coordinates */
export function resolveHitbox(
  hitbox: HitboxDef,
  characterX: number,
  characterY: number,
  characterHeight: number,
  facing: 1 | -1,
): WorldHitbox {
  // relativeY is a fraction of character height
  const worldY = characterY + hitbox.relativeY * characterHeight;
  // relativeX is in pixels, direction depends on facing
  const worldX = facing > 0
    ? characterX + hitbox.relativeX
    : characterX - hitbox.relativeX - hitbox.width;

  return {
    x: worldX,
    y: worldY,
    w: hitbox.width,
    h: typeof hitbox.height === "number" && hitbox.height < 10
      ? hitbox.height * characterHeight  // fraction
      : hitbox.height,                    // absolute px
    damageMult: hitbox.damageMult,
    knockbackAngle: hitbox.knockbackAngle,
    knockbackScale: hitbox.knockbackScale,
  };
}

/** Get hurtbox zones in world space */
export function getHurtboxes(
  characterX: number,
  characterY: number,
  characterWidth: number,
  characterHeight: number,
  colliderOverrides?: ColliderOverrides,
): { head: WorldHitbox; body: WorldHitbox; legs: WorldHitbox } {
  const hc = DEFAULT_HURTBOX;
  const headScale = colliderOverrides?.headScale ?? 1.0;
  const bodyScale = colliderOverrides?.bodyScale ?? 1.0;
  const legsScale = colliderOverrides?.legsScale ?? 1.0;

  const makeZone = (
    cfg: typeof hc.head,
    scale: number,
  ): WorldHitbox => {
    const w = characterWidth * cfg.xScale * scale;
    const h = characterHeight * cfg.yScale * scale;
    return {
      x: characterX - w / 2,
      y: characterY + cfg.yOffset * characterHeight,
      w,
      h,
      damageMult: 1.0,
      knockbackAngle: "neutral",
      knockbackScale: 1.0,
    };
  };

  return {
    head: makeZone(hc.head, headScale),
    body: makeZone(hc.body, bodyScale),
    legs: makeZone(hc.legs, legsScale),
  };
}

/** Check if a frame is within a hitbox's active range */
export function isFrameActive(hitbox: HitboxDef, frame: number): boolean {
  return frame >= hitbox.activeStartFrame && frame <= hitbox.activeEndFrame;
}

/** Calculate damage with move multiplier */
export function calculateMoveDamage(baseDamage: number, hitbox: HitboxDef): number {
  return Math.round(baseDamage * hitbox.damageMult);
}
