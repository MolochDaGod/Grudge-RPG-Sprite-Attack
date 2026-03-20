// Character configuration overrides — shared between ToonAdmin and the fighter game
// Stored in localStorage so edits persist across sessions and deployments

const STORAGE_KEY = "grudge-char-overrides";

// Game action slots that can be remapped to different animation files
export const ACTION_SLOTS = [
  { key: "idle", label: "Idle", required: true },
  { key: "walk", label: "Walk / Run", required: true },
  { key: "attack", label: "Q — Melee Attack", required: true },
  { key: "attack2", label: "E — Melee Attack 2", required: false },
  { key: "hurt", label: "Take Hit", required: true },
  { key: "death", label: "Death", required: true },
  { key: "block", label: "RMB — Block / Parry", required: false },
  { key: "jump", label: "Jump", required: false },
  { key: "cast", label: "Cast / Heal", required: false },
  { key: "special", label: "Special", required: false },
  { key: "roll", label: "Roll / Dodge", required: false },
] as const;

export type ActionSlotKey = typeof ACTION_SLOTS[number]["key"];

// Override for a single action: which animation file + frame count + hold speed
export interface ActionOverride {
  file: string;      // e.g. "attack2.png"
  frames: number;    // frame count
  hold: number;      // ticks per frame (lower = faster)
  loop: boolean;     // loop or play once
}

// Full override config for a character
export interface CharOverrides {
  actions: Partial<Record<ActionSlotKey, ActionOverride>>;
  stats?: {
    atk?: number;
    spd?: number;
    superDmg?: number;
  };
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

export function getCharOverrides(charId: string): CharOverrides | null {
  const all = loadOverrides();
  return all[charId] ?? null;
}

export function setCharOverrides(charId: string, overrides: CharOverrides): void {
  const all = loadOverrides();
  all[charId] = overrides;
  saveOverrides(all);
}

export function deleteCharOverrides(charId: string): void {
  const all = loadOverrides();
  delete all[charId];
  saveOverrides(all);
}

export function exportAllOverrides(): string {
  return JSON.stringify(loadOverrides(), null, 2);
}

export function importOverrides(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      saveOverrides(parsed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
