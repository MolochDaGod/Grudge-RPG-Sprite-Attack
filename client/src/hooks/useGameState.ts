import { useState, useCallback, useMemo } from "react";
import type { Unit, BattleState, Tile, Ability, BattleMap } from "@shared/schema";
import { 
  generateUnit, 
  generateMap, 
  generateEnemyTeam 
} from "@/lib/gameData";
import type { Race, HeroClass } from "@shared/spriteUUIDs";
import type { CharacterAttributes } from "@shared/statsAttributes";

function isBlockedByWall(fromTile: Tile, toTile: Tile): boolean {
  const dx = toTile.x - fromTile.x;
  const dy = toTile.y - fromTile.y;
  
  if (fromTile.isWall && fromTile.wallSides) {
    if (dx === 1 && fromTile.wallSides.includes("east")) return true;
    if (dx === -1 && fromTile.wallSides.includes("west")) return true;
    if (dy === 1 && fromTile.wallSides.includes("south")) return true;
    if (dy === -1 && fromTile.wallSides.includes("north")) return true;
  }
  
  if (toTile.isWall && toTile.wallSides) {
    if (dx === 1 && toTile.wallSides.includes("west")) return true;
    if (dx === -1 && toTile.wallSides.includes("east")) return true;
    if (dy === 1 && toTile.wallSides.includes("north")) return true;
    if (dy === -1 && toTile.wallSides.includes("south")) return true;
  }
  
  return false;
}

function canTraverseTiles(fromTile: Tile | undefined, toTile: Tile | undefined): boolean {
  if (!fromTile || !toTile) return false;
  
  if (isBlockedByWall(fromTile, toTile)) return false;
  
  const heightDiff = Math.abs((toTile.elevation || 0) - (fromTile.elevation || 0));
  
  if (heightDiff === 0) return true;
  
  if (heightDiff === 1) {
    return !!(fromTile.isRamp || toTile.isRamp);
  }
  
  return false;
}

function findReachableTiles(
  startX: number,
  startY: number,
  maxMove: number,
  tileMap: Map<string, Tile>,
  mapWidth: number,
  mapHeight: number,
  occupiedPositions: Set<string>
): { x: number; y: number }[] {
  const visited = new Set<string>();
  const reachable: { x: number; y: number }[] = [];
  const queue: { x: number; y: number; moves: number }[] = [{ x: startX, y: startY, moves: 0 }];
  
  visited.add(`${startX},${startY}`);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.moves > 0 && !occupiedPositions.has(`${current.x},${current.y}`)) {
      reachable.push({ x: current.x, y: current.y });
    }
    
    if (current.moves >= maxMove) continue;
    
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    
    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      
      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;
      if (visited.has(key)) continue;
      
      const fromTile = tileMap.get(`${current.x},${current.y}`);
      const toTile = tileMap.get(key);
      
      if (canTraverseTiles(fromTile, toTile)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, moves: current.moves + 1 });
      }
    }
  }
  
  return reachable;
}

type GamePhase = "menu" | "roster" | "codex" | "barracks" | "admin" | "adminsprites" | "adminassets" | "battle" | "battlearena" | "victory" | "defeat" | "captain" | "chat" | "characterselect" | "missionboard" | "skilltrees" | "spriteassistant" | "fighter2d";

interface GameState {
  phase: GamePhase;
  playerRoster: Unit[];
  selectedUnitsForBattle: string[];
  currentBattle: BattleState | null;
  battlesWon: number;
  currentAction: "idle" | "move" | "attack" | "ability";
  selectedAbility: Ability | null;
  hasMovedThisTurn: boolean;
  hasActedThisTurn: boolean;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => ({
    phase: "menu",
    playerRoster: [],
    selectedUnitsForBattle: [],
    currentBattle: null,
    battlesWon: 0,
    currentAction: "idle",
    selectedAbility: null,
    hasMovedThisTurn: false,
    hasActedThisTurn: false,
  }));

  const setPhase = useCallback((phase: GamePhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const selectUnitsForBattle = useCallback((unitIds: string[]) => {
    setState((prev) => ({ ...prev, selectedUnitsForBattle: unitIds }));
  }, []);

  const startBattle = useCallback((difficulty: "easy" | "normal" | "hard" = "normal") => {
    setState((prev) => {
      const selectedUnits = prev.playerRoster
        .filter((u) => prev.selectedUnitsForBattle.includes(u.id))
        .map((unit, index) => ({
          ...unit,
          position: { x: 1, y: index + 2 },
          stats: { ...unit.stats, hp: unit.stats.maxHp },
        }));

      if (selectedUnits.length === 0) {
        const defaultUnits = prev.playerRoster.slice(0, 4).map((unit, index) => ({
          ...unit,
          position: { x: 1, y: index + 2 },
          stats: { ...unit.stats, hp: unit.stats.maxHp },
        }));
        selectedUnits.push(...defaultUnits);
      }

      const avgLevel = Math.floor(
        selectedUnits.reduce((sum, u) => sum + u.level, 0) / selectedUnits.length
      );
      
      const enemies = generateEnemyTeam(difficulty, avgLevel).map((unit, index) => ({
        ...unit,
        position: { x: 8, y: index + 2 },
      }));

      const map = generateMap(10, 8, "Contested Territory");

      const allUnits = [...selectedUnits, ...enemies];
      const turnOrder = allUnits
        .sort((a, b) => b.stats.speed - a.stats.speed)
        .map((u) => u.id);

      const firstUnitId = turnOrder[0];
      const firstUnit = allUnits.find((u) => u.id === firstUnitId);
      const initialPhase = firstUnit?.isEnemy ? "enemy_turn" : "player_turn";

      const battle: BattleState = {
        id: `battle-${Date.now()}`,
        map,
        playerUnits: selectedUnits,
        enemyUnits: enemies,
        turnOrder,
        currentTurnIndex: 0,
        turnNumber: 1,
        phase: initialPhase as "player_turn" | "enemy_turn",
        selectedUnitId: firstUnitId,
        selectedAbilityId: undefined,
      };

      return {
        ...prev,
        phase: "battle" as GamePhase,
        currentBattle: battle,
        currentAction: "idle" as const,
        selectedAbility: null,
        hasMovedThisTurn: false,
        hasActedThisTurn: false,
      };
    });
  }, []);

  const selectUnit = useCallback((unitId: string | undefined) => {
    setState((prev) => {
      if (!prev.currentBattle) return prev;
      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          selectedUnitId: unitId,
        },
        currentAction: "idle",
        selectedAbility: null,
      };
    });
  }, []);

  const setAction = useCallback((action: "idle" | "move" | "attack" | "ability") => {
    setState((prev) => ({ ...prev, currentAction: action }));
  }, []);

  const selectAbility = useCallback((ability: Ability | null) => {
    setState((prev) => ({
      ...prev,
      selectedAbility: ability,
      currentAction: ability ? "ability" : "idle",
    }));
  }, []);

  const getMovementRange = useCallback((unit: Unit): { x: number; y: number }[] => {
    if (!state.currentBattle || !unit.position) return [];
    
    const movement = unit.stats.movement;
    const allUnits = [...state.currentBattle.playerUnits, ...state.currentBattle.enemyUnits];
    const occupiedPositions = new Set(
      allUnits.filter((u) => u.position && u.id !== unit.id).map((u) => `${u.position!.x},${u.position!.y}`)
    );
    
    const tileMap = new Map<string, Tile>();
    state.currentBattle.map.tiles.forEach(tile => {
      tileMap.set(`${tile.x},${tile.y}`, tile);
    });
    
    return findReachableTiles(
      unit.position.x,
      unit.position.y,
      movement,
      tileMap,
      state.currentBattle.map.width,
      state.currentBattle.map.height,
      occupiedPositions
    );
  }, [state.currentBattle]);

  const getAttackRange = useCallback((unit: Unit): { x: number; y: number }[] => {
    if (!state.currentBattle || !unit.position) return [];
    
    const tiles: { x: number; y: number }[] = [];
    const range = unit.stats.range;
    const enemies = unit.isEnemy ? state.currentBattle.playerUnits : state.currentBattle.enemyUnits;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.abs(dx) + Math.abs(dy) <= range && (dx !== 0 || dy !== 0)) {
          const x = unit.position.x + dx;
          const y = unit.position.y + dy;
          const targetUnit = enemies.find(
            (u) => u.position && u.position.x === x && u.position.y === y && u.stats.hp > 0
          );
          if (targetUnit) {
            tiles.push({ x, y });
          }
        }
      }
    }
    return tiles;
  }, [state.currentBattle]);

  const getAbilityRange = useCallback((unit: Unit, ability: Ability): { x: number; y: number }[] => {
    if (!state.currentBattle || !unit.position) return [];
    
    const tiles: { x: number; y: number }[] = [];
    const range = ability.range;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance <= range) {
          const x = unit.position.x + dx;
          const y = unit.position.y + dy;
          if (
            x >= 0 && x < state.currentBattle.map.width &&
            y >= 0 && y < state.currentBattle.map.height
          ) {
            if (ability.type === "heal" || ability.type === "buff") {
              const allies = unit.isEnemy ? state.currentBattle.enemyUnits : state.currentBattle.playerUnits;
              const targetUnit = allies.find(
                (u) => u.position && u.position.x === x && u.position.y === y && u.stats.hp > 0
              );
              if (targetUnit || (dx === 0 && dy === 0)) {
                tiles.push({ x, y });
              }
            } else {
              const enemies = unit.isEnemy ? state.currentBattle.playerUnits : state.currentBattle.enemyUnits;
              const targetUnit = enemies.find(
                (u) => u.position && u.position.x === x && u.position.y === y && u.stats.hp > 0
              );
              if (targetUnit) {
                tiles.push({ x, y });
              }
            }
          }
        }
      }
    }
    return tiles;
  }, [state.currentBattle]);

  const moveUnit = useCallback((targetX: number, targetY: number) => {
    setState((prev) => {
      if (!prev.currentBattle || !prev.currentBattle.selectedUnitId) return prev;
      
      const unitId = prev.currentBattle.selectedUnitId;
      const isPlayer = prev.currentBattle.playerUnits.some((u) => u.id === unitId);
      
      const updateUnits = (units: Unit[]) =>
        units.map((u) =>
          u.id === unitId ? { ...u, position: { x: targetX, y: targetY } } : u
        );

      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          playerUnits: isPlayer ? updateUnits(prev.currentBattle.playerUnits) : prev.currentBattle.playerUnits,
          enemyUnits: !isPlayer ? updateUnits(prev.currentBattle.enemyUnits) : prev.currentBattle.enemyUnits,
        },
        currentAction: "idle",
        hasMovedThisTurn: true,
      };
    });
  }, []);

  const calculateDamage = useCallback((attacker: Unit, defender: Unit, ability?: Ability): number => {
    const baseDamage = ability?.damage || attacker.stats.attack;
    const defense = defender.stats.defense;
    const damage = Math.max(1, Math.floor(baseDamage * (100 / (100 + defense))));
    const variance = 0.1;
    const finalDamage = Math.floor(damage * (1 + (Math.random() * variance * 2 - variance)));
    return finalDamage;
  }, []);

  const performAttack = useCallback((targetX: number, targetY: number) => {
    setState((prev) => {
      if (!prev.currentBattle || !prev.currentBattle.selectedUnitId) return prev;
      
      const allUnits = [...prev.currentBattle.playerUnits, ...prev.currentBattle.enemyUnits];
      const attacker = allUnits.find((u) => u.id === prev.currentBattle!.selectedUnitId);
      if (!attacker) return prev;

      const target = allUnits.find(
        (u) => u.position && u.position.x === targetX && u.position.y === targetY
      );
      if (!target) return prev;

      const damage = calculateDamage(attacker, target, prev.selectedAbility || undefined);
      const newHp = Math.max(0, target.stats.hp - damage);

      const updateUnits = (units: Unit[]) =>
        units.map((u) =>
          u.id === target.id ? { ...u, stats: { ...u.stats, hp: newHp } } : u
        );

      const updateAbilities = (units: Unit[]) =>
        units.map((u) =>
          u.id === attacker.id && prev.selectedAbility
            ? {
                ...u,
                abilities: u.abilities.map((a) =>
                  a.id === prev.selectedAbility!.id
                    ? { ...a, currentCooldown: a.cooldown }
                    : a
                ),
              }
            : u
        );

      let newPlayerUnits = prev.currentBattle.playerUnits;
      let newEnemyUnits = prev.currentBattle.enemyUnits;

      if (target.isEnemy) {
        newEnemyUnits = updateUnits(newEnemyUnits);
      } else {
        newPlayerUnits = updateUnits(newPlayerUnits);
      }

      if (prev.selectedAbility) {
        if (attacker.isEnemy) {
          newEnemyUnits = updateAbilities(newEnemyUnits);
        } else {
          newPlayerUnits = updateAbilities(newPlayerUnits);
        }
      }

      const playerAlive = newPlayerUnits.some((u) => u.stats.hp > 0);
      const enemyAlive = newEnemyUnits.some((u) => u.stats.hp > 0);

      let phase: BattleState["phase"] = prev.currentBattle.phase;
      if (!playerAlive) phase = "defeat";
      else if (!enemyAlive) phase = "victory";

      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          playerUnits: newPlayerUnits,
          enemyUnits: newEnemyUnits,
          phase,
        },
        currentAction: "idle",
        selectedAbility: null,
        hasActedThisTurn: true,
      };
    });
  }, [calculateDamage]);

  const performHeal = useCallback((targetX: number, targetY: number) => {
    setState((prev) => {
      if (!prev.currentBattle || !prev.currentBattle.selectedUnitId || !prev.selectedAbility) return prev;
      
      const allUnits = [...prev.currentBattle.playerUnits, ...prev.currentBattle.enemyUnits];
      const healer = allUnits.find((u) => u.id === prev.currentBattle!.selectedUnitId);
      if (!healer) return prev;

      const target = allUnits.find(
        (u) => u.position && u.position.x === targetX && u.position.y === targetY
      );
      if (!target) return prev;

      const healing = prev.selectedAbility.healing || 0;
      const newHp = Math.min(target.stats.maxHp, target.stats.hp + healing);

      const updateUnits = (units: Unit[]) =>
        units.map((u) =>
          u.id === target.id ? { ...u, stats: { ...u.stats, hp: newHp } } : u
        );

      const updateAbilities = (units: Unit[]) =>
        units.map((u) =>
          u.id === healer.id
            ? {
                ...u,
                abilities: u.abilities.map((a) =>
                  a.id === prev.selectedAbility!.id
                    ? { ...a, currentCooldown: a.cooldown }
                    : a
                ),
              }
            : u
        );

      let newPlayerUnits = target.isEnemy
        ? prev.currentBattle.playerUnits
        : updateUnits(prev.currentBattle.playerUnits);
      let newEnemyUnits = target.isEnemy
        ? updateUnits(prev.currentBattle.enemyUnits)
        : prev.currentBattle.enemyUnits;

      if (healer.isEnemy) {
        newEnemyUnits = updateAbilities(newEnemyUnits);
      } else {
        newPlayerUnits = updateAbilities(newPlayerUnits);
      }

      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          playerUnits: newPlayerUnits,
          enemyUnits: newEnemyUnits,
        },
        currentAction: "idle",
        selectedAbility: null,
        hasActedThisTurn: true,
      };
    });
  }, []);

  const endTurn = useCallback(() => {
    setState((prev) => {
      if (!prev.currentBattle) return prev;

      const reduceCooldowns = (units: Unit[]) =>
        units.map((u) => ({
          ...u,
          abilities: u.abilities.map((a) => ({
            ...a,
            currentCooldown: Math.max(0, a.currentCooldown - 1),
          })),
        }));

      let newTurnIndex = prev.currentBattle.currentTurnIndex + 1;
      let newTurnNumber = prev.currentBattle.turnNumber;
      
      const aliveTurnOrder = prev.currentBattle.turnOrder.filter((id) => {
        const unit = [...prev.currentBattle!.playerUnits, ...prev.currentBattle!.enemyUnits].find(
          (u) => u.id === id
        );
        return unit && unit.stats.hp > 0;
      });

      if (newTurnIndex >= aliveTurnOrder.length) {
        newTurnIndex = 0;
        newTurnNumber += 1;
      }

      const nextUnitId = aliveTurnOrder[newTurnIndex];
      const nextUnit = [...prev.currentBattle.playerUnits, ...prev.currentBattle.enemyUnits].find(
        (u) => u.id === nextUnitId
      );

      const newPhase: BattleState["phase"] = nextUnit?.isEnemy ? "enemy_turn" : "player_turn";

      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          turnOrder: aliveTurnOrder,
          currentTurnIndex: newTurnIndex,
          turnNumber: newTurnNumber,
          phase: newPhase,
          selectedUnitId: nextUnitId,
          playerUnits: reduceCooldowns(prev.currentBattle.playerUnits),
          enemyUnits: reduceCooldowns(prev.currentBattle.enemyUnits),
        },
        currentAction: "idle",
        selectedAbility: null,
        hasMovedThisTurn: false,
        hasActedThisTurn: false,
      };
    });
  }, []);

  const performEnemyTurn = useCallback(() => {
    setState((prev) => {
      if (!prev.currentBattle || prev.currentBattle.phase !== "enemy_turn") return prev;

      const currentUnitId = prev.currentBattle.turnOrder[prev.currentBattle.currentTurnIndex];
      const enemy = prev.currentBattle.enemyUnits.find((u) => u.id === currentUnitId);
      if (!enemy || enemy.stats.hp <= 0) {
        return prev;
      }

      const validTargets = prev.currentBattle.playerUnits.filter((u) => u.stats.hp > 0 && u.position);
      if (validTargets.length === 0) return prev;

      const target = validTargets.reduce((closest, current) => {
        if (!enemy.position || !current.position || !closest.position) return closest;
        const currentDist = Math.abs(current.position.x - enemy.position.x) + Math.abs(current.position.y - enemy.position.y);
        const closestDist = Math.abs(closest.position.x - enemy.position.x) + Math.abs(closest.position.y - enemy.position.y);
        return currentDist < closestDist ? current : closest;
      }, validTargets[0]);

      if (!target.position || !enemy.position) return prev;

      const distance = Math.abs(target.position.x - enemy.position.x) + Math.abs(target.position.y - enemy.position.y);
      
      let newEnemyUnits = [...prev.currentBattle.enemyUnits];
      let newPlayerUnits = [...prev.currentBattle.playerUnits];

      if (distance <= enemy.stats.range) {
        const damage = Math.max(1, Math.floor(enemy.stats.attack * (100 / (100 + target.stats.defense))));
        const newHp = Math.max(0, target.stats.hp - damage);
        newPlayerUnits = newPlayerUnits.map((u) =>
          u.id === target.id ? { ...u, stats: { ...u.stats, hp: newHp } } : u
        );
      } else {
        const allUnits = [...prev.currentBattle.playerUnits, ...prev.currentBattle.enemyUnits];
        const occupiedPositions = new Set(
          allUnits.filter((u) => u.position && u.id !== enemy.id).map((u) => `${u.position!.x},${u.position!.y}`)
        );
        
        const tileMap = new Map<string, Tile>();
        prev.currentBattle.map.tiles.forEach(tile => {
          tileMap.set(`${tile.x},${tile.y}`, tile);
        });
        
        const reachableTiles = findReachableTiles(
          enemy.position.x,
          enemy.position.y,
          enemy.stats.movement,
          tileMap,
          prev.currentBattle.map.width,
          prev.currentBattle.map.height,
          occupiedPositions
        );
        
        if (reachableTiles.length > 0) {
          const bestTile = reachableTiles.reduce((best, tile) => {
            const tileDist = Math.abs(tile.x - target.position!.x) + Math.abs(tile.y - target.position!.y);
            const bestDist = Math.abs(best.x - target.position!.x) + Math.abs(best.y - target.position!.y);
            return tileDist < bestDist ? tile : best;
          }, reachableTiles[0]);
          
          newEnemyUnits = newEnemyUnits.map((u) =>
            u.id === enemy.id
              ? { ...u, position: { x: bestTile.x, y: bestTile.y } }
              : u
          );
        }
      }

      const playerAlive = newPlayerUnits.some((u) => u.stats.hp > 0);

      return {
        ...prev,
        currentBattle: {
          ...prev.currentBattle,
          playerUnits: newPlayerUnits,
          enemyUnits: newEnemyUnits,
          phase: playerAlive ? prev.currentBattle.phase : "defeat",
        },
      };
    });

    setTimeout(() => {
      endTurn();
    }, 800);
  }, [endTurn]);

  const endBattle = useCallback((isVictory: boolean) => {
    setState((prev) => {
      if (isVictory) {
        const updatedRoster = prev.playerRoster.map((unit) => {
          const battleUnit = prev.currentBattle?.playerUnits.find((u) => u.id === unit.id);
          if (battleUnit && battleUnit.stats.hp > 0) {
            return {
              ...unit,
              level: unit.level + 1,
              stats: {
                ...unit.stats,
                hp: unit.stats.maxHp,
                maxHp: Math.floor(unit.stats.maxHp * 1.05),
                attack: Math.floor(unit.stats.attack * 1.03),
                defense: Math.floor(unit.stats.defense * 1.03),
              },
            };
          }
          return { ...unit, stats: { ...unit.stats, hp: unit.stats.maxHp } };
        });

        return {
          ...prev,
          phase: "menu",
          currentBattle: null,
          playerRoster: updatedRoster,
          battlesWon: prev.battlesWon + 1,
          selectedUnitsForBattle: [],
        };
      }

      const healedRoster = prev.playerRoster.map((unit) => ({
        ...unit,
        stats: { ...unit.stats, hp: unit.stats.maxHp },
      }));

      return {
        ...prev,
        phase: "menu",
        currentBattle: null,
        playerRoster: healedRoster,
        selectedUnitsForBattle: [],
      };
    });
  }, []);

  const currentUnit = useMemo(() => {
    if (!state.currentBattle) return null;
    const currentId = state.currentBattle.turnOrder[state.currentBattle.currentTurnIndex];
    return [...state.currentBattle.playerUnits, ...state.currentBattle.enemyUnits].find(
      (u) => u.id === currentId
    ) || null;
  }, [state.currentBattle]);

  const selectedUnit = useMemo(() => {
    if (!state.currentBattle || !state.currentBattle.selectedUnitId) return null;
    return [...state.currentBattle.playerUnits, ...state.currentBattle.enemyUnits].find(
      (u) => u.id === state.currentBattle!.selectedUnitId
    ) || null;
  }, [state.currentBattle]);

  const highlightedTiles = useMemo(() => {
    if (!selectedUnit || !state.currentBattle) return [];

    if (state.currentAction === "move") {
      return getMovementRange(selectedUnit).map((pos) => ({ ...pos, type: "movement" as const }));
    }
    if (state.currentAction === "attack") {
      return getAttackRange(selectedUnit).map((pos) => ({ ...pos, type: "attack" as const }));
    }
    if (state.currentAction === "ability" && state.selectedAbility) {
      return getAbilityRange(selectedUnit, state.selectedAbility).map((pos) => ({
        ...pos,
        type: "ability" as const,
      }));
    }
    return [];
  }, [selectedUnit, state.currentAction, state.selectedAbility, state.currentBattle, getMovementRange, getAttackRange, getAbilityRange]);

  const addHeroToRoster = useCallback((race: Race, heroClass: HeroClass, attributes: CharacterAttributes) => {
    const factionMap: Record<string, "crusade" | "fabled" | "legion"> = {
      human: "crusade",
      barbarian: "crusade", 
      dwarf: "fabled",
      elf: "fabled",
      orc: "legion",
      undead: "legion",
    };
    const faction = factionMap[race] || "crusade";
    const newUnit = generateUnit(heroClass as any, faction, false, 1, race as any);
    
    const enhancedUnit: Unit = {
      ...newUnit,
      id: `hero-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      stats: {
        ...newUnit.stats,
        attack: newUnit.stats.attack + Math.floor(attributes.strength * 0.5),
        defense: newUnit.stats.defense + Math.floor(attributes.endurance * 0.3),
        maxHp: newUnit.stats.maxHp + Math.floor(attributes.vitality * 2),
        hp: newUnit.stats.maxHp + Math.floor(attributes.vitality * 2),
        maxMana: newUnit.stats.maxMana + Math.floor(attributes.intellect * 1.5),
        mana: newUnit.stats.maxMana + Math.floor(attributes.intellect * 1.5),
        speed: newUnit.stats.speed + Math.floor(attributes.agility * 0.3),
      }
    };
    
    setState(prev => ({
      ...prev,
      playerRoster: [...prev.playerRoster, enhancedUnit],
    }));
  }, []);

  return {
    ...state,
    currentUnit,
    selectedUnit,
    highlightedTiles,
    setPhase,
    selectUnitsForBattle,
    startBattle,
    selectUnit,
    setAction,
    selectAbility,
    moveUnit,
    performAttack,
    performHeal,
    endTurn,
    performEnemyTurn,
    endBattle,
    calculateDamage,
    addHeroToRoster,
  };
}
