import { useMemo } from "react";
import type { Tile, Unit } from "@shared/schema";
import { terrainInfo } from "@/lib/gameData";
import { getTerrainColorByHeight } from "@/lib/heightMapGenerator";
import { AnimatedUnitSpriteWithHealth } from "./AnimatedUnitSprite";
import { CombatEffects, GridProjectile } from "./CombatEffects";
import type { CombatEffect } from "@/hooks/useBattleAnimations";
import type { AnimationState } from "./AnimatedSprite";
import { cn } from "@/lib/utils";

interface BattleGridProps {
  tiles: Tile[];
  width: number;
  height: number;
  units: Unit[];
  selectedUnitId?: string;
  highlightedTiles?: { x: number; y: number; type: "movement" | "attack" | "ability" }[];
  unitAnimations?: Map<string, AnimationState>;
  combatEffects?: CombatEffect[];
  onTileClick: (x: number, y: number) => void;
  onUnitClick: (unit: Unit) => void;
}

const HEIGHT_VISUAL_OFFSETS = {
  0: { shadow: "shadow-sm", border: "border-slate-800/20", offset: "translate-y-0" },
  1: { shadow: "shadow-md", border: "border-slate-700/30", offset: "-translate-y-1" },
  2: { shadow: "shadow-lg", border: "border-slate-600/40", offset: "-translate-y-2" },
};

const RAMP_INDICATORS = {
  north: "border-t-4 border-t-amber-400/60",
  south: "border-b-4 border-b-amber-400/60",
  east: "border-r-4 border-r-amber-400/60",
  west: "border-l-4 border-l-amber-400/60",
};

const WALL_INDICATORS = {
  north: "after:absolute after:top-0 after:left-0 after:right-0 after:h-1 after:bg-stone-600 dark:after:bg-stone-400",
  south: "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-stone-600 dark:after:bg-stone-400",
  east: "after:absolute after:top-0 after:right-0 after:bottom-0 after:w-1 after:bg-stone-600 dark:after:bg-stone-400",
  west: "after:absolute after:top-0 after:left-0 after:bottom-0 after:w-1 after:bg-stone-600 dark:after:bg-stone-400",
};

export function BattleGrid({
  tiles,
  width,
  height,
  units,
  selectedUnitId,
  highlightedTiles = [],
  unitAnimations = new Map(),
  combatEffects = [],
  onTileClick,
  onUnitClick,
}: BattleGridProps) {
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    tiles.forEach((tile) => {
      map.set(`${tile.x},${tile.y}`, tile);
    });
    return map;
  }, [tiles]);

  const unitMap = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach((unit) => {
      if (unit.position) {
        map.set(`${unit.position.x},${unit.position.y}`, unit);
      }
    });
    return map;
  }, [units]);

  const highlightMap = useMemo(() => {
    const map = new Map<string, "movement" | "attack" | "ability">();
    highlightedTiles.forEach((h) => {
      map.set(`${h.x},${h.y}`, h.type);
    });
    return map;
  }, [highlightedTiles]);

  const getHighlightColor = (type: "movement" | "attack" | "ability" | undefined) => {
    switch (type) {
      case "movement":
        return "ring-2 ring-blue-400 ring-inset bg-blue-400/30";
      case "attack":
        return "ring-2 ring-red-400 ring-inset bg-red-400/30";
      case "ability":
        return "ring-2 ring-purple-400 ring-inset bg-purple-400/30";
      default:
        return "";
    }
  };

  const getHeightIndicator = (elevation: number) => {
    if (elevation === 0) return null;
    return (
      <div className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white/80 bg-black/40 rounded px-0.5 z-10">
        {elevation === 1 ? "H1" : "H2"}
      </div>
    );
  };

  return (
    <div className="relative overflow-auto p-4">
      <div 
        className="grid gap-0.5 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${width}, minmax(48px, 64px))`,
          width: "fit-content"
        }}
      >
        {Array.from({ length: height }).map((_, y) =>
          Array.from({ length: width }).map((_, x) => {
            const key = `${x},${y}`;
            const tile = tileMap.get(key);
            const unit = unitMap.get(key);
            const highlightType = highlightMap.get(key);
            const elevation = tile?.elevation || 0;
            const heightVisual = HEIGHT_VISUAL_OFFSETS[elevation as 0 | 1 | 2] || HEIGHT_VISUAL_OFFSETS[0];
            const terrainColor = tile ? getTerrainColorByHeight(tile.terrain, elevation) : "bg-green-600";
            const isSelected = unit && unit.id === selectedUnitId;
            const unitAnimation = unit ? (unitAnimations.get(unit.id) || "idle") : "idle";
            // Filter effects: unit-level effects exclude traveling projectiles (those render at grid level)
            const unitEffects = unit 
              ? combatEffects.filter(e => e.targetUnitId === unit.id && e.projectileType !== "travel")
              : [];

            const rampClass = tile?.isRamp && tile.rampDirection 
              ? RAMP_INDICATORS[tile.rampDirection] 
              : "";

            const hasWalls = tile?.isWall && tile.wallSides && tile.wallSides.length > 0;

            return (
              <div
                key={key}
                onClick={() => {
                  if (unit) {
                    onUnitClick(unit);
                  } else {
                    onTileClick(x, y);
                  }
                }}
                className={cn(
                  "relative aspect-square cursor-pointer transition-all",
                  "border border-black/10 dark:border-white/10",
                  terrainColor,
                  heightVisual.shadow,
                  heightVisual.offset,
                  rampClass,
                  getHighlightColor(highlightType),
                  isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  hasWalls && "relative"
                )}
                style={{
                  transform: `translateY(${-elevation * 4}px)`,
                  zIndex: elevation + (unit ? 10 : 0),
                }}
                data-testid={`tile-${x}-${y}`}
              >
                {getHeightIndicator(elevation)}
                
                {elevation > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,${0.1 * elevation}) 0%, transparent 50%)`,
                    }}
                  />
                )}

                {hasWalls && tile.wallSides?.map((side, idx) => (
                  <div
                    key={`wall-${side}-${idx}`}
                    className={cn(
                      "absolute pointer-events-none z-20",
                      side === "north" && "top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-stone-500 to-stone-700",
                      side === "south" && "bottom-0 left-0 right-0 h-1.5 bg-gradient-to-t from-stone-500 to-stone-700",
                      side === "east" && "top-0 right-0 bottom-0 w-1.5 bg-gradient-to-l from-stone-500 to-stone-700",
                      side === "west" && "top-0 left-0 bottom-0 w-1.5 bg-gradient-to-r from-stone-500 to-stone-700",
                    )}
                  />
                ))}
                
                {unit && (
                  <div
                    className="absolute inset-0.5 flex items-center justify-center z-30"
                    data-testid={`unit-on-grid-${unit.id}`}
                  >
                    <AnimatedUnitSpriteWithHealth 
                      unit={unit} 
                      size="md"
                      showWeapon={true}
                      showGlow={true}
                      isSelected={isSelected}
                      showHealth={true}
                      animation={unitAnimation}
                      effects={unitEffects}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Grid-level projectile layer for traveling effects */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 100 }}>
        {combatEffects
          .filter(e => e.projectileType === "travel" && e.sourceUnitId)
          .map(effect => {
            const sourceUnit = units.find(u => u.id === effect.sourceUnitId);
            const targetUnit = units.find(u => u.id === effect.targetUnitId);
            if (!sourceUnit?.position || !targetUnit?.position) return null;
            
            return (
              <GridProjectile
                key={effect.id}
                effect={effect}
                sourcePos={sourceUnit.position}
                targetPos={targetUnit.position}
                tileSize={56} // Average of minmax(48px, 64px) + gap
              />
            );
          })}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-400/50 ring-1 ring-blue-400" />
          <span>Movement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400/50 ring-1 ring-red-400" />
          <span>Attack</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-400/50 ring-1 ring-purple-400" />
          <span>Ability</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400/60 ring-1 ring-amber-400" />
          <span>Ramp</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-stone-500 ring-1 ring-stone-600" />
          <span>Wall</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-black/40 text-white px-1 rounded">H1/H2</span>
          <span>Height Level</span>
        </div>
      </div>
    </div>
  );
}
