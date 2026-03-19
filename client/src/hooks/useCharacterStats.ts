import { useState, useMemo, useCallback } from 'react';
import {
  ATTRIBUTE_IDS,
  ATTRIBUTES,
  type AttributeId,
  STARTING_ATTRIBUTE_POINTS,
  POINTS_PER_LEVEL,
  MAX_LEVEL,
  getTotalAttributePoints,
  getEffectivePoints,
  calculateBaseStats,
  calculateAttributeBonus,
  STAT_CAPS,
  clampStat,
  getClassStartingAttributes,
  DIMINISHING_RETURNS,
} from '@shared/gameDefinitions';

export interface CharacterStatsState {
  level: number;
  classId: string;
  raceId: string;
  attributePoints: Record<AttributeId, number>;
}

export interface DerivedStats {
  health: number;
  mana: number;
  stamina: number;
  damage: number;
  defense: number;
  blockChance: number;
  blockFactor: number;
  critChance: number;
  critFactor: number;
  accuracy: number;
  resistance: number;
}

export interface AttributeAllocation {
  allocated: number;
  effective: number;
  diminishingReturns: boolean;
}

export function useCharacterStats(initialState?: Partial<CharacterStatsState>) {
  const [level, setLevel] = useState(initialState?.level ?? 1);
  const [classId, setClassId] = useState(initialState?.classId ?? 'warrior');
  const [raceId, setRaceId] = useState(initialState?.raceId ?? 'human');
  
  const defaultAttributes: Record<AttributeId, number> = useMemo(() => {
    const base = {} as Record<AttributeId, number>;
    ATTRIBUTE_IDS.forEach(id => { base[id] = 0; });
    return base;
  }, []);
  
  const [attributePoints, setAttributePoints] = useState<Record<AttributeId, number>>(
    initialState?.attributePoints ?? defaultAttributes
  );
  
  const totalAvailablePoints = useMemo(() => getTotalAttributePoints(level), [level]);
  
  const allocatedPoints = useMemo(() => {
    return Object.values(attributePoints).reduce((sum, val) => sum + val, 0);
  }, [attributePoints]);
  
  const remainingPoints = useMemo(() => {
    return Math.max(0, totalAvailablePoints - allocatedPoints);
  }, [totalAvailablePoints, allocatedPoints]);
  
  const attributeAllocations = useMemo((): Record<AttributeId, AttributeAllocation> => {
    const result = {} as Record<AttributeId, AttributeAllocation>;
    for (const id of ATTRIBUTE_IDS) {
      const allocated = attributePoints[id] || 0;
      const effective = getEffectivePoints(allocated);
      result[id] = {
        allocated,
        effective,
        diminishingReturns: allocated > DIMINISHING_RETURNS.threshold,
      };
    }
    return result;
  }, [attributePoints]);
  
  const baseStats = useMemo(() => calculateBaseStats(level), [level]);
  
  const derivedStats = useMemo((): DerivedStats => {
    const getStat = (stat: string, base: number) => {
      return base + calculateAttributeBonus(attributePoints, stat, base);
    };
    
    const health = Math.round(getStat('health', baseStats.health));
    const mana = Math.round(getStat('mana', baseStats.mana));
    const stamina = Math.round(getStat('stamina', baseStats.stamina));
    const damage = Math.round(getStat('damage', baseStats.damage));
    const defense = Math.round(getStat('defense', baseStats.defense));
    
    let blockChance = 0;
    let blockFactor = 0;
    let critChance = 0;
    let critFactor = 1.5;
    let accuracy = 0;
    let resistance = 0;
    
    for (const attrId of ATTRIBUTE_IDS) {
      const effective = getEffectivePoints(attributePoints[attrId] || 0);
      const attrDef = ATTRIBUTES[attrId];
      
      for (const bonus of attrDef.bonuses) {
        const flatContribution = bonus.flatBonus * effective;
        const percentContribution = bonus.percentBonus * effective;
        switch (bonus.stat) {
          case 'blockChance': blockChance += flatContribution + percentContribution; break;
          case 'blockFactor': blockFactor += flatContribution + percentContribution; break;
          case 'critChance': critChance += flatContribution + percentContribution; break;
          case 'critFactor': critFactor += flatContribution + percentContribution; break;
          case 'accuracy': accuracy += flatContribution + percentContribution; break;
          case 'resistance': resistance += flatContribution + percentContribution; break;
        }
      }
    }
    
    return {
      health,
      mana,
      stamina,
      damage,
      defense,
      blockChance: clampStat('blockChance', blockChance),
      blockFactor: clampStat('blockFactor', blockFactor),
      critChance: clampStat('critChance', critChance),
      critFactor: Math.min(critFactor, STAT_CAPS.critFactor),
      accuracy: clampStat('accuracy', accuracy),
      resistance: clampStat('resistance', resistance),
    };
  }, [attributePoints, baseStats]);
  
  const allocatePoint = useCallback((attrId: AttributeId, delta: number = 1) => {
    setAttributePoints(prev => {
      const current = prev[attrId] || 0;
      const newVal = Math.max(0, current + delta);
      
      const currentTotal = Object.values(prev).reduce((s, v) => s + v, 0);
      const newTotal = currentTotal - current + newVal;
      
      if (newTotal > totalAvailablePoints) {
        const maxAllowed = Math.max(0, current + (totalAvailablePoints - currentTotal));
        return { ...prev, [attrId]: maxAllowed };
      }
      
      return { ...prev, [attrId]: newVal };
    });
  }, [totalAvailablePoints]);
  
  const resetPoints = useCallback(() => {
    setAttributePoints(defaultAttributes);
  }, [defaultAttributes]);
  
  const applyClassDefaults = useCallback(() => {
    const classAttrs = getClassStartingAttributes(classId);
    const classTotal = Object.values(classAttrs).reduce((sum, val) => sum + val, 0);
    
    if (classTotal <= totalAvailablePoints) {
      setAttributePoints(classAttrs);
    } else {
      const scale = totalAvailablePoints / classTotal;
      const scaled = {} as Record<AttributeId, number>;
      let remaining = totalAvailablePoints;
      
      for (const id of ATTRIBUTE_IDS) {
        const scaledVal = Math.floor((classAttrs[id] || 0) * scale);
        scaled[id] = scaledVal;
        remaining -= scaledVal;
      }
      
      for (const id of ATTRIBUTE_IDS) {
        if (remaining <= 0) break;
        if ((classAttrs[id] || 0) > 0) {
          scaled[id] += 1;
          remaining -= 1;
        }
      }
      
      setAttributePoints(scaled);
    }
  }, [classId, totalAvailablePoints]);
  
  const setLevelAndReset = useCallback((newLevel: number) => {
    const clampedLevel = Math.max(1, Math.min(MAX_LEVEL, newLevel));
    setLevel(clampedLevel);
  }, []);
  
  return {
    level,
    setLevel: setLevelAndReset,
    classId,
    setClassId,
    raceId,
    setRaceId,
    attributePoints,
    attributeAllocations,
    totalAvailablePoints,
    allocatedPoints,
    remainingPoints,
    baseStats,
    derivedStats,
    allocatePoint,
    resetPoints,
    applyClassDefaults,
    ATTRIBUTE_IDS,
    ATTRIBUTES,
    MAX_LEVEL,
  };
}

export type CharacterStatsHook = ReturnType<typeof useCharacterStats>;
