// Map editor asset registry — all available sprites from craftpix packs
// Jump Items: /mapassets/jump-items/PNG/
// Tileset:    /mapassets/tileset/

export type AssetCategory =
  | "tiles"
  | "platforms"
  | "props"
  | "trees"
  | "rocks"
  | "grass"
  | "boxes"
  | "food"
  | "spikes"
  | "ladders"
  | "pointers"
  | "backgrounds"
  | "animated";

export interface MapAssetDef {
  id: string;
  name: string;
  category: AssetCategory;
  src: string;           // public-relative path
  tileW?: number;        // expected width for grid snapping (px on canvas)
  tileH?: number;        // expected height
  isDecoration?: boolean; // purely visual, no collision
}

// ─── Tileset individual tiles ────────────────────────────────────
function tile(idx: number): MapAssetDef {
  const n = String(idx).padStart(2, "0");
  return {
    id: `tile_${n}`,
    name: `Tile ${n}`,
    category: "tiles",
    src: `/mapassets/tileset/Tiles/Tileset/TileSet_${n}.png`,
    tileW: 64,
    tileH: 64,
  };
}

function backTile(idx: number): MapAssetDef {
  const n = String(idx).padStart(2, "0");
  return {
    id: `backtile_${n}`,
    name: `Back Tile ${n}`,
    category: "tiles",
    src: `/mapassets/tileset/Tiles/Back_TileSet/Back_TileSet_${n}.png`,
    tileW: 64,
    tileH: 64,
    isDecoration: true,
  };
}

// ─── Jump Items: Pads (platforms) ────────────────────────────────
function pad(style: number, variant: number): MapAssetDef {
  return {
    id: `pad_${style}_${variant}`,
    name: `Platform ${style}-${variant}`,
    category: "platforms",
    src: `/mapassets/jump-items/PNG/Pads/Pad_${style}_${variant}.png`,
    tileW: 128,
    tileH: 48,
  };
}

// ─── Jump Items: Props ───────────────────────────────────────────
function prop(idx: number): MapAssetDef {
  return {
    id: `prop_${idx}`,
    name: `Prop ${idx}`,
    category: "props",
    src: `/mapassets/jump-items/PNG/Props/Prop_${idx}.png`,
    isDecoration: true,
  };
}

// ─── Jump Items: Bonus pickups ───────────────────────────────────
function bonus(style: number, variant: number): MapAssetDef {
  return {
    id: `bonus_${style}_${variant}`,
    name: `Bonus ${style}-${variant}`,
    category: "food",
    src: `/mapassets/jump-items/PNG/Bonus/Bonus_${style}_${variant}.png`,
    isDecoration: true,
  };
}

// ─── Tileset: Trees ──────────────────────────────────────────────
const TREES: MapAssetDef[] = [
  { id: "tree_1", name: "Tree 1", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree1.png", isDecoration: true },
  { id: "tree_2", name: "Tree 2", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree2.png", isDecoration: true },
  { id: "tree_3", name: "Tree 3", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree3.png", isDecoration: true },
  { id: "tree_4", name: "Tree 4", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree4.png", isDecoration: true },
  { id: "tree_back_1", name: "Back Tree 1", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree_Back1.png", isDecoration: true },
  { id: "tree_back_2", name: "Back Tree 2", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree_Back2.png", isDecoration: true },
  { id: "tree_back_3", name: "Back Tree 3", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree_Back3.png", isDecoration: true },
  { id: "tree_back_4", name: "Back Tree 4", category: "trees", src: "/mapassets/tileset/Objects/Trees/Tree_Back4.png", isDecoration: true },
];

// ─── Tileset: Rocks ──────────────────────────────────────────────
const ROCKS: MapAssetDef[] = [
  { id: "rock_big_1", name: "Big Rock 1", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Big1.png", isDecoration: true },
  { id: "rock_big_2", name: "Big Rock 2", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Big2.png", isDecoration: true },
  { id: "rock_big_3", name: "Big Rock 3", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Big3.png", isDecoration: true },
  { id: "rock_big_4", name: "Big Rock 4", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Big4.png", isDecoration: true },
  { id: "rock_big_5", name: "Big Rock 5", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Big5.png", isDecoration: true },
  { id: "rock_small_1", name: "Small Rock 1", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Small1.png", isDecoration: true },
  { id: "rock_small_2", name: "Small Rock 2", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Small2.png", isDecoration: true },
  { id: "rock_small_3", name: "Small Rock 3", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Small3.png", isDecoration: true },
  { id: "rock_small_4", name: "Small Rock 4", category: "rocks", src: "/mapassets/tileset/Objects/Rocks/Rock_Small4.png", isDecoration: true },
];

// ─── Tileset: Grass ──────────────────────────────────────────────
const GRASS: MapAssetDef[] = [
  { id: "grass_1_1", name: "Grass 1A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass1_1.png", isDecoration: true },
  { id: "grass_1_2", name: "Grass 1B", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass1_2.png", isDecoration: true },
  { id: "grass_2_1", name: "Grass 2A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass2_1.png", isDecoration: true },
  { id: "grass_2_2", name: "Grass 2B", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass2_2.png", isDecoration: true },
  { id: "grass_3_1", name: "Grass 3A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass3_1.png", isDecoration: true },
  { id: "grass_3_2", name: "Grass 3B", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass3_2.png", isDecoration: true },
  { id: "grass_4_1", name: "Grass 4A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass4_1.png", isDecoration: true },
  { id: "grass_4_2", name: "Grass 4B", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass4_2.png", isDecoration: true },
  { id: "grass_5_1", name: "Grass 5A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass5_1.png", isDecoration: true },
  { id: "grass_5_2", name: "Grass 5B", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass5_2.png", isDecoration: true },
  { id: "grass_6_1", name: "Grass 6A", category: "grass", src: "/mapassets/tileset/Objects/Grass/Grass6_1.png", isDecoration: true },
];

// ─── Tileset: Boxes / Barrels ────────────────────────────────────
const BOXES: MapAssetDef[] = [
  { id: "barrel_1", name: "Barrel 1", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Barrel1.png" },
  { id: "barrel_2", name: "Barrel 2", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Barrel2.png" },
  { id: "box_1", name: "Box 1", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box1.png" },
  { id: "box_2", name: "Box 2", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box2.png" },
  { id: "box_3", name: "Box 3", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box3.png" },
  { id: "box_4", name: "Box 4", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box4.png" },
  { id: "box_5", name: "Box 5", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box5.png" },
  { id: "box_6", name: "Box 6", category: "boxes", src: "/mapassets/tileset/Objects/Boxes/Box6.png" },
];

// ─── Tileset: Spikes ─────────────────────────────────────────────
const SPIKES: MapAssetDef[] = [
  { id: "spikes_1_1", name: "Spikes 1A", category: "spikes", src: "/mapassets/tileset/Objects/Spikes/Spikes1_1.png" },
  { id: "spikes_1_2", name: "Spikes 1B", category: "spikes", src: "/mapassets/tileset/Objects/Spikes/Spikes1_2.png" },
  { id: "spikes_2_1", name: "Spikes 2A", category: "spikes", src: "/mapassets/tileset/Objects/Spikes/Spikes2_1.png" },
  { id: "spikes_2_2", name: "Spikes 2B", category: "spikes", src: "/mapassets/tileset/Objects/Spikes/Spikes2_2.png" },
];

// ─── Tileset: Ladders ────────────────────────────────────────────
const LADDERS: MapAssetDef[] = [
  { id: "ladder_top_1", name: "Ladder Top 1", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_top_1.png" },
  { id: "ladder_top_2", name: "Ladder Top 2", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_top_2.png" },
  { id: "ladder_mid_1", name: "Ladder Mid 1", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_middle_1.png" },
  { id: "ladder_mid_2", name: "Ladder Mid 2", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_middle_2.png" },
  { id: "ladder_down_1", name: "Ladder Down 1", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_down_1.png" },
  { id: "ladder_down_2", name: "Ladder Down 2", category: "ladders", src: "/mapassets/tileset/Objects/Ladders/Ladder_down_2.png" },
];

// ─── Tileset: Pointers ───────────────────────────────────────────
const POINTERS: MapAssetDef[] = [
  { id: "pointer_1_1", name: "Pointer 1A", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/1_1.png", isDecoration: true },
  { id: "pointer_1_2", name: "Pointer 1B", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/1_2.png", isDecoration: true },
  { id: "pointer_2_1", name: "Pointer 2A", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/2_1.png", isDecoration: true },
  { id: "pointer_2_2", name: "Pointer 2B", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/2_2.png", isDecoration: true },
  { id: "pointer_3_1", name: "Pointer 3A", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/3_1.png", isDecoration: true },
  { id: "pointer_3_2", name: "Pointer 3B", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/3_2.png", isDecoration: true },
  { id: "pointer_4_1", name: "Pointer 4A", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/4_1.png", isDecoration: true },
  { id: "pointer_4_2", name: "Pointer 4B", category: "pointers", src: "/mapassets/tileset/Objects/Pointers/4_2.png", isDecoration: true },
];

// ─── Tileset: Food (from tileset) ────────────────────────────────
const FOOD_TILESET: MapAssetDef[] = [
  { id: "food_cake", name: "Cake", category: "food", src: "/mapassets/tileset/Objects/Food/Cake.png", isDecoration: true },
  { id: "food_cake2", name: "Cake 2", category: "food", src: "/mapassets/tileset/Objects/Food/Cake2.png", isDecoration: true },
  { id: "food_cherry", name: "Cherry", category: "food", src: "/mapassets/tileset/Objects/Food/Cherry.png", isDecoration: true },
  { id: "food_chicken", name: "Chicken", category: "food", src: "/mapassets/tileset/Objects/Food/Chicken.png", isDecoration: true },
  { id: "food_cookies", name: "Cookies", category: "food", src: "/mapassets/tileset/Objects/Food/Cookies.png", isDecoration: true },
  { id: "food_fish", name: "Fish", category: "food", src: "/mapassets/tileset/Objects/Food/Fish.png", isDecoration: true },
  { id: "food_hamburger", name: "Hamburger", category: "food", src: "/mapassets/tileset/Objects/Food/Hamburger.png", isDecoration: true },
  { id: "food_meat", name: "Meat", category: "food", src: "/mapassets/tileset/Objects/Food/Meat.png", isDecoration: true },
  { id: "food_pizza", name: "Pizza", category: "food", src: "/mapassets/tileset/Objects/Food/Pizza.png", isDecoration: true },
];

// ─── Tileset: Animated objects ───────────────────────────────────
const ANIMATED: MapAssetDef[] = [
  { id: "anim_coin", name: "Coin", category: "animated", src: "/mapassets/tileset/Objects_Animated/Coin.png", isDecoration: true },
  { id: "anim_flag", name: "Flag", category: "animated", src: "/mapassets/tileset/Objects_Animated/Flag.png", isDecoration: true },
  { id: "anim_gold_chest", name: "Gold Chest", category: "animated", src: "/mapassets/tileset/Objects_Animated/Golden_Chest_Open.png", isDecoration: true },
  { id: "anim_gold_key", name: "Gold Key", category: "animated", src: "/mapassets/tileset/Objects_Animated/Golden_Key.png", isDecoration: true },
  { id: "anim_pickup", name: "Pickup", category: "animated", src: "/mapassets/tileset/Objects_Animated/Pickup.png", isDecoration: true },
  { id: "anim_silver_chest", name: "Silver Chest", category: "animated", src: "/mapassets/tileset/Objects_Animated/Silver_Chest_Open.png", isDecoration: true },
  { id: "anim_silver_key", name: "Silver Key", category: "animated", src: "/mapassets/tileset/Objects_Animated/Silver_Key.png", isDecoration: true },
];

// ─── Tileset: Background layers ──────────────────────────────────
const BACKGROUNDS: MapAssetDef[] = Array.from({ length: 8 }, (_, i) => ({
  id: `bg_layer_${i + 1}`,
  name: `BG Layer ${i + 1}`,
  category: "backgrounds" as AssetCategory,
  src: `/mapassets/tileset/Background/Layers/${i + 1}.png`,
  isDecoration: true,
}));

// ─── Back prefabs ────────────────────────────────────────────────
const BACK_PREFABS: MapAssetDef[] = Array.from({ length: 5 }, (_, i) => ({
  id: `back_prefab_${i + 1}`,
  name: `Back Prefab ${i + 1}`,
  category: "tiles" as AssetCategory,
  src: `/mapassets/tileset/Tiles/Back_Prefab_${i + 1}.png`,
  isDecoration: true,
}));

// ─── Aggregate all assets ────────────────────────────────────────
export const MAP_ASSETS: MapAssetDef[] = [
  // Individual tiles (1–42)
  ...Array.from({ length: 42 }, (_, i) => tile(i + 1)),
  // Back tiles (1–16)
  ...Array.from({ length: 16 }, (_, i) => backTile(i + 1)),
  // Back prefabs
  ...BACK_PREFABS,
  // Pads (platforms) — styles 1–4, variants 3–4
  ...[1, 2, 3, 4].flatMap(s => [3, 4].map(v => pad(s, v))),
  // Props 1–8
  ...Array.from({ length: 8 }, (_, i) => prop(i + 1)),
  // Bonus items — styles 1–4, variants 1–4
  ...[1, 2, 3, 4].flatMap(s => [1, 2, 3, 4].map(v => bonus(s, v))),
  // Object collections
  ...TREES,
  ...ROCKS,
  ...GRASS,
  ...BOXES,
  ...SPIKES,
  ...LADDERS,
  ...POINTERS,
  ...FOOD_TILESET,
  ...ANIMATED,
  ...BACKGROUNDS,
];

export function getAssetById(id: string): MapAssetDef | undefined {
  return MAP_ASSETS.find(a => a.id === id);
}

export function getAssetsByCategory(cat: AssetCategory): MapAssetDef[] {
  return MAP_ASSETS.filter(a => a.category === cat);
}

export const ALL_CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: "tiles", label: "Tiles" },
  { id: "platforms", label: "Platforms" },
  { id: "props", label: "Props" },
  { id: "trees", label: "Trees" },
  { id: "rocks", label: "Rocks" },
  { id: "grass", label: "Grass" },
  { id: "boxes", label: "Boxes/Barrels" },
  { id: "spikes", label: "Spikes" },
  { id: "ladders", label: "Ladders" },
  { id: "pointers", label: "Signs" },
  { id: "food", label: "Food/Bonus" },
  { id: "animated", label: "Animated" },
  { id: "backgrounds", label: "Backgrounds" },
];

// ─── Tile images used by default stages for sprite rendering ─────
// These map which tiles from the tileset to use for floor/platform surfaces
export interface StageTileConfig {
  floorTopLeft: string;
  floorTopMid: string;
  floorTopRight: string;
  floorMidLeft: string;
  floorMidMid: string;
  floorMidRight: string;
  platformLeft: string;
  platformMid: string;
  platformRight: string;
  padSrc?: string; // Optional pad sprite override for floating platforms
}

// All 4 stages use the same tileset but with different tinting
export const DEFAULT_TILE_CONFIG: StageTileConfig = {
  floorTopLeft: "/mapassets/tileset/Tiles/Tileset/TileSet_01.png",
  floorTopMid: "/mapassets/tileset/Tiles/Tileset/TileSet_02.png",
  floorTopRight: "/mapassets/tileset/Tiles/Tileset/TileSet_03.png",
  floorMidLeft: "/mapassets/tileset/Tiles/Tileset/TileSet_09.png",
  floorMidMid: "/mapassets/tileset/Tiles/Tileset/TileSet_10.png",
  floorMidRight: "/mapassets/tileset/Tiles/Tileset/TileSet_11.png",
  platformLeft: "/mapassets/tileset/Tiles/Tileset/TileSet_25.png",
  platformMid: "/mapassets/tileset/Tiles/Tileset/TileSet_26.png",
  platformRight: "/mapassets/tileset/Tiles/Tileset/TileSet_27.png",
};

// Per-stage pad sprite for floating platforms
export const STAGE_PAD_SPRITES: Record<string, string> = {
  battlefield: "/mapassets/jump-items/PNG/Pads/Pad_1_3.png",
  pirate: "/mapassets/jump-items/PNG/Pads/Pad_2_3.png",
  fortress: "/mapassets/jump-items/PNG/Pads/Pad_3_3.png",
  canopy: "/mapassets/jump-items/PNG/Pads/Pad_4_3.png",
};
