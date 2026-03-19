import type { Unit, Ability, LoreEntry, Tile, BattleMap, UnitClass, Faction, Race, CharacterEquipment, SpriteConfig } from "@shared/schema";
import { generateEquipment, getCharacterSprite } from "./spriteData";
import { getUnitDisplayName, getRaceFaction, getAllRaces, getAllClasses } from "./raceTinting";
import { generateTacticalHeightMap, type HeightMapTile } from "./heightMapGenerator";

// Skill tree tiers by class - abilities unlock at levels 0, 1, 5, 10, 15, 20
// Distribution: 1@Level 0, 2@Level 1, 2@Level 5, 3@Level 10, 2@Level 15, 2@Level 20
export interface SkillTier {
  level: number;
  name: string;
  skills: Ability[];
}

export const classSkillTrees: Record<UnitClass, SkillTier[]> = {
  worge: [
    { level: 0, name: "Primal Shift", skills: [
      { id: "bear_form", name: "Bear Form", description: "Transform into WorgBear: massive HP/Defense, threat generation, damage reduction", type: "buff", range: 0, cooldown: 10, currentCooldown: 0, manaCost: 30 },
    ]},
    { level: 1, name: "Pack Instincts", skills: [
      { id: "howl", name: "Howl", description: "AoE fear and enemy debuff", type: "debuff", range: 3, cooldown: 4, currentCooldown: 0, manaCost: 15 },
      { id: "pack_hunt", name: "Pack Hunt", description: "Damage bonus while near allies", type: "buff", range: 2, cooldown: 5, currentCooldown: 0, manaCost: 10 },
    ]},
    { level: 5, name: "Primal Mastery", skills: [
      { id: "feral_rage", name: "Feral Rage", description: "Attack speed and damage boost", type: "buff", range: 0, cooldown: 6, currentCooldown: 0, manaCost: 20 },
      { id: "alpha_call", name: "Alpha Call", description: "Summon temporary wolf allies", type: "buff", range: 0, cooldown: 8, currentCooldown: 0, manaCost: 35 },
    ]},
    { level: 10, name: "Advanced Forms", skills: [
      { id: "alpha_bear", name: "Alpha Bear", description: "AoE taunt + tanking buffs while in Bear form", type: "buff", range: 3, cooldown: 5, currentCooldown: 0, manaCost: 25 },
      { id: "raptor_form", name: "Raptor Form", description: "Stealth DPS form focused on critical strikes", type: "buff", range: 0, cooldown: 10, currentCooldown: 0, manaCost: 30 },
      { id: "blood_frenzy", name: "Blood Frenzy", description: "Damage increases as health decreases", type: "buff", range: 0, cooldown: 8, currentCooldown: 0, manaCost: 20 },
    ]},
    { level: 15, name: "Apex Predator", skills: [
      { id: "apex_predator", name: "Apex Predator", description: "Enhanced tracking and bonus damage vs wounded", type: "attack", damage: 40, range: 1, cooldown: 3, currentCooldown: 0, manaCost: 15 },
      { id: "primal_fury", name: "Primal Fury", description: "Temporary massive stat boost that drains health over time", type: "buff", range: 0, cooldown: 12, currentCooldown: 0, manaCost: 40 },
    ]},
    { level: 20, name: "Legendary Choices", skills: [
      { id: "worg_lord", name: "Worg Lord", description: "Ultimate tank: massive defenses, pack summoning, battlefield control", type: "buff", range: 0, cooldown: 20, currentCooldown: 0, manaCost: 60 },
      { id: "primal_avatar", name: "Primal Avatar", description: "Colossal form: huge stat increase and fear aura", type: "buff", range: 0, cooldown: 20, currentCooldown: 0, manaCost: 60 },
    ]},
  ],
  warrior: [
    { level: 0, name: "Invincibility", skills: [
      { id: "invulnerability", name: "Invulnerability", description: "Temporary immunity (1-4s), scales with trait level", type: "buff", range: 0, cooldown: 15, currentCooldown: 0, manaCost: 40 },
    ]},
    { level: 1, name: "Combat Basics", skills: [
      { id: "taunt", name: "Taunt", description: "Force enemies to target you", type: "debuff", range: 3, cooldown: 3, currentCooldown: 0, manaCost: 10 },
      { id: "quick_strike", name: "Quick Strike", description: "Fast attack with speed bonus", type: "attack", damage: 20, range: 1, cooldown: 0, currentCooldown: 0, manaCost: 5 },
    ]},
    { level: 5, name: "Specialization", skills: [
      { id: "damage_surge", name: "Damage Surge", description: "Temporary damage boost", type: "buff", range: 0, cooldown: 6, currentCooldown: 0, manaCost: 20 },
      { id: "guardians_aura", name: "Guardian's Aura", description: "Defense buff for nearby allies", type: "buff", range: 3, cooldown: 8, currentCooldown: 0, manaCost: 25 },
    ]},
    { level: 10, name: "Advanced Combat", skills: [
      { id: "dual_wield", name: "Dual Wield", description: "Attack speed and multi-hit capability", type: "buff", range: 0, cooldown: 10, currentCooldown: 0, manaCost: 30 },
      { id: "shield_specialist", name: "Shield Specialist", description: "Increases block chance and defense", type: "buff", range: 0, cooldown: 8, currentCooldown: 0, manaCost: 20 },
      { id: "life_drain", name: "Life Drain", description: "Damage heals you for a portion of damage dealt", type: "attack", damage: 25, range: 1, cooldown: 4, currentCooldown: 0, manaCost: 15 },
    ]},
    { level: 15, name: "Master Warrior", skills: [
      { id: "execute", name: "Execute", description: "Bonus damage vs low-health enemies", type: "attack", damage: 50, range: 1, cooldown: 5, currentCooldown: 0, manaCost: 25 },
      { id: "double_strike", name: "Double Strike", description: "Two consecutive attacks", type: "attack", damage: 35, range: 1, cooldown: 3, currentCooldown: 0, manaCost: 20 },
    ]},
    { level: 20, name: "Legendary Warrior", skills: [
      { id: "avatar_form", name: "Avatar Form", description: "All stats boosted and increased size", type: "buff", range: 0, cooldown: 20, currentCooldown: 0, manaCost: 60 },
      { id: "perfect_counter", name: "Perfect Counter", description: "Chance to fully counter incoming attacks and retaliate", type: "buff", range: 0, cooldown: 15, currentCooldown: 0, manaCost: 50 },
    ]},
  ],
  mage: [
    { level: 0, name: "Arcane Affinity", skills: [
      { id: "mana_shield", name: "Mana Shield", description: "Passive shield based on mana; Active: 15s massive crit/spell boost", type: "buff", range: 0, cooldown: 12, currentCooldown: 0, manaCost: 35 },
    ]},
    { level: 1, name: "Basic Arts", skills: [
      { id: "magic_missile", name: "Magic Missile", description: "Multi-projectile damage", type: "attack", damage: 18, range: 4, cooldown: 0, currentCooldown: 0, manaCost: 8 },
      { id: "heal", name: "Heal", description: "Direct single-target healing", type: "heal", healing: 30, range: 3, cooldown: 2, currentCooldown: 0, manaCost: 15 },
    ]},
    { level: 5, name: "Specialization", skills: [
      { id: "fireball", name: "Fireball", description: "AoE damage spell", type: "attack", damage: 35, range: 3, cooldown: 3, currentCooldown: 0, manaCost: 25 },
      { id: "greater_heal", name: "Greater Heal", description: "Powerful single-target heal", type: "heal", healing: 50, range: 3, cooldown: 4, currentCooldown: 0, manaCost: 30 },
    ]},
    { level: 10, name: "Advanced Magic", skills: [
      { id: "lightning_chain", name: "Lightning Chain", description: "Chained multi-target damage", type: "attack", damage: 25, range: 4, cooldown: 4, currentCooldown: 0, manaCost: 30 },
      { id: "blink", name: "Blink", description: "10-yard directional teleport", type: "movement", range: 5, cooldown: 6, currentCooldown: 0, manaCost: 20 },
      { id: "group_heal", name: "Group Heal", description: "AoE heal for the party", type: "heal", healing: 25, range: 3, cooldown: 6, currentCooldown: 0, manaCost: 40 },
    ]},
    { level: 15, name: "Master Tier", skills: [
      { id: "meteor", name: "Meteor", description: "Delayed massive AoE damage", type: "attack", damage: 60, range: 4, cooldown: 8, currentCooldown: 0, manaCost: 50 },
      { id: "portal", name: "Portal", description: "Place/connect portals for team teleportation", type: "movement", range: 10, cooldown: 15, currentCooldown: 0, manaCost: 40 },
    ]},
    { level: 20, name: "Legendary Magic", skills: [
      { id: "archmage", name: "Archmage", description: "Massive spell power, reduced cost and cooldowns", type: "buff", range: 0, cooldown: 20, currentCooldown: 0, manaCost: 60 },
      { id: "reality_tear", name: "Reality Tear", description: "Devastating line-of-effect reality-warping damage", type: "attack", damage: 80, range: 5, cooldown: 12, currentCooldown: 0, manaCost: 70 },
    ]},
  ],
  ranger: [
    { level: 0, name: "Hunter's Instinct", skills: [
      { id: "precision", name: "Precision", description: "Passive accuracy/crit & movement speed in natural terrain", type: "buff", range: 0, cooldown: 0, currentCooldown: 0, manaCost: 0 },
    ]},
    { level: 1, name: "Basic Training", skills: [
      { id: "power_shot", name: "Power Shot", description: "High damage ranged attack", type: "attack", damage: 28, range: 5, cooldown: 0, currentCooldown: 0, manaCost: 8 },
      { id: "stealth_strike", name: "Stealth Strike", description: "High-damage melee strike from stealth", type: "attack", damage: 35, range: 1, cooldown: 3, currentCooldown: 0, manaCost: 15 },
    ]},
    { level: 5, name: "Specialization Path", skills: [
      { id: "multi_shot", name: "Multi Shot", description: "Fire multiple arrows/bullets", type: "attack", damage: 20, range: 4, cooldown: 3, currentCooldown: 0, manaCost: 20 },
      { id: "shadow_step", name: "Shadow Step", description: "Short-range teleport behind enemy", type: "movement", range: 3, cooldown: 4, currentCooldown: 0, manaCost: 15 },
    ]},
    { level: 10, name: "Advanced Techniques", skills: [
      { id: "explosive_shot", name: "Explosive Shot", description: "AoE ranged damage", type: "attack", damage: 30, range: 4, cooldown: 5, currentCooldown: 0, manaCost: 25 },
      { id: "poison_blade", name: "Poison Blade", description: "DoT melee attacks", type: "attack", damage: 15, range: 1, cooldown: 2, currentCooldown: 0, manaCost: 12 },
      { id: "trap_mastery", name: "Trap Mastery", description: "Deploy and upgrade traps", type: "debuff", range: 2, cooldown: 6, currentCooldown: 0, manaCost: 20 },
    ]},
    { level: 15, name: "Master Hunter", skills: [
      { id: "rain_of_arrows", name: "Rain of Arrows", description: "Massive AoE arrow barrage", type: "attack", damage: 40, range: 5, cooldown: 8, currentCooldown: 0, manaCost: 45 },
      { id: "assassinate", name: "Assassinate", description: "High-damage stealth execution against marked targets", type: "attack", damage: 70, range: 1, cooldown: 10, currentCooldown: 0, manaCost: 35 },
    ]},
    { level: 20, name: "Legendary Skills", skills: [
      { id: "storm_of_arrows", name: "Storm of Arrows", description: "Ultimate ranged devastation across a wide area", type: "attack", damage: 55, range: 6, cooldown: 12, currentCooldown: 0, manaCost: 60 },
      { id: "shadow_master", name: "Shadow Master", description: "Enhanced stealth with multiple strikes and finishers", type: "buff", range: 0, cooldown: 15, currentCooldown: 0, manaCost: 50 },
    ]},
  ],
};

// Get abilities for a unit based on their level
export function getAbilitiesForLevel(unitClass: UnitClass, level: number): Ability[] {
  const skillTree = classSkillTrees[unitClass];
  if (!skillTree) return [];
  
  const abilities: Ability[] = [];
  for (const tier of skillTree) {
    if (tier.level <= level && tier.skills.length > 0) {
      // Add first skill from each unlocked tier (player would choose one per tier)
      abilities.push(tier.skills[0]);
    }
  }
  return abilities;
}

// Legacy ability templates for backwards compatibility (uses level 0-5 abilities)
export const abilityTemplates: Record<UnitClass, Ability[]> = {
  warrior: [
    ...classSkillTrees.warrior[0].skills,
    ...classSkillTrees.warrior[1].skills,
  ],
  ranger: [
    ...classSkillTrees.ranger[0].skills,
    ...classSkillTrees.ranger[1].skills,
  ],
  mage: [
    ...classSkillTrees.mage[0].skills,
    ...classSkillTrees.mage[1].skills,
  ],
  worge: [
    ...classSkillTrees.worge[0].skills,
    ...classSkillTrees.worge[1].skills,
  ],
};

// Base stats by class
export const baseStats: Record<UnitClass, { hp: number; attack: number; defense: number; speed: number; movement: number; range: number }> = {
  warrior: { hp: 120, attack: 28, defense: 22, speed: 12, movement: 3, range: 1 },
  ranger: { hp: 80, attack: 25, defense: 12, speed: 16, movement: 4, range: 4 },
  mage: { hp: 70, attack: 35, defense: 10, speed: 14, movement: 3, range: 3 },
  worge: { hp: 100, attack: 30, defense: 15, speed: 18, movement: 5, range: 1 },
};

// Unit name pools by faction and race
const namesByFactionRace: Record<Faction, Record<string, string[]>> = {
  crusade: {
    human: ["Aldric", "Seraphina", "Cedric", "Elara", "Roland", "Isolde", "Marcus", "Helena"],
    barbarian: ["Grok", "Kira", "Ragnar", "Helga", "Ulf", "Freya", "Bjorn", "Astrid"],
  },
  fabled: {
    dwarf: ["Thorin", "Greta", "Durin", "Helga", "Magnus", "Ingrid", "Olaf", "Freya"],
    elf: ["Aelindra", "Thalion", "Elowen", "Caelan", "Sylphira", "Faelen", "Miriel", "Arannis"],
  },
  legion: {
    orc: ["Grommash", "Shulka", "Zugor", "Morkra", "Thrakk", "Gashna", "Brokk", "Vulgra"],
    undead: ["Malachar", "Seraphyx", "Grimholt", "Whisper", "Dreadbone", "Nythera", "Ashveil", "Mortis"],
  },
};

// Legacy name lookup for backward compatibility
const namesByFaction: Record<Faction, string[]> = {
  crusade: [...namesByFactionRace.crusade.human, ...namesByFactionRace.crusade.barbarian],
  fabled: [...namesByFactionRace.fabled.dwarf, ...namesByFactionRace.fabled.elf],
  legion: [...namesByFactionRace.legion.orc, ...namesByFactionRace.legion.undead],
};

// Faction colors for UI (CSS HSL format)
export const factionColors: Record<Faction, { primary: string; secondary: string }> = {
  crusade: { primary: "hsl(45, 90%, 50%)", secondary: "hsl(45, 70%, 85%)" },
  fabled: { primary: "hsl(200, 70%, 45%)", secondary: "hsl(200, 50%, 80%)" },
  legion: { primary: "hsl(0, 60%, 40%)", secondary: "hsl(0, 40%, 75%)" },
};

// Faction colors for 3D rendering (hex format) - consolidated single source of truth
export const factionColorsHex: Record<Faction, { primary: number; secondary: number; accent: number }> = {
  crusade: { primary: 0xc9a227, secondary: 0x8b0000, accent: 0xffd700 },
  fabled: { primary: 0x228b22, secondary: 0x4169e1, accent: 0x00ff7f },
  legion: { primary: 0x4a0080, secondary: 0x1a1a1a, accent: 0x9400d3 }
};

// Race colors for 3D model tinting (CSS HSL format for UI)
export const raceColors: Record<string, { primary: string; secondary: string }> = {
  human: { primary: "hsl(30, 50%, 60%)", secondary: "hsl(30, 40%, 80%)" },
  barbarian: { primary: "hsl(25, 70%, 45%)", secondary: "hsl(25, 50%, 75%)" },
  dwarf: { primary: "hsl(35, 60%, 40%)", secondary: "hsl(35, 50%, 70%)" },
  elf: { primary: "hsl(140, 50%, 50%)", secondary: "hsl(140, 40%, 80%)" },
  orc: { primary: "hsl(100, 60%, 30%)", secondary: "hsl(100, 40%, 60%)" },
  undead: { primary: "hsl(270, 40%, 35%)", secondary: "hsl(270, 30%, 65%)" },
};

// Race tint colors for 3D rendering (hex format) - consolidated single source of truth
export const raceTintsHex: Record<string, number> = {
  human: 0xf5deb3,
  barbarian: 0xcd853f,
  dwarf: 0xd2691e,
  elf: 0xfaf0e6,
  orc: 0x6b8e23,
  undead: 0x708090
};

// Shared material colors used across 3D scenes (wood, stone, etc.)
export const materialColorsHex = {
  // Wood colors
  woodLight: 0x4a3728,    // Light brown wood (most common)
  woodMedium: 0x3d2817,   // Medium brown wood
  woodDark: 0x2a1a0a,     // Dark/aged wood
  woodRich: 0x5c4033,     // Rich mahogany
  // Stone colors
  stoneLight: 0x808080,   // Light grey stone
  stoneDark: 0x505050,    // Dark grey stone
  // Metal colors
  metalIron: 0x606060,    // Iron
  metalGold: 0xffd700,    // Gold
  metalBronze: 0xcd7f32,  // Bronze
} as const;

// Class icons (using unicode symbols)
export const classIcons: Record<UnitClass, string> = {
  warrior: "Sword",
  ranger: "Target",
  mage: "Sparkles",
  worge: "Dog",
};

// Terrain info
export const terrainInfo = {
  grass: { name: "Grassland", moveCost: 1, defenseBonus: 0, color: "bg-green-600 dark:bg-green-700" },
  stone: { name: "Stone Floor", moveCost: 1, defenseBonus: 5, color: "bg-stone-400 dark:bg-stone-600" },
  water: { name: "Water", moveCost: 3, defenseBonus: -5, color: "bg-blue-500 dark:bg-blue-600" },
  forest: { name: "Forest", moveCost: 2, defenseBonus: 15, color: "bg-emerald-700 dark:bg-emerald-800" },
  mountain: { name: "Mountain", moveCost: 4, defenseBonus: 25, color: "bg-slate-500 dark:bg-slate-700" },
  sand: { name: "Desert", moveCost: 2, defenseBonus: -2, color: "bg-amber-300 dark:bg-amber-500" },
};

// Generate a random unit with equipment
export function generateUnit(unitClass: UnitClass, faction: Faction, isEnemy: boolean = false, level: number = 1, race?: Race): Unit {
  const names = namesByFaction[faction];
  const name = names[Math.floor(Math.random() * names.length)];
  const stats = { ...baseStats[unitClass] };
  
  // Level scaling
  const levelBonus = (level - 1) * 0.1;
  stats.hp = Math.floor(stats.hp * (1 + levelBonus));
  stats.attack = Math.floor(stats.attack * (1 + levelBonus));
  stats.defense = Math.floor(stats.defense * (1 + levelBonus));
  
  // Generate equipment tier based on level (tier 0-8, roughly level/3)
  const equipmentTier = Math.min(Math.floor(level / 3), 8);
  const equipment = generateEquipment(unitClass, equipmentTier);
  
  // Get sprite config for this class
  const spriteConfig = getCharacterSprite(unitClass);
  
  // Use race-based display name if race is provided
  const displayName = race ? getUnitDisplayName(race, unitClass) : name;
  
  return {
    id: `${faction}-${unitClass}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: displayName,
    class: unitClass,
    faction,
    level,
    stats: { ...stats, maxHp: stats.hp },
    abilities: [...abilityTemplates[unitClass]],
    isEnemy,
    portraitIndex: Math.floor(Math.random() * 4),
    equipment,
    spriteConfig,
    race,
  };
}

// Generate unit with race (uses race-based naming and tinting)
export function generateRaceUnit(
  race: Race,
  unitClass: UnitClass,
  isEnemy: boolean = false,
  level: number = 1
): Unit {
  const faction = getRaceFaction(race) as Faction;
  return generateUnit(unitClass, faction, isEnemy, level, race);
}

// Generate a full race team (4 units, 1 of each class)
export function generateRaceTeam(race: Race, isEnemy: boolean = false, level: number = 1): Unit[] {
  const classes = getAllClasses();
  return classes.map(unitClass => generateRaceUnit(race, unitClass, isEnemy, level));
}

// Generate all 6 race teams (24 total units)
export function generateAllRaceTeams(playerRaces: Race[], enemyRaces: Race[], level: number = 1): {
  playerUnits: Unit[];
  enemyUnits: Unit[];
} {
  const playerUnits: Unit[] = [];
  const enemyUnits: Unit[] = [];
  
  playerRaces.forEach(race => {
    playerUnits.push(...generateRaceTeam(race, false, level));
  });
  
  enemyRaces.forEach(race => {
    enemyUnits.push(...generateRaceTeam(race, true, level));
  });
  
  return { playerUnits, enemyUnits };
}

// Generate a random map with height levels
export function generateMap(width: number, height: number, name: string = "Battlefield"): BattleMap {
  const heightMapTiles = generateTacticalHeightMap({ width, height });
  
  const tiles: Tile[] = heightMapTiles.map(tile => ({
    x: tile.x,
    y: tile.y,
    terrain: tile.terrain,
    elevation: tile.height,
    isHighlighted: false,
    isRamp: tile.isRamp,
    rampDirection: tile.rampDirection,
    isWall: tile.isWall,
    wallSides: tile.wallSides,
  }));
  
  return {
    id: `map-${Date.now()}`,
    name,
    width,
    height,
    tiles,
  };
}

// Lore entries
export const loreEntries: LoreEntry[] = [
  {
    id: "lore-1",
    title: "The Age of Fracture",
    category: "history",
    content: `Long ago, the world of Aethermoor was whole - a realm where magic flowed freely through crystalline ley lines that connected all living things. The six great races lived in harmony, their borders defined not by walls but by the natural flow of arcane energy.

Then came the Sundering.

No one knows what truly caused it. Some say it was the hubris of the Archmage Council, attempting to harness the power of the World Heart. Others whisper of the Cosmic Waterfall - Madra's domain expanding, entropy itself given form.

What we know is this: In a single catastrophic moment, the ley lines ruptured. Magic, once predictable and gentle, became wild and dangerous. The land itself split apart, creating the Floating Isles we now call home.

From this chaos, three great factions emerged - the Crusade, the Fabled, and the Legion - each following one of the three gods who still watch over Aethermoor.`,
    unlocked: true,
  },
  {
    id: "lore-race-human",
    title: "Humans",
    category: "races",
    content: `Humans are the most adaptable of all the races in Aethermoor. Neither the strongest nor the wisest, they compensate with determination, ingenuity, and an unshakeable belief in their destiny.

Since the Sundering, Humans have proven remarkably resilient. Where other races clung to ancient traditions, Humans built anew. Their cities rise from the ashes faster than any other, their armies march with renewed purpose, their scholars devise new solutions to old problems.

Odin marked Humanity as his chosen warriors. In return, Humans founded the Crusade alongside the Barbarian tribes, united by Thrax the Savage's prophecy: "The Red Storm shall unite the axes with the swords, or all shall fall to the endless dark."

Human Warriors form the backbone of Crusade forces - disciplined, well-equipped, and utterly devoted to Odin's cause. Their mages channel the All-Father's radiance into devastating solar strikes.`,
    unlocked: true,
  },
  {
    id: "lore-race-barbarian",
    title: "Barbarians",
    category: "races",
    content: `The Barbarian tribes have roamed the wild edges of Aethermoor since before recorded history. They are a fierce people who value strength, honor, and the glory of combat above all else.

Where Humans build walls, Barbarians build legends. Their warriors train from childhood in the brutal arts of war, and their berserkers are feared across all the Floating Isles.

When Thrax the Savage united the tribes and forged the blood-brother bond with Sigurd the Unbreakable, the Barbarians joined the Crusade. This alliance shocked many - the "civilized" Humans fighting alongside the "savage" tribes - but proved unbreakable.

Barbarian Berserkers channel Odin's fury into devastating attacks. They fight with reckless abandon, trusting that the All-Father will welcome them to his eternal halls should they fall. Their war cries - "BLOOD FOR ODIN!" - strike terror into enemy hearts.`,
    unlocked: true,
  },
  {
    id: "lore-race-dwarf",
    title: "Dwarves",
    category: "races",
    content: `Deep within the floating mountain-islands, the Dwarves have built civilizations of stone and steel. They are master craftsmen, their forges producing weapons and armor of legendary quality.

The Omni, the Eternal One, taught the first Dwarves the secrets of the forge - or so they believe. This divine knowledge flows through every Dwarven smith, allowing them to create works that blend craftsmanship with subtle magic.

When the Sundering shattered the world, the Dwarven holds survived better than most. Their underground cities, reinforced by generations of engineering, held firm while surface kingdoms crumbled.

The Fabled alliance paired Dwarves with their ancient friends, the Elves. Together they seek The Omni's vision of balance and harmony. Dwarven Vanguards form impenetrable shield walls, while their Artificers create mechanical wonders that rival any spell.`,
    unlocked: true,
  },
  {
    id: "lore-race-elf",
    title: "Elves",
    category: "races",
    content: `The Elves are the oldest of the mortal races, their civilization stretching back to the dawn of Aethermoor. Long-lived and patient, they see patterns in history that other races cannot perceive.

The Omni blessed the Elves with an innate connection to nature magic. Their forests grow in spiraling patterns that channel arcane energy, their cities are living things of wood and vine, their warriors move with supernatural grace.

Since the Sundering, the Elves have served as the world's memory. Their libraries contain knowledge from before the Fracture, their scholars preserve the wisdom of lost civilizations. This makes them invaluable allies - and dangerous enemies.

Alongside the Dwarves, Elves form the Fabled faction. Their Arcane Archers fire arrows guided by forest spirits, their Druids command nature itself, and their Loremasters can turn an enemy's own magic against them.`,
    unlocked: true,
  },
  {
    id: "lore-race-orc",
    title: "Orcs",
    category: "races",
    content: `Born from volcanic crevices and abyssal zones, the Orcs are a warrior race of tremendous strength and fury. They believe in conquest, power, and the inevitability of conflict.

Orcs follow Madra, the Chaos Mother, who teaches that destruction is the path to true growth. They do not seek to preserve the old world - they seek to tear it down and build something stronger from its ashes.

Orc society is brutally meritocratic. The strongest lead, the weak serve or die, and every Orc dreams of glorious conquest. Their Warbands are engines of destruction, smashing through enemy lines with overwhelming force.

Within the Legion, Orcs serve as the unstoppable vanguard. Their Warlords command through fear and respect, their Shamans channel Madra's chaotic power, and their endless ranks march toward oblivion without hesitation.`,
    unlocked: true,
  },
  {
    id: "lore-race-undead",
    title: "The Undead",
    category: "races",
    content: `The Undead are Madra's greatest gift - or curse, depending on who you ask. When her children die, the Chaos Mother sometimes refuses to let them go, pulling them back from oblivion with twisted immortality.

Not all who die become Undead. Madra chooses those with unfinished purpose, those whose hatred burns bright enough to fuel a second existence, those she simply wishes to keep.

The Undead remember fragments of their former lives - enough to fight, to follow orders, to hate the living with eternal fury. They feel no pain, no fear, no mercy. They are the perfect soldiers.

Within the Legion, the Undead serve alongside their Orc allies. Necromancers raise and command legions of shambling warriors, skeletal mages cast spells from beyond death, and the most powerful Undead retain enough intelligence to lead armies of their own.`,
    unlocked: true,
  },
  {
    id: "lore-6",
    title: "Warriors",
    category: "bestiary",
    content: `The backbone of any army, Warriors are masters of close-quarters combat. Wielding sword and shield, they form the front line of battle, protecting more vulnerable allies while dealing steady damage.

A skilled Warrior can control the battlefield through positioning and aggression. Their Shield Bash ability creates openings for allies, while War Cry inspires nearby troops to fight harder.

Warriors favor heavy armor and simple, reliable weapons. They train for years to master the fundamentals: stance, footwork, and the perfect strike.

Across the Floating Isles, every faction has their own Warrior tradition:
- Crusade Vanguards channel Odin's might through disciplined strikes
- Fabled Defenders form impenetrable shield walls
- Legion Berserkers fight with unstoppable fury`,
    unlocked: true,
  },
  {
    id: "lore-7",
    title: "Mages",
    category: "bestiary",
    content: `Mages are wielders of raw arcane power, capable of devastating attacks from a distance. Their frail bodies belie the destructive force they command.

Since the Sundering, magic has become unpredictable. Mages must constantly adapt their techniques, drawing power from the chaotic ley lines while avoiding corruption.

A battlefield Mage is both a prize asset and a liability. Their Fireball spell can turn the tide of battle, but they require protection from physical attacks.

The Arcane Shield ability allows Mages to protect allies, making them valuable support units as well as damage dealers. Smart commanders position their Mages carefully and guard them well.

Each faction approaches magic differently:
- Crusade Battlemages channel Odin's radiance into solar strikes
- Fabled Loremasters weave ancient spells of protection and nature
- Legion Warlocks twist Madra's chaos into weapons of destruction`,
    unlocked: true,
  },
  {
    id: "lore-8",
    title: "The Floating Isles",
    category: "locations",
    content: `Once a single vast continent, Aethermoor was shattered by the Sundering into hundreds of floating islands drifting through an endless sky, slowly pulled toward the Cosmic Waterfall.

The largest fragments became the homes of the three factions:

THE CRUSADE HIGHLANDS - Fortress-islands where Humans and Barbarians train for war, bathed in golden light that streams from Odin's realm above.

THE FABLED GROVES - Ancient forest-islands where Elves and Dwarves preserve the old knowledge, balanced between creation and destruction.

THE LEGION WASTES - Volcanic and abyssal islands where Orcs and Undead gather strength, closest to Madra's expanding domain.

THE CONTESTED ZONES - Neutral islands where the factions clash for resources and territory. Most battles take place here.

Travel between islands requires ships that sail the sky-seas, magical portals, or the dangerous art of ley-line walking.`,
    unlocked: true,
  },
  {
    id: "lore-9",
    title: "Rangers",
    category: "bestiary",
    content: `Masters of ranged combat, Rangers control the battlefield from a distance. Their ability to strike from safety makes them invaluable, but they struggle when enemies close the gap.

The best Rangers are patient hunters who choose their targets carefully. A well-placed arrow can eliminate an enemy mage or healer before they can act.

The Volley ability allows experienced Rangers to rain death on an area, though the damage is spread thin. Poison Arrows add damage over time, weakening enemies for allies to finish.

Movement is key for a Ranger. They must constantly reposition to maintain optimal range while avoiding pursuit.

Faction variations:
- Crusade Sunbows fire arrows blessed by Odin's light
- Fabled Arcane Archers weave magic into every shot
- Legion Deadeyes strike with cold, undead precision`,
    unlocked: true,
  },
  {
    id: "lore-10",
    title: "Worges",
    category: "bestiary",
    content: `Worges are the healers and support specialists of the battlefield. Their ability to restore health and remove debuffs keeps armies fighting long after they should have fallen.

A single Worge can change the outcome of a battle. Smart commanders protect them at all costs; smart enemies target them first.

The basic Heal spell restores a significant amount of health to one ally. Purify removes harmful effects. Divine Light is the ultimate healing ability, restoring all nearby allies at once.

Worges are poor fighters themselves. They carry light weapons more for self-defense than offense.

Faction variations:
- Crusade Clerics channel Odin's blessing
- Fabled Druids call upon The Omni's balance
- Legion Necromancers heal through dark magic`,
    unlocked: true,
  },
  {
    id: "lore-god-odin",
    title: "Odin - The All-Father",
    category: "history",
    content: `Odin, the All-Father, is the patron of warriors who seek victory through strength and strategy. His domain encompasses War, Wisdom, Fate, and Victory itself.

Legend tells that Odin sacrificed his eye to see all timelines of the Grudge wars - the eternal conflicts that shape our world. His ravens Huginn and Muninn are said to report all activities across the realm, watching from above.

Odin favors those who die gloriously in combat, welcoming them to his eternal halls. His spear Gungnir never misses its mark, and some claim to have heard his voice through crow NPCs scattered across the islands.

The Crusade faction follows his teachings, believing that victory through valor is the highest calling. Though Odin secretly admires The Omni's pursuit of balance, he will never admit it - for he is a god of war first, and compromise second.`,
    unlocked: true,
  },
  {
    id: "lore-god-madra",
    title: "Madra - The Chaos Mother",
    category: "history",
    content: `Madra, the Chaos Mother, is the force of necessary destruction and evolution. Her domain encompasses Entropy, Transformation, Destruction, and Rebirth.

She believes destruction is the only path to true growth. The Cosmic Waterfall that slowly consumes the floating islands is said to be her domain expanding - the ultimate expression of entropy made manifest.

Madra created the Undead by refusing to let her children truly die. She loves her Legion children deeply, but shows her affection through trials and challenges. Her temples appear randomly as islands are consumed, and she speaks in riddles that reveal future catastrophes.

The Legion faction follows her teachings, embracing chaos and transformation. Through destruction, they believe, pure power is reborn.`,
    unlocked: true,
  },
  {
    id: "lore-god-omni",
    title: "The Omni - The Eternal One",
    category: "history",
    content: `The Omni, the Eternal One, is the keeper of cosmic balance who prevents total annihilation. Their domain encompasses Balance, Unity, Infinity, and Harmony.

The Omni is neither male nor female but all things - a being of pure equilibrium. They secretly mourn that balance requires conflict, for they see the necessity of war even as they seek peace.

Their third eye can see a player's true intentions. Dwarves believe The Omni taught them the secrets of the forge, while Elves credit their nature magic to this mysterious deity. The Omni speaks in absolute truths that can be hard to accept.

They created the floating islands to give mortals a chance against the Waterfall's consuming expansion. The Fabled faction follows their teachings of balance and harmony.`,
    unlocked: true,
  },
  {
    id: "lore-faction-crusade",
    title: "The Crusade",
    category: "factions",
    content: `"Victory Through Valor - We March Forward!"

The Crusade is an alliance of Humans and Barbarians who seek victory through strength and honor. They follow Odin's teachings of valor and combat prowess.

The Crusade formed when the Barbarian tribes united with the 'civilized' human kingdoms against the threat of the Cosmic Waterfall and the Legion. United by Thrax the Savage's prophecy - "The Red Storm shall unite the axes with the swords, or all shall fall to the endless dark" - they now stand as the bulwark against darkness.

Their warriors are known for their martial prowess, honorable military traditions, and unwavering dedication to Odin's worship. Human history and Barbarian culture blend together in their traditions, creating a unique martial society.`,
    unlocked: true,
  },
  {
    id: "lore-faction-legion",
    title: "The Legion",
    category: "factions",
    content: `"Through Chaos, We Are Reborn"

The Legion is a coalition of Orcs and Undead who embrace chaos and transformation. They follow Madra's teachings of destruction as the path to growth.

Born from volcanic crevices and abyssal zones, the Legion rises as a coordinated, relentless force. Their creed centers on conquest, entropy, and the reclamation of a 'perfect order' through subjugation of free will.

The undead members were created by Madra refusing to let her children truly die, giving them a twisted immortality. Their aggressive, chaotic nature drives them forward, with knowledge of necromancy, chaos magic, orc culture, and undead lore forming the foundation of their society.

"Destruction is but a prelude to creation!" they cry as they march to war.`,
    unlocked: true,
  },
  {
    id: "lore-faction-fabled",
    title: "The Fabled",
    category: "factions",
    content: `"In Balance, We Find Eternity"

The Fabled is an alliance of Elves and Dwarves who seek balance and harmony. They follow The Omni's teachings of unity and cosmic equilibrium.

As the oldest races, they united under The Omni's guidance to preserve knowledge and maintain the delicate balance between creation and destruction. Dwarves believe The Omni taught them the art of the forge, while Elves credit their nature magic to the Eternal One.

Their wise, diplomatic nature helps them navigate the conflicts between the other factions. Masters of ancient lore, balance, nature magic, and forge craft, they serve as the world's memory and conscience.

"May The Omni's light guide your path," they greet friend and stranger alike.`,
    unlocked: true,
  },
  {
    id: "lore-location-waterfall",
    title: "The Cosmic Waterfall",
    category: "locations",
    content: `The Cosmic Waterfall stands at the edge of existence - a void of pure entropy that slowly consumes islands, pulling them into oblivion.

This is Madra's domain expanding, a manifestation of chaos and destruction made real. All races struggle between power and survival in this eternal migration away from its consuming edge.

The closer to the Waterfall, the stronger the magic flows from the gods. Islands nearest to it hold the most powerful magic but the greatest danger. Some foolish treasure hunters sail close to gather rare materials, but few return.

The Waterfall shapes all politics in Aethermoor - every faction must consider the slow drift toward oblivion in their plans.`,
    unlocked: true,
  },
  {
    id: "lore-location-ocean",
    title: "The Ocean of Echoes",
    category: "locations",
    content: `The Ocean of Echoes is a living sea that records memories of civilizations. Sailors who traverse its depths hear ancestral voices that may guide or misguide explorers.

Beneath the waves lie the Vaults of Memory - submerged and airborne temples that hold the crystallized memories of the old world. Scholars and adventurers alike seek these treasures, for within them lies knowledge from before the Sundering.

The ocean itself seems aware, responding to those who sail upon it. Some claim the voices speak of treasures, while others hear warnings of doom. Only the brave - or the foolish - venture into its deepest reaches.`,
    unlocked: true,
  },
  {
    id: "lore-hero-aurion",
    title: "Aurion the Radiant",
    category: "characters",
    content: `Aurion the Radiant is the most powerful human mage in living memory. Marked by Odin at birth during a solar eclipse, his golden divine energy constantly radiates from his form.

Born as golden light erupted from the sky - Odin himself marking the child. By age 12, he could channel pure solar energy. Now at 34, he leads the Crusade's magical corps with unmatched power.

His power comes from proximity to the Waterfall - the further away he goes, the weaker he becomes. This curse keeps him always near danger, yet he continues to serve the Crusade with noble inspiration.

"The light of Odin guides your path here," he greets those who seek his aid.`,
    unlocked: true,
  },
  {
    id: "lore-hero-sigurd",
    title: "Sigurd the Unbreakable",
    category: "characters",
    content: `Sigurd the Unbreakable is the Supreme Commander of Crusade ground forces. He has never lost a duel, never abandoned a position, never broken a promise.

Born to a blacksmith family, at age 16 he single-handedly held a bridge for three days while his village evacuated. He fought Thrax the Savage for seven hours to a draw, and they became blood brothers.

His legendary stubbornness is both his greatest strength and his tragic flaw. A blunt military man, he values discipline and honor above all else.

"State your business," he greets visitors, wasting no time on pleasantries. Only those who prove themselves in combat earn his respect.`,
    unlocked: true,
  },
  {
    id: "lore-hero-thrax",
    title: "Thrax the Savage",
    category: "characters",
    content: `Thrax the Savage is Odin's Berserker, born of prophecy: "The Red Storm shall unite the axes with the swords, or all shall fall to the endless dark."

At age 18, he challenged and defeated every tribal champion in single combat to unite the Barbarian tribes with the Crusade. He then fought Sigurd for seven hours to a draw, and they became blood brothers - a bond that united Human and Barbarian in common cause.

A fierce warrior with primal fighting style, Thrax channels rage into devastating combat prowess. He speaks simply but truthfully: "Fight together good. Fight apart stupid."

When he screams his battle cry - "BLOOD FOR ODIN!" - even his allies feel a chill run down their spines.`,
    unlocked: true,
  },
  {
    id: "lore-hero-kael",
    title: "Kael the Shadowblade",
    category: "characters",
    content: `Kael the Shadowblade is the Crusade's intelligence master. No one knows his true origin - some whisper he was born in Legion lands and defected. He encourages all rumors equally.

He has prevented seventeen assassination attempts on Crusade leaders, mapped the interior of three Legion fortresses, and once stole a crown directly off an Orc warlord's head - replacing it with a Crusade banner.

His loyalty is absolute, but his morality is flexible. A cryptic, mysterious figure, he trades in information and secrets. His quests often involve stealth, espionage, and the shadowy arts.

"...you saw me. Interesting," he says to those perceptive enough to notice him. Most don't.`,
    unlocked: true,
  },
  {
    id: "lore-hero-theron",
    title: "Theron Wildkin",
    category: "characters",
    content: `Theron Wildkin is the Brother of Beasts, raised by wolves after being lost in the Wildwood at age 5. He walks between civilization and nature, translating for both.

A pack of dire wolves found him and adopted him. He lived as a wolf for twelve years. His wolf-brother Fenrix is not a pet but an equal partner - they share thoughts and even pain through their magical bond.

Speaking in simple, primal terms, Theron can communicate with beasts and track any prey across any terrain. He serves as the Crusade's connection to the natural world.

"*sniff* You smell... uncertain. Speak," he greets visitors, trusting his wolf senses more than words.`,
    unlocked: true,
  },
];

// Get starting player roster - uses Human race team (4 units, 1 of each class)
export function getStarterRoster(): Unit[] {
  return generateRaceTeam("human", false, 1);
}

// Generate enemy team based on difficulty - uses race teams
export function generateEnemyTeam(difficulty: "easy" | "normal" | "hard", playerLevel: number): Unit[] {
  const enemyRaces: Race[] = ["orc", "undead", "elf", "dwarf", "barbarian"];
  const selectedRace = enemyRaces[Math.floor(Math.random() * enemyRaces.length)];
  
  const levelBonus = {
    easy: -1,
    normal: 0,
    hard: 1,
  };
  
  const level = Math.max(1, playerLevel + levelBonus[difficulty]);
  const team = generateRaceTeam(selectedRace, true, level);
  
  // Adjust team size based on difficulty
  if (difficulty === "easy") {
    return team.slice(0, 3);
  } else if (difficulty === "hard") {
    // Add an extra unit for hard mode
    const extraClass = getAllClasses()[Math.floor(Math.random() * 4)];
    team.push(generateRaceUnit(selectedRace, extraClass, true, level + 1));
  }
  
  return team;
}
