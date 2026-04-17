/**
 * Shared Character Identity Map
 * 
 * Maps fighter IDs across all Grudge Studio apps:
 * - Grudge Smash (this app)
 * - grudgewarlords.com / client.grudge-studio.com (The Engine / 3D game)
 * - GDevelop (gdevelop-assistant.vercel.app)
 * 
 * When a player picks a main fighter here, their Grudge backend profile
 * stores the `grudgeId` so it carries across apps.
 */

export interface CharacterIdentity {
  grudgeId: string;           // Universal Grudge Studio ID
  smashId: string;            // ID in grudaRoster.ts (this game)
  warlordRace?: string;       // Race in grudgewarlords.com
  warlordClass?: string;      // Class in grudgewarlords.com
  engineModelId?: string;     // 3D model ID in The Engine
  faction: 'crusade' | 'legion' | 'fabled';
  displayName: string;
}

// 10 Main Fighters — canonical cross-app identity
export const CHARACTER_IDENTITY_MAP: CharacterIdentity[] = [
  // Hustle 5
  { grudgeId: 'GRD-KNIGHT-01',     smashId: 'hustle-knight',     warlordRace: 'human',     warlordClass: 'warrior', engineModelId: 'WK_Knight',     faction: 'crusade', displayName: 'Knight' },
  { grudgeId: 'GRD-MAGE-01',       smashId: 'hustle-mage',       warlordRace: 'elf',       warlordClass: 'mage',    engineModelId: 'ELF_Mage',      faction: 'fabled',  displayName: 'Mage' },
  { grudgeId: 'GRD-BERSERKER-01',  smashId: 'hustle-berserker',  warlordRace: 'orc',       warlordClass: 'warrior', engineModelId: 'ORC_Berserker',  faction: 'legion',  displayName: 'Berserker' },
  { grudgeId: 'GRD-ROGUE-01',      smashId: 'hustle-rogue',      warlordRace: 'undead',    warlordClass: 'ranger',  engineModelId: 'UD_Rogue',      faction: 'legion',  displayName: 'Rogue' },
  { grudgeId: 'GRD-ARCHER-01',     smashId: 'hustle-archer',     warlordRace: 'human',     warlordClass: 'ranger',  engineModelId: 'WK_Archer',     faction: 'crusade', displayName: 'Archer' },
  // Grudge 5
  { grudgeId: 'GRD-WIZARD-01',     smashId: 'wizard',            warlordRace: 'human',     warlordClass: 'mage',    engineModelId: 'WK_Wizard',     faction: 'crusade', displayName: 'Wizard' },
  { grudgeId: 'GRD-SWORDSMAN-01',  smashId: 'swordsman',         warlordRace: 'human',     warlordClass: 'warrior', engineModelId: 'WK_Swordsman',  faction: 'crusade', displayName: 'Swordsman' },
  { grudgeId: 'GRD-CRUSADE-KNT-01',smashId: 'knight',            warlordRace: 'human',     warlordClass: 'warrior', engineModelId: 'WK_CrusadeKnight', faction: 'crusade', displayName: 'Knight (Crusade)' },
  { grudgeId: 'GRD-ORC-01',        smashId: 'orc',               warlordRace: 'orc',       warlordClass: 'warrior', engineModelId: 'ORC_Warrior',   faction: 'legion',  displayName: 'Orc' },
  { grudgeId: 'GRD-WEREBEAR-01',   smashId: 'werebear',          warlordRace: 'barbarian', warlordClass: 'worge',   engineModelId: 'BRB_Werebear',  faction: 'fabled',  displayName: 'Werebear' },
];

/** Look up the Grudge ID for a smash fighter */
export function getGrudgeId(smashId: string): string | undefined {
  return CHARACTER_IDENTITY_MAP.find(c => c.smashId === smashId)?.grudgeId;
}

/** Look up a smash ID from a Grudge ID */
export function getSmashId(grudgeId: string): string | undefined {
  return CHARACTER_IDENTITY_MAP.find(c => c.grudgeId === grudgeId)?.smashId;
}

/** Sync selected fighter to Grudge backend (fire and forget) */
export async function syncFighterSelection(smashId: string): Promise<void> {
  const token = localStorage.getItem('grudge_auth_token');
  if (!token) return;
  const grudgeId = getGrudgeId(smashId);
  if (!grudgeId) return;
  try {
    await fetch('https://api.grudge-studio.com/v1/player/fighter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ grudgeId, smashId, app: 'grudge-smash' }),
    });
  } catch {
    // Non-critical — don't block gameplay
  }
}
