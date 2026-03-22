// GRUDA Wars character roster — frame counts verified from actual sprite file dimensions
// All sprites at /fighter2d/characters/<folder>/<file>.png

import type { FactionId } from "./factions";

export interface GrudaCharDef {
  id: string;
  name: string;
  folder: string;
  color: string;
  faction: FactionId;
  frameSize: number; // px per frame (height of sprite strip)
  renderScale?: number; // multiplier on top of standard scaling (default 1)
  renderScaleX?: number; // optional horizontal multiplier
  renderScaleY?: number; // optional vertical multiplier
  idle: [string, number];
  walk: [string, number];
  attack: [string, number];
  fall?: [string, number];
  hurt: [string, number];
  death: [string, number];
  attack2?: [string, number];
  block?: [string, number];
  jump?: [string, number];
  cast?: [string, number];
  special?: [string, number];
  roll?: [string, number];
  projectile?: string;
  effectSrc?: string;
  effectFrames?: number;
  atk: number;
  spd: number;
  superDmg: number;
  superName: string;
}

export const GRUDA_ROSTER: GrudaCharDef[] = [
  // ─── ORIGINAL 7 (100x100 frames) ──────────────────────────────
  { id:"knight", name:"Knight", folder:"Knight", color:"#e74c3c", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Knight-Idle.png",6], walk:["Knight-Walk.png",8],
    attack:["Knight-Attack01.png",7], attack2:["Knight-Attack02.png",10],
    hurt:["Knight-Hurt.png",4], death:["Knight-Death.png",4], block:["Knight-Block.png",4],
    special:["Knight-Attack03.png",11],
    effectSrc:"Knight-Attack03_Effect.png", effectFrames:11,
    atk:13, spd:5.6, superDmg:35, superName:"Divine Judgment" },
  { id:"archer", name:"Archer", folder:"Archer", color:"#27ae60", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Archer-Idle.png",6], walk:["Archer-Walk.png",8],
    attack:["Archer-Attack01.png",9], attack2:["Archer-Attack02.png",12],
    hurt:["Archer-Hurt.png",4], death:["Archer-Death.png",4],
    effectSrc:"Archer-Attack02_Effect.png", effectFrames:12, projectile:"Arrow.png",
    atk:9, spd:6.8, superDmg:30, superName:"Storm of Arrows" },
  { id:"wizard", name:"Wizard", folder:"Wizard", color:"#8e44ad", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Wizard-Idle.png",6], walk:["Wizard-Walk.png",8], attack:["Wizard-Attack01.png",6],
    hurt:["Wizard-Hurt.png",4], death:["Wizard-DEATH.png",4], attack2:["Wizard-Attack02.png",6],
    effectSrc:"Wizard-Attack01_Effect.png", effectFrames:10, projectile:"Wizard-Projectile.png",
    atk:10, spd:5.4, superDmg:40, superName:"Arcane Apocalypse" },
  { id:"orc", name:"Orc", folder:"Orc", color:"#2ecc71", faction:"legion", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Orc-Idle.png",6], walk:["Orc-Walk.png",8], attack:["Orc-Attack01.png",6],
    hurt:["Orc-Hurt.png",4], death:["Orc-Death.png",4], attack2:["Orc-Attack02.png",6],
    effectSrc:"Orc-attack01_Effect.png", effectFrames:6,
    atk:15, spd:5.0, superDmg:38, superName:"Waaagh! Smash" },
  { id:"skeleton", name:"Armored Skeleton", folder:"Armored-Skeleton", color:"#95a5a6", faction:"legion", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Armored Skeleton-Idle.png",6], walk:["Armored Skeleton-Walk.png",8],
    attack:["Armored Skeleton-Attack01.png",8], attack2:["Armored Skeleton-Attack02.png",9],
    hurt:["Armored Skeleton-Hurt.png",4], death:["Armored Skeleton-Death.png",4],
    effectSrc:"Armored Skeleton-Attack02_Effect.png", effectFrames:9,
    atk:11, spd:5.8, superDmg:32, superName:"Soul Harvest" },
  { id:"swordsman", name:"Swordsman", folder:"Swordsman", color:"#e67e22", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Swordsman-Idle.png",6], walk:["Swordsman-Walk.png",8],
    attack:["Swordsman-Attack01.png",7], attack2:["Swordsman-Attack02.png",15],
    special:["Swordsman-Attack3.png",12],
    hurt:["Swordsman-Hurt.png",5], death:["Swordsman-Death.png",4],
    effectSrc:"Swordsman-Attack01_Effect.png", effectFrames:7,
    atk:12, spd:6.4, superDmg:33, superName:"Thousand Cuts" },
  { id:"priest", name:"Priest", folder:"Priest", color:"#f1c40f", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["Priest-Idle.png",6], walk:["Priest-Walk.png",8], attack:["Priest-Attack.png",9],
    hurt:["Priest-Hurt.png",4], death:["Priest-Death.png",4], cast:["Priest-Heal.png",6],
    effectSrc:"Priest-Attack_effect.png", effectFrames:5,
    atk:9, spd:5.2, superDmg:36, superName:"Holy Smite" },

  // ─── 100px frame GRUDA heroes ──────────────────────────────────
  { id:"armored-orc", name:"Armored Orc", folder:"armored-orc", color:"#196f3d", faction:"legion", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["idle.png",6], walk:["walk.png",8],
    attack:["attack1.png",7], attack2:["attack2.png",8], special:["attack3.png",9],
    hurt:["hurt.png",4], death:["death.png",4], block:["block.png",4],
    atk:14, spd:5.0, superDmg:38, superName:"Iron Tusk" },
  { id:"elite-orc", name:"Elite Orc", folder:"elite-orc", color:"#1e8449", faction:"legion", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["idle.png",6], walk:["walk.png",8],
    attack:["attack1.png",7], attack2:["attack2.png",11], special:["attack3.png",9],
    hurt:["hurt.png",4], death:["death.png",4],
    atk:15, spd:5.2, superDmg:40, superName:"Orc Warlord" },
  { id:"knight-templar", name:"Knight Templar", folder:"knight-templar", color:"#f39c12", faction:"crusade", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["idle.png",6], walk:["walk.png",8],
    attack:["attack1.png",7], attack2:["attack2.png",8], special:["attack3.png",11],
    hurt:["hurt.png",4], death:["death.png",4], block:["block.png",4], cast:["cast.png",11],
    atk:14, spd:5.4, superDmg:37, superName:"Holy Crusade" },
  { id:"barbarian-ranger", name:"Barbarian Ranger", folder:"barbarian-ranger", color:"#c0392b", faction:"crusade", frameSize:100, renderScale:2,
    idle:["idle.png",6], walk:["walk.png",6], attack:["attack1.png",6],
    hurt:["hurt.png",4], death:["death.png",4], attack2:["attack2.png",9],
    projectile:"axe.png",
    atk:12, spd:5.6, superDmg:34, superName:"Axe Storm" },
  { id:"elf-ranger", name:"Elf Ranger", folder:"elf-ranger", color:"#27ae60", faction:"fabled", frameSize:100, renderScale:2,
    idle:["idle.png",6], walk:["walk.png",8], attack:["attack1.png",6],
    hurt:["hurt.png",4], death:["death.png",4], attack2:["attack2.png",6],
    projectile:"arrow_long.png",
    atk:10, spd:7.0, superDmg:28, superName:"Elven Barrage" },
  { id:"werebear", name:"Werebear", folder:"werebear", color:"#6e2c00", faction:"fabled", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["idle.png",6], walk:["walk.png",8],
    attack:["attack1.png",9], attack2:["attack2.png",13], special:["attack3.png",9],
    hurt:["hurt.png",4], death:["death.png",4],
    atk:16, spd:4.6, superDmg:42, superName:"Bear Maul" },
  { id:"werewolf", name:"Werewolf", folder:"werewolf", color:"#4a235a", faction:"fabled", frameSize:100, renderScale:2, renderScaleX:1.6, renderScaleY:2.45,
    idle:["idle.png",6], walk:["walk.png",8], attack:["attack1.png",9],
    hurt:["hurt.png",4], death:["death.png",4], attack2:["attack2.png",13],
    atk:14, spd:6.8, superDmg:35, superName:"Lunar Frenzy" },
  { id:"barbarian-warrior", name:"Barbarian", folder:"barbarian-warrior", color:"#d35400", faction:"crusade", frameSize:100, renderScale:2,
    idle:["idle.png",16], walk:["walk.png",8], attack:["attack1.png",30],
    hurt:["hurt.png",8], death:["death.png",40], attack2:["attack2.png",30],
    atk:16, spd:4.8, superDmg:42, superName:"Berserker Fury" },

  // ─── 96px frame heroes ─────────────────────────────────────────
  { id:"dark-knight", name:"Dark Knight", folder:"dark-knight", color:"#2c3e50", faction:"legion", frameSize:96,
    idle:["Idle.png",5], walk:["Walk.png",8], attack:["Attack_1.png",4],
    hurt:["Hurt.png",3], death:["Dead.png",4], jump:["Jump.png",10],
    attack2:["Attack_2.png",4], special:["Attack_3.png",4],
    effectSrc:"slash_arc.png", effectFrames:6,
    atk:14, spd:5.8, superDmg:36, superName:"Shadow Cleave" },
  { id:"silver-knight", name:"Silver Knight", folder:"silver-knight", color:"#c0c0c0", faction:"crusade", frameSize:180,
    idle:["Idle.png",11], walk:["Run.png",8], attack:["Attack1.png",7],
    hurt:["TakeHit.png",4], death:["Death.png",11], jump:["Jump.png",3],
    attack2:["Attack2.png",7],
    atk:14, spd:6.0, superDmg:36, superName:"Silver Crescendo" },
  { id:"pirate-captain", name:"Pirate Captain", folder:"pirate-captain", color:"#784212", faction:"crusade", frameSize:96,
    idle:["Idle.png",4], walk:["Walk.png",6], attack:["Attack1.png",6],
    hurt:["Hurt.png",2], death:["Death.png",6], special:["Special.png",6], attack2:["Attack2.png",6],
    projectile:"bullet.png",
    atk:13, spd:5.8, superDmg:35, superName:"Cannon Barrage" },
  { id:"crossbowman", name:"Crossbowman", folder:"crossbowman", color:"#566573", faction:"crusade", frameSize:96,
    idle:["Idle.png",6], walk:["Walk.png",8], attack:["Attack_1.png",4],
    hurt:["Hurt.png",3], death:["Dead.png",4], jump:["Jump.png",10],
    attack2:["Attack_2.png",4], cast:["Recharge.png",8], special:["Shot_1.png",3],
    projectile:"ballista_bolt.png",
    atk:12, spd:5.8, superDmg:32, superName:"Bolt Barrage" },

  // ─── 128px frame heroes ────────────────────────────────────────
  { id:"fire-knight", name:"Fire Knight", folder:"fire-knight", color:"#e74c3c", faction:"crusade", frameSize:128,
    idle:["idle.png",8], walk:["run.png",8], attack:["attack1.png",11],
    hurt:["hurt.png",6], death:["death.png",13], block:["block.png",10],
    jump:["jump.png",20], attack2:["attack2.png",19], special:["special.png",18], roll:["roll.png",8],
    atk:14, spd:6.2, superDmg:38, superName:"Inferno Blade" },
  // Note: fire-knight now uses Elementals pack v1.1 with clean sprites (288x128 frames)
  { id:"fire-wizard", name:"Fire Wizard", folder:"fire-wizard", color:"#e74c3c", faction:"fabled", frameSize:128,
    idle:["idle.png",7], walk:["walk.png",6], attack:["attack1.png",4],
    hurt:["hurt.png",3], death:["death.png",6], jump:["jump.png",9],
    attack2:["attack2.png",4], cast:["fireball.png",8],
    special:["area_attack.png",9], roll:["roll.png",6],
    projectile:"fireball.png",
    atk:10, spd:5.4, superDmg:42, superName:"Meteor Rain" },
  { id:"lightning-mage", name:"Lightning Mage", folder:"lightning-mage", color:"#3498db", faction:"fabled", frameSize:128,
    idle:["idle.png",7], walk:["walk.png",7], attack:["attack1.png",10],
    hurt:["hurt.png",3], death:["death.png",5], jump:["jump.png",8],
    attack2:["attack2.png",4], cast:["light_ball.png",7],
    special:["area_attack.png",12], roll:["roll.png",7],
    effectSrc:"lightning-bolt.png", effectFrames:6,
    atk:11, spd:5.6, superDmg:40, superName:"Thunder God" },
  { id:"necromancer", name:"Necromancer", folder:"necromancer", color:"#6c3483", faction:"legion", frameSize:128,
    idle:["idle.png",8], walk:["walk.png",8], attack:["attack1.png",13],
    hurt:["hurt.png",9], death:["death.png",5], cast:["cast2.png",17], attack2:["attack2.png",13],
    atk:11, spd:5.0, superDmg:38, superName:"Death Pact" },
  { id:"human-ranger", name:"Human Ranger", folder:"human-ranger", color:"#2e86c1", faction:"crusade", frameSize:128,
    idle:["idle.png",8], walk:["walk.png",8],
    attack:["attack1.png",14], attack2:["attack2.png",28],
    hurt:["hurt.png",14], death:["death.png",24], jump:["jump.png",12],
    projectile:"arrow_long.png",
    atk:10, spd:6.5, superDmg:30, superName:"Precision Volley" },
  { id:"human-mage", name:"Human Mage", folder:"human-mage", color:"#5b2c6f", faction:"crusade", frameSize:128,
    idle:["idle.png",8], walk:["walk.png",10], attack:["attack1.png",7],
    hurt:["hurt.png",7], death:["death.png",16], block:["block.png",12],
    cast:["cast.png",32], attack2:["attack2.png",21],
    projectile:"fireball.png",
    atk:10, spd:5.0, superDmg:44, superName:"Arcane Cataclysm" },
  { id:"water-priestess", name:"Water Priestess", folder:"water-priestess", color:"#2980b9", faction:"crusade", frameSize:128,
    idle:["idle.png",8], walk:["walk.png",10], attack:["attack1.png",7],
    hurt:["hurt.png",7], death:["death.png",16], block:["block.png",12],
    cast:["heal.png",12], attack2:["attack2.png",12],
    atk:9, spd:5.2, superDmg:38, superName:"Tidal Wave" },
  { id:"leaf-ranger", name:"Leaf Ranger", folder:"leaf-ranger", color:"#229954", faction:"fabled", frameSize:128,
    idle:["idle.png",12], walk:["run.png",10], attack:["attack1.png",10],
    hurt:["take_hit.png",6], death:["death.png",19], special:["special.png",17],
    attack2:["attack3.png",12], roll:["roll.png",8],
    projectile:"arrow_short.png",
    atk:10, spd:7.2, superDmg:28, superName:"Nature's Wrath" },
  { id:"wind-hashashin", name:"Wind Hashashin", folder:"wind-hashashin", color:"#1abc9c", faction:"fabled", frameSize:128,
    idle:["idle.png",8], walk:["run.png",8], attack:["attack1.png",8],
    hurt:["take_hit.png",6], death:["death.png",19], special:["special.png",30],
    attack2:["attack3.png",26], roll:["roll.png",6],
    atk:13, spd:7.4, superDmg:33, superName:"Gale Slash" },

  // ─── 80px frame heroes ─────────────────────────────────────────
  { id:"free-knight", name:"Dwarf Mage", folder:"free-knight", color:"#7d3c98", faction:"fabled", frameSize:96,
    idle:["Idle.png",6], walk:["Walk.png",8], attack:["Attack_1.png",5],
    hurt:["Hurt.png",2], death:["Dead.png",4], jump:["Jump.png",12],
    attack2:["Attack_2.png",3], cast:["Shot.png",5], special:["Special.png",7],
    projectile:"fireball.png",
    atk:11, spd:5.4, superDmg:40, superName:"Arcane Vortex" },
  { id:"nightborne", name:"Nightborne", folder:"nightborne", color:"#2c3e50", faction:"legion", frameSize:80,
    idle:["idle.png",9], walk:["walk.png",6], attack:["attack1.png",12],
    hurt:["hurt.png",5], death:["death.png",23], block:["block.png",3],
    cast:["cast.png",6], attack2:["attack2.png",6],
    atk:12, spd:5.8, superDmg:36, superName:"Void Collapse" },
  { id:"dwarf-ranger", name:"Dwarf Ranger", folder:"dwarf-ranger", color:"#a0522d", faction:"fabled", frameSize:80,
    idle:["idle.png",10], walk:["walk.png",10], attack:["attack1.png",4],
    hurt:["hurt.png",3], death:["death.png",10], roll:["roll.png",12], attack2:["attack2.png",6],
    projectile:"axe.png",
    atk:12, spd:5.2, superDmg:33, superName:"Dwarven Fury" },

  // ─── 64px frame heroes ─────────────────────────────────────────
  { id:"arcane-archer", name:"Arcane Archer", folder:"arcane-archer", color:"#1abc9c", faction:"fabled", frameSize:64,
    idle:["idle.png",6], walk:["walk.png",4], attack:["attack1.png",7],
    hurt:["hurt.png",5], death:["death.png",6], jump:["jump.png",2], attack2:["attack2.png",6],
    projectile:"arrow_long.png",
    atk:11, spd:6.6, superDmg:32, superName:"Arcane Volley" },
  { id:"shardsoul-slayer", name:"Shardsoul Slayer", folder:"shardsoul-slayer", color:"#c0392b", faction:"legion", frameSize:64,
    idle:["idle.png",6], walk:["walk.png",6], attack:["attack1.png",6],
    hurt:["hurt.png",4], death:["death.png",6],
    atk:15, spd:6.0, superDmg:37, superName:"Soul Rend" },

  // ─── Unique frame size heroes ──────────────────────────────────
  { id:"elf-mage", name:"Elf Mage", folder:"Elf-mage", color:"#9b59b6", faction:"fabled", frameSize:190,
    idle:["Idle.png",6], walk:["Run.png",8], attack:["Attack1.png",8],
    hurt:["Hit.png",4], death:["Death.png",7], jump:["Jump.png",2], attack2:["Attack2.png",8],
    projectile:"fireball.png",
    atk:11, spd:5.6, superDmg:40, superName:"Arcane Storm" },
  { id:"evil-wizard", name:"Evil Wizard", folder:"evil-wizard", color:"#4a235a", faction:"legion", frameSize:150,
    idle:["idle.png",8], walk:["walk.png",8], attack:["attack1.png",8],
    hurt:["hurt.png",4], death:["death.png",5], attack2:["attack2.png",8],
    projectile:"fireball.png",
    atk:12, spd:5.0, superDmg:42, superName:"Dark Cataclysm" },
  { id:"martial-hero", name:"Martial Hero", folder:"martial-hero", color:"#d4ac0d", faction:"crusade", frameSize:200,
    idle:["idle.png",8], walk:["walk.png",8], attack:["attack1.png",6],
    fall:["fall.png",2], hurt:["hurt.png",4], death:["death.png",6], jump:["jump.png",2], attack2:["attack2.png",6],
    atk:13, spd:6.6, superDmg:34, superName:"Dragon Fist" },
  { id:"wanderer-magician", name:"Wanderer Magician", folder:"wanderer-magician", color:"#8B4513", faction:"fabled", frameSize:128,
    idle:["Idle.png",8], walk:["Walk.png",7], attack:["Attack_1.png",7],
    hurt:["Hurt.png",4], death:["Dead.png",4], jump:["Jump.png",8],
    attack2:["Attack_2.png",9], cast:["Magic_sphere.png",16],
    special:["Area_Attack.png",8], roll:["Roll.png",7],
    projectile:"fireball.png",
    atk:11, spd:5.6, superDmg:40, superName:"Eldritch Storm" },
  { id:"loreon-knight", name:"Loreon Knight", folder:"loreon-knight", color:"#f4d03f", faction:"crusade", frameSize:48,
    idle:["idle.png",3], walk:["walk.png",6], attack:["attack1.png",9],
    hurt:["hurt.png",3], death:["death.png",5], block:["block.png",5],
    jump:["jump.png",5], attack2:["attack2.png",9],
    atk:13, spd:5.8, superDmg:36, superName:"Loreon's Judgment" },
];
