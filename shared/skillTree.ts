import { z } from 'zod';

export const SkillClassSchema = z.enum(['warrior', 'mage', 'worge', 'ranger']);
export type SkillClass = z.infer<typeof SkillClassSchema>;

export const SkillTierSchema = z.enum(['tier1', 'tier2', 'tier3', 'tier4', 'tier5']);
export type SkillTier = z.infer<typeof SkillTierSchema>;

export const SkillTypeSchema = z.enum(['passive', 'active', 'ultimate']);
export type SkillType = z.infer<typeof SkillTypeSchema>;

export const SkillRequirementSchema = z.object({
  skillId: z.string().optional(),
  level: z.number().optional(),
  attributePoints: z.number().optional()
});
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

export const SkillEffectSchema = z.object({
  type: z.string(),
  value: z.number(),
  duration: z.number().optional(),
  description: z.string()
});
export type SkillEffect = z.infer<typeof SkillEffectSchema>;

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
  tier: SkillTierSchema,
  type: SkillTypeSchema,
  skillClass: SkillClassSchema,
  maxPoints: z.number(),
  currentPoints: z.number(),
  requirements: z.array(SkillRequirementSchema),
  effects: z.array(SkillEffectSchema),
  cooldown: z.number().optional(),
  manaCost: z.number().optional(),
  staminaCost: z.number().optional()
});
export type Skill = z.infer<typeof SkillSchema>;

export const SkillTreeStateSchema = z.object({
  skillClass: SkillClassSchema,
  availablePoints: z.number(),
  spentPoints: z.number(),
  unlockedSkills: z.array(z.string()),
  skillPoints: z.record(z.string(), z.number())
});
export type SkillTreeState = z.infer<typeof SkillTreeStateSchema>;

export const ClassSkillTreeSchema = z.object({
  skillClass: SkillClassSchema,
  displayName: z.string(),
  icon: z.string(),
  color: z.string(),
  skills: z.array(SkillSchema)
});
export type ClassSkillTree = z.infer<typeof ClassSkillTreeSchema>;

export const CLASS_SKILL_TREES: ClassSkillTree[] = [
  {
    skillClass: 'warrior',
    displayName: 'Warrior',
    icon: 'sword',
    color: '#ef4444',
    skills: [
      {
        id: 'warrior-power-strike',
        name: 'Power Strike',
        icon: 'swords',
        description: 'A powerful melee attack that deals increased damage',
        tier: 'tier1',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'damage', value: 150, description: '+50% damage per point' }],
        cooldown: 8,
        staminaCost: 20
      },
      {
        id: 'warrior-shield-wall',
        name: 'Shield Wall',
        icon: 'shield',
        description: 'Raise your shield to block incoming attacks',
        tier: 'tier1',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'blockChance', value: 25, duration: 5, description: '+25% block chance' }],
        cooldown: 15,
        staminaCost: 30
      },
      {
        id: 'warrior-heavy-armor',
        name: 'Heavy Armor Training',
        icon: 'shield-check',
        description: 'Passive: Increased armor effectiveness',
        tier: 'tier1',
        type: 'passive',
        skillClass: 'warrior',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'defense', value: 8, description: '+8 defense per point' }]
      },
      {
        id: 'warrior-battle-cry',
        name: 'Battle Cry',
        icon: 'megaphone',
        description: 'Inspire allies and intimidate enemies',
        tier: 'tier2',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-power-strike', level: 1 }],
        effects: [{ type: 'damage', value: 15, duration: 10, description: '+15% damage to allies' }],
        cooldown: 30,
        staminaCost: 40
      },
      {
        id: 'warrior-thick-skin',
        name: 'Thick Skin',
        icon: 'brick-wall',
        description: 'Passive armor increase',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'warrior',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-shield-wall', level: 1 }],
        effects: [{ type: 'defense', value: 10, description: '+10 defense per point' }]
      },
      {
        id: 'warrior-cleave',
        name: 'Cleave',
        icon: 'axe',
        description: 'Swing weapon in an arc hitting multiple enemies',
        tier: 'tier2',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-power-strike', level: 2 }],
        effects: [{ type: 'damage', value: 80, description: 'Hit up to 3 targets' }],
        cooldown: 10,
        staminaCost: 25
      },
      {
        id: 'warrior-taunt',
        name: 'Taunt',
        icon: 'alert-circle',
        description: 'Force enemies to attack you',
        tier: 'tier2',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-shield-wall', level: 2 }],
        effects: [{ type: 'taunt', value: 5, duration: 5, description: 'Force target for 5s' }],
        cooldown: 20,
        staminaCost: 20
      },
      {
        id: 'warrior-berserker-rage',
        name: 'Berserker Rage',
        icon: 'flame',
        description: 'Enter a rage state, increasing damage but reducing defense',
        tier: 'tier3',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-battle-cry', level: 2 }],
        effects: [
          { type: 'damage', value: 50, duration: 15, description: '+50% damage' },
          { type: 'defense', value: -25, duration: 15, description: '-25% defense' }
        ],
        cooldown: 60,
        staminaCost: 50
      },
      {
        id: 'warrior-iron-will',
        name: 'Iron Will',
        icon: 'shield-off',
        description: 'Passive: Resist crowd control effects',
        tier: 'tier3',
        type: 'passive',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-thick-skin', level: 3 }],
        effects: [{ type: 'ccResist', value: 15, description: '+15% CC resistance per point' }]
      },
      {
        id: 'warrior-whirlwind',
        name: 'Whirlwind',
        icon: 'rotate-cw',
        description: 'Spin attack hitting all nearby enemies',
        tier: 'tier3',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-cleave', level: 2 }],
        effects: [{ type: 'damage', value: 100, description: 'AoE damage around self' }],
        cooldown: 15,
        staminaCost: 35
      },
      {
        id: 'warrior-last-stand',
        name: 'Last Stand',
        icon: 'heart-pulse',
        description: 'Become immune to death for a short duration',
        tier: 'tier4',
        type: 'active',
        skillClass: 'warrior',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-iron-will', level: 2 }],
        effects: [{ type: 'immunity', value: 3, duration: 3, description: 'Cannot die for 3s' }],
        cooldown: 180,
        staminaCost: 60
      },
      {
        id: 'warrior-executioner',
        name: 'Executioner',
        icon: 'skull',
        description: 'Ultimate: Devastating attack against low health targets',
        tier: 'tier5',
        type: 'ultimate',
        skillClass: 'warrior',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'warrior-berserker-rage', level: 3 }],
        effects: [{ type: 'damage', value: 300, description: '+300% damage to targets below 30% health' }],
        cooldown: 120,
        staminaCost: 80
      }
    ]
  },
  {
    skillClass: 'mage',
    displayName: 'Mage Priest',
    icon: 'wand',
    color: '#8b5cf6',
    skills: [
      {
        id: 'mage-fireball',
        name: 'Fireball',
        icon: 'flame',
        description: 'Launch a ball of fire at enemies',
        tier: 'tier1',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'damage', value: 120, description: 'Fire damage' }],
        cooldown: 6,
        manaCost: 25
      },
      {
        id: 'mage-heal',
        name: 'Healing Light',
        icon: 'sparkles',
        description: 'Restore health to an ally',
        tier: 'tier1',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'heal', value: 100, description: 'Restore health' }],
        cooldown: 10,
        manaCost: 30
      },
      {
        id: 'mage-mana-mastery',
        name: 'Mana Mastery',
        icon: 'droplets',
        description: 'Passive: Increased maximum mana',
        tier: 'tier1',
        type: 'passive',
        skillClass: 'mage',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'mana', value: 20, description: '+20 mana per point' }]
      },
      {
        id: 'mage-arcane-shield',
        name: 'Arcane Shield',
        icon: 'shield',
        description: 'Create a magical barrier that absorbs damage',
        tier: 'tier2',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-heal', level: 1 }],
        effects: [{ type: 'shield', value: 150, duration: 8, description: 'Absorbs 150 damage' }],
        cooldown: 20,
        manaCost: 40
      },
      {
        id: 'mage-mana-flow',
        name: 'Mana Flow',
        icon: 'droplet',
        description: 'Passive mana regeneration increase',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'mage',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-fireball', level: 1 }],
        effects: [{ type: 'manaRegen', value: 5, description: '+5 mana regen per point' }]
      },
      {
        id: 'mage-frost-nova',
        name: 'Frost Nova',
        icon: 'snowflake',
        description: 'Freeze nearby enemies in place',
        tier: 'tier2',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-fireball', level: 2 }],
        effects: [{ type: 'freeze', value: 2, duration: 2, description: 'Freeze for 2s' }],
        cooldown: 18,
        manaCost: 35
      },
      {
        id: 'mage-group-heal',
        name: 'Circle of Healing',
        icon: 'users',
        description: 'Heal all nearby allies',
        tier: 'tier2',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-heal', level: 2 }],
        effects: [{ type: 'heal', value: 60, description: 'Heal all allies in range' }],
        cooldown: 25,
        manaCost: 50
      },
      {
        id: 'mage-chain-lightning',
        name: 'Chain Lightning',
        icon: 'zap',
        description: 'Lightning that jumps between enemies',
        tier: 'tier3',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-fireball', level: 3 }],
        effects: [{ type: 'damage', value: 80, description: 'Hits up to 4 targets' }],
        cooldown: 15,
        manaCost: 50
      },
      {
        id: 'mage-spell-focus',
        name: 'Spell Focus',
        icon: 'target',
        description: 'Passive: Increased spell critical chance',
        tier: 'tier3',
        type: 'passive',
        skillClass: 'mage',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-mana-flow', level: 3 }],
        effects: [{ type: 'criticalChance', value: 3, description: '+3% spell crit per point' }]
      },
      {
        id: 'mage-blessing',
        name: 'Divine Blessing',
        icon: 'hand-heart',
        description: 'Grant an ally increased healing received',
        tier: 'tier3',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-group-heal', level: 2 }],
        effects: [{ type: 'healingReceived', value: 30, duration: 15, description: '+30% healing received' }],
        cooldown: 30,
        manaCost: 40
      },
      {
        id: 'mage-meteor',
        name: 'Meteor Strike',
        icon: 'flame',
        description: 'Call down a massive meteor for huge AoE damage',
        tier: 'tier4',
        type: 'active',
        skillClass: 'mage',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-chain-lightning', level: 2 }],
        effects: [{ type: 'damage', value: 250, description: 'Massive AoE fire damage' }],
        cooldown: 90,
        manaCost: 80
      },
      {
        id: 'mage-divine-intervention',
        name: 'Divine Intervention',
        icon: 'heart',
        description: 'Ultimate: Revive a fallen ally with full health',
        tier: 'tier5',
        type: 'ultimate',
        skillClass: 'mage',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'mage-heal', level: 5 }],
        effects: [{ type: 'revive', value: 100, description: 'Revive with 100% health' }],
        cooldown: 180,
        manaCost: 100
      }
    ]
  },
  {
    skillClass: 'worge',
    displayName: 'Worge',
    icon: 'dog',
    color: '#d97706',
    skills: [
      {
        id: 'worge-bite',
        name: 'Savage Bite',
        icon: 'circle-dot',
        description: 'A vicious bite that causes bleeding',
        tier: 'tier1',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [
          { type: 'damage', value: 80, description: 'Physical damage' },
          { type: 'bleed', value: 20, duration: 5, description: 'Bleed damage over time' }
        ],
        cooldown: 5,
        staminaCost: 15
      },
      {
        id: 'worge-howl',
        name: 'Howl',
        icon: 'volume-2',
        description: 'Terrifying howl that reduces enemy accuracy',
        tier: 'tier1',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'debuff', value: -15, duration: 8, description: '-15% enemy accuracy' }],
        cooldown: 20,
        staminaCost: 25
      },
      {
        id: 'worge-thick-fur',
        name: 'Thick Fur',
        icon: 'shield',
        description: 'Passive: Natural armor from fur',
        tier: 'tier1',
        type: 'passive',
        skillClass: 'worge',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'defense', value: 6, description: '+6 defense per point' }]
      },
      {
        id: 'worge-pack-tactics',
        name: 'Pack Tactics',
        icon: 'users',
        description: 'Passive: Increased damage when allies are nearby',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'worge',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-bite', level: 1 }],
        effects: [{ type: 'damage', value: 5, description: '+5% damage per nearby ally' }]
      },
      {
        id: 'worge-feral-agility',
        name: 'Feral Agility',
        icon: 'wind',
        description: 'Passive: Increased movement and attack speed',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'worge',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-howl', level: 1 }],
        effects: [{ type: 'speed', value: 10, description: '+10% speed per point' }]
      },
      {
        id: 'worge-pounce',
        name: 'Pounce',
        icon: 'arrow-up-right',
        description: 'Leap at target dealing damage and stunning',
        tier: 'tier2',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-bite', level: 2 }],
        effects: [
          { type: 'damage', value: 60, description: 'Impact damage' },
          { type: 'stun', value: 1, duration: 1, description: 'Stun for 1s' }
        ],
        cooldown: 12,
        staminaCost: 30
      },
      {
        id: 'worge-scent-track',
        name: 'Scent Tracking',
        icon: 'search',
        description: 'Passive: Detect hidden enemies',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'worge',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-howl', level: 2 }],
        effects: [{ type: 'detection', value: 10, description: '+10 detection range per point' }]
      },
      {
        id: 'worge-rend',
        name: 'Rend',
        icon: 'slash',
        description: 'Tear into enemies causing massive bleeding',
        tier: 'tier3',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-bite', level: 3 }],
        effects: [{ type: 'bleed', value: 50, duration: 10, description: 'Heavy bleed damage' }],
        cooldown: 25,
        staminaCost: 40
      },
      {
        id: 'worge-bloodlust',
        name: 'Bloodlust',
        icon: 'activity',
        description: 'Passive: Heal on dealing damage',
        tier: 'tier3',
        type: 'passive',
        skillClass: 'worge',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-pack-tactics', level: 3 }],
        effects: [{ type: 'lifesteal', value: 3, description: '+3% lifesteal per point' }]
      },
      {
        id: 'worge-alpha-howl',
        name: 'Alpha Howl',
        icon: 'volume-x',
        description: 'Fear all nearby enemies causing them to flee',
        tier: 'tier3',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-howl', level: 3 }],
        effects: [{ type: 'fear', value: 3, duration: 3, description: 'Fear for 3s' }],
        cooldown: 45,
        staminaCost: 50
      },
      {
        id: 'worge-savage-fury',
        name: 'Savage Fury',
        icon: 'zap',
        description: 'Enter a frenzy, attacking rapidly',
        tier: 'tier4',
        type: 'active',
        skillClass: 'worge',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-rend', level: 2 }],
        effects: [{ type: 'attackSpeed', value: 50, duration: 8, description: '+50% attack speed' }],
        cooldown: 60,
        staminaCost: 45
      },
      {
        id: 'worge-alpha-form',
        name: 'Alpha Form',
        icon: 'crown',
        description: 'Ultimate: Transform into a powerful alpha worge',
        tier: 'tier5',
        type: 'ultimate',
        skillClass: 'worge',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'worge-bloodlust', level: 5 }],
        effects: [
          { type: 'damage', value: 100, duration: 20, description: '+100% damage' },
          { type: 'defense', value: 50, duration: 20, description: '+50% defense' }
        ],
        cooldown: 120,
        staminaCost: 80
      }
    ]
  },
  {
    skillClass: 'ranger',
    displayName: 'Ranger',
    icon: 'crosshair',
    color: '#22c55e',
    skills: [
      {
        id: 'ranger-aimed-shot',
        name: 'Aimed Shot',
        icon: 'target',
        description: 'A precise shot with increased critical chance',
        tier: 'tier1',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [
          { type: 'damage', value: 130, description: 'Physical damage' },
          { type: 'criticalChance', value: 25, description: '+25% critical chance' }
        ],
        cooldown: 8,
        staminaCost: 20
      },
      {
        id: 'ranger-trap',
        name: 'Bear Trap',
        icon: 'triangle',
        description: 'Place a trap that immobilizes enemies',
        tier: 'tier1',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'root', value: 3, description: 'Immobilize for 3 seconds' }],
        cooldown: 15,
        staminaCost: 25
      },
      {
        id: 'ranger-steady-aim',
        name: 'Steady Aim',
        icon: 'focus',
        description: 'Passive: Increased accuracy',
        tier: 'tier1',
        type: 'passive',
        skillClass: 'ranger',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [],
        effects: [{ type: 'accuracy', value: 4, description: '+4% accuracy per point' }]
      },
      {
        id: 'ranger-eagle-eye',
        name: 'Eagle Eye',
        icon: 'eye',
        description: 'Passive: Increased accuracy and critical damage',
        tier: 'tier2',
        type: 'passive',
        skillClass: 'ranger',
        maxPoints: 5,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-aimed-shot', level: 1 }],
        effects: [
          { type: 'accuracy', value: 5, description: '+5% accuracy per point' },
          { type: 'criticalFactor', value: 10, description: '+10% crit damage per point' }
        ]
      },
      {
        id: 'ranger-camouflage',
        name: 'Camouflage',
        icon: 'eye-off',
        description: 'Blend into surroundings, becoming harder to hit',
        tier: 'tier2',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-trap', level: 1 }],
        effects: [{ type: 'evasion', value: 30, duration: 10, description: '+30% evasion' }],
        cooldown: 25,
        staminaCost: 30
      },
      {
        id: 'ranger-quick-shot',
        name: 'Quick Shot',
        icon: 'zap',
        description: 'Fast attack with reduced cooldown',
        tier: 'tier2',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-aimed-shot', level: 2 }],
        effects: [{ type: 'damage', value: 70, description: 'Quick physical damage' }],
        cooldown: 3,
        staminaCost: 10
      },
      {
        id: 'ranger-poison-arrow',
        name: 'Poison Arrow',
        icon: 'flask-conical',
        description: 'Shoot an arrow coated in poison',
        tier: 'tier2',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-trap', level: 2 }],
        effects: [{ type: 'poison', value: 15, duration: 8, description: 'Poison damage over time' }],
        cooldown: 12,
        staminaCost: 20
      },
      {
        id: 'ranger-multishot',
        name: 'Multishot',
        icon: 'layers',
        description: 'Fire multiple arrows at once',
        tier: 'tier3',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-aimed-shot', level: 3 }],
        effects: [{ type: 'damage', value: 70, description: 'Hit up to 5 targets' }],
        cooldown: 12,
        staminaCost: 35
      },
      {
        id: 'ranger-tracking',
        name: 'Master Tracker',
        icon: 'compass',
        description: 'Passive: Reveal enemy positions',
        tier: 'tier3',
        type: 'passive',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-camouflage', level: 2 }],
        effects: [{ type: 'tracking', value: 20, description: '+20 tracking range per point' }]
      },
      {
        id: 'ranger-explosive-trap',
        name: 'Explosive Trap',
        icon: 'bomb',
        description: 'Place a trap that explodes dealing AoE damage',
        tier: 'tier3',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 3,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-trap', level: 3 }],
        effects: [{ type: 'damage', value: 120, description: 'AoE explosion damage' }],
        cooldown: 20,
        staminaCost: 35
      },
      {
        id: 'ranger-snipe',
        name: 'Snipe',
        icon: 'crosshair',
        description: 'Long range high damage shot',
        tier: 'tier4',
        type: 'active',
        skillClass: 'ranger',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-eagle-eye', level: 4 }],
        effects: [{ type: 'damage', value: 250, description: 'Massive single target damage' }],
        cooldown: 30,
        staminaCost: 50
      },
      {
        id: 'ranger-rain-of-arrows',
        name: 'Rain of Arrows',
        icon: 'cloud-rain',
        description: 'Ultimate: Rain arrows down on a large area',
        tier: 'tier5',
        type: 'ultimate',
        skillClass: 'ranger',
        maxPoints: 1,
        currentPoints: 0,
        requirements: [{ skillId: 'ranger-multishot', level: 3 }],
        effects: [{ type: 'damage', value: 200, duration: 5, description: 'Massive AoE damage' }],
        cooldown: 90,
        staminaCost: 70
      }
    ]
  }
];

z.array(ClassSkillTreeSchema).parse(CLASS_SKILL_TREES);

// Weapon Types
export const WeaponTypeSchema = z.enum(['sword', 'bow', 'staff', 'dagger', 'axe', 'hammer']);
export type WeaponType = z.infer<typeof WeaponTypeSchema>;

// Hotkey Slots for weapon skills
export const HotkeySlotSchema = z.enum(['Q', 'W', 'E', 'R', 'D', 'F']);
export type HotkeySlot = z.infer<typeof HotkeySlotSchema>;

// Weapon Skill with hotkey binding
export const WeaponSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
  tier: SkillTierSchema,
  effect: z.string(),
  maxPoints: z.number(),
  currentPoints: z.number(),
  requires: z.string().nullable(),
  hotkey: HotkeySlotSchema.optional(),
  cooldown: z.number().optional(),
  manaCost: z.number().optional(),
  staminaCost: z.number().optional()
});
export type WeaponSkill = z.infer<typeof WeaponSkillSchema>;

// Weapon Skill Tree
export const WeaponSkillTreeSchema = z.object({
  weaponType: WeaponTypeSchema,
  displayName: z.string(),
  icon: z.string(),
  color: z.string(),
  tiers: z.array(z.object({
    name: z.string(),
    skills: z.array(WeaponSkillSchema)
  }))
});
export type WeaponSkillTree = z.infer<typeof WeaponSkillTreeSchema>;

// Hotkey Loadout - skills equipped to hotkey slots
export const HotkeyLoadoutSchema = z.object({
  Q: z.string().optional(),
  W: z.string().optional(),
  E: z.string().optional(),
  R: z.string().optional(),
  D: z.string().optional(),
  F: z.string().optional()
});
export type HotkeyLoadout = z.infer<typeof HotkeyLoadoutSchema>;

// Weapon Skill Trees Data - icons are Lucide icon names
export const WEAPON_SKILL_TREES: WeaponSkillTree[] = [
  {
    weaponType: 'sword',
    displayName: 'Sword Mastery',
    icon: 'sword',
    color: '#ef4444',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'sword_slash', name: 'Sharp Slash', icon: 'sword', description: 'Sword attacks deal more damage', tier: 'tier1', effect: '+8% Sword Damage', maxPoints: 3, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 5, staminaCost: 15 },
          { id: 'sword_speed', name: 'Swift Blade', icon: 'wind', description: 'Faster sword attacks', tier: 'tier1', effect: '+5% Attack Speed', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'parry', name: 'Parry', icon: 'shield', description: 'Block attacks and counter', tier: 'tier1', effect: 'Counter Attack', maxPoints: 2, currentPoints: 0, requires: null, hotkey: 'E', cooldown: 8, staminaCost: 20 }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'combo_master', name: 'Combo Master', icon: 'repeat', description: 'Extended combo chain', tier: 'tier2', effect: '+2 Combo Hits', maxPoints: 1, currentPoints: 0, requires: 'sword_slash' },
          { id: 'riposte', name: 'Riposte', icon: 'zap', description: 'Perfect parry deals damage', tier: 'tier2', effect: '50% Counter Damage', maxPoints: 3, currentPoints: 0, requires: 'parry', hotkey: 'W', cooldown: 10, staminaCost: 25 },
          { id: 'lunge', name: 'Lunge', icon: 'arrow-right', description: 'Dash forward with thrust', tier: 'tier2', effect: 'Gap Closer', maxPoints: 2, currentPoints: 0, requires: 'sword_speed', hotkey: 'R', cooldown: 12, staminaCost: 30 }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'whirlwind', name: 'Whirlwind', icon: 'rotate-cw', description: 'Spin attack hits all nearby', tier: 'tier3', effect: 'AoE Spin Attack', maxPoints: 1, currentPoints: 0, requires: 'combo_master', hotkey: 'D', cooldown: 15, staminaCost: 40 },
          { id: 'blade_dance', name: 'Blade Dance', icon: 'sparkles', description: 'Rapid attack sequence', tier: 'tier3', effect: '5 Hit Combo', maxPoints: 2, currentPoints: 0, requires: 'riposte' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'sword_ultimate', name: 'Blade Storm', icon: 'swords', description: 'Unleash a devastating flurry', tier: 'tier4', effect: 'Ultimate: 10 Rapid Hits', maxPoints: 1, currentPoints: 0, requires: 'whirlwind', hotkey: 'F', cooldown: 60, staminaCost: 80 }
        ]
      }
    ]
  },
  {
    weaponType: 'bow',
    displayName: 'Bow Mastery',
    icon: 'bow',
    color: '#f59e0b',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'bow_aim', name: 'Keen Eye', icon: 'target', description: 'Better aim accuracy', tier: 'tier1', effect: '+10% Accuracy', maxPoints: 3, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 0, staminaCost: 10 },
          { id: 'bow_draw', name: 'Strong Draw', icon: 'crosshair', description: 'Faster charge speed', tier: 'tier1', effect: '+10% Charge Speed', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'bow_range', name: 'Long Shot', icon: 'maximize', description: 'Extended arrow range', tier: 'tier1', effect: '+20% Range', maxPoints: 2, currentPoints: 0, requires: null }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'quick_shot', name: 'Quick Shot', icon: 'zap', description: 'Instant weak shot', tier: 'tier2', effect: 'Fast Attack', maxPoints: 1, currentPoints: 0, requires: 'bow_aim', hotkey: 'W', cooldown: 3, staminaCost: 15 },
          { id: 'power_shot_bow', name: 'Power Shot', icon: 'circle-dot', description: 'Charged shots deal more', tier: 'tier2', effect: '+25% Charged Damage', maxPoints: 3, currentPoints: 0, requires: 'bow_draw', hotkey: 'E', cooldown: 8, staminaCost: 25 },
          { id: 'fire_arrow', name: 'Fire Arrow', icon: 'flame', description: 'Arrows ignite targets', tier: 'tier2', effect: 'Burning DoT', maxPoints: 2, currentPoints: 0, requires: 'bow_range', hotkey: 'R', cooldown: 10, staminaCost: 20 }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'triple_shot', name: 'Triple Shot', icon: 'split', description: 'Fire 3 arrows at once', tier: 'tier3', effect: 'Multi-shot', maxPoints: 1, currentPoints: 0, requires: 'quick_shot', hotkey: 'D', cooldown: 12, staminaCost: 35 },
          { id: 'piercing', name: 'Piercing Shot', icon: 'move-right', description: 'Arrows pierce enemies', tier: 'tier3', effect: 'Pierce 2 Targets', maxPoints: 2, currentPoints: 0, requires: 'power_shot_bow' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'bow_ultimate', name: 'Arrow Storm', icon: 'cloud-rain', description: 'Rain arrows on area', tier: 'tier4', effect: 'Ultimate: AoE Rain', maxPoints: 1, currentPoints: 0, requires: 'triple_shot', hotkey: 'F', cooldown: 60, staminaCost: 70 }
        ]
      }
    ]
  },
  {
    weaponType: 'staff',
    displayName: 'Staff Mastery',
    icon: 'staff',
    color: '#8b5cf6',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'staff_power', name: 'Arcane Power', icon: 'sparkles', description: 'Increased spell damage', tier: 'tier1', effect: '+10% Magic Damage', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'mana_regen', name: 'Mana Flow', icon: 'droplets', description: 'Faster mana recovery', tier: 'tier1', effect: '+15% Mana Regen', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'magic_bolt', name: 'Magic Bolt', icon: 'zap', description: 'Basic magic projectile', tier: 'tier1', effect: 'Ranged Attack', maxPoints: 2, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 2, manaCost: 10 }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'fireball_staff', name: 'Fireball', icon: 'flame', description: 'Explosive fire spell', tier: 'tier2', effect: 'AoE Fire Damage', maxPoints: 3, currentPoints: 0, requires: 'staff_power', hotkey: 'W', cooldown: 8, manaCost: 30 },
          { id: 'ice_spike', name: 'Ice Spike', icon: 'snowflake', description: 'Freezing projectile', tier: 'tier2', effect: 'Slow + Damage', maxPoints: 3, currentPoints: 0, requires: 'magic_bolt', hotkey: 'E', cooldown: 6, manaCost: 25 },
          { id: 'mana_shield', name: 'Mana Shield', icon: 'shield', description: 'Absorb damage with mana', tier: 'tier2', effect: 'Damage Barrier', maxPoints: 2, currentPoints: 0, requires: 'mana_regen', hotkey: 'R', cooldown: 20, manaCost: 40 }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'chain_lightning_staff', name: 'Chain Lightning', icon: 'zap', description: 'Lightning bounces between enemies', tier: 'tier3', effect: 'Hit 5 Targets', maxPoints: 1, currentPoints: 0, requires: 'fireball_staff', hotkey: 'D', cooldown: 12, manaCost: 45 },
          { id: 'blink_staff', name: 'Blink', icon: 'star', description: 'Short range teleport', tier: 'tier3', effect: 'Instant Movement', maxPoints: 2, currentPoints: 0, requires: 'mana_shield' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'staff_ultimate', name: 'Meteor', icon: 'circle', description: 'Call down a devastating meteor', tier: 'tier4', effect: 'Ultimate: Massive AoE', maxPoints: 1, currentPoints: 0, requires: 'chain_lightning_staff', hotkey: 'F', cooldown: 90, manaCost: 100 }
        ]
      }
    ]
  },
  {
    weaponType: 'dagger',
    displayName: 'Dagger Mastery',
    icon: 'dagger',
    color: '#22c55e',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'dagger_speed', name: 'Quick Strikes', icon: 'wind', description: 'Faster attack speed', tier: 'tier1', effect: '+15% Attack Speed', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'dagger_crit', name: 'Vital Strike', icon: 'skull', description: 'Higher critical chance', tier: 'tier1', effect: '+8% Crit Chance', maxPoints: 3, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 4, staminaCost: 12 },
          { id: 'dagger_poison', name: 'Poison Coat', icon: 'flask-conical', description: 'Apply poison on hit', tier: 'tier1', effect: 'Poison DoT', maxPoints: 2, currentPoints: 0, requires: null, hotkey: 'E', cooldown: 15, staminaCost: 20 }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'flurry', name: 'Flurry', icon: 'tornado', description: 'Rapid attack chain', tier: 'tier2', effect: '4 Quick Hits', maxPoints: 1, currentPoints: 0, requires: 'dagger_speed', hotkey: 'W', cooldown: 8, staminaCost: 25 },
          { id: 'backstab', name: 'Backstab', icon: 'knife', description: 'Behind attacks crit', tier: 'tier2', effect: 'Guaranteed Back Crit', maxPoints: 3, currentPoints: 0, requires: 'dagger_crit', hotkey: 'R', cooldown: 10, staminaCost: 30 },
          { id: 'envenom', name: 'Envenom', icon: 'bug', description: 'Stronger poison', tier: 'tier2', effect: '+50% Poison Damage', maxPoints: 2, currentPoints: 0, requires: 'dagger_poison' }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'shadow_strike', name: 'Shadow Strike', icon: 'moon', description: 'Teleport and attack', tier: 'tier3', effect: 'Blink Attack', maxPoints: 1, currentPoints: 0, requires: 'flurry', hotkey: 'D', cooldown: 15, staminaCost: 40 },
          { id: 'assassinate_dagger', name: 'Assassinate', icon: 'skull', description: 'Execute low HP targets', tier: 'tier3', effect: 'Kill below 20% HP', maxPoints: 2, currentPoints: 0, requires: 'backstab' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'dagger_ultimate', name: 'Death Blossom', icon: 'flower', description: 'Spinning blade dance', tier: 'tier4', effect: 'Ultimate: 360 Attack', maxPoints: 1, currentPoints: 0, requires: 'shadow_strike', hotkey: 'F', cooldown: 60, staminaCost: 70 }
        ]
      }
    ]
  },
  {
    weaponType: 'axe',
    displayName: 'Axe Mastery',
    icon: 'axe',
    color: '#dc2626',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'axe_power', name: 'Brutal Force', icon: 'axe', description: 'More raw damage', tier: 'tier1', effect: '+15% Damage', maxPoints: 3, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 6, staminaCost: 20 },
          { id: 'axe_cleave', name: 'Wide Swing', icon: 'move-horizontal', description: 'Wider attack arc', tier: 'tier1', effect: '+30% AoE Size', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'axe_armor', name: 'Armor Break', icon: 'shield-off', description: 'Reduce target armor', tier: 'tier1', effect: '-10% Enemy Defense', maxPoints: 2, currentPoints: 0, requires: null }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'overhead', name: 'Overhead Slam', icon: 'arrow-down', description: 'Powerful overhead strike', tier: 'tier2', effect: '+40% Single Hit', maxPoints: 1, currentPoints: 0, requires: 'axe_power', hotkey: 'W', cooldown: 10, staminaCost: 35 },
          { id: 'whirlwind_axe', name: 'Whirlwind', icon: 'rotate-cw', description: 'Spin attack', tier: 'tier2', effect: 'AoE Spin', maxPoints: 3, currentPoints: 0, requires: 'axe_cleave', hotkey: 'E', cooldown: 12, staminaCost: 40 },
          { id: 'rend', name: 'Rend', icon: 'droplet', description: 'Cause bleeding', tier: 'tier2', effect: 'Bleed DoT', maxPoints: 2, currentPoints: 0, requires: 'axe_armor', hotkey: 'R', cooldown: 8, staminaCost: 25 }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'execute_axe', name: 'Execute', icon: 'skull', description: 'Massive damage to wounded', tier: 'tier3', effect: '+100% below 30% HP', maxPoints: 1, currentPoints: 0, requires: 'overhead', hotkey: 'D', cooldown: 15, staminaCost: 45 },
          { id: 'bloodlust', name: 'Bloodlust', icon: 'heart', description: 'Heal on kill', tier: 'tier3', effect: '+10% Max HP on Kill', maxPoints: 2, currentPoints: 0, requires: 'rend' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'axe_ultimate', name: 'Rampage', icon: 'angry', description: 'Berserk attack frenzy', tier: 'tier4', effect: 'Ultimate: 2x Speed 5s', maxPoints: 1, currentPoints: 0, requires: 'execute_axe', hotkey: 'F', cooldown: 60, staminaCost: 80 }
        ]
      }
    ]
  },
  {
    weaponType: 'hammer',
    displayName: 'Hammer Mastery',
    icon: 'hammer',
    color: '#6b7280',
    tiers: [
      {
        name: 'Tier 1 - Basics',
        skills: [
          { id: 'hammer_impact', name: 'Heavy Impact', icon: 'hammer', description: 'More stagger power', tier: 'tier1', effect: '+20% Stagger', maxPoints: 3, currentPoints: 0, requires: null, hotkey: 'Q', cooldown: 6, staminaCost: 20 },
          { id: 'hammer_crush', name: 'Crushing Blow', icon: 'bomb', description: 'Ignore armor', tier: 'tier1', effect: '15% Armor Pen', maxPoints: 3, currentPoints: 0, requires: null },
          { id: 'hammer_stun', name: 'Concussion', icon: 'star', description: 'Chance to stun', tier: 'tier1', effect: '10% Stun Chance', maxPoints: 2, currentPoints: 0, requires: null }
        ]
      },
      {
        name: 'Tier 2 - Combat',
        skills: [
          { id: 'ground_slam', name: 'Ground Slam', icon: 'arrow-down', description: 'AoE shockwave', tier: 'tier2', effect: 'AoE Knockdown', maxPoints: 1, currentPoints: 0, requires: 'hammer_impact', hotkey: 'W', cooldown: 12, staminaCost: 40 },
          { id: 'shatter_hammer', name: 'Shatter', icon: 'gem', description: 'Break shields', tier: 'tier2', effect: 'Shield Break', maxPoints: 3, currentPoints: 0, requires: 'hammer_crush', hotkey: 'E', cooldown: 10, staminaCost: 30 },
          { id: 'daze', name: 'Daze', icon: 'circle-dashed', description: 'Extended stun', tier: 'tier2', effect: '+1s Stun Duration', maxPoints: 2, currentPoints: 0, requires: 'hammer_stun', hotkey: 'R', cooldown: 15, staminaCost: 35 }
        ]
      },
      {
        name: 'Tier 3 - Mastery',
        skills: [
          { id: 'earthquake', name: 'Earthquake', icon: 'mountain', description: 'Ground crack AoE', tier: 'tier3', effect: 'Line AoE Damage', maxPoints: 1, currentPoints: 0, requires: 'ground_slam', hotkey: 'D', cooldown: 18, staminaCost: 50 },
          { id: 'fortress', name: 'Fortress', icon: 'castle', description: 'Damage resistance', tier: 'tier3', effect: '+30% Defense 5s', maxPoints: 2, currentPoints: 0, requires: 'shatter_hammer' }
        ]
      },
      {
        name: 'Tier 4 - Ultimate',
        skills: [
          { id: 'hammer_ultimate', name: 'Meteor Strike', icon: 'circle', description: 'Leap and slam for massive damage', tier: 'tier4', effect: 'Ultimate: Jump AoE', maxPoints: 1, currentPoints: 0, requires: 'earthquake', hotkey: 'F', cooldown: 60, staminaCost: 80 }
        ]
      }
    ]
  }
];

// Validate weapon skill trees
z.array(WeaponSkillTreeSchema).parse(WEAPON_SKILL_TREES);

export function getClassSkillTree(skillClass: SkillClass): ClassSkillTree | undefined {
  return CLASS_SKILL_TREES.find(tree => tree.skillClass === skillClass);
}

export function getWeaponSkillTree(weaponType: WeaponType): WeaponSkillTree | undefined {
  return WEAPON_SKILL_TREES.find(tree => tree.weaponType === weaponType);
}

export function getAllWeaponSkills(weaponType: WeaponType): WeaponSkill[] {
  const tree = getWeaponSkillTree(weaponType);
  if (!tree) return [];
  return tree.tiers.flatMap(tier => tier.skills);
}

export function getHotkeySkills(weaponType: WeaponType): Record<HotkeySlot, WeaponSkill | undefined> {
  const skills = getAllWeaponSkills(weaponType);
  const result: Record<HotkeySlot, WeaponSkill | undefined> = {
    Q: undefined,
    W: undefined,
    E: undefined,
    R: undefined,
    D: undefined,
    F: undefined
  };
  
  for (const skill of skills) {
    if (skill.hotkey) {
      result[skill.hotkey] = skill;
    }
  }
  
  return result;
}

export function getSkillById(skillId: string): Skill | undefined {
  for (const tree of CLASS_SKILL_TREES) {
    const skill = tree.skills.find(s => s.id === skillId);
    if (skill) return skill;
  }
  return undefined;
}

export function canUnlockSkill(skill: Skill, state: SkillTreeState): boolean {
  if (state.availablePoints <= 0) return false;
  if (skill.currentPoints >= skill.maxPoints) return false;
  
  for (const req of skill.requirements) {
    if (req.skillId) {
      const reqPoints = state.skillPoints[req.skillId] || 0;
      if (reqPoints < (req.level || 1)) return false;
    }
    if (req.attributePoints && state.spentPoints < req.attributePoints) return false;
  }
  
  return true;
}

export function createDefaultSkillTreeState(skillClass: SkillClass): SkillTreeState {
  return {
    skillClass,
    availablePoints: 0,
    spentPoints: 0,
    unlockedSkills: [],
    skillPoints: {}
  };
}

export function getSkillsByTier(skillClass: SkillClass, tier: SkillTier): Skill[] {
  const tree = getClassSkillTree(skillClass);
  if (!tree) return [];
  return tree.skills.filter(s => s.tier === tier);
}

export function getTotalSkillsPerClass(): Record<SkillClass, number> {
  return {
    warrior: CLASS_SKILL_TREES.find(t => t.skillClass === 'warrior')?.skills.length || 0,
    mage: CLASS_SKILL_TREES.find(t => t.skillClass === 'mage')?.skills.length || 0,
    worge: CLASS_SKILL_TREES.find(t => t.skillClass === 'worge')?.skills.length || 0,
    ranger: CLASS_SKILL_TREES.find(t => t.skillClass === 'ranger')?.skills.length || 0
  };
}
