import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export type AssetType = 'building' | 'character' | 'prop' | 'resource' | 'vehicle' | 'effect' | 'terrain';

export interface AssetDefinition {
  id: string;
  name: string;
  type: AssetType;
  path: string;
  format: 'glb' | 'gltf' | 'fbx';
  scale: number;
  yOffset: number;
  hasAnimations: boolean;
  thumbnail?: string;
  tags: string[];
  category: string;
}

export interface LoadedAsset {
  definition: AssetDefinition;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
}

const ASSET_DEFINITIONS: AssetDefinition[] = [
  {
    id: 'goblin_npc',
    name: 'Goblin NPC',
    type: 'character',
    path: '/models/goblin_npc.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: true,
    tags: ['enemy', 'goblin', 'npc', 'monster'],
    category: 'Characters'
  },
  {
    id: 'goblin_animations',
    name: 'Goblin Animations',
    type: 'character',
    path: '/models/goblin_animations.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: true,
    tags: ['animation', 'goblin'],
    category: 'Characters'
  },
  {
    id: 'barracks',
    name: 'Barracks',
    type: 'building',
    path: '/buildings/barracks.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: false,
    tags: ['military', 'building', 'training'],
    category: 'Buildings'
  },
  {
    id: 'barricade',
    name: 'Barricade',
    type: 'building',
    path: '/buildings/barricade.glb',
    format: 'glb',
    scale: 1.5,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'wall', 'barrier'],
    category: 'Buildings'
  },
  {
    id: 'farm',
    name: 'Farm',
    type: 'building',
    path: '/buildings/farm.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: false,
    tags: ['agriculture', 'food', 'production'],
    category: 'Buildings'
  },
  {
    id: 'fantasy_house',
    name: 'Fantasy House',
    type: 'building',
    path: '/buildings/fantasy_house.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: false,
    tags: ['house', 'residential', 'fantasy'],
    category: 'Buildings'
  },
  {
    id: 'hut',
    name: 'Hut',
    type: 'building',
    path: '/buildings/hut.glb',
    format: 'glb',
    scale: 1.0,
    yOffset: 0,
    hasAnimations: false,
    tags: ['shelter', 'small', 'basic'],
    category: 'Buildings'
  },
  {
    id: 'log_cabin',
    name: 'Log Cabin',
    type: 'building',
    path: '/buildings/log_cabin.glb',
    format: 'glb',
    scale: 1.2,
    yOffset: 0,
    hasAnimations: false,
    tags: ['cabin', 'wood', 'residential'],
    category: 'Buildings'
  },
  {
    id: 'sawmill',
    name: 'Sawmill',
    type: 'building',
    path: '/buildings/sawmill.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['production', 'wood', 'industry', 'lumber'],
    category: 'Production'
  },
  {
    id: 'slaughterhouse',
    name: 'Slaughterhouse',
    type: 'building',
    path: '/buildings/slaughterhouse.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['production', 'meat', 'industry', 'food'],
    category: 'Production'
  },
  {
    id: 'smith',
    name: 'Blacksmith',
    type: 'building',
    path: '/buildings/smith.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['production', 'metal', 'crafting', 'forge'],
    category: 'Production'
  },
  {
    id: 'stairs',
    name: 'Stairs',
    type: 'building',
    path: '/buildings/stairs.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['infrastructure', 'stairs', 'access'],
    category: 'Infrastructure'
  },
  {
    id: 'tower',
    name: 'Tower',
    type: 'building',
    path: '/buildings/tower.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'military', 'fortification'],
    category: 'Defense'
  },
  {
    id: 'tower_corner',
    name: 'Corner Tower',
    type: 'building',
    path: '/buildings/tower_corner.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'military', 'fortification', 'corner'],
    category: 'Defense'
  },
  {
    id: 'tower_round',
    name: 'Round Tower',
    type: 'building',
    path: '/buildings/tower_round.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'military', 'fortification', 'round'],
    category: 'Defense'
  },
  {
    id: 'tower_small',
    name: 'Small Tower',
    type: 'building',
    path: '/buildings/tower_small.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'military', 'watchtower'],
    category: 'Defense'
  },
  {
    id: 'wall',
    name: 'Wall',
    type: 'building',
    path: '/buildings/wall.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'fortification', 'barrier'],
    category: 'Defense'
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    type: 'building',
    path: '/buildings/warehouse.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['storage', 'goods', 'trade'],
    category: 'Storage'
  },
  {
    id: 'windmill',
    name: 'Windmill',
    type: 'building',
    path: '/buildings/windmill.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['production', 'grain', 'food', 'mill'],
    category: 'Production'
  },
  {
    id: 'palisade',
    name: 'Palisade',
    type: 'building',
    path: '/buildings/palisade.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['defense', 'wood', 'wall', 'barrier'],
    category: 'Defense'
  },
  {
    id: 'quarry',
    name: 'Quarry',
    type: 'building',
    path: '/buildings/quarry.fbx',
    format: 'fbx',
    scale: 0.01,
    yOffset: 0,
    hasAnimations: false,
    tags: ['production', 'stone', 'mining', 'resource'],
    category: 'Production'
  }
];

const PIRATE_KIT_CATEGORIES = {
  characters: [
    'Barbossa', 'Captain', 'Crew1', 'Crew2', 'Crew3', 'Elizabeth', 
    'Jack', 'Mermaid', 'Monkey', 'Navy', 'Parrot', 'Will'
  ],
  environment: [
    'Barrel', 'Cage', 'Cannon', 'CannonBall', 'Chest', 'Crate',
    'Flag', 'Helm', 'Ladder', 'Lantern', 'Map', 'Net', 'Plank',
    'Rope', 'Sail', 'Telescope', 'Wheel'
  ],
  props: [
    'Anchor', 'Bell', 'Bucket', 'Compass', 'Coin', 'Gem',
    'Hook', 'Key', 'Knife', 'Mug', 'Ring', 'Scroll', 'Sword'
  ],
  ships: [
    'Sloop', 'Brigantine', 'Galleon', 'Rowboat', 'Raft'
  ]
};

export class AssetLibrary {
  private gltfLoader: GLTFLoader;
  private fbxLoader: FBXLoader;
  private loadedAssets: Map<string, LoadedAsset> = new Map();
  private loadingPromises: Map<string, Promise<LoadedAsset>> = new Map();
  
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
  }
  
  getDefinitions(): AssetDefinition[] {
    return [...ASSET_DEFINITIONS];
  }
  
  getDefinitionsByType(type: AssetType): AssetDefinition[] {
    return ASSET_DEFINITIONS.filter(d => d.type === type);
  }
  
  getDefinitionsByCategory(category: string): AssetDefinition[] {
    return ASSET_DEFINITIONS.filter(d => d.category === category);
  }
  
  getCategories(): string[] {
    const categories = new Set(ASSET_DEFINITIONS.map(d => d.category));
    return Array.from(categories);
  }
  
  searchAssets(query: string): AssetDefinition[] {
    const lowerQuery = query.toLowerCase();
    return ASSET_DEFINITIONS.filter(d => 
      d.name.toLowerCase().includes(lowerQuery) ||
      d.tags.some(t => t.includes(lowerQuery)) ||
      d.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  async loadAsset(id: string): Promise<LoadedAsset | null> {
    if (this.loadedAssets.has(id)) {
      return this.loadedAssets.get(id)!;
    }
    
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }
    
    const definition = ASSET_DEFINITIONS.find(d => d.id === id);
    if (!definition) {
      console.warn(`Asset definition not found: ${id}`);
      return null;
    }
    
    const promise = this.loadAssetFromDefinition(definition);
    this.loadingPromises.set(id, promise);
    
    try {
      const asset = await promise;
      this.loadedAssets.set(id, asset);
      this.loadingPromises.delete(id);
      return asset;
    } catch (error) {
      this.loadingPromises.delete(id);
      console.error(`Failed to load asset ${id}:`, error);
      return null;
    }
  }
  
  private async loadAssetFromDefinition(definition: AssetDefinition): Promise<LoadedAsset> {
    if (definition.format === 'fbx') {
      return this.loadFBXAsset(definition);
    } else {
      return this.loadGLTFAsset(definition);
    }
  }
  
  private async loadGLTFAsset(definition: AssetDefinition): Promise<LoadedAsset> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        definition.path,
        (gltf: GLTF) => {
          const scene = gltf.scene.clone();
          scene.scale.setScalar(definition.scale);
          
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          resolve({
            definition,
            scene,
            animations: gltf.animations || [],
            mixer: definition.hasAnimations ? new THREE.AnimationMixer(scene) : undefined
          });
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  private async loadFBXAsset(definition: AssetDefinition): Promise<LoadedAsset> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        definition.path,
        (fbx: THREE.Group) => {
          const scene = fbx.clone();
          scene.scale.setScalar(definition.scale);
          
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          const animations = (fbx as any).animations || [];
          
          resolve({
            definition,
            scene,
            animations,
            mixer: definition.hasAnimations ? new THREE.AnimationMixer(scene) : undefined
          });
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  async spawnAsset(
    id: string, 
    position: THREE.Vector3, 
    rotation: number = 0
  ): Promise<THREE.Group | null> {
    const asset = await this.loadAsset(id);
    if (!asset) return null;
    
    const instance = asset.scene.clone();
    instance.position.copy(position);
    instance.position.y += asset.definition.yOffset;
    instance.rotation.y = rotation;
    
    instance.userData = {
      assetId: id,
      assetDefinition: asset.definition
    };
    
    return instance;
  }
  
  preloadAssets(ids: string[]): Promise<(LoadedAsset | null)[]> {
    return Promise.all(ids.map(id => this.loadAsset(id)));
  }
  
  clearCache(): void {
    this.loadedAssets.clear();
  }
  
  getCacheSize(): number {
    return this.loadedAssets.size;
  }
  
  getPirateKitCategories(): typeof PIRATE_KIT_CATEGORIES {
    return PIRATE_KIT_CATEGORIES;
  }
  
  addCustomDefinition(definition: AssetDefinition): void {
    const existing = ASSET_DEFINITIONS.findIndex(d => d.id === definition.id);
    if (existing >= 0) {
      ASSET_DEFINITIONS[existing] = definition;
    } else {
      ASSET_DEFINITIONS.push(definition);
    }
  }
}

export const assetLibrary = new AssetLibrary();
