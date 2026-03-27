import { z } from 'zod';

export const SPRITE_SIZE = 100;

export const RaceSchema = z.enum(['human', 'orc', 'elf', 'dwarf', 'undead', 'barbarian']);
export const ClassSchema = z.enum(['warrior', 'ranger', 'mage', 'worge']);
export const AnimationTypeSchema = z.enum([
  'idle', 'walk', 'walk01', 'walk02',
  'attack01', 'attack02', 'attack03',
  'block', 'hurt', 'death', 'attack', 'heal'
]);

export type Race = z.infer<typeof RaceSchema>;
export type HeroClass = z.infer<typeof ClassSchema>;
export type AnimationType = z.infer<typeof AnimationTypeSchema>;

export interface SpriteAnimation {
  uuid: string;
  name: string;
  fileName: string;
  frames: number;
  fps: number;
  loop: boolean;
  isEffect?: boolean;
  isProjectile?: boolean;
}

export interface HeroSprite {
  id: string;
  race: Race;
  heroClass: HeroClass;
  folder: string;
  effectsFolder?: string;
  spriteSize: number;
  spriteName: string;
  animations: Record<string, SpriteAnimation>;
  effects?: Record<string, SpriteAnimation>;
  projectiles?: Record<string, SpriteAnimation>;
}

// 24 heroes = 6 races x 4 classes — all melee-capable sprites
// Frame counts verified against actual sprite sheet files on disk

export const HERO_SPRITES: HeroSprite[] = [
  // ==================== HUMAN ====================
  {
    id: 'human-warrior',
    race: 'human',
    heroClass: 'warrior',
    folder: 'sprites/characters/Soldier/Soldier/',
    effectsFolder: 'sprites/characters/Soldier/Soldier(Split Effects)/',
    spriteName: 'Soldier',
    spriteSize: 100,
    animations: {
      idle:     { uuid: 'anim-human-warrior-idle-001',    name: 'Idle',     fileName: 'Soldier-Idle.png',     frames: 6,  fps: 8,  loop: true },
      walk:     { uuid: 'anim-human-warrior-walk-002',    name: 'Walk',     fileName: 'Soldier-Walk.png',     frames: 8,  fps: 8,  loop: true },
      attack01: { uuid: 'anim-human-warrior-atk1-003',    name: 'Attack 1', fileName: 'Soldier-Attack01.png', frames: 8,  fps: 10, loop: false },
      attack02: { uuid: 'anim-human-warrior-atk2-004',    name: 'Attack 2', fileName: 'Soldier-Attack02.png', frames: 9,  fps: 10, loop: false },
      attack03: { uuid: 'anim-human-warrior-atk3-005',    name: 'Attack 3', fileName: 'Soldier-Attack03.png', frames: 10, fps: 10, loop: false },
      block:    { uuid: 'anim-human-warrior-block-005b',   name: 'Block',    fileName: 'Soldier-Block.png',    frames: 4,  fps: 10, loop: false },
      hurt:     { uuid: 'anim-human-warrior-hurt-006',    name: 'Hurt',     fileName: 'Soldier-Hurt.png',     frames: 4,  fps: 10, loop: false },
      death:    { uuid: 'anim-human-warrior-death-007',   name: 'Death',    fileName: 'Soldier-Death.png',    frames: 4,  fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-human-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Soldier-Attack01_Effect.png', frames: 8,  fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-human-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Soldier-Attack02_Effect.png', frames: 9,  fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-human-warrior-atk3-003', name: 'Attack 3 Effect', fileName: 'Soldier-Attack03_Effect.png', frames: 10, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'human-ranger',
    race: 'human',
    heroClass: 'ranger',
    folder: 'sprites/characters/Soldier/Soldier/',
    effectsFolder: 'sprites/characters/Soldier/Soldier(Split Effects)/',
    spriteName: 'Soldier',
    spriteSize: 100,
    animations: {
      idle:     { uuid: 'anim-human-ranger-idle-008',    name: 'Idle',     fileName: 'Soldier-Idle.png',     frames: 6,  fps: 8,  loop: true },
      walk:     { uuid: 'anim-human-ranger-walk-009',    name: 'Walk',     fileName: 'Soldier-Walk.png',     frames: 8,  fps: 8,  loop: true },
      attack01: { uuid: 'anim-human-ranger-atk1-010',    name: 'Attack 1', fileName: 'Soldier-Attack01.png', frames: 8,  fps: 10, loop: false },
      attack02: { uuid: 'anim-human-ranger-atk2-011',    name: 'Attack 2', fileName: 'Soldier-Attack02.png', frames: 9,  fps: 10, loop: false },
      attack03: { uuid: 'anim-human-ranger-atk3-011b',   name: 'Attack 3', fileName: 'Soldier-Attack03.png', frames: 10, fps: 10, loop: false },
      block:    { uuid: 'anim-human-ranger-block-011c',   name: 'Block',    fileName: 'Soldier-Block.png',    frames: 4,  fps: 10, loop: false },
      hurt:     { uuid: 'anim-human-ranger-hurt-012',    name: 'Hurt',     fileName: 'Soldier-Hurt.png',     frames: 4,  fps: 10, loop: false },
      death:    { uuid: 'anim-human-ranger-death-013',   name: 'Death',    fileName: 'Soldier-Death.png',    frames: 4,  fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-human-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Soldier-Attack01_Effect.png', frames: 8,  fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-human-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Soldier-Attack02_Effect.png', frames: 9,  fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-human-ranger-atk3-003', name: 'Attack 3 Effect', fileName: 'Soldier-Attack03_Effect.png', frames: 10, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'human-mage',
    race: 'human',
    heroClass: 'mage',
    folder: 'sprites/characters/Wizard/Wizard/',
    effectsFolder: 'sprites/characters/Wizard/Wizard(Split Effects)/',
    spriteName: 'Wizard',
    spriteSize: 100,
    animations: {
      idle:     { uuid: 'anim-human-mage-idle-015',    name: 'Idle',     fileName: 'Wizard-Idle.png',     frames: 6, fps: 8,  loop: true },
      walk:     { uuid: 'anim-human-mage-walk-016',    name: 'Walk',     fileName: 'Wizard-Walk.png',     frames: 8, fps: 8,  loop: true },
      attack01: { uuid: 'anim-human-mage-atk1-017',    name: 'Attack 1', fileName: 'Wizard-Attack01.png', frames: 6, fps: 12, loop: false },
      attack02: { uuid: 'anim-human-mage-atk2-018',    name: 'Attack 2', fileName: 'Wizard-Attack02.png', frames: 6, fps: 12, loop: false },
      hurt:     { uuid: 'anim-human-mage-hurt-019',    name: 'Hurt',     fileName: 'Wizard-Hurt.png',     frames: 4, fps: 10, loop: false },
      death:    { uuid: 'anim-human-mage-death-020',   name: 'Death',    fileName: 'Wizard-DEATH.png',    frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-human-mage-atk1-001', name: 'Attack 1 Effect', fileName: 'Wizard-Attack01_Effect.png', frames: 10, fps: 12, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-human-mage-atk2-002', name: 'Attack 2 Effect', fileName: 'Wizard-Attack02_Effect.png', frames: 7,  fps: 12, loop: false, isEffect: true },
    },
  },
  {
    id: 'human-worge',
    race: 'human',
    heroClass: 'worge',
    folder: 'sprites/characters/Werewolf/Werewolf/',
    effectsFolder: 'sprites/characters/Werewolf/Werewolf(Split Effects)/',
    spriteName: 'Werewolf',
    spriteSize: 100,
    animations: {
      idle:     { uuid: 'anim-human-worge-idle-021',   name: 'Idle',     fileName: 'Werewolf-Idle.png',     frames: 6,  fps: 8,  loop: true },
      walk:     { uuid: 'anim-human-worge-walk-022',   name: 'Walk',     fileName: 'Werewolf-Walk.png',     frames: 8,  fps: 8,  loop: true },
      attack01: { uuid: 'anim-human-worge-atk1-023',   name: 'Attack 1', fileName: 'Werewolf-Attack01.png', frames: 9,  fps: 10, loop: false },
      attack02: { uuid: 'anim-human-worge-atk2-024',   name: 'Attack 2', fileName: 'Werewolf-Attack02.png', frames: 13, fps: 10, loop: false },
      hurt:     { uuid: 'anim-human-worge-hurt-026',   name: 'Hurt',     fileName: 'Werewolf-Hurt.png',     frames: 4,  fps: 10, loop: false },
      death:    { uuid: 'anim-human-worge-death-027',  name: 'Death',    fileName: 'Werewolf-Death.png',    frames: 4,  fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-human-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Werewolf-Attack01_Effect.png', frames: 9,  fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-human-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Werewolf-Attack02_Effect.png', frames: 13, fps: 10, loop: false, isEffect: true },
    },
  },
  // ==================== ORC ====================
  {
    id: 'orc-warrior', race: 'orc', heroClass: 'warrior',
    folder: 'sprites/characters/Armored Orc/Armored Orc/', effectsFolder: 'sprites/characters/Armored Orc/Armored Orc(Split Effects)/',
    spriteName: 'Armored Orc', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-orc-warrior-idle-028', name: 'Idle', fileName: 'Armored Orc-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-orc-warrior-walk-029', name: 'Walk', fileName: 'Armored Orc-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-orc-warrior-atk1-030', name: 'Attack 1', fileName: 'Armored Orc-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-orc-warrior-atk2-031', name: 'Attack 2', fileName: 'Armored Orc-Attack02.png', frames: 8, fps: 10, loop: false },
      attack03: { uuid: 'anim-orc-warrior-atk3-032', name: 'Attack 3', fileName: 'Armored Orc-Attack03.png', frames: 9, fps: 10, loop: false },
      block: { uuid: 'anim-orc-warrior-block-032b', name: 'Block', fileName: 'Armored Orc-Block.png', frames: 4, fps: 10, loop: false },
      hurt: { uuid: 'anim-orc-warrior-hurt-033', name: 'Hurt', fileName: 'Armored Orc-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-orc-warrior-death-034', name: 'Death', fileName: 'Armored Orc-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-orc-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Armored Orc-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-orc-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Armored Orc-Attack02_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-orc-warrior-atk3-003', name: 'Attack 3 Effect', fileName: 'Armored Orc-Attack03_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'orc-ranger', race: 'orc', heroClass: 'ranger',
    folder: 'sprites/characters/Orc rider/Orc rider/', effectsFolder: 'sprites/characters/Orc rider/Orc rider(Split Effects)/',
    spriteName: 'Orc Rider', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-orc-ranger-idle-035', name: 'Idle', fileName: 'Orc rider-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-orc-ranger-walk-036', name: 'Walk', fileName: 'Orc rider-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-orc-ranger-atk1-037', name: 'Attack 1', fileName: 'Orc rider-Attack01.png', frames: 8, fps: 10, loop: false },
      attack02: { uuid: 'anim-orc-ranger-atk2-038', name: 'Attack 2', fileName: 'Orc rider-Attack02.png', frames: 9, fps: 10, loop: false },
      attack03: { uuid: 'anim-orc-ranger-atk3-038b', name: 'Attack 3', fileName: 'Orc rider-Attack03.png', frames: 11, fps: 10, loop: false },
      block: { uuid: 'anim-orc-ranger-block-038c', name: 'Block', fileName: 'Orc rider-Block.png', frames: 4, fps: 10, loop: false },
      hurt: { uuid: 'anim-orc-ranger-hurt-039', name: 'Hurt', fileName: 'Orc rider-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-orc-ranger-death-040', name: 'Death', fileName: 'Orc rider-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-orc-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Orc rider-Attack01_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-orc-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Orc rider-Attack02_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-orc-ranger-atk3-003', name: 'Attack 3 Effect', fileName: 'Orc rider-Attack03_Effect.png', frames: 11, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'orc-mage', race: 'orc', heroClass: 'mage',
    folder: 'sprites/characters/Orc/Orc/', effectsFolder: 'sprites/characters/Orc/Orc(Split Effects)/',
    spriteName: 'Orc', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-orc-mage-idle-041', name: 'Idle', fileName: 'Orc-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-orc-mage-walk-042', name: 'Walk', fileName: 'Orc-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-orc-mage-atk1-043', name: 'Attack 1', fileName: 'Orc-Attack01.png', frames: 6, fps: 12, loop: false },
      attack02: { uuid: 'anim-orc-mage-atk2-044', name: 'Attack 2', fileName: 'Orc-Attack02.png', frames: 6, fps: 12, loop: false },
      hurt: { uuid: 'anim-orc-mage-hurt-045', name: 'Hurt', fileName: 'Orc-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-orc-mage-death-046', name: 'Death', fileName: 'Orc-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-orc-mage-atk1-001', name: 'Attack 1 Effect', fileName: 'Orc-attack01_Effect.png', frames: 6, fps: 12, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-orc-mage-atk2-002', name: 'Attack 2 Effect', fileName: 'Orc-attack02_Effect.png', frames: 6, fps: 12, loop: false, isEffect: true },
    },
  },
  {
    id: 'orc-worge', race: 'orc', heroClass: 'worge',
    folder: 'sprites/characters/Werebear/Werebear/', effectsFolder: 'sprites/characters/Werebear/Werebear(Split Effects)/',
    spriteName: 'Werebear', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-orc-worge-idle-047', name: 'Idle', fileName: 'Werebear-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-orc-worge-walk-048', name: 'Walk', fileName: 'Werebear-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-orc-worge-atk1-049', name: 'Attack 1', fileName: 'Werebear-Attack01.png', frames: 9, fps: 10, loop: false },
      attack02: { uuid: 'anim-orc-worge-atk2-050', name: 'Attack 2', fileName: 'Werebear-Attack02.png', frames: 13, fps: 10, loop: false },
      attack03: { uuid: 'anim-orc-worge-atk3-051', name: 'Attack 3', fileName: 'Werebear-Attack03.png', frames: 9, fps: 10, loop: false },
      hurt: { uuid: 'anim-orc-worge-hurt-052', name: 'Hurt', fileName: 'Werebear-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-orc-worge-death-053', name: 'Death', fileName: 'Werebear-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-orc-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Werebear-Attack01_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-orc-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Werebear-Attack02_Effect.png', frames: 13, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-orc-worge-atk3-003', name: 'Attack 3 Effect', fileName: 'Werebear-Attack03_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
    },
  },
  // ==================== ELF ====================
  {
    id: 'elf-warrior', race: 'elf', heroClass: 'warrior',
    folder: 'sprites/characters/Knight/Knight/', effectsFolder: 'sprites/characters/Knight/Knight(Split Effects)/',
    spriteName: 'Knight', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-elf-warrior-idle-054', name: 'Idle', fileName: 'Knight-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-elf-warrior-walk-055', name: 'Walk', fileName: 'Knight-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-elf-warrior-atk1-056', name: 'Attack 1', fileName: 'Knight-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-elf-warrior-atk2-057', name: 'Attack 2', fileName: 'Knight-Attack02.png', frames: 10, fps: 10, loop: false },
      attack03: { uuid: 'anim-elf-warrior-atk3-058', name: 'Attack 3', fileName: 'Knight-Attack03.png', frames: 11, fps: 10, loop: false },
      block: { uuid: 'anim-elf-warrior-block-058b', name: 'Block', fileName: 'Knight-Block.png', frames: 4, fps: 10, loop: false },
      hurt: { uuid: 'anim-elf-warrior-hurt-059', name: 'Hurt', fileName: 'Knight-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-elf-warrior-death-060', name: 'Death', fileName: 'Knight-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-elf-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Knight-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-elf-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Knight-Attack02_Effect.png', frames: 10, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-elf-warrior-atk3-003', name: 'Attack 3 Effect', fileName: 'Knight-Attack03_Effect.png', frames: 11, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'elf-ranger', race: 'elf', heroClass: 'ranger',
    folder: 'sprites/characters/Swordsman/Swordsman/', effectsFolder: 'sprites/characters/Swordsman/Swordsman(Split Effects)/',
    spriteName: 'Swordsman', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-elf-ranger-idle-061', name: 'Idle', fileName: 'Swordsman-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-elf-ranger-walk-062', name: 'Walk', fileName: 'Swordsman-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-elf-ranger-atk1-063', name: 'Attack 1', fileName: 'Swordsman-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-elf-ranger-atk2-064', name: 'Attack 2', fileName: 'Swordsman-Attack02.png', frames: 15, fps: 10, loop: false },
      attack03: { uuid: 'anim-elf-ranger-atk3-064b', name: 'Attack 3', fileName: 'Swordsman-Attack3.png', frames: 12, fps: 10, loop: false },
      hurt: { uuid: 'anim-elf-ranger-hurt-065', name: 'Hurt', fileName: 'Swordsman-Hurt.png', frames: 5, fps: 10, loop: false },
      death: { uuid: 'anim-elf-ranger-death-066', name: 'Death', fileName: 'Swordsman-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-elf-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Swordsman-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-elf-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Swordsman-Attack02_Effect.png', frames: 15, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-elf-ranger-atk3-003', name: 'Attack 3 Effect', fileName: 'Swordsman-Attack3_Effect.png', frames: 12, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'elf-mage', race: 'elf', heroClass: 'mage',
    folder: 'sprites/characters/Wizard/Wizard/', effectsFolder: 'sprites/characters/Wizard/Wizard(Split Effects)/',
    spriteName: 'Wizard', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-elf-mage-idle-067', name: 'Idle', fileName: 'Wizard-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-elf-mage-walk-068', name: 'Walk', fileName: 'Wizard-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-elf-mage-atk1-069', name: 'Attack 1', fileName: 'Wizard-Attack01.png', frames: 6, fps: 12, loop: false },
      attack02: { uuid: 'anim-elf-mage-atk2-070', name: 'Attack 2', fileName: 'Wizard-Attack02.png', frames: 6, fps: 12, loop: false },
      hurt: { uuid: 'anim-elf-mage-hurt-071', name: 'Hurt', fileName: 'Wizard-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-elf-mage-death-072', name: 'Death', fileName: 'Wizard-DEATH.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-elf-mage-atk1-001', name: 'Attack 1 Effect', fileName: 'Wizard-Attack01_Effect.png', frames: 10, fps: 12, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-elf-mage-atk2-002', name: 'Attack 2 Effect', fileName: 'Wizard-Attack02_Effect.png', frames: 7, fps: 12, loop: false, isEffect: true },
    },
  },
  {
    id: 'elf-worge', race: 'elf', heroClass: 'worge',
    folder: 'sprites/characters/Werewolf/Werewolf/', effectsFolder: 'sprites/characters/Werewolf/Werewolf(Split Effects)/',
    spriteName: 'Werewolf', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-elf-worge-idle-073', name: 'Idle', fileName: 'Werewolf-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-elf-worge-walk-074', name: 'Walk', fileName: 'Werewolf-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-elf-worge-atk1-075', name: 'Attack 1', fileName: 'Werewolf-Attack01.png', frames: 9, fps: 10, loop: false },
      attack02: { uuid: 'anim-elf-worge-atk2-076', name: 'Attack 2', fileName: 'Werewolf-Attack02.png', frames: 13, fps: 10, loop: false },
      hurt: { uuid: 'anim-elf-worge-hurt-078', name: 'Hurt', fileName: 'Werewolf-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-elf-worge-death-079', name: 'Death', fileName: 'Werewolf-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-elf-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Werewolf-Attack01_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-elf-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Werewolf-Attack02_Effect.png', frames: 13, fps: 10, loop: false, isEffect: true },
    },
  },
  // ==================== DWARF ====================
  {
    id: 'dwarf-warrior', race: 'dwarf', heroClass: 'warrior',
    folder: 'sprites/characters/Armored Axeman/Armored Axeman/', effectsFolder: 'sprites/characters/Armored Axeman/Armored Axeman(Split Effects)/',
    spriteName: 'Armored Axeman', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-dwarf-warrior-idle-080', name: 'Idle', fileName: 'Armored Axeman-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-dwarf-warrior-walk-081', name: 'Walk', fileName: 'Armored Axeman-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-dwarf-warrior-atk1-082', name: 'Attack 1', fileName: 'Armored Axeman-Attack01.png', frames: 9, fps: 10, loop: false },
      attack02: { uuid: 'anim-dwarf-warrior-atk2-083', name: 'Attack 2', fileName: 'Armored Axeman-Attack02.png', frames: 9, fps: 10, loop: false },
      attack03: { uuid: 'anim-dwarf-warrior-atk3-084', name: 'Attack 3', fileName: 'Armored Axeman-Attack03.png', frames: 12, fps: 10, loop: false },
      hurt: { uuid: 'anim-dwarf-warrior-hurt-085', name: 'Hurt', fileName: 'Armored Axeman-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-dwarf-warrior-death-086', name: 'Death', fileName: 'Armored Axeman-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-dwarf-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Armored Axeman-Attack01_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-dwarf-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Armored Axeman-Attack02_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-dwarf-warrior-atk3-003', name: 'Attack 3 Effect', fileName: 'Armored Axeman-Attack03_Effect.png', frames: 12, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'dwarf-ranger', race: 'dwarf', heroClass: 'ranger',
    folder: 'sprites/characters/Soldier/Soldier/', effectsFolder: 'sprites/characters/Soldier/Soldier(Split Effects)/',
    spriteName: 'Soldier', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-dwarf-ranger-idle-087', name: 'Idle', fileName: 'Soldier-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-dwarf-ranger-walk-088', name: 'Walk', fileName: 'Soldier-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-dwarf-ranger-atk1-089', name: 'Attack 1', fileName: 'Soldier-Attack01.png', frames: 8, fps: 10, loop: false },
      attack02: { uuid: 'anim-dwarf-ranger-atk2-090', name: 'Attack 2', fileName: 'Soldier-Attack02.png', frames: 9, fps: 10, loop: false },
      attack03: { uuid: 'anim-dwarf-ranger-atk3-090b', name: 'Attack 3', fileName: 'Soldier-Attack03.png', frames: 10, fps: 10, loop: false },
      block: { uuid: 'anim-dwarf-ranger-block-090c', name: 'Block', fileName: 'Soldier-Block.png', frames: 4, fps: 10, loop: false },
      hurt: { uuid: 'anim-dwarf-ranger-hurt-091', name: 'Hurt', fileName: 'Soldier-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-dwarf-ranger-death-092', name: 'Death', fileName: 'Soldier-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-dwarf-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Soldier-Attack01_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-dwarf-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Soldier-Attack02_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-dwarf-ranger-atk3-003', name: 'Attack 3 Effect', fileName: 'Soldier-Attack03_Effect.png', frames: 10, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'dwarf-mage', race: 'dwarf', heroClass: 'mage',
    folder: 'sprites/characters/Priest/Priest/', effectsFolder: 'sprites/characters/Priest/Priest(Split Effects)/',
    spriteName: 'Priest', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-dwarf-mage-idle-093', name: 'Idle', fileName: 'Priest-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-dwarf-mage-walk-094', name: 'Walk', fileName: 'Priest-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-dwarf-mage-atk1-095', name: 'Attack', fileName: 'Priest-Attack.png', frames: 9, fps: 12, loop: false },
      heal: { uuid: 'anim-dwarf-mage-heal-095b', name: 'Heal', fileName: 'Priest-Heal.png', frames: 6, fps: 10, loop: false },
      hurt: { uuid: 'anim-dwarf-mage-hurt-097', name: 'Hurt', fileName: 'Priest-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-dwarf-mage-death-098', name: 'Death', fileName: 'Priest-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack_effect: { uuid: 'eff-dwarf-mage-atk-001', name: 'Attack Effect', fileName: 'Priest-Attack_Effect.png', frames: 5, fps: 12, loop: false, isEffect: true },
      heal_effect: { uuid: 'eff-dwarf-mage-heal-002', name: 'Heal Effect', fileName: 'Priest-Heal_Effect.png', frames: 4, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'dwarf-worge', race: 'dwarf', heroClass: 'worge',
    folder: 'sprites/characters/Werebear/Werebear/', effectsFolder: 'sprites/characters/Werebear/Werebear(Split Effects)/',
    spriteName: 'Werebear', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-dwarf-worge-idle-099', name: 'Idle', fileName: 'Werebear-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-dwarf-worge-walk-100', name: 'Walk', fileName: 'Werebear-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-dwarf-worge-atk1-101', name: 'Attack 1', fileName: 'Werebear-Attack01.png', frames: 9, fps: 10, loop: false },
      attack02: { uuid: 'anim-dwarf-worge-atk2-102', name: 'Attack 2', fileName: 'Werebear-Attack02.png', frames: 13, fps: 10, loop: false },
      attack03: { uuid: 'anim-dwarf-worge-atk3-103', name: 'Attack 3', fileName: 'Werebear-Attack03.png', frames: 9, fps: 10, loop: false },
      hurt: { uuid: 'anim-dwarf-worge-hurt-104', name: 'Hurt', fileName: 'Werebear-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-dwarf-worge-death-105', name: 'Death', fileName: 'Werebear-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-dwarf-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Werebear-Attack01_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-dwarf-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Werebear-Attack02_Effect.png', frames: 13, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-dwarf-worge-atk3-003', name: 'Attack 3 Effect', fileName: 'Werebear-Attack03_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
    },
  },
  // ==================== UNDEAD ====================
  {
    id: 'undead-warrior', race: 'undead', heroClass: 'warrior',
    folder: 'sprites/characters/Armored Skeleton/Armored Skeleton/', effectsFolder: 'sprites/characters/Armored Skeleton/Armored Skeleton(Split Effects)/',
    spriteName: 'Armored Skeleton', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-undead-warrior-idle-106', name: 'Idle', fileName: 'Armored Skeleton-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-undead-warrior-walk-107', name: 'Walk', fileName: 'Armored Skeleton-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-undead-warrior-atk1-108', name: 'Attack 1', fileName: 'Armored Skeleton-Attack01.png', frames: 8, fps: 10, loop: false },
      attack02: { uuid: 'anim-undead-warrior-atk2-109', name: 'Attack 2', fileName: 'Armored Skeleton-Attack02.png', frames: 9, fps: 10, loop: false },
      hurt: { uuid: 'anim-undead-warrior-hurt-111', name: 'Hurt', fileName: 'Armored Skeleton-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-undead-warrior-death-112', name: 'Death', fileName: 'Armored Skeleton-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-undead-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Armored Skeleton-Attack01_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-undead-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Armored Skeleton-Attack02_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'undead-ranger', race: 'undead', heroClass: 'ranger',
    folder: 'sprites/characters/Skeleton/Skeleton/', effectsFolder: 'sprites/characters/Skeleton/Skeleton(Split Effects)/',
    spriteName: 'Skeleton', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-undead-ranger-idle-113', name: 'Idle', fileName: 'Skeleton-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-undead-ranger-walk-114', name: 'Walk', fileName: 'Skeleton-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-undead-ranger-atk1-115', name: 'Attack 1', fileName: 'Skeleton-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-undead-ranger-atk2-116', name: 'Attack 2', fileName: 'Skeleton-Attack02.png', frames: 8, fps: 10, loop: false },
      hurt: { uuid: 'anim-undead-ranger-hurt-117', name: 'Hurt', fileName: 'Skeleton-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-undead-ranger-death-118', name: 'Death', fileName: 'Skeleton-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-undead-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Skeleton-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-undead-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Skeleton-Attack02_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'undead-mage', race: 'undead', heroClass: 'mage',
    folder: 'sprites/characters/Skeleton/Skeleton/', effectsFolder: 'sprites/characters/Skeleton/Skeleton(Split Effects)/',
    spriteName: 'Skeleton', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-undead-mage-idle-119', name: 'Idle', fileName: 'Skeleton-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-undead-mage-walk-120', name: 'Walk', fileName: 'Skeleton-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-undead-mage-atk1-121', name: 'Attack 1', fileName: 'Skeleton-Attack01.png', frames: 7, fps: 12, loop: false },
      attack02: { uuid: 'anim-undead-mage-atk2-122', name: 'Attack 2', fileName: 'Skeleton-Attack02.png', frames: 8, fps: 12, loop: false },
      hurt: { uuid: 'anim-undead-mage-hurt-123', name: 'Hurt', fileName: 'Skeleton-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-undead-mage-death-124', name: 'Death', fileName: 'Skeleton-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-undead-mage-atk1-001', name: 'Attack 1 Effect', fileName: 'Skeleton-Attack01_Effect.png', frames: 7, fps: 12, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-undead-mage-atk2-002', name: 'Attack 2 Effect', fileName: 'Skeleton-Attack02_Effect.png', frames: 8, fps: 12, loop: false, isEffect: true },
    },
  },
  {
    id: 'undead-worge', race: 'undead', heroClass: 'worge',
    folder: 'sprites/characters/Greatsword Skeleton/Greatsword Skeleton/', effectsFolder: 'sprites/characters/Greatsword Skeleton/Greatsword Skeleton(Split Effects)/',
    spriteName: 'Greatsword Skeleton', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-undead-worge-idle-125', name: 'Idle', fileName: 'Greatsword Skeleton-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-undead-worge-walk-126', name: 'Walk', fileName: 'Greatsword Skeleton-Walk.png', frames: 9, fps: 8, loop: true },
      attack01: { uuid: 'anim-undead-worge-atk1-127', name: 'Attack 1', fileName: 'Greatsword Skeleton-Attack01.png', frames: 9, fps: 10, loop: false },
      attack02: { uuid: 'anim-undead-worge-atk2-128', name: 'Attack 2', fileName: 'Greatsword Skeleton-Attack02.png', frames: 12, fps: 10, loop: false },
      attack03: { uuid: 'anim-undead-worge-atk3-128b', name: 'Attack 3', fileName: 'Greatsword Skeleton-Attack03.png', frames: 8, fps: 10, loop: false },
      hurt: { uuid: 'anim-undead-worge-hurt-129', name: 'Hurt', fileName: 'Greatsword Skeleton-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-undead-worge-death-130', name: 'Death', fileName: 'Greatsword Skeleton-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-undead-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Greatsword Skeleton-Attack01_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-undead-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Greatsword Skeleton-Attack02_Effect.png', frames: 12, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-undead-worge-atk3-003', name: 'Attack 3 Effect', fileName: 'Greatsword Skeleton-Attack03_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
    },
  },
  // ==================== BARBARIAN ====================
  {
    id: 'barbarian-warrior', race: 'barbarian', heroClass: 'warrior',
    folder: 'sprites/characters/Lancer/Lancer/', effectsFolder: 'sprites/characters/Lancer/Lancer(Split Effects)/',
    spriteName: 'Lancer', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-barbarian-warrior-idle-131', name: 'Idle', fileName: 'Lancer-Idle.png', frames: 6, fps: 8, loop: true },
      walk01: { uuid: 'anim-barbarian-warrior-walk1-132', name: 'Walk 1', fileName: 'Lancer-Walk01.png', frames: 8, fps: 8, loop: true },
      walk02: { uuid: 'anim-barbarian-warrior-walk2-132b', name: 'Walk 2', fileName: 'Lancer-Walk02.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-barbarian-warrior-atk1-133', name: 'Attack 1', fileName: 'Lancer-Attack01.png', frames: 6, fps: 10, loop: false },
      attack02: { uuid: 'anim-barbarian-warrior-atk2-134', name: 'Attack 2', fileName: 'Lancer-Attack02.png', frames: 9, fps: 10, loop: false },
      attack03: { uuid: 'anim-barbarian-warrior-atk3-135', name: 'Attack 3', fileName: 'Lancer-Attack03.png', frames: 8, fps: 10, loop: false },
      hurt: { uuid: 'anim-barbarian-warrior-hurt-136', name: 'Hurt', fileName: 'Lancer-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-barbarian-warrior-death-137', name: 'Death', fileName: 'Lancer-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-barbarian-warrior-atk1-001', name: 'Attack 1 Effect', fileName: 'Lancer-Attack01_Effect.png', frames: 6, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-barbarian-warrior-atk2-002', name: 'Attack 2 Effect', fileName: 'Lancer-Attack02_Effect.png', frames: 9, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-barbarian-warrior-atk3-003', name: 'Attack 3 Effect', fileName: 'Lancer-Attack03_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'barbarian-ranger', race: 'barbarian', heroClass: 'ranger',
    folder: 'sprites/characters/Swordsman/Swordsman/', effectsFolder: 'sprites/characters/Swordsman/Swordsman(Split Effects)/',
    spriteName: 'Swordsman', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-barbarian-ranger-idle-138', name: 'Idle', fileName: 'Swordsman-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-barbarian-ranger-walk-139', name: 'Walk', fileName: 'Swordsman-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-barbarian-ranger-atk1-140', name: 'Attack 1', fileName: 'Swordsman-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-barbarian-ranger-atk2-141', name: 'Attack 2', fileName: 'Swordsman-Attack02.png', frames: 15, fps: 10, loop: false },
      attack03: { uuid: 'anim-barbarian-ranger-atk3-141b', name: 'Attack 3', fileName: 'Swordsman-Attack3.png', frames: 12, fps: 10, loop: false },
      hurt: { uuid: 'anim-barbarian-ranger-hurt-142', name: 'Hurt', fileName: 'Swordsman-Hurt.png', frames: 5, fps: 10, loop: false },
      death: { uuid: 'anim-barbarian-ranger-death-143', name: 'Death', fileName: 'Swordsman-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-barbarian-ranger-atk1-001', name: 'Attack 1 Effect', fileName: 'Swordsman-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-barbarian-ranger-atk2-002', name: 'Attack 2 Effect', fileName: 'Swordsman-Attack02_Effect.png', frames: 15, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-barbarian-ranger-atk3-003', name: 'Attack 3 Effect', fileName: 'Swordsman-Attack3_Effect.png', frames: 12, fps: 10, loop: false, isEffect: true },
    },
  },
  {
    id: 'barbarian-mage', race: 'barbarian', heroClass: 'mage',
    folder: 'sprites/characters/Elite Orc/Elite Orc/', effectsFolder: 'sprites/characters/Elite Orc/Elite Orc(Split Effects)/',
    spriteName: 'Elite Orc', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-barbarian-mage-idle-144', name: 'Idle', fileName: 'Elite Orc-Idle.png', frames: 6, fps: 8, loop: true },
      walk: { uuid: 'anim-barbarian-mage-walk-145', name: 'Walk', fileName: 'Elite Orc-Walk.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-barbarian-mage-atk1-146', name: 'Attack 1', fileName: 'Elite Orc-Attack01.png', frames: 7, fps: 12, loop: false },
      attack02: { uuid: 'anim-barbarian-mage-atk2-147', name: 'Attack 2', fileName: 'Elite Orc-Attack02.png', frames: 11, fps: 12, loop: false },
      attack03: { uuid: 'anim-barbarian-mage-atk3-147b', name: 'Attack 3', fileName: 'Elite Orc-Attack03.png', frames: 9, fps: 12, loop: false },
      hurt: { uuid: 'anim-barbarian-mage-hurt-148', name: 'Hurt', fileName: 'Elite Orc-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-barbarian-mage-death-149', name: 'Death', fileName: 'Elite Orc-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-barbarian-mage-atk1-001', name: 'Attack 1 Effect', fileName: 'Elite Orc-Attack01_Effect.png', frames: 7, fps: 12, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-barbarian-mage-atk2-002', name: 'Attack 2 Effect', fileName: 'Elite Orc-Attack02_Effect.png', frames: 11, fps: 12, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-barbarian-mage-atk3-003', name: 'Attack 3 Effect', fileName: 'Elite Orc-Attack03_Effect.png', frames: 9, fps: 12, loop: false, isEffect: true },
    },
  },
  {
    id: 'barbarian-worge', race: 'barbarian', heroClass: 'worge',
    folder: 'sprites/characters/Knight Templar/Knight Templar/', effectsFolder: 'sprites/characters/Knight Templar/Knight Templar(Split Effects)/',
    spriteName: 'Knight Templar', spriteSize: 100,
    animations: {
      idle: { uuid: 'anim-barbarian-worge-idle-150', name: 'Idle', fileName: 'Knight Templar-Idle.png', frames: 6, fps: 8, loop: true },
      walk01: { uuid: 'anim-barbarian-worge-walk1-151', name: 'Walk 1', fileName: 'Knight Templar-Walk01.png', frames: 8, fps: 8, loop: true },
      walk02: { uuid: 'anim-barbarian-worge-walk2-151b', name: 'Walk 2', fileName: 'Knight Templar-Walk02.png', frames: 8, fps: 8, loop: true },
      attack01: { uuid: 'anim-barbarian-worge-atk1-152', name: 'Attack 1', fileName: 'Knight Templar-Attack01.png', frames: 7, fps: 10, loop: false },
      attack02: { uuid: 'anim-barbarian-worge-atk2-153', name: 'Attack 2', fileName: 'Knight Templar-Attack02.png', frames: 8, fps: 10, loop: false },
      attack03: { uuid: 'anim-barbarian-worge-atk3-154', name: 'Attack 3', fileName: 'Knight Templar-Attack03.png', frames: 11, fps: 10, loop: false },
      block: { uuid: 'anim-barbarian-worge-block-154b', name: 'Block', fileName: 'Knight Templar-Block.png', frames: 4, fps: 10, loop: false },
      hurt: { uuid: 'anim-barbarian-worge-hurt-155', name: 'Hurt', fileName: 'Knight Templar-Hurt.png', frames: 4, fps: 10, loop: false },
      death: { uuid: 'anim-barbarian-worge-death-156', name: 'Death', fileName: 'Knight Templar-Death.png', frames: 4, fps: 10, loop: false },
    },
    effects: {
      attack01_effect: { uuid: 'eff-barbarian-worge-atk1-001', name: 'Attack 1 Effect', fileName: 'Knight Templar-Attack01_Effect.png', frames: 7, fps: 10, loop: false, isEffect: true },
      attack02_effect: { uuid: 'eff-barbarian-worge-atk2-002', name: 'Attack 2 Effect', fileName: 'Knight Templar-Attack02_Effect.png', frames: 8, fps: 10, loop: false, isEffect: true },
      attack03_effect: { uuid: 'eff-barbarian-worge-atk3-003', name: 'Attack 3 Effect', fileName: 'Knight Templar-Attack03_Effect.png', frames: 11, fps: 10, loop: false, isEffect: true },
    },
  },
];

export function getHeroById(id: string): HeroSprite | undefined {
  return HERO_SPRITES.find(h => h.id === id);
}

export function getHeroesByRace(race: Race): HeroSprite[] {
  return HERO_SPRITES.filter(h => h.race === race);
}

export function getHeroesByClass(heroClass: HeroClass): HeroSprite[] {
  return HERO_SPRITES.filter(h => h.heroClass === heroClass);
}

export function getSpriteUrl(hero: HeroSprite, animationType: string): string | null {
  const anim = hero.animations[animationType];
  if (!anim) return null;
  return `${hero.folder}${anim.fileName}`;
}

export function getEffectUrl(hero: HeroSprite, effectName: string): string | null {
  if (!hero.effects) return null;
  const effect = hero.effects[effectName];
  if (!effect) return null;
  return `${hero.effectsFolder || hero.folder}${effect.fileName}`;
}

export function getProjectileUrl(hero: HeroSprite, projectileName: string): string | null {
  if (!hero.projectiles) return null;
  const proj = hero.projectiles[projectileName];
  if (!proj) return null;
  return `${hero.folder}${proj.fileName}`;
}

export function getAnimationByUUID(uuid: string): { hero: HeroSprite; animation: SpriteAnimation; type: 'animation' | 'effect' | 'projectile' } | null {
  for (const hero of HERO_SPRITES) {
    for (const [, anim] of Object.entries(hero.animations)) {
      if (anim.uuid === uuid) return { hero, animation: anim, type: 'animation' };
    }
    if (hero.effects) {
      for (const [, effect] of Object.entries(hero.effects)) {
        if (effect.uuid === uuid) return { hero, animation: effect, type: 'effect' };
      }
    }
    if (hero.projectiles) {
      for (const [, proj] of Object.entries(hero.projectiles)) {
        if (proj.uuid === uuid) return { hero, animation: proj, type: 'projectile' };
      }
    }
  }
  return null;
}

export function getAllAnimationUUIDs(): string[] {
  const uuids: string[] = [];
  for (const hero of HERO_SPRITES) {
    for (const anim of Object.values(hero.animations)) {
      uuids.push(anim.uuid);
    }
    if (hero.effects) {
      for (const effect of Object.values(hero.effects)) {
        uuids.push(effect.uuid);
      }
    }
    if (hero.projectiles) {
      for (const proj of Object.values(hero.projectiles)) {
        uuids.push(proj.uuid);
      }
    }
  }
  return uuids;
}
