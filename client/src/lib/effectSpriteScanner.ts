export interface ScannedEffectSprite {
  id: string;
  name: string;
  path: string;
  type: "impact" | "projectile" | "status";
  columns: number;
  rows: number;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  totalWidth: number;
  totalHeight: number;
  frameDuration: number;
  loop: boolean;
  color?: string;
}

// Frame reading order: top-left → top-right (row 1), then bottom-left → bottom-right (row 2)
// Example for 4x2 grid (8 frames):
//   [0] [1] [2] [3]   ← top row (frames 0-3)
//   [4] [5] [6] [7]   ← bottom row (frames 4-7)

export const SCANNED_IMPACT_EFFECTS: ScannedEffectSprite[] = [
  {
    id: "arcanebolt",
    name: "Arcane Bolt",
    path: "/attached_assets/arcanebolt_1768553615895.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 80,
    loop: false,
    color: "#9370db",
  },
  {
    id: "arcanelighting",
    name: "Arcane Lightning",
    path: "/attached_assets/arcanelighting_1768553615895.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 60,
    loop: false,
    color: "#ffff00",
  },
  {
    id: "arcanemist",
    name: "Arcane Mist",
    path: "/attached_assets/arcanemist_1768553615896.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 100,
    loop: false,
    color: "#9370db",
  },
  {
    id: "arcaneslash",
    name: "Arcane Slash",
    path: "/attached_assets/arcaneslash_1768553615896.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 60,
    loop: false,
    color: "#00ffff",
  },
  {
    id: "crit",
    name: "Critical Hit",
    path: "/attached_assets/crit_1768553615896.png",
    type: "impact",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameWidth: 384,
    frameHeight: 394,
    totalWidth: 1536,
    totalHeight: 394,
    frameDuration: 40,
    loop: false,
    color: "#ff4444",
  },
  {
    id: "extraoverlay",
    name: "Weapon Slash",
    path: "/attached_assets/extraoverlay_1768553615897.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 60,
    loop: false,
    color: "#00ffff",
  },
  {
    id: "flamestrike",
    name: "Flame Strike",
    path: "/attached_assets/flamestrike_1768553615897.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 80,
    loop: false,
    color: "#ff4500",
  },
  {
    id: "frostbolt",
    name: "Frost Bolt",
    path: "/attached_assets/frostbolt_1768553615898.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 80,
    loop: false,
    color: "#00bfff",
  },
  {
    id: "frozen",
    name: "Frozen Status",
    path: "/attached_assets/frozen_1768553615898.png",
    type: "status",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 120,
    loop: true,
    color: "#87ceeb",
  },
  {
    id: "healingregen",
    name: "Healing Regen",
    path: "/attached_assets/healingregen_1768553615898.png",
    type: "impact",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 512,
    frameDuration: 150,
    loop: false,
    color: "#32cd32",
  },
  {
    id: "healingwave",
    name: "Healing Wave",
    path: "/attached_assets/healingwave_1768553615899.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 100,
    loop: false,
    color: "#ffd700",
  },
  {
    id: "hit",
    name: "Physical Hit",
    path: "/attached_assets/hit_1768553615899.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 50,
    loop: false,
    color: "#ff6347",
  },
  {
    id: "holyheal",
    name: "Holy Heal",
    path: "/attached_assets/holyheal_1768553615899.png",
    type: "impact",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 512,
    frameDuration: 120,
    loop: false,
    color: "#ffd700",
  },
  {
    id: "holylight",
    name: "Holy Light",
    path: "/attached_assets/holylight_1768553615900.png",
    type: "impact",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameWidth: 384,
    frameHeight: 512,
    totalWidth: 1536,
    totalHeight: 1024,
    frameDuration: 80,
    loop: false,
    color: "#ffd700",
  },
];

export const SCANNED_PROJECTILE_EFFECTS: ScannedEffectSprite[] = [
  {
    id: "wizard_projectile_1",
    name: "Arcane Star",
    path: "/sprites/characters/Wizard/Magic(projectile)/Wizard-Attack01_Effect.png",
    type: "projectile",
    columns: 10,
    rows: 1,
    frameCount: 10,
    frameWidth: 100,
    frameHeight: 100,
    totalWidth: 1000,
    totalHeight: 100,
    frameDuration: 60,
    loop: true,
    color: "#9370db",
  },
  {
    id: "wizard_projectile_2",
    name: "Fireball",
    path: "/sprites/characters/Wizard/Magic(projectile)/Wizard-Attack02_Effect.png",
    type: "projectile",
    columns: 7,
    rows: 1,
    frameCount: 7,
    frameWidth: 100,
    frameHeight: 100,
    totalWidth: 700,
    totalHeight: 100,
    frameDuration: 60,
    loop: true,
    color: "#ff4500",
  },
  {
    id: "arrow",
    name: "Arrow",
    path: "/sprites/characters/Archer/Arrow(projectile)/Arrow02(100x100).png",
    type: "projectile",
    columns: 1,
    rows: 1,
    frameCount: 1,
    frameWidth: 100,
    frameHeight: 100,
    totalWidth: 100,
    totalHeight: 100,
    frameDuration: 500,
    loop: false,
    color: "#8b4513",
  },
];

export interface CharacterAttackEffect {
  characterId: string;
  characterName: string;
  attackId: string;
  attackName: string;
  effectPath: string;
  columns: number;
  rows: number;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
}

export const CHARACTER_ATTACK_EFFECTS: CharacterAttackEffect[] = [
  { characterId: "archer", characterName: "Archer", attackId: "attack01", attackName: "Arrow Shot", effectPath: "/sprites/characters/Archer/Archer(Split Effects)/Archer-Attack01_Effect.png", columns: 8, rows: 1, frameCount: 8, frameWidth: 100, frameHeight: 100 },
  { characterId: "archer", characterName: "Archer", attackId: "attack02", attackName: "Power Shot", effectPath: "/sprites/characters/Archer/Archer(Split Effects)/Archer-Attack02_Effect.png", columns: 8, rows: 1, frameCount: 8, frameWidth: 100, frameHeight: 100 },
  { characterId: "armored_axeman", characterName: "Armored Axeman", attackId: "attack01", attackName: "Axe Swing", effectPath: "/sprites/characters/Armored Axeman/Armored Axeman(Split Effects)/Armored Axeman-Attack01_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
  { characterId: "armored_axeman", characterName: "Armored Axeman", attackId: "attack02", attackName: "Heavy Chop", effectPath: "/sprites/characters/Armored Axeman/Armored Axeman(Split Effects)/Armored Axeman-Attack02_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
  { characterId: "armored_axeman", characterName: "Armored Axeman", attackId: "attack03", attackName: "Overhead Slam", effectPath: "/sprites/characters/Armored Axeman/Armored Axeman(Split Effects)/Armored Axeman-Attack03_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
  { characterId: "wizard", characterName: "Wizard", attackId: "attack01", attackName: "Arcane Bolt", effectPath: "/sprites/characters/Wizard/Wizard(Split Effects)/Wizard-Attack01_Effect.png", columns: 10, rows: 1, frameCount: 10, frameWidth: 100, frameHeight: 100 },
  { characterId: "wizard", characterName: "Wizard", attackId: "attack02", attackName: "Fireball", effectPath: "/sprites/characters/Wizard/Wizard(Split Effects)/Wizard-Attack02_Effect.png", columns: 7, rows: 1, frameCount: 7, frameWidth: 100, frameHeight: 100 },
  { characterId: "knight", characterName: "Knight", attackId: "attack01", attackName: "Sword Slash", effectPath: "/sprites/characters/Knight/Knight(Split Effects)/Knight-Attack01_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
  { characterId: "knight", characterName: "Knight", attackId: "attack02", attackName: "Shield Bash", effectPath: "/sprites/characters/Knight/Knight(Split Effects)/Knight-Attack02_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
  { characterId: "knight", characterName: "Knight", attackId: "attack03", attackName: "Heavy Strike", effectPath: "/sprites/characters/Knight/Knight(Split Effects)/Knight-Attack03_Effect.png", columns: 6, rows: 1, frameCount: 6, frameWidth: 100, frameHeight: 100 },
];

export function getAllEffects(): ScannedEffectSprite[] {
  return [...SCANNED_IMPACT_EFFECTS, ...SCANNED_PROJECTILE_EFFECTS];
}

export function getEffectById(id: string): ScannedEffectSprite | undefined {
  return getAllEffects().find(e => e.id === id);
}

export function getEffectsByType(type: "impact" | "projectile" | "status"): ScannedEffectSprite[] {
  return getAllEffects().filter(e => e.type === type);
}

export function getCharacterEffects(characterId: string): CharacterAttackEffect[] {
  return CHARACTER_ATTACK_EFFECTS.filter(e => e.characterId === characterId);
}
