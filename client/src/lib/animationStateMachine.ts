// Animation State Machine — proper FSM for fighting game characters
// Each state defines which states can cancel into it, and at what frame ranges.
// This replaces ad-hoc stateLockUntil checks with structured transition rules.

import type { ActionOverride, KnockbackAngle } from "./charConfig";

// All possible character states
export type FighterState =
  | "idle"
  | "walk"
  | "jump"
  | "fall"
  | "attack"
  | "attack2"
  | "comboQ2"
  | "comboQ3"
  | "dashAttack"
  | "special"
  | "cast"
  | "block"
  | "hurt"
  | "death"
  | "dodge"
  | "rescueRoll";

// Maps FighterState to the AnimationState used by the sprite system
export type SpriteAnimKey = "idle" | "run" | "jump" | "fall" | "attack" | "attack2" | "special" | "takeHit" | "death" | "dodge";

export const STATE_TO_SPRITE: Record<FighterState, SpriteAnimKey> = {
  idle: "idle",
  walk: "run",
  jump: "jump",
  fall: "fall",
  attack: "attack",
  attack2: "attack2",
  comboQ2: "attack",     // reuses attack sprite (can override via ToonAdmin)
  comboQ3: "attack2",    // reuses attack2 sprite (can override via ToonAdmin)
  dashAttack: "attack2",
  special: "special",
  cast: "special",
  block: "idle",         // block uses idle or block sprite if available
  hurt: "takeHit",
  death: "death",
  dodge: "dodge",
  rescueRoll: "dodge",
};

// Which states can be entered from which other states
// "*" means any state can cancel into this
export interface StateTransition {
  from: FighterState[] | "*";
  /** Minimum frame in the source state before this transition is allowed (cancel window) */
  cancelAfterFrame?: number;
  /** If true, the source animation must have finished before transitioning */
  requireAnimComplete?: boolean;
  /** Cost in stamina to enter this state */
  staminaCost?: number;
}

export interface StateDefinition {
  /** How this state maps to sprite animation */
  spriteKey: SpriteAnimKey;
  /** Whether the animation loops */
  loops: boolean;
  /** Lock duration in ms (overridable per character) */
  baseLockMs: number;
  /** Frame range where hitbox is active [start, end] */
  hitboxActiveFrames?: [number, number];
  /** Invulnerable during this state */
  invulnerable?: boolean;
  /** States that can transition INTO this state */
  transitions: StateTransition[];
  /** If true, character can move during this state */
  allowMovement: boolean;
  /** Forward momentum applied per frame (px) */
  forwardMotion?: number;
}

// Default state definitions — these are the base rules
// ToonAdmin overrides can modify hitboxActiveFrames, baseLockMs, forwardMotion per character
export const DEFAULT_STATES: Record<FighterState, StateDefinition> = {
  idle: {
    spriteKey: "idle",
    loops: true,
    baseLockMs: 0,
    transitions: [{ from: "*" }], // anything can go to idle
    allowMovement: true,
  },
  walk: {
    spriteKey: "run",
    loops: true,
    baseLockMs: 0,
    transitions: [{ from: "*" }],
    allowMovement: true,
  },
  jump: {
    spriteKey: "jump",
    loops: false,
    baseLockMs: 0,
    transitions: [
      { from: ["idle", "walk", "fall"] },
      { from: ["jump"], cancelAfterFrame: 0 }, // double jump
    ],
    allowMovement: true,
  },
  fall: {
    spriteKey: "fall",
    loops: false,
    baseLockMs: 0,
    transitions: [{ from: ["jump", "idle", "walk", "attack", "attack2", "special", "dodge", "rescueRoll"] }],
    allowMovement: true,
  },
  attack: {
    spriteKey: "attack",
    loops: false,
    baseLockMs: 330,
    hitboxActiveFrames: [4, 6],
    transitions: [
      { from: ["idle", "walk", "jump", "fall"] },
      // Can cancel into attack from block after parry window
      { from: ["block"], cancelAfterFrame: 2 },
    ],
    allowMovement: false,
    forwardMotion: 0,
  },
  attack2: {
    spriteKey: "attack2",
    loops: false,
    baseLockMs: 330,
    hitboxActiveFrames: [4, 7],
    transitions: [
      { from: ["idle", "walk", "jump", "fall"] },
      { from: ["block"], cancelAfterFrame: 2 },
    ],
    allowMovement: false,
    forwardMotion: 0,
  },
  comboQ2: {
    spriteKey: "attack",
    loops: false,
    baseLockMs: 300,
    hitboxActiveFrames: [3, 6],
    transitions: [
      // Can only chain from attack within the combo window
      { from: ["attack"], cancelAfterFrame: 4 },
    ],
    allowMovement: false,
    forwardMotion: 2,
  },
  comboQ3: {
    spriteKey: "attack2",
    loops: false,
    baseLockMs: 400,
    hitboxActiveFrames: [3, 8],
    transitions: [
      { from: ["comboQ2"], cancelAfterFrame: 3 },
    ],
    allowMovement: false,
    forwardMotion: 4,
  },
  dashAttack: {
    spriteKey: "attack2",
    loops: false,
    baseLockMs: 350,
    hitboxActiveFrames: [2, 5],
    transitions: [
      { from: ["idle", "walk", "jump", "fall"], staminaCost: 3 },
    ],
    allowMovement: false,
    forwardMotion: 0, // handled by dash velocity
  },
  special: {
    spriteKey: "special",
    loops: false,
    baseLockMs: 340,
    hitboxActiveFrames: [4, 8],
    transitions: [
      { from: ["idle", "walk", "jump", "fall"], staminaCost: 2 },
    ],
    allowMovement: false,
  },
  cast: {
    spriteKey: "special",
    loops: false,
    baseLockMs: 300,
    transitions: [
      { from: ["idle", "walk"], staminaCost: 1 },
    ],
    allowMovement: false,
  },
  block: {
    spriteKey: "idle",
    loops: false,
    baseLockMs: 400,
    transitions: [
      { from: ["idle", "walk"] },
    ],
    allowMovement: false,
  },
  hurt: {
    spriteKey: "takeHit",
    loops: false,
    baseLockMs: 200, // hitstun overrides this
    transitions: [
      { from: "*" }, // anything can be interrupted by taking damage
    ],
    allowMovement: false,
  },
  death: {
    spriteKey: "death",
    loops: false,
    baseLockMs: 1000,
    transitions: [
      { from: "*" }, // death overrides everything
    ],
    allowMovement: false,
  },
  dodge: {
    spriteKey: "dodge",
    loops: false,
    baseLockMs: 340,
    invulnerable: true,
    transitions: [
      { from: ["idle", "walk", "jump", "fall"] },
    ],
    allowMovement: false,
  },
  rescueRoll: {
    spriteKey: "dodge",
    loops: false,
    baseLockMs: 460,
    invulnerable: true,
    transitions: [
      { from: ["idle", "walk", "jump", "fall"] },
    ],
    allowMovement: false,
  },
};

/** Check if a transition from sourceState to targetState is allowed */
export function canTransition(
  sourceState: FighterState,
  targetState: FighterState,
  sourceFrame: number,
  sourceAnimComplete: boolean,
  currentStamina: number,
): boolean {
  const targetDef = DEFAULT_STATES[targetState];
  if (!targetDef) return false;

  for (const t of targetDef.transitions) {
    // Check if source state is allowed
    const fromMatch = t.from === "*" || t.from.includes(sourceState);
    if (!fromMatch) continue;

    // Check cancel frame requirement
    if (t.cancelAfterFrame !== undefined && sourceFrame < t.cancelAfterFrame) continue;

    // Check animation completion requirement
    if (t.requireAnimComplete && !sourceAnimComplete) continue;

    // Check stamina
    if (t.staminaCost !== undefined && currentStamina < t.staminaCost) continue;

    return true;
  }

  return false;
}

/** Get the state definition, optionally modified by ToonAdmin overrides */
export function getStateDef(
  state: FighterState,
  actionOverride?: ActionOverride,
): StateDefinition {
  const base = { ...DEFAULT_STATES[state] };

  if (actionOverride) {
    // Override hit frame range
    if (actionOverride.hitFrame !== undefined) {
      const start = actionOverride.hitFrame;
      const end = actionOverride.activeFrameEnd ?? start + 2;
      base.hitboxActiveFrames = [start, end];
    }

    // Override forward motion
    if (actionOverride.forwardMotion !== undefined) {
      base.forwardMotion = actionOverride.forwardMotion;
    }

    // Override lock duration based on hold and frames
    if (actionOverride.hold && actionOverride.frames) {
      base.baseLockMs = Math.round(actionOverride.hold * actionOverride.frames * (1000 / 60));
    }
  }

  return base;
}

/** Check if a hitbox is active on the given frame for a state */
export function isHitboxActive(
  state: FighterState,
  frame: number,
  actionOverride?: ActionOverride,
): boolean {
  const def = getStateDef(state, actionOverride);
  if (!def.hitboxActiveFrames) return false;
  const [start, end] = def.hitboxActiveFrames;
  return frame >= start && frame <= end;
}
