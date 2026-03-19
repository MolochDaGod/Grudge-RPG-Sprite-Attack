// Effect spritesheet definitions
// Impact effects: 4 columns x 2 rows = 8 frames (top-left to bottom-right)
// Projectile effects: variable columns x 1 row (horizontal strip)

export interface EffectSpriteConfig {
  src: string;
  name: string;
  columns: number;
  rows: number;
  frameCount: number;
  frameDuration: number; // ms per frame
  loop?: boolean;
  isProjectile?: boolean; // true = traveling projectile, false = impact effect
}

// Import impact effect sprites (4x2 grid, 8 frames)
import arcanebolt from "@assets/arcanebolt_1768553615895.png";
import arcanelighting from "@assets/arcanelighting_1768553615895.png";
import arcanemist from "@assets/arcanemist_1768553615896.png";
import arcaneslash from "@assets/arcaneslash_1768553615896.png";
import crit from "@assets/crit_1768553615896.png";
import extraoverlay from "@assets/extraoverlay_1768553615897.png";
import flamestrike from "@assets/flamestrike_1768553615897.png";
import frostbolt from "@assets/frostbolt_1768553615898.png";
import frozen from "@assets/frozen_1768553615898.png";
import healingregen from "@assets/healingregen_1768553615898.png";
import healingwave from "@assets/healingwave_1768553615899.png";
import hit from "@assets/hit_1768553615899.png";
import holyheal from "@assets/holyheal_1768553615899.png";
import holylight from "@assets/holylight_1768553615900.png";

// Import projectile sprites from character folders (horizontal strips)
import wizardAttack01 from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Magic(Projectile)/Wizard-Attack01_Effect.png";
import wizardAttack02 from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Magic(Projectile)/Wizard-Attack02_Effect.png";
import priestAttack from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Magic(Projectile)/Priest-Attack_effect.png";
import priestHeal from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Magic(Projectile)/Priest-Heal_Effect.png";
import arrowProjectile from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Arrow(Projectile)/Arrow02(100x100).png";

// Import character attack effects (Split Effects)
import archerAttack01Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Archer/Archer(Split Effects)/Archer-Attack01_Effect.png";
import archerAttack02Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Archer/Archer(Split Effects)/Archer-Attack02_Effect.png";
import knightAttack01Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Knight/Knight(Split Effects)/Knight-Attack01_Effect.png";
import knightAttack02Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Knight/Knight(Split Effects)/Knight-Attack02_Effect.png";
import knightAttack03Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Knight/Knight(Split Effects)/Knight-Attack03_Effect.png";
import orcAttack01Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Orc/Orc(Split Effects)/Orc-attack01_Effect.png";
import orcAttack02Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Orc/Orc(Split Effects)/Orc-attack02_Effect.png";
import skeletonAttack01Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Armored Skeleton/Armored Skeleton(Split Effects)/Armored Skeleton-Attack01_Effect.png";
import skeletonAttack02Effect from "@/assets/GrudgeRPGAssets2d/GrudgeRPGAssets2d/Characters(100x100)/Armored Skeleton/Armored Skeleton(Split Effects)/Armored Skeleton-Attack02_Effect.png";

export const effectSprites: Record<string, EffectSpriteConfig> = {
  arcanebolt: {
    src: arcanebolt,
    name: "Arcane Bolt",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 80,
  },
  arcanelighting: {
    src: arcanelighting,
    name: "Arcane Lightning",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 80,
  },
  arcanemist: {
    src: arcanemist,
    name: "Arcane Mist",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 100,
  },
  arcaneslash: {
    src: arcaneslash,
    name: "Arcane Slash",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 60,
  },
  crit: {
    src: crit,
    name: "Critical Hit",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 40,
  },
  extraoverlay: {
    src: extraoverlay,
    name: "Weapon Slash",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 60,
  },
  flamestrike: {
    src: flamestrike,
    name: "Flame Strike",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 80,
  },
  frostbolt: {
    src: frostbolt,
    name: "Frost Bolt",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 80,
  },
  frozen: {
    src: frozen,
    name: "Frozen",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 120,
    loop: true,
  },
  healingregen: {
    src: healingregen,
    name: "Healing Regen",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameDuration: 150,
  },
  healingwave: {
    src: healingwave,
    name: "Healing Wave",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 100,
  },
  hit: {
    src: hit,
    name: "Hit",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 50,
  },
  holyheal: {
    src: holyheal,
    name: "Holy Heal",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameDuration: 120,
  },
  holylight: {
    src: holylight,
    name: "Holy Light",
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDuration: 80,
  },
  
  // Projectile sprites (horizontal strips)
  wizardprojectile1: {
    src: wizardAttack01,
    name: "Arcane Star Projectile",
    columns: 10,
    rows: 1,
    frameCount: 10,
    frameDuration: 60,
    isProjectile: true,
  },
  wizardprojectile2: {
    src: wizardAttack02,
    name: "Fireball Projectile",
    columns: 10,
    rows: 1,
    frameCount: 10,
    frameDuration: 60,
    isProjectile: true,
  },
  priestprojectile: {
    src: priestAttack,
    name: "Holy Bolt Projectile",
    columns: 8,
    rows: 1,
    frameCount: 8,
    frameDuration: 70,
    isProjectile: true,
  },
  priestheal: {
    src: priestHeal,
    name: "Healing Sparkles",
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameDuration: 120,
  },
  arrow: {
    src: arrowProjectile,
    name: "Arrow",
    columns: 1,
    rows: 1,
    frameCount: 1,
    frameDuration: 500,
    isProjectile: true,
  },
  
  // Character attack effects (weapon swing trails)
  archerattack1: {
    src: archerAttack01Effect,
    name: "Archer Attack 1",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  archerattack2: {
    src: archerAttack02Effect,
    name: "Archer Attack 2",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  knightattack1: {
    src: knightAttack01Effect,
    name: "Knight Slash 1",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  knightattack2: {
    src: knightAttack02Effect,
    name: "Knight Slash 2",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  knightattack3: {
    src: knightAttack03Effect,
    name: "Knight Slash 3",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  orcattack1: {
    src: orcAttack01Effect,
    name: "Orc Attack 1",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  orcattack2: {
    src: orcAttack02Effect,
    name: "Orc Attack 2",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  skeletonattack1: {
    src: skeletonAttack01Effect,
    name: "Skeleton Attack 1",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
  skeletonattack2: {
    src: skeletonAttack02Effect,
    name: "Skeleton Attack 2",
    columns: 6,
    rows: 1,
    frameCount: 6,
    frameDuration: 60,
  },
};

// Map ability/effect names to sprite keys based on sprite titles
export const effectNameToSprite: Record<string, string> = {
  // Physical damage effects
  "attack": "hit",           // hit = red burst impact
  "melee": "hit",
  "hit": "hit",
  "damage": "hit",
  "slash": "extraoverlay",   // extraoverlay = sword with cyan burst
  "sword": "extraoverlay",
  "weapon": "extraoverlay",
  
  // Critical hit
  "critical": "crit",        // crit = white star burst with red
  "crit": "crit",
  
  // Fire/Flame effects
  "fireball": "flamestrike", // flamestrike = fire spell impact
  "fire": "flamestrike",
  "flame": "flamestrike",
  "flamestrike": "flamestrike",
  "burn": "flamestrike",
  
  // Ice/Frost effects
  "frostbolt": "frostbolt",  // frostbolt = ice spell impact
  "frost": "frostbolt",
  "ice": "frostbolt",
  "freeze": "frozen",        // frozen = ice encasing status
  "frozen": "frozen",
  "chill": "frostbolt",
  
  // Arcane/Magic effects
  "arcane": "arcanebolt",    // arcanebolt = purple magic projectile
  "arcanebolt": "arcanebolt",
  "arcane_bolt": "arcanebolt",
  "magic": "arcanebolt",
  "lightning": "arcanelighting", // arcanelighting = arcane lightning
  "arcanelightning": "arcanelighting",
  "thunder": "arcanelighting",
  "shock": "arcanelighting",
  "mist": "arcanemist",      // arcanemist = purple cloud effect
  "arcanemist": "arcanemist",
  "cloud": "arcanemist",
  "arcaneslash": "arcaneslash", // arcaneslash = crescent slash
  "moonslash": "arcaneslash",
  
  // Healing effects
  "heal": "holyheal",        // holyheal = golden sparkles
  "healing": "holyheal",
  "holyheal": "holyheal",
  "holy": "holylight",       // holylight = golden light column
  "holylight": "holylight",
  "smite": "holylight",
  "divine": "holylight",
  "regen": "healingregen",   // healingregen = green healing particles
  "regeneration": "healingregen",
  "healingregen": "healingregen",
  "healingwave": "healingwave", // healingwave = golden swirl
  "wave": "healingwave",
  
  // Buff effects
  "buff": "holylight",
  "blessing": "holylight",
  "protect": "holylight",
  
  // Projectiles (traveling effects)
  "arcaneprojectile": "wizardprojectile1", // blue star projectile
  "wizardattack": "wizardprojectile1",
  "arcanestar": "wizardprojectile1",
  "fireprojectile": "wizardprojectile2",   // fireball projectile
  "fireballprojectile": "wizardprojectile2",
  "holyprojectile": "priestprojectile",    // holy bolt projectile
  "holybolt": "priestprojectile",
  "priestattack": "priestprojectile",
  "healprojectile": "priestheal",          // healing sparkles
  "priestheal": "priestheal",
  "arrow": "arrow",                        // static arrow
  "arrowprojectile": "arrow",
  "shoot": "arrow",
  "ranged": "arrow",
  
  // Default fallback
  "default": "hit",
};

export function getEffectSprite(effectName: string): EffectSpriteConfig | null {
  const normalizedName = effectName.toLowerCase().replace(/[^a-z]/g, "");
  const spriteKey = effectNameToSprite[normalizedName] || effectNameToSprite["default"];
  return effectSprites[spriteKey] || null;
}

// Calculate frame position for a given frame index
// Reading order: top-left → top-right, then bottom-left → bottom-right
// For 4x2 grid (8 frames):
//   [0] [1] [2] [3]   ← top row
//   [4] [5] [6] [7]   ← bottom row
export function getFramePosition(
  config: EffectSpriteConfig,
  frameIndex: number
): { col: number; row: number } {
  const col = frameIndex % config.columns;
  const row = Math.floor(frameIndex / config.columns);
  return { col, row };
}

// Get the frame dimensions based on sprite sheet info
export function getFrameDimensions(config: EffectSpriteConfig): { 
  frameWidth: number; 
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
} {
  // Standard effect sprite dimensions based on our analysis:
  // Impact effects: 1536x1024 total, 4 cols x 2 rows = 384x512 per frame
  // Projectiles: variable width x 100px height, single row
  // Character attack effects: 600x100 total, 6 cols x 1 row = 100x100 per frame
  
  if (config.isProjectile) {
    // Projectiles are typically 100x100 per frame
    return {
      frameWidth: 100,
      frameHeight: 100,
      sheetWidth: config.columns * 100,
      sheetHeight: 100,
    };
  }
  
  // Impact effects (4x2 grid): 384x512 per frame
  if (config.columns === 4 && config.rows === 2) {
    return {
      frameWidth: 384,
      frameHeight: 512,
      sheetWidth: 1536,
      sheetHeight: 1024,
    };
  }
  
  // Character attack effects (6x1 or similar): 100x100 per frame
  if (config.rows === 1) {
    return {
      frameWidth: 100,
      frameHeight: 100,
      sheetWidth: config.columns * 100,
      sheetHeight: 100,
    };
  }
  
  // Default fallback
  return {
    frameWidth: 100,
    frameHeight: 100,
    sheetWidth: config.columns * 100,
    sheetHeight: config.rows * 100,
  };
}
