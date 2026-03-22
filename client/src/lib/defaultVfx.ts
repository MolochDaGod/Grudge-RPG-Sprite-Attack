// Default VFX assignments for every character — best-effort based on class/faction/weapon
// These are used when no override is set in charConfig
// Format: { attack: { hit, swing }, attack2: { hit, swing }, special: { hit, swing }, block: { hit }, cast: { swing } }

interface SlotVfx { hit?: string; swing?: string; }
interface CharVfxDefaults {
  attack: SlotVfx;
  attack2: SlotVfx;
  special: SlotVfx;
  block: SlotVfx;
  cast: SlotVfx;
  comboQ2: SlotVfx;
  comboQ3: SlotVfx;
  dashAttack: SlotVfx;
  rescueRoll: SlotVfx;
}

// Shared VFX palettes by archetype
const SWORD_VFX: CharVfxDefaults = {
  attack:     { hit: "hitEffect1", swing: "slashRedMd" },
  attack2:    { hit: "hitEffect2", swing: "slashRedLg" },
  special:    { hit: "hitEffect3", swing: "demonSlash1" },
  block:      { hit: "weaponHit" },
  cast:       { swing: "protectionCircle" },
  comboQ2:    { hit: "hitEffect1", swing: "slashRedSm" },
  comboQ3:    { hit: "hitEffect3", swing: "demonSlash2" },
  dashAttack: { hit: "hitEffect2", swing: "slashRedLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx3" },
};

const MAGIC_VFX: CharVfxDefaults = {
  attack:     { hit: "sparkBurst", swing: "arcaneslash" },
  attack2:    { hit: "magickaHit", swing: "arcanebolt" },
  special:    { hit: "impactPurpleA", swing: "felSpell" },
  block:      { hit: "protectionCircle" },
  cast:       { swing: "casting" },
  comboQ2:    { hit: "sparkBurst", swing: "arcaneslash" },
  comboQ3:    { hit: "impactPurpleA", swing: "arcanelighting" },
  dashAttack: { hit: "magickaHit", swing: "arcanemist" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx1" },
};

const RANGER_VFX: CharVfxDefaults = {
  attack:     { hit: "hitEffect1", swing: "slashGreenMd" },
  attack2:    { hit: "hitEffect2", swing: "slashGreenLg" },
  special:    { hit: "windHit", swing: "windBreath" },
  block:      { hit: "weaponHit" },
  cast:       { swing: "windProjectile" },
  comboQ2:    { hit: "hitEffect1", swing: "slashGreenSm" },
  comboQ3:    { hit: "hitEffect3", swing: "demonSlash3" },
  dashAttack: { hit: "hitEffect2", swing: "slashGreenLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx3" },
};

const FIRE_VFX: CharVfxDefaults = {
  attack:     { hit: "fireExplosion", swing: "slashOrangeMd" },
  attack2:    { hit: "fireExplosion2", swing: "slashOrangeLg" },
  special:    { hit: "impactFireA", swing: "flamestrike" },
  block:      { hit: "brightFire" },
  cast:       { swing: "fireSpin" },
  comboQ2:    { hit: "fireExplosion", swing: "slashOrangeSm" },
  comboQ3:    { hit: "impactFireB", swing: "flameLash" },
  dashAttack: { hit: "fireExplosion2", swing: "slashOrangeLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx1" },
};

const DARK_VFX: CharVfxDefaults = {
  attack:     { hit: "hitEffect1", swing: "slashPurpleMd" },
  attack2:    { hit: "hitEffect2", swing: "slashPurpleLg" },
  special:    { hit: "impactMagentaA", swing: "midnight" },
  block:      { hit: "phantom" },
  cast:       { swing: "nebula" },
  comboQ2:    { hit: "hitEffect1", swing: "slashPurpleSm" },
  comboQ3:    { hit: "impactPurpleA", swing: "demonSlash1" },
  dashAttack: { hit: "hitEffect3", swing: "slashPurpleLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx2" },
};

const HOLY_VFX: CharVfxDefaults = {
  attack:     { hit: "holyImpact", swing: "slashBlueMd" },
  attack2:    { hit: "impactYellowA", swing: "slashBlueLg" },
  special:    { hit: "impactWhiteA", swing: "holyVfx" },
  block:      { hit: "holyRepeatable" },
  cast:       { swing: "healEffect" },
  comboQ2:    { hit: "holyImpact", swing: "slashBlueSm" },
  comboQ3:    { hit: "impactYellowB", swing: "resurrect" },
  dashAttack: { hit: "impactYellowA", swing: "slashBlueLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx1" },
};

const ICE_VFX: CharVfxDefaults = {
  attack:     { hit: "iceHit", swing: "slashBlueMd" },
  attack2:    { hit: "impactCyanA", swing: "slashBlueLg" },
  special:    { hit: "impactCyanB", swing: "frostbolt" },
  block:      { hit: "iceActive" },
  cast:       { swing: "iceVfx1" },
  comboQ2:    { hit: "iceHit", swing: "slashBlueSm" },
  comboQ3:    { hit: "impactCyanA", swing: "frozenIce" },
  dashAttack: { hit: "impactCyanB", swing: "slashBlueLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx1" },
};

const BEAST_VFX: CharVfxDefaults = {
  attack:     { hit: "hitEffect1", swing: "slashRedMd" },
  attack2:    { hit: "hitEffect3", swing: "demonSlash2" },
  special:    { hit: "impactOrangeA", swing: "demonSlash3" },
  block:      { hit: "weaponHit" },
  cast:       { swing: "worgeTornado" },
  comboQ2:    { hit: "hitEffect2", swing: "slashRedSm" },
  comboQ3:    { hit: "impactRedA", swing: "demonSlash1" },
  dashAttack: { hit: "hitEffect3", swing: "slashRedLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx3" },
};

const NATURE_VFX: CharVfxDefaults = {
  attack:     { hit: "hitEffect1", swing: "slashGreenMd" },
  attack2:    { hit: "impactGreenA", swing: "slashGreenLg" },
  special:    { hit: "impactGreenB", swing: "healingwave" },
  block:      { hit: "protectionCircle" },
  cast:       { swing: "healEffect" },
  comboQ2:    { hit: "hitEffect1", swing: "slashGreenSm" },
  comboQ3:    { hit: "impactGreenA", swing: "healingregen" },
  dashAttack: { hit: "impactGreenB", swing: "slashGreenLg" },
  rescueRoll: { hit: "dustCloud", swing: "smokeVfx1" },
};

// Per-character VFX assignments
export const DEFAULT_CHAR_VFX: Record<string, CharVfxDefaults> = {
  // Crusade — Sword fighters
  "knight":           SWORD_VFX,
  "swordsman":        SWORD_VFX,
  "knight-templar":   { ...SWORD_VFX, cast: HOLY_VFX.cast, special: HOLY_VFX.special },
  "silver-knight":    SWORD_VFX,
  "fire-knight":      FIRE_VFX,
  "loreon-knight":    SWORD_VFX,
  "barbarian-warrior": { ...SWORD_VFX, attack: { hit: "hitEffect3", swing: "demonSlash2" }, comboQ3: { hit: "impactRedA", swing: "demonSlash3" } },
  "martial-hero":     { ...SWORD_VFX, attack: { hit: "hitBurst", swing: "critSlash" }, special: { hit: "impactOrangeA", swing: "flamestrike" } },

  // Crusade — Ranged
  "archer":           RANGER_VFX,
  "crossbowman":      RANGER_VFX,
  "barbarian-ranger": { ...RANGER_VFX, attack: { hit: "hitEffect2", swing: "slashRedMd" } },
  "human-ranger":     RANGER_VFX,
  "pirate-captain":   { ...RANGER_VFX, attack: { hit: "impactFireA", swing: "slashOrangeMd" }, special: { hit: "fireExplosion", swing: "flameLash" } },

  // Crusade — Magic
  "wizard":           MAGIC_VFX,
  "priest":           HOLY_VFX,
  "human-mage":       MAGIC_VFX,
  "water-priestess":  { ...ICE_VFX, cast: NATURE_VFX.cast, block: NATURE_VFX.block },

  // Legion — Brutes
  "orc":              { ...SWORD_VFX, attack: { hit: "hitEffect3", swing: "demonSlash1" }, comboQ3: { hit: "impactRedA", swing: "demonSlash3" } },
  "armored-orc":      { ...SWORD_VFX, attack: { hit: "hitEffect3", swing: "demonSlash2" }, block: { hit: "weaponHit" } },
  "elite-orc":        { ...SWORD_VFX, attack: { hit: "impactRedA", swing: "demonSlash3" }, special: { hit: "impactOrangeA", swing: "flamestrike" } },
  "skeleton":         DARK_VFX,

  // Legion — Dark casters
  "dark-knight":      DARK_VFX,
  "necromancer":      { ...DARK_VFX, cast: { swing: "midnight" }, special: { hit: "impactPurpleA", swing: "felSpell" } },
  "evil-wizard":      DARK_VFX,
  "nightborne":       { ...DARK_VFX, attack: { hit: "impactMagentaA", swing: "slashPurpleMd" } },
  "shardsoul-slayer": { ...DARK_VFX, attack: { hit: "hitBurst", swing: "critSlash" }, comboQ3: { hit: "impactMagentaA", swing: "demonSlash1" } },

  // Fabled — Nature / beast
  "elf-ranger":       NATURE_VFX,
  "leaf-ranger":      NATURE_VFX,
  "elf-mage":         { ...MAGIC_VFX, special: NATURE_VFX.special, cast: NATURE_VFX.cast },
  "werebear":         BEAST_VFX,
  "werewolf":         BEAST_VFX,
  "wind-hashashin":   { ...RANGER_VFX, special: { hit: "windHit", swing: "windBreath" }, attack: { hit: "hitEffect2", swing: "slashGreenMd" } },
  "dwarf-ranger":     RANGER_VFX,
  "arcane-archer":    { ...RANGER_VFX, special: MAGIC_VFX.special },

  // Fabled — Elemental mages
  "fire-wizard":      FIRE_VFX,
  "lightning-mage":   { ...MAGIC_VFX, attack: { hit: "thunderHit", swing: "arcanelighting" }, special: { hit: "impactYellowA", swing: "arcanelighting" } },
  "free-knight":      MAGIC_VFX,  // Dwarf Mage
  "wanderer-magician": MAGIC_VFX,
};

/** Get default VFX for a character's action slot */
export function getDefaultVfx(charId: string, slot: string): SlotVfx {
  const charDefaults = DEFAULT_CHAR_VFX[charId];
  if (!charDefaults) return {};
  return (charDefaults as any)[slot] ?? {};
}
