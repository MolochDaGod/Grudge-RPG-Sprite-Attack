import { useState, useCallback, useRef } from "react";
import type { Unit } from "@shared/schema";
import type { AnimationState } from "@/components/game/AnimatedSprite";

export interface UnitAnimationState {
  unitId: string;
  animation: AnimationState;
  startTime: number;
}

export interface CombatEffect {
  id: string;
  type: "damage" | "heal" | "spell" | "projectile" | "status" | "impact";
  targetUnitId: string;
  sourceUnitId?: string;
  effectName: string;
  color: string;
  value?: number;
  position?: { x: number; y: number };
  startTime: number;
  duration: number;
  // Projectile travel settings
  projectileType?: "on_self" | "on_target" | "travel";
  travelStartPercent?: number; // 0 = start at caster, 0.5 = start at midpoint, 1 = at target
}

export interface UseBattleAnimationsReturn {
  unitAnimations: Map<string, AnimationState>;
  effects: CombatEffect[];
  playAttackAnimation: (attackerId: string, targetId: string, damage: number) => Promise<void>;
  playSpellAnimation: (casterId: string, targetId: string, spellName: string, damage: number, spellColor: string) => Promise<void>;
  playHealAnimation: (casterId: string, targetId: string, healAmount: number) => Promise<void>;
  playDeathAnimation: (unitId: string) => Promise<void>;
  playHitAnimation: (unitId: string) => Promise<void>;
  setUnitAnimation: (unitId: string, animation: AnimationState) => void;
  clearEffect: (effectId: string) => void;
  isAnimating: boolean;
}

export function useBattleAnimations(): UseBattleAnimationsReturn {
  const [unitAnimations, setUnitAnimations] = useState<Map<string, AnimationState>>(new Map());
  const [effects, setEffects] = useState<CombatEffect[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationQueue = useRef<Promise<void>>(Promise.resolve());

  const setUnitAnimation = useCallback((unitId: string, animation: AnimationState) => {
    setUnitAnimations(prev => {
      const next = new Map(prev);
      next.set(unitId, animation);
      return next;
    });
  }, []);

  const clearEffect = useCallback((effectId: string) => {
    setEffects(prev => prev.filter(e => e.id !== effectId));
  }, []);

  const addEffect = useCallback((effect: Omit<CombatEffect, "id" | "startTime">) => {
    const newEffect: CombatEffect = {
      ...effect,
      id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      startTime: Date.now(),
    };
    setEffects(prev => [...prev, newEffect]);
    
    setTimeout(() => {
      clearEffect(newEffect.id);
    }, effect.duration);
    
    return newEffect;
  }, [clearEffect]);

  const waitForAnimation = useCallback((duration: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, duration));
  }, []);

  const playAttackAnimation = useCallback(async (attackerId: string, targetId: string, damage: number) => {
    setIsAnimating(true);
    
    // Anticipation - attacker winds up
    setUnitAnimation(attackerId, "attack");
    
    // Startup delay before active frames
    await waitForAnimation(150);
    
    // Active frames - impact effect plays ON TARGET (point of contact)
    addEffect({
      type: "impact",
      targetUnitId: targetId,
      sourceUnitId: attackerId,
      effectName: "slash",
      color: "#ff4444",
      projectileType: "on_target",
      duration: 120, // Very short impact flash (50-120ms as per guidelines)
    });
    
    // Hit reaction on target
    setUnitAnimation(targetId, "hit");
    
    // Damage number floats up from target
    addEffect({
      type: "damage",
      targetUnitId: targetId,
      sourceUnitId: attackerId,
      effectName: "damage_number",
      color: "#ff4444",
      value: damage,
      projectileType: "on_target",
      duration: 800,
    });
    
    // Recovery phase
    await waitForAnimation(300);
    
    setUnitAnimation(attackerId, "idle");
    setUnitAnimation(targetId, "idle");
    
    setIsAnimating(false);
  }, [setUnitAnimation, addEffect, waitForAnimation]);

  const playSpellAnimation = useCallback(async (
    casterId: string, 
    targetId: string, 
    spellName: string, 
    damage: number,
    spellColor: string
  ) => {
    setIsAnimating(true);
    
    // Anticipation - caster charges spell
    setUnitAnimation(casterId, "cast");
    
    // Casting effect ON SELF (caster)
    addEffect({
      type: "spell",
      targetUnitId: casterId,
      effectName: "casting",
      color: spellColor,
      projectileType: "on_self",
      duration: 500,
    });
    
    await waitForAnimation(400);
    
    // Traveling projectile from caster to target (starts at 50% = midpoint)
    addEffect({
      type: "projectile",
      targetUnitId: targetId,
      sourceUnitId: casterId,
      effectName: spellName,
      color: spellColor,
      projectileType: "travel",
      travelStartPercent: 0.5, // Start at midpoint, travel to target
      duration: 350,
    });
    
    await waitForAnimation(300);
    
    // Impact effect ON TARGET when projectile arrives
    addEffect({
      type: "impact",
      targetUnitId: targetId,
      sourceUnitId: casterId,
      effectName: spellName,
      color: spellColor,
      projectileType: "on_target",
      duration: 150,
    });
    
    setUnitAnimation(targetId, "hit");
    
    // Damage number ON TARGET
    addEffect({
      type: "damage",
      targetUnitId: targetId,
      effectName: "damage_number",
      color: spellColor,
      value: damage,
      projectileType: "on_target",
      duration: 800,
    });
    
    await waitForAnimation(300);
    
    setUnitAnimation(casterId, "idle");
    setUnitAnimation(targetId, "idle");
    
    setIsAnimating(false);
  }, [setUnitAnimation, addEffect, waitForAnimation]);

  const playHealAnimation = useCallback(async (casterId: string, targetId: string, healAmount: number) => {
    setIsAnimating(true);
    
    setUnitAnimation(casterId, "cast");
    
    await waitForAnimation(300);
    
    addEffect({
      type: "heal",
      targetUnitId: targetId,
      sourceUnitId: casterId,
      effectName: "heal",
      color: "#44ff44",
      value: healAmount,
      duration: 800,
    });
    
    await waitForAnimation(500);
    
    setUnitAnimation(casterId, "idle");
    
    setIsAnimating(false);
  }, [setUnitAnimation, addEffect, waitForAnimation]);

  const playDeathAnimation = useCallback(async (unitId: string) => {
    setIsAnimating(true);
    
    setUnitAnimation(unitId, "death");
    
    await waitForAnimation(1000);
    
    setIsAnimating(false);
  }, [setUnitAnimation, waitForAnimation]);

  const playHitAnimation = useCallback(async (unitId: string) => {
    setIsAnimating(true);
    
    setUnitAnimation(unitId, "hit");
    
    await waitForAnimation(300);
    
    setUnitAnimation(unitId, "idle");
    
    setIsAnimating(false);
  }, [setUnitAnimation, waitForAnimation]);

  return {
    unitAnimations,
    effects,
    playAttackAnimation,
    playSpellAnimation,
    playHealAnimation,
    playDeathAnimation,
    playHitAnimation,
    setUnitAnimation,
    clearEffect,
    isAnimating,
  };
}
