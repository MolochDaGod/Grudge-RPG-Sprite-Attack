import type { Tile, TerrainType } from "@shared/schema";

export interface HeightMapTile extends Tile {
  height: 0 | 1 | 2;
  isRamp: boolean;
  rampDirection?: 'north' | 'south' | 'east' | 'west';
  isWall: boolean;
  wallSides?: ('north' | 'south' | 'east' | 'west')[];
}

export interface HeightMapConfig {
  width: number;
  height: number;
  baseHeight?: 0 | 1 | 2;
  elevated2Percent?: number;
  elevated1Percent?: number;
  wallPercent?: number;
}

const TERRAIN_HEIGHT_COLORS: Record<number, Record<TerrainType, string>> = {
  0: {
    grass: "bg-green-700 dark:bg-green-800",
    stone: "bg-stone-500 dark:bg-stone-700",
    water: "bg-blue-600 dark:bg-blue-700",
    forest: "bg-emerald-800 dark:bg-emerald-900",
    mountain: "bg-slate-600 dark:bg-slate-800",
    sand: "bg-amber-400 dark:bg-amber-600",
  },
  1: {
    grass: "bg-green-600 dark:bg-green-700",
    stone: "bg-stone-400 dark:bg-stone-600",
    water: "bg-blue-500 dark:bg-blue-600",
    forest: "bg-emerald-700 dark:bg-emerald-800",
    mountain: "bg-slate-500 dark:bg-slate-700",
    sand: "bg-amber-300 dark:bg-amber-500",
  },
  2: {
    grass: "bg-green-500 dark:bg-green-600",
    stone: "bg-stone-300 dark:bg-stone-500",
    water: "bg-blue-400 dark:bg-blue-500",
    forest: "bg-emerald-600 dark:bg-emerald-700",
    mountain: "bg-slate-400 dark:bg-slate-600",
    sand: "bg-amber-200 dark:bg-amber-400",
  },
};

export function getTerrainColorByHeight(terrain: TerrainType, height: number): string {
  const heightLevel = Math.min(2, Math.max(0, height)) as 0 | 1 | 2;
  return TERRAIN_HEIGHT_COLORS[heightLevel][terrain] || TERRAIN_HEIGHT_COLORS[0].grass;
}

export function generateTacticalHeightMap(config: HeightMapConfig): HeightMapTile[] {
  const {
    width,
    height,
    baseHeight = 0,
    elevated2Percent = 0.15,
    elevated1Percent = 0.25,
    wallPercent = 0.08,
  } = config;

  const tiles: HeightMapTile[] = [];
  const terrainTypes: TerrainType[] = ["grass", "stone", "forest", "sand"];

  const heightMap: number[][] = Array(height).fill(null).map(() => 
    Array(width).fill(baseHeight)
  );

  const numElevated2Clusters = Math.floor((width * height * elevated2Percent) / 6);
  for (let i = 0; i < numElevated2Clusters; i++) {
    const cx = Math.floor(Math.random() * (width - 2)) + 1;
    const cy = Math.floor(Math.random() * (height - 2)) + 1;
    const size = Math.floor(Math.random() * 3) + 2;
    
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist <= size) {
            heightMap[ny][nx] = 2;
          }
        }
      }
    }
  }

  const numElevated1Clusters = Math.floor((width * height * elevated1Percent) / 4);
  for (let i = 0; i < numElevated1Clusters; i++) {
    const cx = Math.floor(Math.random() * (width - 2)) + 1;
    const cy = Math.floor(Math.random() * (height - 2)) + 1;
    const size = Math.floor(Math.random() * 2) + 2;
    
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && heightMap[ny][nx] === 0) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist <= size) {
            heightMap[ny][nx] = 1;
          }
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const currentHeight = heightMap[y][x] as 0 | 1 | 2;
      const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
      
      let isRamp = false;
      let rampDirection: 'north' | 'south' | 'east' | 'west' | undefined;
      let isWall = false;
      const wallSides: ('north' | 'south' | 'east' | 'west')[] = [];

      const neighbors = {
        north: y > 0 ? heightMap[y - 1][x] : currentHeight,
        south: y < height - 1 ? heightMap[y + 1][x] : currentHeight,
        east: x < width - 1 ? heightMap[y][x + 1] : currentHeight,
        west: x > 0 ? heightMap[y][x - 1] : currentHeight,
      };

      for (const [dir, neighborHeight] of Object.entries(neighbors)) {
        const heightDiff = currentHeight - neighborHeight;
        if (heightDiff > 0) {
          if (!isRamp && Math.random() < 0.4) {
            isRamp = true;
            rampDirection = dir as typeof rampDirection;
          } else if (Math.random() < wallPercent) {
            isWall = true;
            wallSides.push(dir as 'north' | 'south' | 'east' | 'west');
          }
        }
      }

      tiles.push({
        x,
        y,
        terrain,
        elevation: currentHeight,
        isHighlighted: false,
        height: currentHeight,
        isRamp,
        rampDirection,
        isWall,
        wallSides: wallSides.length > 0 ? wallSides : undefined,
      });
    }
  }

  return tiles;
}

export function canMoveToTile(
  from: HeightMapTile,
  to: HeightMapTile,
  tiles: HeightMapTile[]
): boolean {
  const heightDiff = Math.abs(to.height - from.height);
  
  if (heightDiff === 0) return true;
  
  if (heightDiff === 1) {
    if (from.isRamp || to.isRamp) return true;
    return false;
  }
  
  if (heightDiff > 1) return false;
  
  if (to.isWall) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 1 && to.wallSides?.includes('west')) return false;
    if (dx === -1 && to.wallSides?.includes('east')) return false;
    if (dy === 1 && to.wallSides?.includes('north')) return false;
    if (dy === -1 && to.wallSides?.includes('south')) return false;
  }
  
  return true;
}

export function getHeightAdvantage(
  attackerHeight: number,
  defenderHeight: number
): { damageModifier: number; hitModifier: number } {
  const heightDiff = attackerHeight - defenderHeight;
  
  if (heightDiff > 0) {
    return { 
      damageModifier: 1 + (heightDiff * 0.15),
      hitModifier: 1 + (heightDiff * 0.10),
    };
  } else if (heightDiff < 0) {
    return {
      damageModifier: 1 + (heightDiff * 0.10),
      hitModifier: 1 + (heightDiff * 0.05),
    };
  }
  
  return { damageModifier: 1, hitModifier: 1 };
}
