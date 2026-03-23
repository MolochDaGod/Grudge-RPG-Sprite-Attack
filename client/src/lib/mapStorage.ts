// Map storage — save/load custom maps via puter.kv
import { isPuterAvailable, isSignedIn } from "./puterAuth";

export interface PlacedAsset {
  uid: string;       // unique placement id
  assetId: string;   // references MapAssetDef.id
  x: number;         // world x
  y: number;         // world y
  w: number;         // rendered width
  h: number;         // rendered height
  rotation?: number;
  flipX?: boolean;
  layer: "bg" | "main" | "fg"; // render order
  isCollider?: boolean; // acts as solid platform
}

export interface MapPlatform {
  x: number;
  y: number;
  w: number;
  oneWay: boolean;
}

export interface CustomMapData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Game stage params
  mainFloorY: number;
  mainFloorX: number;
  mainFloorW: number;
  platforms: MapPlatform[];
  blastZone: { top: number; bottom: number; left: number; right: number };
  bgColor1: string;
  bgColor2: string;
  bgFeatures: string;

  // Visual assets placed on the map
  assets: PlacedAsset[];

  // Canvas dimensions (editor working area)
  canvasW: number;
  canvasH: number;
}

const MAP_KEY_PREFIX = "grudge_map_";

export function newMapData(name = "Untitled Map"): CustomMapData {
  return {
    id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mainFloorY: 700,
    mainFloorX: 360,
    mainFloorW: 1200,
    platforms: [],
    blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
    bgColor1: "#0c1a0c",
    bgColor2: "#1a2e1a",
    bgFeatures: "castle",
    assets: [],
    canvasW: 1920,
    canvasH: 1080,
  };
}

export async function saveMap(map: CustomMapData): Promise<boolean> {
  if (!isPuterAvailable() || !isSignedIn()) {
    // Fallback to localStorage
    try {
      localStorage.setItem(MAP_KEY_PREFIX + map.id, JSON.stringify({ ...map, updatedAt: new Date().toISOString() }));
      return true;
    } catch { return false; }
  }
  try {
    await window.puter.kv.set(MAP_KEY_PREFIX + map.id, { ...map, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.error("Failed to save map:", e);
    return false;
  }
}

export async function loadMap(mapId: string): Promise<CustomMapData | null> {
  if (!isPuterAvailable() || !isSignedIn()) {
    try {
      const raw = localStorage.getItem(MAP_KEY_PREFIX + mapId);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  try {
    const data = await window.puter.kv.get(MAP_KEY_PREFIX + mapId);
    return data as CustomMapData | null;
  } catch { return null; }
}

export async function listMaps(): Promise<{ id: string; name: string; updatedAt: string }[]> {
  if (!isPuterAvailable() || !isSignedIn()) {
    // Fallback localStorage
    const results: { id: string; name: string; updatedAt: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MAP_KEY_PREFIX)) {
        try {
          const d = JSON.parse(localStorage.getItem(key)!) as CustomMapData;
          results.push({ id: d.id, name: d.name, updatedAt: d.updatedAt });
        } catch { /* skip */ }
      }
    }
    return results;
  }
  try {
    const entries = await window.puter.kv.list({ prefix: MAP_KEY_PREFIX });
    return entries.map(e => {
      const d = e.value as CustomMapData;
      return { id: d.id, name: d.name, updatedAt: d.updatedAt };
    });
  } catch { return []; }
}

export async function deleteMap(mapId: string): Promise<boolean> {
  if (!isPuterAvailable() || !isSignedIn()) {
    try { localStorage.removeItem(MAP_KEY_PREFIX + mapId); return true; } catch { return false; }
  }
  try {
    await window.puter.kv.del(MAP_KEY_PREFIX + mapId);
    return true;
  } catch { return false; }
}

// Convert custom map → game StageDefinition shape (used by GrudgeFighter2D)
export function mapToStage(map: CustomMapData) {
  return {
    id: map.id,
    name: map.name,
    mainFloorY: map.mainFloorY,
    mainFloorX: map.mainFloorX,
    mainFloorW: map.mainFloorW,
    platforms: map.platforms.map(p => ({ x: p.x, y: p.y, w: p.w, oneWay: p.oneWay })),
    blastZone: { ...map.blastZone },
    bgColor1: map.bgColor1,
    bgColor2: map.bgColor2,
    floorColor: "#4a7a30",
    platformColor: "#5a8a3a",
    bgFeatures: map.bgFeatures,
    customAssets: map.assets,
    isCustom: true,
  };
}
