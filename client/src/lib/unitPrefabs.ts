import type { Race, UnitClass, Faction } from "@shared/schema";
import { RACE_TINTS, getRaceFaction } from "./raceTinting";
import { effectSprites, type EffectSpriteConfig } from "./effectSprites";
import { SPRITE_CHARACTERS, getCharacterById, type CharacterSprite } from "./spriteManifest";

export interface WeaponEffect {
  projectileSprite?: string;
  impactSprite: string;
  travelSpeed?: number;
  soundEffect?: string;
}

export interface UnitPrefab {
  id: string;
  race: Race;
  unitClass: UnitClass;
  faction: Faction;
  displayName: string;
  
  characterSpriteId: string | null;
  
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    movement: number;
    attackRange: number;
  };
  
  weaponEffect: WeaponEffect;
  
  scalingPerLevel: {
    hp: number;
    attack: number;
    defense: number;
  };
  
  description: string;
}

const CLASS_BASE_STATS: Record<UnitClass, {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  movement: number;
  attackRange: number;
}> = {
  warrior: { hp: 120, attack: 28, defense: 22, speed: 12, movement: 3, attackRange: 1 },
  ranger: { hp: 80, attack: 25, defense: 12, speed: 16, movement: 4, attackRange: 4 },
  mage: { hp: 70, attack: 35, defense: 10, speed: 14, movement: 3, attackRange: 3 },
  worge: { hp: 100, attack: 20, defense: 18, speed: 14, movement: 3, attackRange: 2 },
};

const RACE_STAT_MODIFIERS: Record<Race, {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}> = {
  human: { hp: 1.0, attack: 1.0, defense: 1.0, speed: 1.0 },
  barbarian: { hp: 1.1, attack: 1.15, defense: 0.9, speed: 1.0 },
  dwarf: { hp: 1.15, attack: 0.95, defense: 1.2, speed: 0.85 },
  elf: { hp: 0.9, attack: 1.0, defense: 0.85, speed: 1.2 },
  orc: { hp: 1.2, attack: 1.2, defense: 1.0, speed: 0.9 },
  undead: { hp: 1.0, attack: 1.05, defense: 1.1, speed: 0.95 },
};

const CLASS_WEAPON_EFFECTS: Record<UnitClass, WeaponEffect> = {
  warrior: {
    impactSprite: "hit",
  },
  ranger: {
    projectileSprite: "arrow",
    impactSprite: "hit",
    travelSpeed: 400,
  },
  mage: {
    projectileSprite: "wizardprojectile1",
    impactSprite: "arcanebolt",
    travelSpeed: 300,
  },
  worge: {
    projectileSprite: "priestprojectile",
    impactSprite: "holyheal",
    travelSpeed: 250,
  },
};

const CLASS_DISPLAY_NAMES: Record<UnitClass, string> = {
  warrior: "Warrior",
  mage: "Mage",
  ranger: "Archer",
  worge: "Priest",
};

const RACE_DISPLAY_NAMES: Record<Race, string> = {
  human: "Human",
  barbarian: "Barbarian",
  dwarf: "Dwarf",
  elf: "Elf",
  orc: "Orc",
  undead: "Undead",
};

function createPrefabId(race: Race, unitClass: UnitClass): string {
  return `${race}_${unitClass}`;
}

function calculateBaseStats(race: Race, unitClass: UnitClass): UnitPrefab["baseStats"] {
  const classStats = CLASS_BASE_STATS[unitClass];
  const raceModifiers = RACE_STAT_MODIFIERS[race];
  
  return {
    hp: Math.floor(classStats.hp * raceModifiers.hp),
    attack: Math.floor(classStats.attack * raceModifiers.attack),
    defense: Math.floor(classStats.defense * raceModifiers.defense),
    speed: Math.floor(classStats.speed * raceModifiers.speed),
    movement: classStats.movement,
    attackRange: classStats.attackRange,
  };
}

function createUnitPrefab(race: Race, unitClass: UnitClass): UnitPrefab {
  const faction = getRaceFaction(race) as Faction;
  const displayName = `${RACE_DISPLAY_NAMES[race]} (${CLASS_DISPLAY_NAMES[unitClass]})`;
  const baseStats = calculateBaseStats(race, unitClass);
  
  return {
    id: createPrefabId(race, unitClass),
    race,
    unitClass,
    faction,
    displayName,
    
    characterSpriteId: null,
    
    baseStats,
    
    weaponEffect: { ...CLASS_WEAPON_EFFECTS[unitClass] },
    
    scalingPerLevel: {
      hp: Math.floor(baseStats.hp * 0.1),
      attack: Math.floor(baseStats.attack * 0.1),
      defense: Math.floor(baseStats.defense * 0.1),
    },
    
    description: `A ${race} ${CLASS_DISPLAY_NAMES[unitClass].toLowerCase()} of the ${faction} faction.`,
  };
}

export const UNIT_PREFABS: Record<string, UnitPrefab> = {};

const RACES: Race[] = ["human", "barbarian", "dwarf", "elf", "orc", "undead"];
const CLASSES: UnitClass[] = ["warrior", "mage", "ranger", "worge"];

RACES.forEach(race => {
  CLASSES.forEach(unitClass => {
    const prefab = createUnitPrefab(race, unitClass);
    UNIT_PREFABS[prefab.id] = prefab;
  });
});

export function getUnitPrefab(race: Race, unitClass: UnitClass): UnitPrefab | null {
  const id = createPrefabId(race, unitClass);
  return UNIT_PREFABS[id] || null;
}

export function getPrefabById(id: string): UnitPrefab | null {
  return UNIT_PREFABS[id] || null;
}

export function getAllPrefabs(): UnitPrefab[] {
  return Object.values(UNIT_PREFABS);
}

export function getPrefabsByRace(race: Race): UnitPrefab[] {
  return getAllPrefabs().filter(p => p.race === race);
}

export function getPrefabsByClass(unitClass: UnitClass): UnitPrefab[] {
  return getAllPrefabs().filter(p => p.unitClass === unitClass);
}

export function getPrefabsByFaction(faction: Faction): UnitPrefab[] {
  return getAllPrefabs().filter(p => p.faction === faction);
}

export function getStatsAtLevel(prefab: UnitPrefab, level: number): UnitPrefab["baseStats"] {
  const levelBonus = level - 1;
  return {
    hp: prefab.baseStats.hp + (prefab.scalingPerLevel.hp * levelBonus),
    attack: prefab.baseStats.attack + (prefab.scalingPerLevel.attack * levelBonus),
    defense: prefab.baseStats.defense + (prefab.scalingPerLevel.defense * levelBonus),
    speed: prefab.baseStats.speed,
    movement: prefab.baseStats.movement,
    attackRange: prefab.baseStats.attackRange,
  };
}

export function getWeaponProjectileSprite(prefab: UnitPrefab): EffectSpriteConfig | null {
  if (!prefab.weaponEffect.projectileSprite) return null;
  return effectSprites[prefab.weaponEffect.projectileSprite] || null;
}

export function getWeaponImpactSprite(prefab: UnitPrefab): EffectSpriteConfig | null {
  return effectSprites[prefab.weaponEffect.impactSprite] || null;
}

export function updatePrefabCharacterSprite(
  prefabId: string, 
  characterSpriteId: string
): void {
  const prefab = UNIT_PREFABS[prefabId];
  if (prefab) {
    prefab.characterSpriteId = characterSpriteId;
  }
}

export function getPrefabCharacterSprite(prefab: UnitPrefab): CharacterSprite | null {
  if (!prefab.characterSpriteId) return null;
  return getCharacterById(prefab.characterSpriteId) || null;
}

export function getAvailableCharacterSprites(): CharacterSprite[] {
  return SPRITE_CHARACTERS;
}

export function updatePrefabWeaponEffect(
  prefabId: string,
  weaponEffect: Partial<WeaponEffect>
): void {
  const prefab = UNIT_PREFABS[prefabId];
  if (prefab) {
    prefab.weaponEffect = { ...prefab.weaponEffect, ...weaponEffect };
  }
}

export function updatePrefabStats(
  prefabId: string,
  stats: Partial<UnitPrefab["baseStats"]>
): void {
  const prefab = UNIT_PREFABS[prefabId];
  if (prefab) {
    prefab.baseStats = { ...prefab.baseStats, ...stats };
  }
}

export { RACES, CLASSES, CLASS_DISPLAY_NAMES, RACE_DISPLAY_NAMES };
