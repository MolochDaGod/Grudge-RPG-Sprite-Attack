export * from './weapons';
export * from './weaponSkills';

// Combat exports (excluding duplicates that are also in attributes)
export { 
  type CombatStats,
  type CombatResult as CombatDamageResult,
  STAT_CAPS as COMBAT_STAT_CAPS,
  calculateMitigation,
  calculateCombatDamage,
  checkDebuffSuccess,
  DEFENSE_EXAMPLES
} from './combat';

// Attributes exports (primary source for stat system)
export * from './attributes';

export * from './racesClasses';
export * from './professions';
export * from './dungeons';
export * from './islands';
export * from './items';
export * from './sailing';
export * from './sprites';
