import type { HeroClass, Race } from '@shared/spriteUUIDs';
import { HERO_SPRITES } from '@shared/spriteUUIDs';

export interface BattleUnit {
  id: string;
  name: string;
  race: Race;
  heroClass: HeroClass;
  level: number;
  isEnemy: boolean;
  position: { x: number; y: number };
  stats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    magic: number;
    speed: number;
    range: number;
  };
  atbGauge: number;
  currentAnimation: string;
  skills: BattleSkill[];
  statusEffects: StatusEffect[];
}

export interface BattleSkill {
  id: string;
  name: string;
  type: 'attack' | 'magic' | 'heal' | 'buff' | 'debuff';
  damage?: number;
  healing?: number;
  mpCost: number;
  range: number;
  cooldown: number;
  currentCooldown: number;
  animation: string;
  effectColor: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  turnsRemaining: number;
  statModifier?: Partial<BattleUnit['stats']>;
}

export interface BattleAction {
  type: 'attack' | 'skill' | 'defend' | 'item';
  actorId: string;
  targetId?: string;
  skillId?: string;
  itemId?: string;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isBlocked: boolean;
  isMiss: boolean;
}

export interface BattleState {
  id: string;
  turn: number;
  phase: 'intro' | 'battle' | 'victory' | 'defeat' | 'player_action' | 'enemy_action' | 'animating';
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  activeUnitId: string | null;
  selectedTargetId: string | null;
  actionQueue: BattleAction[];
  battleLog: BattleLogEntry[];
  pendingDamage: PendingDamage[];
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'status' | 'system';
}

export interface PendingDamage {
  id: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  isHealing: boolean;
  x: number;
  y: number;
  createdAt: number;
}

const ATB_FILL_RATE = 0.02;
const ATB_SPEED_MULTIPLIER = 0.01;

export function createBattleUnit(
  id: string,
  name: string,
  race: Race,
  heroClass: HeroClass,
  level: number,
  isEnemy: boolean,
  position: { x: number; y: number }
): BattleUnit {
  const baseStats = getBaseStats(heroClass, level);
  const skills = getClassSkills(heroClass);

  return {
    id,
    name,
    race,
    heroClass,
    level,
    isEnemy,
    position,
    stats: {
      ...baseStats,
      hp: baseStats.maxHp,
      mp: baseStats.maxMp,
    },
    atbGauge: Math.random() * 0.3,
    currentAnimation: 'idle',
    skills,
    statusEffects: [],
  };
}

function getBaseStats(heroClass: HeroClass, level: number): Omit<BattleUnit['stats'], 'hp' | 'mp'> {
  const levelMultiplier = 1 + (level - 1) * 0.1;

  const classStats: Record<HeroClass, Omit<BattleUnit['stats'], 'hp' | 'mp'>> = {
    warrior: {
      maxHp: Math.floor(120 * levelMultiplier),
      maxMp: Math.floor(30 * levelMultiplier),
      attack: Math.floor(25 * levelMultiplier),
      defense: Math.floor(20 * levelMultiplier),
      magic: Math.floor(8 * levelMultiplier),
      speed: Math.floor(12 * levelMultiplier),
      range: 1,
    },
    ranger: {
      maxHp: Math.floor(80 * levelMultiplier),
      maxMp: Math.floor(40 * levelMultiplier),
      attack: Math.floor(22 * levelMultiplier),
      defense: Math.floor(12 * levelMultiplier),
      magic: Math.floor(12 * levelMultiplier),
      speed: Math.floor(18 * levelMultiplier),
      range: 4,
    },
    mage: {
      maxHp: Math.floor(70 * levelMultiplier),
      maxMp: Math.floor(80 * levelMultiplier),
      attack: Math.floor(10 * levelMultiplier),
      defense: Math.floor(10 * levelMultiplier),
      magic: Math.floor(30 * levelMultiplier),
      speed: Math.floor(14 * levelMultiplier),
      range: 3,
    },
    worge: {
      maxHp: Math.floor(100 * levelMultiplier),
      maxMp: Math.floor(35 * levelMultiplier),
      attack: Math.floor(28 * levelMultiplier),
      defense: Math.floor(15 * levelMultiplier),
      magic: Math.floor(10 * levelMultiplier),
      speed: Math.floor(20 * levelMultiplier),
      range: 1,
    },
  };

  return classStats[heroClass];
}

function getClassSkills(heroClass: HeroClass): BattleSkill[] {
  const skillSets: Record<HeroClass, BattleSkill[]> = {
    warrior: [
      { id: 'slash', name: 'Slash', type: 'attack', damage: 30, mpCost: 0, range: 1, cooldown: 0, currentCooldown: 0, animation: 'attack01', effectColor: '#ff6600' },
      { id: 'power-strike', name: 'Power Strike', type: 'attack', damage: 50, mpCost: 10, range: 1, cooldown: 2, currentCooldown: 0, animation: 'attack02', effectColor: '#ff3300' },
      { id: 'whirlwind', name: 'Whirlwind', type: 'attack', damage: 40, mpCost: 20, range: 1, cooldown: 3, currentCooldown: 0, animation: 'attack03', effectColor: '#ffaa00' },
    ],
    ranger: [
      { id: 'arrow-shot', name: 'Arrow Shot', type: 'attack', damage: 25, mpCost: 0, range: 4, cooldown: 0, currentCooldown: 0, animation: 'attack01', effectColor: '#88ff44' },
      { id: 'precise-shot', name: 'Precise Shot', type: 'attack', damage: 45, mpCost: 15, range: 5, cooldown: 2, currentCooldown: 0, animation: 'attack02', effectColor: '#44ff88' },
      { id: 'rain-of-arrows', name: 'Rain of Arrows', type: 'attack', damage: 35, mpCost: 25, range: 4, cooldown: 4, currentCooldown: 0, animation: 'attack01', effectColor: '#66ffaa' },
    ],
    mage: [
      { id: 'fireball', name: 'Fireball', type: 'magic', damage: 35, mpCost: 10, range: 3, cooldown: 0, currentCooldown: 0, animation: 'attack01', effectColor: '#ff4400' },
      { id: 'ice-lance', name: 'Ice Lance', type: 'magic', damage: 50, mpCost: 20, range: 4, cooldown: 2, currentCooldown: 0, animation: 'attack02', effectColor: '#44aaff' },
      { id: 'heal', name: 'Heal', type: 'heal', healing: 40, mpCost: 15, range: 3, cooldown: 2, currentCooldown: 0, animation: 'attack01', effectColor: '#44ff44' },
    ],
    worge: [
      { id: 'bite', name: 'Bite', type: 'attack', damage: 32, mpCost: 0, range: 1, cooldown: 0, currentCooldown: 0, animation: 'attack01', effectColor: '#ff8844' },
      { id: 'pounce', name: 'Pounce', type: 'attack', damage: 48, mpCost: 12, range: 2, cooldown: 2, currentCooldown: 0, animation: 'attack02', effectColor: '#ffaa44' },
      { id: 'howl', name: 'Howl', type: 'buff', mpCost: 18, range: 0, cooldown: 4, currentCooldown: 0, animation: 'attack03', effectColor: '#aaffaa' },
    ],
  };

  return skillSets[heroClass];
}

export function updateATBGauges(state: BattleState, deltaTime: number): BattleState {
  if (state.phase !== 'battle') return state;

  const allUnits = [...state.playerUnits, ...state.enemyUnits];
  let activeUnit: BattleUnit | null = null;

  const updatedPlayerUnits = state.playerUnits.map(unit => {
    if (unit.stats.hp <= 0) return unit;
    const speedBonus = unit.stats.speed * ATB_SPEED_MULTIPLIER;
    const newGauge = Math.min(1, unit.atbGauge + (ATB_FILL_RATE + speedBonus) * deltaTime);
    if (newGauge >= 1 && !activeUnit) {
      activeUnit = unit;
    }
    return { ...unit, atbGauge: newGauge };
  });

  const updatedEnemyUnits = state.enemyUnits.map(unit => {
    if (unit.stats.hp <= 0) return unit;
    const speedBonus = unit.stats.speed * ATB_SPEED_MULTIPLIER;
    const newGauge = Math.min(1, unit.atbGauge + (ATB_FILL_RATE + speedBonus) * deltaTime);
    if (newGauge >= 1 && !activeUnit) {
      activeUnit = unit;
    }
    return { ...unit, atbGauge: newGauge };
  });

  let newPhase: BattleState['phase'] = state.phase;
  let activeUnitId = state.activeUnitId;

  if (activeUnit && !state.activeUnitId) {
    activeUnitId = (activeUnit as BattleUnit).id;
    newPhase = (activeUnit as BattleUnit).isEnemy ? 'enemy_action' : 'player_action';
  }

  return {
    ...state,
    playerUnits: updatedPlayerUnits,
    enemyUnits: updatedEnemyUnits,
    phase: newPhase,
    activeUnitId,
  };
}

export function calculateDamage(attacker: BattleUnit, defender: BattleUnit, skill?: BattleSkill): DamageResult {
  const baseDamage = skill?.damage || attacker.stats.attack;
  const isMagic = skill?.type === 'magic';
  
  const attackStat = isMagic ? attacker.stats.magic : attacker.stats.attack;
  const defenseStat = isMagic ? defender.stats.magic * 0.5 : defender.stats.defense;
  
  const critChance = 0.1 + (attacker.stats.speed * 0.005);
  const blockChance = defender.heroClass === 'warrior' ? 0.15 : 0.05;
  const missChance = 0.05;

  const roll = Math.random();
  
  if (roll < missChance) {
    return { damage: 0, isCritical: false, isBlocked: false, isMiss: true };
  }
  
  if (roll < missChance + blockChance) {
    const blockedDamage = Math.floor(baseDamage * 0.3);
    return { damage: blockedDamage, isCritical: false, isBlocked: true, isMiss: false };
  }
  
  const isCritical = Math.random() < critChance;
  const critMultiplier = isCritical ? 1.5 : 1;
  
  const rawDamage = (baseDamage + attackStat * 0.5) * critMultiplier;
  const mitigatedDamage = rawDamage * (100 / (100 + defenseStat));
  const variance = 0.9 + Math.random() * 0.2;
  const finalDamage = Math.max(1, Math.floor(mitigatedDamage * variance));

  return { damage: finalDamage, isCritical, isBlocked: false, isMiss: false };
}

export function executeAction(state: BattleState, action: BattleAction): BattleState {
  const allUnits = [...state.playerUnits, ...state.enemyUnits];
  const actor = allUnits.find(u => u.id === action.actorId);
  if (!actor) return state;

  let newState: BattleState = { ...state, pendingDamage: [] as PendingDamage[] };
  const logEntries: BattleLogEntry[] = [];

  if (action.type === 'attack' || action.type === 'skill') {
    const target = allUnits.find(u => u.id === action.targetId);
    if (!target) return state;

    const skill = action.skillId 
      ? actor.skills.find(s => s.id === action.skillId)
      : actor.skills[0];

    if (skill?.type === 'heal') {
      const healing = skill.healing || 30;
      const newHp = Math.min(target.stats.maxHp, target.stats.hp + healing);
      
      newState = updateUnitInState(newState, target.id, {
        stats: { ...target.stats, hp: newHp }
      });

      newState.pendingDamage.push({
        id: `heal-${Date.now()}`,
        targetId: target.id,
        damage: healing,
        isCritical: false,
        isHealing: true,
        x: target.position.x,
        y: target.position.y,
        createdAt: Date.now(),
      });

      logEntries.push({
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        message: `${actor.name} heals ${target.name} for ${healing} HP!`,
        type: 'heal',
      });
    } else {
      const result = calculateDamage(actor, target, skill);
      
      if (!result.isMiss) {
        const newHp = Math.max(0, target.stats.hp - result.damage);
        newState = updateUnitInState(newState, target.id, {
          stats: { ...target.stats, hp: newHp },
          currentAnimation: newHp > 0 ? 'hurt' : 'death',
        });

        newState.pendingDamage.push({
          id: `dmg-${Date.now()}`,
          targetId: target.id,
          damage: result.damage,
          isCritical: result.isCritical,
          isHealing: false,
          x: target.position.x,
          y: target.position.y,
          createdAt: Date.now(),
        });
      }

      let message = '';
      if (result.isMiss) {
        message = `${actor.name} attacks ${target.name} but misses!`;
      } else if (result.isBlocked) {
        message = `${target.name} blocks! ${actor.name} deals ${result.damage} damage.`;
      } else if (result.isCritical) {
        message = `CRITICAL! ${actor.name} strikes ${target.name} for ${result.damage} damage!`;
      } else {
        message = `${actor.name} attacks ${target.name} for ${result.damage} damage.`;
      }

      logEntries.push({
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        message,
        type: 'damage',
      });
    }

    newState = updateUnitInState(newState, actor.id, {
      atbGauge: 0,
      currentAnimation: skill?.animation || 'attack01',
      stats: { ...actor.stats, mp: actor.stats.mp - (skill?.mpCost || 0) }
    });

    if (skill && skill.cooldown > 0) {
      const updatedSkills = actor.skills.map(s => 
        s.id === skill.id ? { ...s, currentCooldown: s.cooldown } : s
      );
      newState = updateUnitInState(newState, actor.id, { skills: updatedSkills });
    }
  } else if (action.type === 'defend') {
    newState = updateUnitInState(newState, actor.id, {
      atbGauge: 0,
      currentAnimation: 'block',
    });

    logEntries.push({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      message: `${actor.name} takes a defensive stance.`,
      type: 'system',
    });
  }

  const playerAlive = newState.playerUnits.some(u => u.stats.hp > 0);
  const enemyAlive = newState.enemyUnits.some(u => u.stats.hp > 0);

  if (!playerAlive) {
    newState.phase = 'defeat';
  } else if (!enemyAlive) {
    newState.phase = 'victory';
  } else {
    newState.phase = 'animating';
    newState.activeUnitId = null;
  }

  newState.battleLog = [...newState.battleLog, ...logEntries];
  newState.turn = state.turn + 1;

  newState = reduceCooldowns(newState);

  return newState;
}

function updateUnitInState(state: BattleState, unitId: string, updates: Partial<BattleUnit>): BattleState {
  const updateUnit = (unit: BattleUnit) => 
    unit.id === unitId ? { ...unit, ...updates } : unit;

  return {
    ...state,
    playerUnits: state.playerUnits.map(updateUnit),
    enemyUnits: state.enemyUnits.map(updateUnit),
  };
}

export function getAIAction(state: BattleState, enemyUnit: BattleUnit): BattleAction {
  const potentialTargets = state.playerUnits.filter(u => u.stats.hp > 0);
  if (potentialTargets.length === 0) {
    return { type: 'defend', actorId: enemyUnit.id };
  }

  const lowestHpTarget = potentialTargets.reduce((lowest, current) => 
    current.stats.hp < lowest.stats.hp ? current : lowest
  );

  const availableSkills = enemyUnit.skills.filter(
    s => s.currentCooldown === 0 && s.mpCost <= enemyUnit.stats.mp && s.type !== 'heal'
  );

  const skill = availableSkills.length > 0 
    ? availableSkills[Math.floor(Math.random() * availableSkills.length)]
    : enemyUnit.skills[0];

  return {
    type: 'skill',
    actorId: enemyUnit.id,
    targetId: lowestHpTarget.id,
    skillId: skill.id,
  };
}

export function reduceCooldowns(state: BattleState): BattleState {
  const reduceUnitCooldowns = (unit: BattleUnit): BattleUnit => ({
    ...unit,
    skills: unit.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    })),
  });

  return {
    ...state,
    playerUnits: state.playerUnits.map(reduceUnitCooldowns),
    enemyUnits: state.enemyUnits.map(reduceUnitCooldowns),
  };
}

export function createInitialBattleState(
  playerUnits: BattleUnit[],
  enemyUnits: BattleUnit[]
): BattleState {
  return {
    id: `battle-${Date.now()}`,
    turn: 1,
    phase: 'intro',
    playerUnits,
    enemyUnits,
    activeUnitId: null,
    selectedTargetId: null,
    actionQueue: [],
    battleLog: [{
      id: 'log-start',
      timestamp: Date.now(),
      message: 'Battle begins!',
      type: 'system',
    }],
    pendingDamage: [],
  };
}

export function generateEnemyParty(difficulty: number, playerLevel: number): BattleUnit[] {
  const validCombos = HERO_SPRITES.map(s => ({ race: s.race, heroClass: s.heroClass }));
  
  const enemyCount = Math.min(4, 2 + Math.floor(difficulty / 2));
  const enemyLevel = Math.max(1, playerLevel + (difficulty - 2));
  
  const enemies: BattleUnit[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    const combo = validCombos[Math.floor(Math.random() * validCombos.length)];
    const enemyNames = ['Shadow', 'Dark', 'Cursed', 'Fallen', 'Corrupted'];
    const name = `${enemyNames[Math.floor(Math.random() * enemyNames.length)]} ${combo.heroClass.charAt(0).toUpperCase() + combo.heroClass.slice(1)}`;
    
    const enemySlots = [
      { x: 700, y: 330 },
      { x: 752, y: 270 },
      { x: 700, y: 210 },
      { x: 752, y: 155 },
    ];
    enemies.push(createBattleUnit(
      `enemy-${i}-${Date.now()}`,
      name,
      combo.race,
      combo.heroClass,
      enemyLevel,
      true,
      enemySlots[i] ?? { x: 700, y: 330 - i * 60 }
    ));
  }
  
  return enemies;
}

export function getSpriteData(race: Race, heroClass: HeroClass) {
  return HERO_SPRITES.find(s => s.race === race && s.heroClass === heroClass);
}
