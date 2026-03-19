export interface AIConfig {
  personalityTemperature: number;
  responseStyle: string;
  knowledgeDomains: string[];
  canGiveQuests?: boolean;
  questTypes?: string[];
  hostileToFactions?: string[];
  friendlyToFactions?: string[];
}

export interface DialogueSamples {
  greeting?: string;
  greeting_neutral?: string;
  greeting_friendly?: string;
  greeting_hostile?: string;
  quest_offer?: string;
  blessing?: string;
  combat_start?: string;
  victory?: string;
  defeat?: string;
  faction_greeting?: string;
  rally_cry?: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
}

export interface NPCRelationship {
  targetId: string;
  type: 'friend' | 'rival' | 'neutral' | 'enemy';
  description: string;
}

export interface AIAgent {
  id: string;
  entityType: 'god' | 'faction' | 'hero' | 'location' | 'npc';
  name: string;
  title: string;
  domain?: string;
  factionId?: string;
  patronGodId?: string;
  raceId?: string;
  classId?: string;
  level?: number;
  description: string;
  backstory: string;
  aiConfig: AIConfig;
  dialogueSamples: DialogueSamples;
  questPool?: QuestDefinition[];
  relationships?: NPCRelationship[];
}

export const AI_RESPONSE_STYLES: Record<string, { description: string; traits: string[] }> = {
  wise_commanding: {
    description: "Speaks with authority and ancient wisdom",
    traits: ["formal", "metaphorical", "references_fate"]
  },
  cryptic_chaotic: {
    description: "Speaks in riddles with unpredictable patterns",
    traits: ["mysterious", "chaotic", "prophetic"]
  },
  transcendent_wise: {
    description: "Speaks absolute truths with cosmic perspective",
    traits: ["balanced", "philosophical", "all-knowing"]
  },
  honorable_military: {
    description: "Direct and disciplined military speech",
    traits: ["formal", "honorable", "tactical"]
  },
  aggressive_chaotic: {
    description: "Fierce and unpredictable aggressive tone",
    traits: ["aggressive", "threatening", "passionate"]
  },
  wise_diplomatic: {
    description: "Calm and measured diplomatic speech",
    traits: ["peaceful", "wise", "negotiating"]
  },
  noble_inspirational: {
    description: "Uplifting and noble heroic speech",
    traits: ["inspiring", "noble", "protective"]
  },
  military_blunt: {
    description: "Terse, no-nonsense military communication",
    traits: ["direct", "stern", "efficient"]
  },
  cryptic_mysterious: {
    description: "Enigmatic and shadowy communication",
    traits: ["secretive", "clever", "information-trading"]
  },
  simple_primal: {
    description: "Basic speech with animal instincts",
    traits: ["simple", "instinctive", "pack-oriented"]
  },
  primal_fierce: {
    description: "Primal warrior speech with bloodlust",
    traits: ["fierce", "barbaric", "powerful"]
  }
};

export const GODS: AIAgent[] = [
  {
    id: "god_odin",
    entityType: "god",
    name: "Odin",
    title: "The All-Father",
    domain: "War, Wisdom, Fate, Victory",
    description: "Patron of warriors who seek victory through strength and strategy. Odin sacrificed his eye to see all timelines of the Grudge wars.",
    backstory: "Odin's ravens Huginn and Muninn report all player activities daily. He favors those who die gloriously in combat. His spear Gungnir never misses its mark. Odin can speak to players through crow NPCs. He secretly admires The Omni's balance but will never admit it.",
    aiConfig: {
      personalityTemperature: 0.6,
      responseStyle: "wise_commanding",
      knowledgeDomains: ["warfare", "fate", "wisdom", "runes", "valhalla"],
      canGiveQuests: true,
      questTypes: ["combat", "prophecy", "artifact_retrieval"],
      hostileToFactions: ["legion"],
      friendlyToFactions: ["crusade"],
    },
    dialogueSamples: {
      greeting: "Child of battle, I have watched your journey through mine ravens' eyes.",
      quest_offer: "The threads of fate converge upon you. Will you grasp victory?",
      blessing: "My golden lightning shall guide your blade to its mark.",
    },
  },
  {
    id: "god_madra",
    entityType: "god",
    name: "Madra",
    title: "The Chaos Mother",
    domain: "Entropy, Transformation, Destruction, Rebirth",
    description: "Force of necessary destruction and evolution. She believes destruction is the only path to true growth.",
    backstory: "Madra created the Undead by refusing to let her children truly die. She loves her Legion children but shows it through trials. Her temples appear randomly as islands are consumed. Madra speaks in riddles that reveal future catastrophes.",
    aiConfig: {
      personalityTemperature: 0.9,
      responseStyle: "cryptic_chaotic",
      knowledgeDomains: ["entropy", "necromancy", "transformation", "chaos_magic"],
      canGiveQuests: true,
      questTypes: ["destruction", "corruption", "rebirth"],
      hostileToFactions: ["crusade", "fabled"],
      friendlyToFactions: ["legion"],
    },
    dialogueSamples: {
      greeting: "From ash, you came. To ash, you shall return... only stronger.",
      quest_offer: "Destruction awaits, child. Embrace it, and find your true form.",
      blessing: "The chaos within you stirs. Let it consume your enemies.",
    },
  },
  {
    id: "god_omni",
    entityType: "god",
    name: "The Omni",
    title: "The Eternal One",
    domain: "Balance, Unity, Infinity, Harmony",
    description: "Keeper of cosmic balance, prevents total annihilation.",
    backstory: "The Omni is neither male nor female but all things. They secretly mourn that balance requires conflict. Their third eye can see a player's true intentions.",
    aiConfig: {
      personalityTemperature: 0.5,
      responseStyle: "transcendent_wise",
      knowledgeDomains: ["balance", "harmony", "creation", "true_sight", "unity"],
      canGiveQuests: true,
      questTypes: ["diplomacy", "restoration", "protection"],
      hostileToFactions: [],
      friendlyToFactions: ["fabled"],
    },
    dialogueSamples: {
      greeting: "Your path leads here, as all paths ultimately must.",
      quest_offer: "Balance must be restored. Will you be the instrument of harmony?",
      blessing: "See with clarity, act with purpose, restore what was lost.",
    },
  },
];

export const FACTION_AGENTS: AIAgent[] = [
  {
    id: "faction_crusade",
    entityType: "faction",
    name: "The Crusade",
    title: "Victory Through Valor",
    patronGodId: "god_odin",
    description: "Alliance of Humans and Barbarians who seek victory through strength and honor.",
    backstory: "The Crusade formed when the Barbarian tribes united with the 'civilized' human kingdoms against the threat of the Waterfall and the Legion.",
    aiConfig: {
      personalityTemperature: 0.6,
      responseStyle: "honorable_military",
      knowledgeDomains: ["warfare", "honor", "odin_worship", "human_history", "barbarian_culture"],
    },
    dialogueSamples: {
      faction_greeting: "For Odin! For the Crusade!",
      rally_cry: "Victory through valor! We march forward!",
    },
  },
  {
    id: "faction_legion",
    entityType: "faction",
    name: "The Legion",
    title: "Through Chaos, We Are Reborn",
    patronGodId: "god_madra",
    description: "Coalition of Orcs and Undead who embrace chaos and transformation.",
    backstory: "Born from volcanic crevices and abyssal zones, the Legion rises as a coordinated, relentless force.",
    aiConfig: {
      personalityTemperature: 0.8,
      responseStyle: "aggressive_chaotic",
      knowledgeDomains: ["conquest", "necromancy", "chaos", "orc_culture", "undead_lore"],
    },
    dialogueSamples: {
      faction_greeting: "Destruction is but a prelude to creation!",
      rally_cry: "Embrace chaos! Through it, pure power is reborn!",
    },
  },
  {
    id: "faction_fabled",
    entityType: "faction",
    name: "The Fabled",
    title: "In Balance, We Find Eternity",
    patronGodId: "god_omni",
    description: "Alliance of Elves and Dwarves who seek balance and harmony.",
    backstory: "The oldest races united under The Omni's guidance to preserve knowledge and maintain the delicate balance.",
    aiConfig: {
      personalityTemperature: 0.5,
      responseStyle: "wise_diplomatic",
      knowledgeDomains: ["ancient_lore", "balance", "nature_magic", "forge_craft", "diplomacy"],
    },
    dialogueSamples: {
      faction_greeting: "May The Omni's light guide your path.",
      rally_cry: "In balance, we find strength. In unity, eternity!",
    },
  },
];

export const HERO_AGENTS: AIAgent[] = [
  {
    id: "hero_aurion",
    entityType: "hero",
    name: "Aurion",
    title: "The Radiant",
    factionId: "faction_crusade",
    raceId: "human",
    classId: "mage",
    level: 50,
    description: "The most powerful human mage in living memory. Marked by Odin at birth during a solar eclipse.",
    backstory: "Born as golden light erupted from the sky - Odin himself marking the child. His power comes from proximity to the Waterfall.",
    aiConfig: {
      personalityTemperature: 0.7,
      responseStyle: "noble_inspirational",
      knowledgeDomains: ["crusade_history", "solar_magic", "odin_worship", "waterfall_lore", "healing_arts"],
      canGiveQuests: true,
      questTypes: ["protection", "escort", "monster_slaying", "artifact_retrieval"],
      hostileToFactions: ["legion"],
      friendlyToFactions: ["crusade", "fabled"],
    },
    dialogueSamples: {
      greeting_neutral: "Hail, traveler. The light of Odin guides your path here.",
      greeting_friendly: "Ah, a friend returns! Your deeds echo in the light.",
      greeting_hostile: "The shadows cling to you... state your business quickly.",
      quest_offer: "I sense purpose in you. Would you carry the light where I cannot?",
      combat_start: "By Odin's eye, you shall fall!",
      victory: "The dawn always defeats the night.",
      defeat: "The light... merely dims... never dies...",
    },
    questPool: [
      { id: "aurion_quest_1", title: "Light Against the Dark", description: "Cleanse corrupted shrines near Waterfall" },
      { id: "aurion_quest_2", title: "Dawn Patrol", description: "Scout advancing void zones" },
      { id: "aurion_quest_3", title: "The Radiant Path", description: "Escort refugees to safety" },
    ],
    relationships: [
      { targetId: "hero_silesh", type: "rival", description: "Ancient enemies" },
      { targetId: "hero_aelindor", type: "friend", description: "Fought together in many battles" },
    ],
  },
  {
    id: "hero_sigurd",
    entityType: "hero",
    name: "Sigurd",
    title: "The Unbreakable",
    factionId: "faction_crusade",
    raceId: "human",
    classId: "warrior",
    level: 55,
    description: "Supreme Commander of Crusade ground forces. He has never lost a duel.",
    backstory: "Born to a blacksmith family, at age 16 he single-handedly held a bridge for three days. He fought Thrax to a draw and they became blood brothers.",
    aiConfig: {
      personalityTemperature: 0.5,
      responseStyle: "military_blunt",
      knowledgeDomains: ["warfare_tactics", "crusade_military", "weapon_mastery", "defensive_fortification", "honor_codes"],
      canGiveQuests: true,
      questTypes: ["combat_training", "defense_missions", "dueling", "fortification"],
    },
    dialogueSamples: {
      greeting_neutral: "State your business.",
      greeting_friendly: "Warrior. Good to see you standing.",
      greeting_hostile: "You smell of Legion. Explain.",
      quest_offer: "I need fighters, not talkers. Prove yourself.",
      combat_start: "Come, then. Show me your resolve.",
      victory: "Adequate.",
      defeat: "Impossible... but... well fought...",
    },
    questPool: [
      { id: "sigurd_quest_1", title: "Trial by Combat", description: "Defeat Sigurd's training dummies" },
      { id: "sigurd_quest_2", title: "Hold the Line", description: "Survive waves of enemies" },
      { id: "sigurd_quest_3", title: "The Weight of Command", description: "Make difficult tactical decisions" },
    ],
    relationships: [
      { targetId: "hero_thrax", type: "friend", description: "Blood brothers after their legendary duel" },
      { targetId: "hero_gruk", type: "rival", description: "Worthy opponent in battle" },
    ],
  },
  {
    id: "hero_thrax",
    entityType: "hero",
    name: "Thrax",
    title: "The Savage",
    factionId: "faction_crusade",
    raceId: "barbarian",
    classId: "warrior",
    level: 52,
    description: "Odin's Berserker, born of prophecy.",
    backstory: "At age 18, he challenged and defeated every tribal champion in single combat to unite the Barbarian tribes with the Crusade.",
    aiConfig: {
      personalityTemperature: 0.7,
      responseStyle: "primal_fierce",
      knowledgeDomains: ["barbarian_culture", "rage_combat", "tribal_magic", "primal_strength"],
      canGiveQuests: true,
      questTypes: ["combat", "survival", "tribal_rites"],
    },
    dialogueSamples: {
      greeting_neutral: "Hmm. You strong? We see.",
      greeting_friendly: "HA! Friend! Let us drink and fight!",
      greeting_hostile: "BLOOD! Your blood on my axes!",
      quest_offer: "Fight together good. Fight apart stupid. You join hunt?",
      combat_start: "RAAAAGH! BLOOD FOR ODIN!",
      victory: "Good fight! You worthy!",
      defeat: "I... fall... but... rise again...",
    },
    questPool: [
      { id: "thrax_quest_1", title: "Blood and Glory", description: "Defeat worthy opponents in combat" },
      { id: "thrax_quest_2", title: "Tribal Rites", description: "Participate in Barbarian ceremonies" },
    ],
    relationships: [
      { targetId: "hero_sigurd", type: "friend", description: "Blood brothers" },
    ],
  },
  {
    id: "hero_kael",
    entityType: "hero",
    name: "Kael",
    title: "The Shadowblade",
    factionId: "faction_crusade",
    raceId: "human",
    classId: "ranger",
    level: 48,
    description: "The Crusade's intelligence master. No one knows his true origin.",
    backstory: "He has prevented seventeen assassination attempts on Crusade leaders, mapped the interior of three Legion fortresses.",
    aiConfig: {
      personalityTemperature: 0.8,
      responseStyle: "cryptic_mysterious",
      knowledgeDomains: ["espionage", "stealth_tactics", "poison_craft", "secret_lore", "hidden_locations"],
      canGiveQuests: true,
      questTypes: ["stealth_missions", "information_gathering", "assassination", "puzzle_solving"],
    },
    dialogueSamples: {
      greeting_neutral: "...you saw me. Interesting.",
      greeting_friendly: "Ah, a shadow I can trust. What do you bring me?",
      greeting_hostile: "You know too much. That's... problematic.",
      quest_offer: "Information has a price. What are you willing to pay?",
      combat_start: "",
      victory: "You never saw me.",
      defeat: "A shadow... cannot truly... die...",
    },
    questPool: [
      { id: "kael_quest_1", title: "Whispers in the Dark", description: "Eavesdrop on NPC conversations" },
      { id: "kael_quest_2", title: "The Poisoner's Art", description: "Learn to craft toxins" },
    ],
  },
  {
    id: "hero_theron",
    entityType: "hero",
    name: "Theron",
    title: "Wildkin",
    factionId: "faction_crusade",
    raceId: "human",
    classId: "worges",
    level: 45,
    description: "Brother of Beasts, raised by wolves after being lost in the Wildwood at age 5.",
    backstory: "A pack of dire wolves found him and adopted him. He lived as a wolf for twelve years. His wolf-brother Fenrix is not a pet but an equal partner.",
    aiConfig: {
      personalityTemperature: 0.6,
      responseStyle: "simple_primal",
      knowledgeDomains: ["nature_lore", "beast_taming", "tracking", "survival", "pack_tactics", "territorial_magic"],
      canGiveQuests: true,
      questTypes: ["hunting", "taming", "nature_protection", "tracking"],
    },
    dialogueSamples: {
      greeting_neutral: "*sniff* You smell... uncertain. Speak.",
      greeting_friendly: "*Fenrix wags tail* Pack-friend returns. Good.",
      greeting_hostile: "*growls* You smell of death-magic. Leave. Now.",
      quest_offer: "The wild needs defenders. Will you run with us?",
      combat_start: "*howls* FENRIX! HUNT!",
      victory: "*panting* Good hunt.",
      defeat: "Fenrix... run... save the pack...",
    },
    questPool: [
      { id: "theron_quest_1", title: "The Hunt", description: "Track and defeat dangerous prey" },
      { id: "theron_quest_2", title: "Pack Bond", description: "Help players bond with companion creatures" },
    ],
  },
];

export const ALL_AGENTS: AIAgent[] = [...GODS, ...FACTION_AGENTS, ...HERO_AGENTS];

export function getAgentById(id: string): AIAgent | undefined {
  return ALL_AGENTS.find(agent => agent.id === id);
}

export function getAgentsByFaction(factionId: string): AIAgent[] {
  return ALL_AGENTS.filter(agent => agent.factionId === factionId);
}

export function getAgentsByType(entityType: AIAgent['entityType']): AIAgent[] {
  return ALL_AGENTS.filter(agent => agent.entityType === entityType);
}

export function getQuestGivers(): AIAgent[] {
  return ALL_AGENTS.filter(agent => agent.aiConfig.canGiveQuests);
}

export function generateDialogue(agent: AIAgent, context: 'greeting' | 'quest' | 'combat' | 'victory' | 'defeat', playerFaction?: string): string {
  const samples = agent.dialogueSamples;
  
  if (context === 'greeting') {
    if (playerFaction && agent.aiConfig.hostileToFactions?.includes(playerFaction)) {
      return samples.greeting_hostile || samples.greeting || "...";
    }
    if (playerFaction && agent.aiConfig.friendlyToFactions?.includes(playerFaction)) {
      return samples.greeting_friendly || samples.greeting || "Welcome.";
    }
    return samples.greeting_neutral || samples.greeting || "Greetings.";
  }
  
  if (context === 'quest') {
    return samples.quest_offer || "I have a task for you.";
  }
  
  if (context === 'combat') {
    return samples.combat_start || "";
  }
  
  if (context === 'victory') {
    return samples.victory || "Victory is mine.";
  }
  
  if (context === 'defeat') {
    return samples.defeat || "...";
  }
  
  return "";
}
