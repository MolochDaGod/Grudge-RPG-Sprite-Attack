// Game sound system — Howler.js with pooled instances for zero-lag playback
// Uses royalty-free sounds from Pixabay (CC0) served from public/fighter2d/sfx/
import { Howl, Howler } from "howler";

// Master volume (0-1)
Howler.volume(0.6);

type SoundId =
  | "hit_light"
  | "hit_heavy"
  | "hit_head"
  | "swoosh_light"
  | "swoosh_heavy"
  | "block"
  | "parry"
  | "dodge"
  | "jump"
  | "land"
  | "projectile_fire"
  | "projectile_hit"
  | "super_charge"
  | "super_impact"
  | "ko"
  | "bounce"
  | "rescue_roll"
  | "stock_lost"
  | "menu_select"
  | "fight_start";

interface SoundDef {
  src: string[];
  volume?: number;
  rate?: number;       // playback speed (1.0 = normal)
  rateRange?: number;  // random pitch variance (+/- this amount)
  pool?: number;       // how many concurrent instances (default 3)
}

// All sounds served from /fighter2d/sfx/ — small MP3 files (<50KB each)
const SOUND_DEFS: Record<SoundId, SoundDef> = {
  hit_light:       { src: ["/fighter2d/sfx/hit_light.mp3"],      volume: 0.5, rate: 1.0, rateRange: 0.15, pool: 4 },
  hit_heavy:       { src: ["/fighter2d/sfx/hit_heavy.mp3"],      volume: 0.6, rate: 0.9, rateRange: 0.1,  pool: 3 },
  hit_head:        { src: ["/fighter2d/sfx/hit_heavy.mp3"],      volume: 0.7, rate: 0.75, rateRange: 0.05 },
  swoosh_light:    { src: ["/fighter2d/sfx/swoosh_light.mp3"],   volume: 0.3, rate: 1.1, rateRange: 0.2,  pool: 4 },
  swoosh_heavy:    { src: ["/fighter2d/sfx/swoosh_heavy.mp3"],   volume: 0.4, rate: 0.95, rateRange: 0.15 },
  block:           { src: ["/fighter2d/sfx/block.mp3"],          volume: 0.5, rate: 1.0 },
  parry:           { src: ["/fighter2d/sfx/parry.mp3"],          volume: 0.65, rate: 1.0 },
  dodge:           { src: ["/fighter2d/sfx/dodge.mp3"],          volume: 0.3, rate: 1.2, rateRange: 0.1 },
  jump:            { src: ["/fighter2d/sfx/jump.mp3"],           volume: 0.25, rate: 1.0, rateRange: 0.1, pool: 2 },
  land:            { src: ["/fighter2d/sfx/land.mp3"],           volume: 0.2, rate: 1.0 },
  projectile_fire: { src: ["/fighter2d/sfx/projectile_fire.mp3"],volume: 0.4, rate: 1.0, rateRange: 0.15 },
  projectile_hit:  { src: ["/fighter2d/sfx/projectile_hit.mp3"], volume: 0.5, rate: 1.0 },
  super_charge:    { src: ["/fighter2d/sfx/super_charge.mp3"],   volume: 0.7, rate: 1.0 },
  super_impact:    { src: ["/fighter2d/sfx/super_impact.mp3"],   volume: 0.8, rate: 1.0 },
  ko:              { src: ["/fighter2d/sfx/ko.mp3"],             volume: 0.7, rate: 1.0 },
  bounce:          { src: ["/fighter2d/sfx/bounce.mp3"],         volume: 0.35, rate: 1.0, rateRange: 0.2 },
  rescue_roll:     { src: ["/fighter2d/sfx/dodge.mp3"],          volume: 0.4, rate: 0.85 },
  stock_lost:      { src: ["/fighter2d/sfx/ko.mp3"],             volume: 0.6, rate: 0.8 },
  menu_select:     { src: ["/fighter2d/sfx/menu_select.mp3"],    volume: 0.4, rate: 1.0 },
  fight_start:     { src: ["/fighter2d/sfx/fight_start.mp3"],    volume: 0.6, rate: 1.0 },
};

// Lazy-loaded Howl instances — created on first play
const howlCache = new Map<SoundId, Howl>();

function getHowl(id: SoundId): Howl {
  let howl = howlCache.get(id);
  if (howl) return howl;

  const def = SOUND_DEFS[id];
  howl = new Howl({
    src: def.src,
    volume: def.volume ?? 0.5,
    rate: def.rate ?? 1.0,
    pool: def.pool ?? 3,
    preload: false, // load on first play
  });
  howlCache.set(id, howl);
  return howl;
}

/** Play a game sound with optional pitch randomization for variety */
export function playSound(id: SoundId): void {
  const def = SOUND_DEFS[id];
  const howl = getHowl(id);

  // Load on first use (non-blocking)
  if (howl.state() === "unloaded") {
    howl.load();
  }

  const playId = howl.play();

  // Random pitch variation to avoid repetitive sounds
  if (def.rateRange && def.rateRange > 0) {
    const baseRate = def.rate ?? 1.0;
    const variance = (Math.random() - 0.5) * 2 * def.rateRange;
    howl.rate(baseRate + variance, playId);
  }
}

/** Preload all combat sounds so first hit isn't silent */
export function preloadSounds(): void {
  const priority: SoundId[] = [
    "hit_light", "hit_heavy", "swoosh_light", "swoosh_heavy",
    "jump", "dodge", "block", "projectile_fire",
  ];
  for (const id of priority) {
    getHowl(id).load();
  }
}

/** Set master volume (0-1) */
export function setMasterVolume(vol: number): void {
  Howler.volume(Math.max(0, Math.min(1, vol)));
}
