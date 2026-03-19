import type { UnitClass, Faction } from "@shared/schema";

export interface TestHeroAnimations {
  idle: string[];
  walk: string[];
  run: string[];
  jump: string[];
  strafe: string[];
  turn: string[];
  attack: string[];
  slash: string[];
  block: string[];
  impact: string[];
  crouch: string[];
  death: string[];
  special: string[];
}

export interface TestHero {
  id: string;
  name: string;
  title: string;
  race: string;
  faction: Faction;
  unitClass: UnitClass;
  level: number;
  age: number;
  backstory: string;
  startingLocation: string;
  modelPath: string;
  texturePath?: string;
  animations: TestHeroAnimations;
  voiceLines?: string[];
  traits: string[];
  startingWeapons: string[];
}

const RACALVIN_BASE_PATH = 'attached_assets/RacalvinDaWarrior';

export const TEST_HEROES: TestHero[] = [
  {
    id: 'racalvin_gruda',
    name: "Rac'al'vin Gruda",
    title: 'The Young Warlord',
    race: 'orc',
    faction: 'legion',
    unitClass: 'warrior',
    level: 1,
    age: 12,
    backstory: `Born to the Gruda clan in the volcanic badlands of the southern Legion territory, Rac'al'vin showed exceptional strength even as a child. At age 10, slavers from a rival pirate faction raided his village during the Festival of Flames, capturing him along with other young orcs.

For two years he endured captivity, learning to survive, to wait, and to hate. On the voyage to Waterfall Island where he was to be sold as a servant, fate intervened. A massive kraken, drawn by the magical energies of the island's eternal waterfall, attacked the slaver vessel.

In the chaos of splintering wood and drowning screams, young Rac'al'vin found himself washed upon the sacred shores of the neutral zone - free, alone, and burning with the determination to become strong enough that no one would ever chain him again.

He would grow to become the legendary Orc Hero of War, but on that day, he was simply a 12-year-old boy finding a sword and shield in the sand, ready to fight for his survival.`,
    startingLocation: 'waterfall_isle',
    modelPath: `${RACALVIN_BASE_PATH}/Meshy_AI_Orc_Warlord_Render_1220104017_texture_fbx.fbx`,
    animations: {
      idle: [
        `${RACALVIN_BASE_PATH}/sword and shield idle.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield idle (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield idle (3).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield idle (4).fbx`,
      ],
      walk: [
        `${RACALVIN_BASE_PATH}/sword and shield walk.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield walk (2).fbx`,
      ],
      run: [
        `${RACALVIN_BASE_PATH}/sword and shield run.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield run (2).fbx`,
      ],
      jump: [
        `${RACALVIN_BASE_PATH}/sword and shield jump.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield jump (2).fbx`,
      ],
      strafe: [
        `${RACALVIN_BASE_PATH}/sword and shield strafe.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield strafe (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield strafe (3).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield strafe (4).fbx`,
      ],
      turn: [
        `${RACALVIN_BASE_PATH}/sword and shield turn.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield turn (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield 180 turn.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield 180 turn (2).fbx`,
      ],
      attack: [
        `${RACALVIN_BASE_PATH}/sword and shield attack.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield attack (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield attack (3).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield attack (4).fbx`,
      ],
      slash: [
        `${RACALVIN_BASE_PATH}/sword and shield slash.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield slash (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield slash (3).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield slash (4).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield slash (5).fbx`,
      ],
      block: [
        `${RACALVIN_BASE_PATH}/sword and shield block.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield block (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield block idle.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouch block.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouch block (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouch block idle.fbx`,
      ],
      impact: [
        `${RACALVIN_BASE_PATH}/sword and shield impact.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield impact (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield impact (3).fbx`,
      ],
      crouch: [
        `${RACALVIN_BASE_PATH}/sword and shield crouch.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouch idle.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouching.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouching (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield crouching (3).fbx`,
      ],
      death: [
        `${RACALVIN_BASE_PATH}/sword and shield death.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield death (2).fbx`,
      ],
      special: [
        `${RACALVIN_BASE_PATH}/sword and shield kick.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield casting.fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield casting (2).fbx`,
        `${RACALVIN_BASE_PATH}/sword and shield power up.fbx`,
        `${RACALVIN_BASE_PATH}/draw sword 1.fbx`,
        `${RACALVIN_BASE_PATH}/draw sword 2.fbx`,
        `${RACALVIN_BASE_PATH}/sheath sword 1.fbx`,
        `${RACALVIN_BASE_PATH}/sheath sword 2.fbx`,
      ],
    },
    traits: ['survivor', 'vengeful', 'determined', 'young_prodigy'],
    startingWeapons: ['rusty_sword', 'driftwood_shield'],
  },
];

export function getTestHeroById(id: string): TestHero | undefined {
  return TEST_HEROES.find(hero => hero.id === id);
}

export function getTestHeroesByFaction(faction: Faction): TestHero[] {
  return TEST_HEROES.filter(hero => hero.faction === faction);
}

export function getTestHeroesByClass(unitClass: UnitClass): TestHero[] {
  return TEST_HEROES.filter(hero => hero.unitClass === unitClass);
}

export function getTestHeroesByRace(race: string): TestHero[] {
  return TEST_HEROES.filter(hero => hero.race === race);
}

export interface CinematicScene {
  id: string;
  name: string;
  duration: number;
  cameraKeyframes: CameraKeyframe[];
  events: CinematicEvent[];
  audio?: string;
}

export interface CameraKeyframe {
  time: number;
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  fov?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface CinematicEvent {
  time: number;
  type: 'spawn' | 'animate' | 'effect' | 'sound' | 'text' | 'fadeIn' | 'fadeOut' | 'shake';
  target?: string;
  data: Record<string, unknown>;
}

export const INTRO_CINEMATIC: CinematicScene = {
  id: 'racalvin_intro',
  name: "Rac'al'vin's Awakening",
  duration: 60,
  cameraKeyframes: [
    { time: 0, position: { x: 0, y: 2, z: 5 }, lookAt: { x: 0, y: 1.5, z: 0 }, fov: 50, easing: 'easeInOut' },
    { time: 5, position: { x: -50, y: 10, z: 100 }, lookAt: { x: 0, y: 5, z: 0 }, fov: 60, easing: 'easeInOut' },
    { time: 15, position: { x: -200, y: 50, z: 300 }, lookAt: { x: 0, y: 100, z: -100 }, fov: 70, easing: 'easeInOut' },
    { time: 25, position: { x: -100, y: 30, z: 200 }, lookAt: { x: 50, y: 0, z: 150 }, fov: 65, easing: 'easeIn' },
    { time: 35, position: { x: -80, y: 20, z: 180 }, lookAt: { x: 0, y: 10, z: 100 }, fov: 55, easing: 'easeOut' },
    { time: 45, position: { x: 20, y: 3, z: 30 }, lookAt: { x: 0, y: 1, z: 0 }, fov: 50, easing: 'easeInOut' },
    { time: 55, position: { x: 5, y: 2, z: 8 }, lookAt: { x: 0, y: 1.2, z: 0 }, fov: 45, easing: 'easeOut' },
  ],
  events: [
    { time: 0, type: 'spawn', target: 'racalvin', data: { position: { x: 0, y: 0, z: 0 }, animation: 'shackled_idle' } },
    { time: 0, type: 'spawn', target: 'slaver_ship', data: { position: { x: 0, y: 0, z: 0 }, scale: 1 } },
    { time: 0, type: 'text', data: { text: 'The Shattered Seas...', position: 'bottom', duration: 4 } },
    { time: 5, type: 'text', data: { text: 'A young orc, bound in chains, destined for slavery...', position: 'bottom', duration: 5 } },
    { time: 12, type: 'spawn', target: 'waterfall_island', data: { position: { x: 0, y: 0, z: -500 } } },
    { time: 15, type: 'effect', data: { type: 'waterfall_particles', intensity: 1.0 } },
    { time: 15, type: 'text', data: { text: 'Waterfall Isle - The Neutral Sanctuary', position: 'center', duration: 4 } },
    { time: 22, type: 'spawn', target: 'tentacle_1', data: { position: { x: 30, y: -20, z: 50 }, animation: 'emerge' } },
    { time: 24, type: 'spawn', target: 'tentacle_2', data: { position: { x: -40, y: -20, z: 60 }, animation: 'emerge' } },
    { time: 26, type: 'spawn', target: 'tentacle_3', data: { position: { x: 0, y: -25, z: 80 }, animation: 'emerge' } },
    { time: 28, type: 'shake', data: { intensity: 0.5, duration: 2 } },
    { time: 30, type: 'animate', target: 'tentacle_1', data: { animation: 'attack' } },
    { time: 31, type: 'animate', target: 'tentacle_2', data: { animation: 'attack' } },
    { time: 32, type: 'animate', target: 'tentacle_3', data: { animation: 'attack' } },
    { time: 33, type: 'effect', data: { type: 'ship_destruction', particles: 'wood_splinters' } },
    { time: 33, type: 'shake', data: { intensity: 1.0, duration: 3 } },
    { time: 33, type: 'sound', data: { sound: 'ship_breaking', volume: 1.0 } },
    { time: 36, type: 'fadeOut', data: { duration: 2, color: 'black' } },
    { time: 40, type: 'text', data: { text: 'Hours later...', position: 'center', duration: 3 } },
    { time: 43, type: 'fadeIn', data: { duration: 2 } },
    { time: 45, type: 'spawn', target: 'racalvin_beach', data: { position: { x: 0, y: 0, z: 0 }, animation: 'lying_down' } },
    { time: 45, type: 'spawn', target: 'beach_sword', data: { position: { x: 3, y: 0, z: 2 }, glow: true } },
    { time: 45, type: 'spawn', target: 'beach_shield', data: { position: { x: -2, y: 0, z: 3 }, glow: true } },
    { time: 48, type: 'animate', target: 'racalvin_beach', data: { animation: 'wake_up' } },
    { time: 52, type: 'spawn', target: 'surviving_pirate_1', data: { position: { x: 15, y: 0, z: 10 }, animation: 'idle_hostile' } },
    { time: 52, type: 'spawn', target: 'surviving_pirate_2', data: { position: { x: 20, y: 0, z: 8 }, animation: 'idle_hostile' } },
    { time: 55, type: 'text', data: { text: 'Find your weapons. Survive.', position: 'center', duration: 4 } },
  ],
};

export const CINEMATIC_ASSETS = {
  tentacles: [
    'attached_assets/Tentacle_1768390389925.glb',
    'attached_assets/Tentacledrop_1768390394083.glb',
    'attached_assets/Octopus_1768390386433.glb',
    'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Characters_Tentacle.gltf',
    'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Enemy_Tentacle.gltf',
  ],
  ships: [
    'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Ship_Large.gltf',
    'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Ship_Large_Damaged.gltf',
  ],
  waterfallIsland: 'attached_assets/waterfall_diorama/scene.gltf',
  weapons: {
    sword: 'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Weapon_Sword.gltf',
    shield: 'attached_assets/pirate_kit/Pirate Kit - Nov 2023/glTF/Weapon_Shield.gltf',
  },
};
