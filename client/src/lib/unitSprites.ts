import { SPRITE_CHARACTERS, CharacterSprite } from "./spriteManifest";

export interface UnitSpriteAssignment {
  raceId: string;
  classId: string;
  spriteId: string;
  spritePath: string;
}

const STORAGE_KEY = "tethical_sprite_assignments";

export function getSpriteAssignments(): UnitSpriteAssignment[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to parse saved sprite assignments");
    }
  }
  return [];
}

export function saveSpriteAssignments(assignments: UnitSpriteAssignment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

export function getUnitSprite(raceId: string, classId: string): CharacterSprite | null {
  const assignments = getSpriteAssignments();
  const assignment = assignments.find(
    (a) => a.raceId === raceId && a.classId === classId
  );

  if (assignment && assignment.spriteId) {
    const sprite = SPRITE_CHARACTERS.find((s) => s.id === assignment.spriteId);
    if (sprite) {
      return sprite;
    }
  }

  return getDefaultSpriteForClass(classId);
}

export function getUnitSpriteId(raceId: string, classId: string): string | null {
  const assignments = getSpriteAssignments();
  const assignment = assignments.find(
    (a) => a.raceId === raceId && a.classId === classId
  );
  return assignment?.spriteId || getDefaultSpriteIdForClass(classId);
}

export function getDefaultSpriteIdForClass(classId: string): string | null {
  const classToSpriteMap: Record<string, string> = {
    warrior: "knight",
    mage: "wizard",
    ranger: "soldier",
    worge_caster: "priest",
    worge_bear: "werewolf",
  };
  return classToSpriteMap[classId] || null;
}

export function getDefaultSpriteForClass(classId: string): CharacterSprite | null {
  const spriteId = getDefaultSpriteIdForClass(classId);
  if (spriteId) {
    return SPRITE_CHARACTERS.find((s) => s.id === spriteId) || null;
  }
  return SPRITE_CHARACTERS[0] || null;
}

export function getSpriteImagePath(sprite: CharacterSprite, animationKey: string = "idle"): string {
  const anim = sprite.animations[animationKey];
  if (!anim) {
    const firstAnim = Object.values(sprite.animations)[0];
    if (firstAnim) {
      return `/attached_assets/GrudgeRPGAssets2d/${sprite.folder}/${firstAnim.fileName}.png`;
    }
    return "";
  }
  return `/attached_assets/GrudgeRPGAssets2d/${sprite.folder}/${anim.fileName}.png`;
}

export function getSpriteEffectPath(sprite: CharacterSprite, effectKey: string): string | null {
  if (!sprite.effectsFolder) return null;
  const effect = sprite.animations[effectKey];
  if (!effect?.isEffect) return null;
  return `/attached_assets/GrudgeRPGAssets2d/${sprite.effectsFolder}/${effect.fileName}.png`;
}

export function getSpriteProjectilePath(sprite: CharacterSprite, projectileKey: string): string | null {
  if (!sprite.projectileFolder) return null;
  const projectile = sprite.animations[projectileKey];
  if (!projectile?.isProjectile) return null;
  return `/attached_assets/GrudgeRPGAssets2d/${sprite.projectileFolder}/${projectile.fileName}.png`;
}

export function getAllCharacterSprites(): CharacterSprite[] {
  return SPRITE_CHARACTERS;
}
