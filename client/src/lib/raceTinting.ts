import type { Race, UnitClass } from "@shared/schema";
import { RACES, CLASSES } from "@shared/gameDefinitions/racesClasses";

export interface RaceTint {
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
  primaryColor: string;
  secondaryColor: string;
}

export const RACE_TINTS: Record<Race, RaceTint> = {
  human: {
    hueRotate: 0,
    saturate: 100,
    brightness: 100,
    contrast: 100,
    primaryColor: "#d4a574",
    secondaryColor: "#8b7355",
  },
  barbarian: {
    hueRotate: 15,
    saturate: 120,
    brightness: 95,
    contrast: 110,
    primaryColor: "#c17f59",
    secondaryColor: "#8b4513",
  },
  dwarf: {
    hueRotate: 30,
    saturate: 90,
    brightness: 90,
    contrast: 115,
    primaryColor: "#cd853f",
    secondaryColor: "#654321",
  },
  elf: {
    hueRotate: 120,
    saturate: 80,
    brightness: 110,
    contrast: 95,
    primaryColor: "#98fb98",
    secondaryColor: "#228b22",
  },
  orc: {
    hueRotate: 90,
    saturate: 130,
    brightness: 85,
    contrast: 120,
    primaryColor: "#6b8e23",
    secondaryColor: "#355e3b",
  },
  undead: {
    hueRotate: 240,
    saturate: 60,
    brightness: 80,
    contrast: 130,
    primaryColor: "#708090",
    secondaryColor: "#4a4a6a",
  },
};

export const CLASS_SPRITE_MAP: Record<UnitClass, string> = {
  warrior: "warrior",
  mage: "mage",
  ranger: "ranger",
  worge: "worge",
};

export function getRaceTintFilter(race: Race): string {
  const tint = RACE_TINTS[race];
  return `hue-rotate(${tint.hueRotate}deg) saturate(${tint.saturate}%) brightness(${tint.brightness}%) contrast(${tint.contrast}%)`;
}

export function getRaceClassName(race: Race): string {
  return RACES[race]?.name || race.charAt(0).toUpperCase() + race.slice(1);
}

export function getClassDisplayName(unitClass: UnitClass): string {
  const classMap: Record<UnitClass, string> = {
    warrior: "Warrior",
    mage: "Mage",
    ranger: "Ranger",
    worge: "Worge",
  };
  return classMap[unitClass] || unitClass;
}

export function getUnitDisplayName(race: Race, unitClass: UnitClass): string {
  return `${getRaceClassName(race)} (${getClassDisplayName(unitClass)})`;
}

export function getAllRaces(): Race[] {
  return ["human", "barbarian", "dwarf", "elf", "orc", "undead"];
}

export function getAllClasses(): UnitClass[] {
  return ["warrior", "mage", "ranger", "worge"];
}

export function getRaceFaction(race: Race): string {
  const raceData = RACES[race];
  return raceData?.faction || "crusade";
}

export function generateRaceTeams(unitsPerTeam: number = 4): { 
  race: Race; 
  units: { race: Race; class: UnitClass }[] 
}[] {
  const races = getAllRaces();
  const classes = getAllClasses();
  
  return races.map(race => ({
    race,
    units: classes.slice(0, unitsPerTeam).map((unitClass, index) => ({
      race,
      class: classes[index % classes.length],
    })),
  }));
}
