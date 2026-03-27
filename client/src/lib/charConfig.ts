// Character configuration overrides — shared between ToonAdmin and the fighter game
// Saves to server first, falls back to localStorage when offline

const STORAGE_KEY = "grudge-char-overrides";
const API_BASE = "/api/char-config";

// Game action slots that can be remapped to different animation files
export const ACTION_SLOTS = [
  // Core movement
  { key: "idle", label: "Idle", required: true, group: "movement" },
  { key: "walk", label: "Walk / Run", required: true, group: "movement" },
  { key: "jump", label: "Jump", required: false, group: "movement" },
  { key: "fall", label: "Fall", required: false, group: "movement" },
  { key: "roll", label: "Roll / Dodge (AA/DD)", required: false, group: "movement" },
  // Melee attacks
  { key: "attack", label: "Q -- Melee 1", required: true, group: "melee" },
  { key: "attack2", label: "E -- Melee 2", required: false, group: "melee" },
  { key: "comboQ2", label: "QQ -- Combo Hit 2", required: false, group: "melee" },
  { key: "comboQ3", label: "QQQ -- Combo Finisher", required: false, group: "melee" },
  { key: "dashAttack", label: "LMB -- Dash Attack", required: false, group: "melee" },
  // Specials
  { key: "special", label: "Up/Down Special", required: false, group: "special" },
  { key: "cast", label: "Cast / Heal", required: false, group: "special" },
  { key: "rescueRoll", label: "Rescue Roll (Space+Space / W+LMB)", required: false, group: "special" },
  // Defense
  { key: "block", label: "RMB -- Block Pose", required: false, group: "defense" },
  { key: "hurt", label: "Take Hit", required: true, group: "defense" },
  { key: "death", label: "Death", required: true, group: "defense" },
] as const;

export type ActionSlotKey = typeof ACTION_SLOTS[number]["key"];

// Override for a single action: which animation file + frame count + hold speed
export interface ActionOverride {
  file: string;        // e.g. "attack2.png"
  frames: number;      // frame count
  hold: number;        // ticks per frame (lower = faster)
  loop: boolean;       // loop or play once
  hitVfx?: string;     // VFX ID to play on hit impact
  swingVfx?: string;   // VFX ID to play during attack swing
  // Hit detection timing
  hitFrame?: number;         // frame index when damage starts (default 4)
  activeFrameEnd?: number;   // last active damage frame (default hitFrame + 2)
  // Damage / knockback tuning per move
  damageMult?: number;       // multiplier on base ATK for this move (default 1.0)
  knockbackAngle?: KnockbackAngle; // launch direction override
  // Advanced maneuver options
  forwardMotion?: number;   // px to push character forward per play (combo QQQ momentum)
  freezeFrame?: number;     // frame index to freeze on (block-pose: hold mid-attack frame)
  reverseOnEnd?: boolean;   // play animation backwards after freeze (block release)
  comboWindow?: number;     // ms window to chain into next combo hit
}

export type KnockbackAngle = "neutral" | "up" | "down" | "spike" | "forward";

// Per-character collision shape overrides
export interface ColliderOverrides {
  widthMult?: number;    // multiplier on base collision width (default 1.0)
  heightMult?: number;   // multiplier on base collision height (default 1.0)
  headScale?: number;    // scale factor for head hitzone (default 1.0)
  bodyScale?: number;    // scale factor for body hitzone (default 1.0)
  legsScale?: number;    // scale factor for legs hitzone (default 1.0)
  weaponReach?: number;  // override weapon hitbox reach in px
}

// Full override config for a character
export interface CharOverrides {
  actions: Partial<Record<ActionSlotKey, ActionOverride>>;
  stats?: {
    atk?: number;
    spd?: number;
    superDmg?: number;
    hp?: number;
    jumpForce?: number;
  };
  collider?: ColliderOverrides;
  projectile?: string;
  effectSrc?: string;
  effectFrames?: number;
}

// All overrides keyed by character ID
export type AllOverrides = Record<string, CharOverrides>;

export function loadOverrides(): AllOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: AllOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/** Load overrides from server, merge with local, return combined */
export async function loadOverridesFromServer(): Promise<AllOverrides> {
  try {
    const res = await fetch(API_BASE);
    if (res.ok) {
      const server = await res.json();
      // Merge: server takes priority, local fills gaps
      const local = loadOverrides();
      const merged = { ...local, ...server };
      saveOverrides(merged);
      return merged;
    }
  } catch {}
  return loadOverrides();
}

/** Save overrides to server + localStorage */
export async function saveOverridesToServer(overrides: AllOverrides): Promise<boolean> {
  saveOverrides(overrides);
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overrides),
    });
    return res.ok;
  } catch {
    return false; // saved locally, server unavailable
  }
}

export function getCharOverrides(charId: string): CharOverrides | null {
  const all = loadOverrides();
  return all[charId] ?? null;
}

export function setCharOverrides(charId: string, overrides: CharOverrides): void {
  const all = loadOverrides();
  all[charId] = overrides;
  saveOverrides(all);
  // Fire-and-forget server sync
  fetch(`${API_BASE}/${charId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides),
  }).catch(() => {});
}

export function deleteCharOverrides(charId: string): void {
  const all = loadOverrides();
  delete all[charId];
  saveOverrides(all);
  fetch(`${API_BASE}/${charId}`, { method: "DELETE" }).catch(() => {});
}

export function exportAllOverrides(): string {
  return JSON.stringify(loadOverrides(), null, 2);
}

export function importOverrides(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      saveOverrides(parsed);
      // Sync to server
      saveOverridesToServer(parsed).catch(() => {});
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
