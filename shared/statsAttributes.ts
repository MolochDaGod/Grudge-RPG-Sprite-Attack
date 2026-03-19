import { z } from 'zod';

export const AttributeNameSchema = z.enum([
  'strength', 'vitality', 'endurance', 'intellect', 
  'wisdom', 'dexterity', 'agility', 'tactics'
]);
export type AttributeName = z.infer<typeof AttributeNameSchema>;

export const StatNameSchema = z.enum([
  'health', 'mana', 'stamina', 'damage', 'defense',
  'blockChance', 'blockFactor', 'criticalChance', 'criticalFactor',
  'accuracy', 'resistance'
]);
export type StatName = z.infer<typeof StatNameSchema>;

export const AttributeBonusSchema = z.object({
  flat: z.number(),
  percent: z.number()
});
export type AttributeBonus = z.infer<typeof AttributeBonusSchema>;

export const AttributeEffectSchema = z.object({
  stat: StatNameSchema,
  bonus: AttributeBonusSchema
});
export type AttributeEffect = z.infer<typeof AttributeEffectSchema>;

export const AttributeDefinitionSchema = z.object({
  name: AttributeNameSchema,
  displayName: z.string(),
  description: z.string(),
  role: z.string(),
  color: z.string(),
  icon: z.string(),
  effects: z.array(AttributeEffectSchema)
});
export type AttributeDefinition = z.infer<typeof AttributeDefinitionSchema>;

export const CharacterStatsSchema = z.object({
  health: z.number(),
  mana: z.number(),
  stamina: z.number(),
  damage: z.number(),
  defense: z.number(),
  blockChance: z.number(),
  blockFactor: z.number(),
  criticalChance: z.number(),
  criticalFactor: z.number(),
  accuracy: z.number(),
  resistance: z.number()
});
export type CharacterStats = z.infer<typeof CharacterStatsSchema>;

export const CharacterAttributesSchema = z.object({
  strength: z.number(),
  vitality: z.number(),
  endurance: z.number(),
  intellect: z.number(),
  wisdom: z.number(),
  dexterity: z.number(),
  agility: z.number(),
  tactics: z.number()
});
export type CharacterAttributes = z.infer<typeof CharacterAttributesSchema>;

export const STAT_CAPS: CharacterStats = {
  health: 99999,
  mana: 9999,
  stamina: 999,
  damage: 9999,
  defense: 9999,
  blockChance: 75,
  blockFactor: 80,
  criticalChance: 100,
  criticalFactor: 500,
  accuracy: 100,
  resistance: 80
};

export const DIMINISHING_RETURNS_THRESHOLD = 25;

export const ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  {
    name: 'strength',
    displayName: 'Strength',
    description: 'High health, damage, and defense with strong combat modifiers',
    role: 'Tank / Melee DPS',
    color: '#e74c3c',
    icon: 'sword',
    effects: [
      { stat: 'health', bonus: { flat: 26, percent: 0.8 } },
      { stat: 'damage', bonus: { flat: 3, percent: 2 } },
      { stat: 'defense', bonus: { flat: 12, percent: 1.5 } },
      { stat: 'blockChance', bonus: { flat: 0.5, percent: 5 } },
      { stat: 'criticalChance', bonus: { flat: 0.32, percent: 7 } },
      { stat: 'blockFactor', bonus: { flat: 0.85, percent: 26.3 } },
      { stat: 'criticalFactor', bonus: { flat: 1.1, percent: 1.5 } }
    ]
  },
  {
    name: 'vitality',
    displayName: 'Vitality',
    description: 'Maximum health, defense, and damage mitigation',
    role: 'Tank / Survivability',
    color: '#27ae60',
    icon: 'heart',
    effects: [
      { stat: 'health', bonus: { flat: 25, percent: 0.5 } },
      { stat: 'mana', bonus: { flat: 2, percent: 0.2 } },
      { stat: 'stamina', bonus: { flat: 5, percent: 0.1 } },
      { stat: 'damage', bonus: { flat: 2, percent: 0.1 } },
      { stat: 'defense', bonus: { flat: 12, percent: 0 } },
      { stat: 'blockFactor', bonus: { flat: 0.3, percent: 17 } },
      { stat: 'resistance', bonus: { flat: 0.5, percent: 0 } }
    ]
  },
  {
    name: 'endurance',
    displayName: 'Endurance',
    description: 'Defense, block mechanics, and critical evasion',
    role: 'Defensive Specialist',
    color: '#95a5a6',
    icon: 'shield',
    effects: [
      { stat: 'health', bonus: { flat: 10, percent: 0.1 } },
      { stat: 'stamina', bonus: { flat: 1, percent: 0.3 } },
      { stat: 'defense', bonus: { flat: 12, percent: 12 } },
      { stat: 'blockChance', bonus: { flat: 0.11, percent: 73.5 } },
      { stat: 'blockFactor', bonus: { flat: 0.27, percent: 0 } },
      { stat: 'resistance', bonus: { flat: 0.46, percent: 0 } }
    ]
  },
  {
    name: 'intellect',
    displayName: 'Intellect',
    description: 'Mana, magic damage, and spell accuracy',
    role: 'Mage / Caster',
    color: '#3498db',
    icon: 'brain',
    effects: [
      { stat: 'mana', bonus: { flat: 5, percent: 5 } },
      { stat: 'damage', bonus: { flat: 4, percent: 2.5 } },
      { stat: 'defense', bonus: { flat: 2, percent: 0 } },
      { stat: 'criticalChance', bonus: { flat: 0.23, percent: 0.1 } },
      { stat: 'accuracy', bonus: { flat: 0.12, percent: 33.8 } },
      { stat: 'resistance', bonus: { flat: 0.38, percent: 17 } }
    ]
  },
  {
    name: 'wisdom',
    displayName: 'Wisdom',
    description: 'Mana efficiency, survivability, and spell effectiveness',
    role: 'Healer / Support',
    color: '#9b59b6',
    icon: 'sparkles',
    effects: [
      { stat: 'health', bonus: { flat: 10, percent: 0 } },
      { stat: 'mana', bonus: { flat: 20, percent: 3 } },
      { stat: 'damage', bonus: { flat: 2, percent: 1.5 } },
      { stat: 'defense', bonus: { flat: 2, percent: 0 } },
      { stat: 'criticalChance', bonus: { flat: 0.5, percent: 0.15 } },
      { stat: 'resistance', bonus: { flat: 0.5, percent: 0 } }
    ]
  },
  {
    name: 'dexterity',
    displayName: 'Dexterity',
    description: 'Critical strikes, accuracy, and evasion',
    role: 'Rogue / Precision Fighter',
    color: '#f39c12',
    icon: 'target',
    effects: [
      { stat: 'damage', bonus: { flat: 3, percent: 1.8 } },
      { stat: 'defense', bonus: { flat: 10, percent: 1 } },
      { stat: 'blockChance', bonus: { flat: 0.41, percent: 1 } },
      { stat: 'criticalChance', bonus: { flat: 0.5, percent: 1.2 } },
      { stat: 'accuracy', bonus: { flat: 0.7, percent: 1.5 } }
    ]
  },
  {
    name: 'agility',
    displayName: 'Agility',
    description: 'Mobility, critical strikes, and defensive penetration',
    role: 'Mobile DPS / Dodge Tank',
    color: '#1abc9c',
    icon: 'zap',
    effects: [
      { stat: 'health', bonus: { flat: 2, percent: 0.6 } },
      { stat: 'stamina', bonus: { flat: 5, percent: 0.5 } },
      { stat: 'damage', bonus: { flat: 3, percent: 1.6 } },
      { stat: 'defense', bonus: { flat: 5, percent: 0.8 } },
      { stat: 'criticalChance', bonus: { flat: 0.42, percent: 1 } }
    ]
  },
  {
    name: 'tactics',
    displayName: 'Tactics',
    description: 'Balanced combat stats with penetration abilities',
    role: 'Strategic Fighter / Commander',
    color: '#34495e',
    icon: 'compass',
    effects: [
      { stat: 'health', bonus: { flat: 10, percent: 8.4 } },
      { stat: 'mana', bonus: { flat: 0, percent: 8.2 } },
      { stat: 'stamina', bonus: { flat: 1, percent: 0 } },
      { stat: 'damage', bonus: { flat: 3, percent: 0.2 } },
      { stat: 'defense', bonus: { flat: 5, percent: 0.5 } },
      { stat: 'blockChance', bonus: { flat: 0.27, percent: 0.8 } }
    ]
  }
];

z.array(AttributeDefinitionSchema).parse(ATTRIBUTE_DEFINITIONS);

export function getAttributeDefinition(name: AttributeName): AttributeDefinition | undefined {
  return ATTRIBUTE_DEFINITIONS.find(a => a.name === name);
}

export function calculateStatFromAttributes(
  statName: StatName,
  baseStat: number,
  attributes: CharacterAttributes
): number {
  let total = baseStat;
  
  for (const attrDef of ATTRIBUTE_DEFINITIONS) {
    const attrValue = attributes[attrDef.name];
    const effect = attrDef.effects.find(e => e.stat === statName);
    
    if (effect && attrValue > 0) {
      const effectivePoints = attrValue <= DIMINISHING_RETURNS_THRESHOLD 
        ? attrValue 
        : DIMINISHING_RETURNS_THRESHOLD + (attrValue - DIMINISHING_RETURNS_THRESHOLD) * 0.5;
      
      const flatBonus = effect.bonus.flat * effectivePoints;
      const percentBonus = baseStat * (effect.bonus.percent / 100) * effectivePoints;
      total += flatBonus + percentBonus;
    }
  }
  
  const cap = STAT_CAPS[statName];
  return Math.min(total, cap);
}

export function createDefaultAttributes(): CharacterAttributes {
  return {
    strength: 0,
    vitality: 0,
    endurance: 0,
    intellect: 0,
    wisdom: 0,
    dexterity: 0,
    agility: 0,
    tactics: 0
  };
}

export function createDefaultStats(): CharacterStats {
  return {
    health: 100,
    mana: 50,
    stamina: 100,
    damage: 10,
    defense: 5,
    blockChance: 5,
    blockFactor: 25,
    criticalChance: 5,
    criticalFactor: 150,
    accuracy: 90,
    resistance: 0
  };
}
