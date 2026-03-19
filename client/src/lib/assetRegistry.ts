export type AssetCategory = 'character' | 'animation' | 'npc' | 'creature' | 'prop' | 'effect';
export type AssetFormat = 'fbx' | 'glb' | 'gltf';

export interface AssetTexture {
  name: string;
  path: string;
  type: 'diffuse' | 'normal' | 'specular' | 'ao' | 'emissive';
}

export interface AssetAnimation {
  name: string;
  path: string;
  duration?: number;
  loop?: boolean;
}

export interface Asset3D {
  id: string;
  name: string;
  category: AssetCategory;
  sourcePath: string;
  glbPath?: string;
  textures: AssetTexture[];
  animations: AssetAnimation[];
  hasSkeleton: boolean;
  skeletonType?: 'humanoid' | 'quadruped' | 'custom';
  scale: number;
  tags: string[];
  license?: string;
  converted: boolean;
}

export const ASSET_REGISTRY: Asset3D[] = [
  {
    id: 'bambi',
    name: 'Bambi',
    category: 'character',
    sourcePath: 'attached_assets/CharacterExport/AllStarCharacters/Bambi/Bambi.FBX',
    glbPath: '/assets/models/characters/bambi.glb',
    textures: [
      { name: 'Bambi', path: 'attached_assets/CharacterExport/AllStarCharacters/Bambi/Bambi.png', type: 'diffuse' }
    ],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['player', 'humanoid', 'allstar'],
    converted: false
  },
  {
    id: 'villhelm',
    name: 'VillHelm',
    category: 'character',
    sourcePath: 'attached_assets/CharacterExport/AllStarCharacters/VillHelm/VillHelm.FBX',
    glbPath: '/assets/models/characters/villhelm.glb',
    textures: [
      { name: 'VillHem', path: 'attached_assets/CharacterExport/AllStarCharacters/VillHelm/VillHem.png', type: 'diffuse' }
    ],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['player', 'humanoid', 'allstar', 'villain'],
    converted: false
  },
  {
    id: 'forest_monster',
    name: 'Forest Monster',
    category: 'creature',
    sourcePath: 'attached_assets/CharacterExport/Models/(Public Domain) Forest Monster/forest-monster-final.fbx',
    glbPath: '/assets/models/npcs/forest_monster.glb',
    textures: [
      { name: 'Skin', path: 'attached_assets/CharacterExport/Models/(Public Domain) Forest Monster/Textures/forest-monster-skin.png', type: 'diffuse' },
      { name: 'Normal', path: 'attached_assets/CharacterExport/Models/(Public Domain) Forest Monster/Textures/forest-monster-norm.png', type: 'normal' },
      { name: 'AO', path: 'attached_assets/CharacterExport/Models/(Public Domain) Forest Monster/Textures/forest-monster-AO.png', type: 'ao' },
      { name: 'Specular', path: 'attached_assets/CharacterExport/Models/(Public Domain) Forest Monster/Textures/forest-monster-spec.png', type: 'specular' }
    ],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['monster', 'enemy', 'forest', 'public_domain'],
    license: 'Public Domain',
    converted: false
  },
  {
    id: 'horse',
    name: 'Horse',
    category: 'creature',
    sourcePath: 'attached_assets/CharacterExport/Models/(Public Domain) Horse/horse.FBX',
    glbPath: '/assets/models/npcs/horse.glb',
    textures: [
      { name: 'Main', path: 'attached_assets/CharacterExport/Models/(Public Domain) Horse/HorseMain4k00.png', type: 'diffuse' },
      { name: 'Normal', path: 'attached_assets/CharacterExport/Models/(Public Domain) Horse/HorseMain4k00Norm00.p.png', type: 'normal' },
      { name: 'AO', path: 'attached_assets/CharacterExport/Models/(Public Domain) Horse/HorseMain4k00AO00.png', type: 'ao' },
      { name: 'Hair', path: 'attached_assets/CharacterExport/Models/(Public Domain) Horse/Hair12Main2k.png', type: 'diffuse' }
    ],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'quadruped',
    scale: 1,
    tags: ['mount', 'animal', 'horse', 'public_domain'],
    license: 'Public Domain',
    converted: false
  },
  {
    id: 'archer',
    name: 'Archer',
    category: 'character',
    sourcePath: 'attached_assets/CharacterExport/Models/Archer/Archer.fbx',
    glbPath: '/assets/models/characters/archer.glb',
    textures: [],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['player', 'humanoid', 'ranged', 'class'],
    converted: false
  },
  {
    id: 'skeleton_monster',
    name: 'Skeleton Monster',
    category: 'creature',
    sourcePath: 'attached_assets/CharacterExport/Models/SkeletonNew/Models/SkeletonMonster2KPoly.fbx',
    glbPath: '/assets/models/npcs/skeleton_monster.glb',
    textures: [
      { name: 'Skeleton', path: 'attached_assets/CharacterExport/Models/SkeletonNew/Texture/SkeletonMonster.tga', type: 'diffuse' }
    ],
    animations: [],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['enemy', 'undead', 'skeleton'],
    converted: false
  },
  {
    id: 'racalvin_gruda',
    name: "Rac'al'vin Gruda",
    category: 'character',
    sourcePath: 'attached_assets/RacalvinDaWarrior/Meshy_AI_Orc_Warlord_Render_1220104017_texture_fbx.fbx',
    glbPath: '/assets/models/heroes/racalvin_gruda.glb',
    textures: [],
    animations: [
      { name: 'Idle', path: 'attached_assets/RacalvinDaWarrior/sword and shield idle.fbx', loop: true },
      { name: 'Walk', path: 'attached_assets/RacalvinDaWarrior/sword and shield walk.fbx', loop: true },
      { name: 'Run', path: 'attached_assets/RacalvinDaWarrior/sword and shield run.fbx', loop: true },
      { name: 'Attack', path: 'attached_assets/RacalvinDaWarrior/sword and shield attack.fbx', loop: false },
      { name: 'Slash', path: 'attached_assets/RacalvinDaWarrior/sword and shield slash.fbx', loop: false },
      { name: 'Block', path: 'attached_assets/RacalvinDaWarrior/sword and shield block.fbx', loop: false },
      { name: 'Death', path: 'attached_assets/RacalvinDaWarrior/sword and shield death.fbx', loop: false },
      { name: 'Draw Sword', path: 'attached_assets/RacalvinDaWarrior/draw sword 1.fbx', loop: false },
    ],
    hasSkeleton: true,
    skeletonType: 'humanoid',
    scale: 1,
    tags: ['hero', 'test_hero', 'orc', 'warrior', 'legion', 'player'],
    license: 'Meshy AI',
    converted: false
  },
  {
    id: 'tentacle',
    name: 'Kraken Tentacle',
    category: 'creature',
    sourcePath: 'attached_assets/Tentacle_1768390389925.glb',
    textures: [],
    animations: [],
    hasSkeleton: false,
    scale: 1,
    tags: ['sea_creature', 'kraken', 'tentacle', 'enemy', 'cinematic'],
    converted: true
  },
  {
    id: 'octopus',
    name: 'Octopus',
    category: 'creature',
    sourcePath: 'attached_assets/Octopus_1768390386433.glb',
    textures: [],
    animations: [],
    hasSkeleton: false,
    scale: 1,
    tags: ['sea_creature', 'octopus', 'enemy'],
    converted: true
  }
];

export const ANIMATION_REGISTRY: AssetAnimation[] = [
  { name: 'Idle Jump Up', path: 'attached_assets/CharacterExport/Animations/From Standard Assets ThirdPersonCharacter/HumanoidIdleJumpUp.fbx', loop: false },
  { name: 'Jump And Fall', path: 'attached_assets/CharacterExport/Animations/From Standard Assets ThirdPersonCharacter/HumanoidJumpAndFall.fbx', loop: false },
  { name: 'Mid Air', path: 'attached_assets/CharacterExport/Animations/From Standard Assets ThirdPersonCharacter/HumanoidMidAir.fbx', loop: true },
  { name: 'Swimming', path: 'attached_assets/CharacterExport/Animations/MocapUTD/MCP_swimming.fbx', loop: true },
  { name: 'Idle', path: 'attached_assets/CharacterExport/Players/Player Animation/Idle.fbx', loop: true },
  { name: 'Bboy Hip Hop Move', path: 'attached_assets/CharacterExport/Players/Player Animation/Bboy Hip Hop Move.fbx', loop: true },
  { name: 'Climbing Ladder', path: 'attached_assets/CharacterExport/Players/Player Animation/Climbing Ladder.fbx', loop: true },
  { name: 'Cover To Stand', path: 'attached_assets/CharacterExport/Players/Player Animation/Cover To Stand.fbx', loop: false },
  { name: 'Crouch Idle', path: 'attached_assets/CharacterExport/Players/Player Animation/Crouch Idle.fbx', loop: true },
  { name: 'Dancing Running Man', path: 'attached_assets/CharacterExport/Players/Player Animation/Dancing Running Man.fbx', loop: true },
  { name: 'Disarmed', path: 'attached_assets/CharacterExport/Players/Player Animation/Disarmed.fbx', loop: false },
  { name: 'Dual Weapon Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/Dual Weapon Combo.fbx', loop: false },
  { name: 'Great Sword Slash', path: 'attached_assets/CharacterExport/Players/Player Animation/Great Sword Slash.fbx', loop: false },
  { name: 'Hip Hop Dancing', path: 'attached_assets/CharacterExport/Players/Player Animation/Hip Hop Dancing.fbx', loop: true },
  { name: 'Kick', path: 'attached_assets/CharacterExport/Players/Player Animation/Kick.fbx', loop: false },
  { name: 'Look Over Shoulder', path: 'attached_assets/CharacterExport/Players/Player Animation/Look Over Shoulder.fbx', loop: false },
  { name: 'Male Sitting Pose', path: 'attached_assets/CharacterExport/Players/Player Animation/Male Sitting Pose.fbx', loop: true },
  { name: 'Northern Soul Spin Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/Northern Soul Spin Combo.fbx', loop: false },
  { name: 'One Hand Club Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/One Hand Club Combo.fbx', loop: false },
  { name: 'One Hand Sword Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/One Hand Sword Combo.fbx', loop: false },
  { name: 'Patting', path: 'attached_assets/CharacterExport/Players/Player Animation/Patting.fbx', loop: true },
  { name: 'Reacting', path: 'attached_assets/CharacterExport/Players/Player Animation/Reacting.fbx', loop: false },
  { name: 'Silly Dancing', path: 'attached_assets/CharacterExport/Players/Player Animation/Silly Dancing.fbx', loop: true },
  { name: 'Spell Casting', path: 'attached_assets/CharacterExport/Players/Player Animation/Spell Casting.fbx', loop: false },
  { name: 'Standing 1H Cast Spell', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 1H Cast Spell 01.fbx', loop: false },
  { name: 'Standing 2H Cast Spell', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Cast Spell 01.fbx', loop: false },
  { name: 'Standing 2H Magic Area Attack 01', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Magic Area Attack 01.fbx', loop: false },
  { name: 'Standing 2H Magic Area Attack 02', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Magic Area Attack 02.fbx', loop: false },
  { name: 'Standing 2H Magic Attack 01', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Magic Attack 01.fbx', loop: false },
  { name: 'Standing 2H Magic Attack 03', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Magic Attack 03.fbx', loop: false },
  { name: 'Standing 2H Magic Attack 04', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing 2H Magic Attack 04.fbx', loop: false },
  { name: 'Standing Taunt Battlecry', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing Taunt Battlecry.fbx', loop: false },
  { name: 'Standing To Crouch', path: 'attached_assets/CharacterExport/Players/Player Animation/Standing To Crouch.fbx', loop: false },
  { name: 'Swagger Walk', path: 'attached_assets/CharacterExport/Players/Player Animation/Swagger Walk.fbx', loop: true },
  { name: 'Sword And Shield Attack', path: 'attached_assets/CharacterExport/Players/Player Animation/Sword And Shield Attack.fbx', loop: false },
  { name: 'Sword And Shield Casting', path: 'attached_assets/CharacterExport/Players/Player Animation/Sword And Shield Casting.fbx', loop: false },
  { name: 'Sword And Shield Power Up', path: 'attached_assets/CharacterExport/Players/Player Animation/Sword And Shield Power Up.fbx', loop: false },
  { name: 'Sword And Shield Slash', path: 'attached_assets/CharacterExport/Players/Player Animation/Sword And Shield Slash.fbx', loop: false },
  { name: 'Throw Object', path: 'attached_assets/CharacterExport/Players/Player Animation/Throw Object.fbx', loop: false },
  { name: 'Two Hand Club Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/Two Hand Club Combo.fbx', loop: false },
  { name: 'Two Hand Sword Combo', path: 'attached_assets/CharacterExport/Players/Player Animation/Two Hand Sword Combo.fbx', loop: false }
];

export const RACE_ICONS: Record<string, string> = {
  barbarian: 'attached_assets/CharacterExport/Players/BarbarianIcon.png',
  dwarf: 'attached_assets/CharacterExport/Players/DwarveIcon.png',
  elf: 'attached_assets/CharacterExport/Players/ElfIcon.png',
  human: 'attached_assets/CharacterExport/Players/HumanIcon.png',
  orc: 'attached_assets/CharacterExport/Players/OrcIcon.png',
  undead: 'attached_assets/CharacterExport/Players/UndeadIcon.png'
};

export function getAssetsByCategory(category: AssetCategory): Asset3D[] {
  return ASSET_REGISTRY.filter(a => a.category === category);
}

export function getAssetsByTag(tag: string): Asset3D[] {
  return ASSET_REGISTRY.filter(a => a.tags.includes(tag));
}

export function getConvertedAssets(): Asset3D[] {
  return ASSET_REGISTRY.filter(a => a.converted);
}

export function getAnimationsByType(type: 'combat' | 'movement' | 'emote' | 'all'): AssetAnimation[] {
  if (type === 'all') return ANIMATION_REGISTRY;
  
  const combatKeywords = ['sword', 'slash', 'attack', 'combo', 'kick', 'cast', 'spell', 'magic', 'weapon'];
  const movementKeywords = ['idle', 'walk', 'run', 'jump', 'climb', 'swim', 'crouch', 'stand'];
  const emoteKeywords = ['dance', 'hip hop', 'silly', 'taunt', 'sitting', 'patting', 'reacting'];
  
  return ANIMATION_REGISTRY.filter(anim => {
    const name = anim.name.toLowerCase();
    if (type === 'combat') return combatKeywords.some(k => name.includes(k));
    if (type === 'movement') return movementKeywords.some(k => name.includes(k));
    if (type === 'emote') return emoteKeywords.some(k => name.includes(k));
    return true;
  });
}
