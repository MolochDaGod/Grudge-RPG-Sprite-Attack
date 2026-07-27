/**
 * Production VFX / effects pipeline for Sprite Attack (fighter + battle).
 *
 * Asset SSOT:
 *  - Catalog JSON: info.grudge-studio.com/api/v1/effectSprites.json
 *  - Binaries: same-origin /cdn-effects/* → info.grudge-studio.com (vercel rewrite)
 *  - Local strips: /fighter2d/effects/*
 *
 * Call `bootVfxPipeline()` once at app/fight/battle mount so combat never
 * draws character bodies as slash/impact.
 */

import {
  preloadVfx,
  getVfxById,
  getVfxImage,
  ensureVfxLoaded,
  getAllVfx,
  vfxDisplayScale,
  isPureCombatVfx,
  type VfxDef,
} from "./vfxLibrary";

/** Same-origin proxy prefix (see vercel.json rewrites). */
export const CDN_EFFECTS_PREFIX = "/cdn-effects";

/** Public catalog endpoint (mirrored on deploy via env). */
export const EFFECT_CATALOG_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_EFFECTS_CATALOG_URL) ||
  "https://info.grudge-studio.com/api/v1/effectSprites.json";

export const EFFECTS_INFO_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_INFO_BASE_URL) ||
  "https://info.grudge-studio.com";

/** Combat-critical pure slash / impact IDs — always warm-cache. */
export const COMBAT_SLASH_IDS = [
  "slashRedSm",
  "slashRedMd",
  "slashRedLg",
  "slashBlueMd",
  "slashBlueLg",
  "slashGreenMd",
  "slashGreenLg",
  "slashPurpleMd",
  "slashOrangeMd",
  "slashOrangeLg",
  "demonSlash1",
  "demonSlash2",
  "demonSlash3",
  "smearH1",
  "smearH2",
  "smearH3",
  "smearV1",
  "smearV2",
  "smearV3",
  "slash_arc",
  "slash_ranged",
  "arcaneslash",
  "critSlash",
] as const;

export const COMBAT_IMPACT_IDS = [
  "hitEffect1",
  "hitEffect2",
  "hitEffect3",
  "hitBurst",
  "weaponHit",
  "impactFireA",
  "impactYellowA",
  "impactRedA",
  "impactPurpleA",
  "impactCyanA",
  "impactGreenA",
  "impactWhiteA",
  "thunderHit",
  "holyImpact",
  "starBurst",
  "explosionSmall",
  "sparkBurst",
] as const;

export type SlashBurstKind = "light" | "heavy" | "crit" | "ranged" | "special";

export interface SlashBurstSpec {
  swingIds: string[];
  hitIds: string[];
  swingScale: number;
  hitScale: number;
  count: number;
  spreadPx: number;
}

/** Attack range multipliers used by fighter hitboxes (production feel). */
export const ATTACK_RANGE_TUNING = {
  /** Base reach before character scale (px at DISTANCE_SCALE=1 was 80). */
  meleeBase: 100,
  normal: 1.0,
  altNormal: 1.12,
  dash: 1.45,
  upSpecial: 1.25,
  downSpecial: 1.05,
  rescue: 0.95,
  /** Horizontal forward offset of hitbox from body center. */
  forwardOffset: 36,
  /** Projectile lifetime ms / speed already scaled by SPEED_SCALE. */
  projectileLifeMs: 3200,
  projectileRadius: 16,
} as const;

export function slashBurstForKind(kind: SlashBurstKind): SlashBurstSpec {
  switch (kind) {
    case "heavy":
      return {
        swingIds: ["slashRedLg", "demonSlash1", "smearH3"],
        hitIds: ["hitBurst", "hitEffect3", "critSlash"],
        swingScale: 170,
        hitScale: 140,
        count: 2,
        spreadPx: 28,
      };
    case "crit":
      return {
        swingIds: ["critSlash", "slashOrangeLg", "demonSlash2"],
        hitIds: ["critSlash", "impactFireA", "hitBurst"],
        swingScale: 190,
        hitScale: 160,
        count: 3,
        spreadPx: 36,
      };
    case "ranged":
      return {
        swingIds: ["slash_ranged", "slashGreenMd", "smearH1"],
        hitIds: ["hitEffect1", "sparkBurst", "starBurst"],
        swingScale: 120,
        hitScale: 110,
        count: 1,
        spreadPx: 12,
      };
    case "special":
      return {
        swingIds: ["arcaneslash", "slashPurpleMd", "smearV2"],
        hitIds: ["impactPurpleA", "magickaHit", "hitBurst"],
        swingScale: 160,
        hitScale: 145,
        count: 2,
        spreadPx: 32,
      };
    case "light":
    default:
      return {
        swingIds: ["slashRedMd", "smearH1", "slash_arc"],
        hitIds: ["hitEffect1", "hitEffect2", "weaponHit"],
        swingScale: 140,
        hitScale: 115,
        count: 2,
        spreadPx: 22,
      };
  }
}

/** Map moveVariant string → slash burst kind. */
export function slashKindForMove(move: string): SlashBurstKind {
  switch (move) {
    case "dash":
      return "heavy";
    case "altNormal":
      return "heavy";
    case "upSpecial":
    case "downSpecial":
      return "special";
    case "ranged":
      return "ranged";
    case "rescue":
      return "heavy";
    default:
      return "light";
  }
}

let bootPromise: Promise<VfxPipelineStatus> | null = null;

export interface VfxPipelineStatus {
  ok: boolean;
  catalogLoaded: boolean;
  totalVfx: number;
  slashesReady: number;
  impactsReady: number;
  errors: string[];
  source: string;
}

/**
 * Boot full combat VFX pipeline (idempotent).
 * Safe to call from fighter, battle, ToonAdmin.
 */
export function bootVfxPipeline(): Promise<VfxPipelineStatus> {
  if (bootPromise) return bootPromise;
  bootPromise = (async (): Promise<VfxPipelineStatus> => {
    const errors: string[] = [];
    try {
      await preloadVfx();
    } catch (e) {
      errors.push(`preloadVfx: ${e instanceof Error ? e.message : String(e)}`);
    }

    const priority = [...COMBAT_SLASH_IDS, ...COMBAT_IMPACT_IDS];
    await Promise.all(
      priority.map(async (id) => {
        try {
          await ensureVfxLoaded(id);
        } catch {
          /* non-fatal */
        }
      }),
    );

    let slashesReady = 0;
    let impactsReady = 0;
    for (const id of COMBAT_SLASH_IDS) {
      const d = getVfxById(id);
      const img = getVfxImage(id);
      if (d && isPureCombatVfx(d) && img) slashesReady++;
    }
    for (const id of COMBAT_IMPACT_IDS) {
      const d = getVfxById(id);
      const img = getVfxImage(id);
      if (d && isPureCombatVfx(d) && img) impactsReady++;
    }

    const total = getAllVfx().length;
    const status: VfxPipelineStatus = {
      ok: slashesReady >= 6 && impactsReady >= 4,
      catalogLoaded: total > 40,
      totalVfx: total,
      slashesReady,
      impactsReady,
      errors,
      source: EFFECT_CATALOG_URL,
    };
    if (typeof console !== "undefined") {
      console.info(
        `[vfxPipeline] ready total=${status.totalVfx} slash=${status.slashesReady} impact=${status.impactsReady} ok=${status.ok}`,
      );
    }
    return status;
  })();
  return bootPromise;
}

export interface SpawnSlashArgs {
  x: number;
  y: number;
  flip: boolean;
  kind: SlashBurstKind;
  /** Prefer character-specific pure VFX id if pure. */
  preferredSwingId?: string | null;
  preferredHitId?: string | null;
  intensity?: number;
}

export interface SlashSpawnPlan {
  swings: { vfx: VfxDef; x: number; y: number; scale: number; flip: boolean }[];
  hits: { vfx: VfxDef; x: number; y: number; scale: number; flip: boolean }[];
}

/** Plan multi-slash + impact burst for a combat event (fighter or battle). */
export function planSlashBurst(args: SpawnSlashArgs): SlashSpawnPlan {
  const spec = slashBurstForKind(args.kind);
  const intensity = args.intensity ?? 1.25;
  const swings: SlashSpawnPlan["swings"] = [];
  const hits: SlashSpawnPlan["hits"] = [];

  const pick = (ids: string[], preferred?: string | null): VfxDef | undefined => {
    if (preferred) {
      const p = getVfxById(preferred);
      if (p && isPureCombatVfx(p)) return p;
    }
    for (const id of ids) {
      const d = getVfxById(id);
      if (d && isPureCombatVfx(d)) return d;
    }
    return getVfxById(ids[0]);
  };

  for (let i = 0; i < spec.count; i++) {
    const swing = pick(spec.swingIds, i === 0 ? args.preferredSwingId : null);
    if (!swing) continue;
    const ox = (i - (spec.count - 1) / 2) * spec.spreadPx;
    const oy = (i % 2 === 0 ? -1 : 1) * (spec.spreadPx * 0.35);
    swings.push({
      vfx: swing,
      x: args.x + (args.flip ? -ox : ox),
      y: args.y + oy,
      scale: vfxDisplayScale(swing, spec.swingScale) * intensity,
      flip: args.flip || i % 2 === 1,
    });
  }

  const hit = pick(spec.hitIds, args.preferredHitId);
  if (hit) {
    hits.push({
      vfx: hit,
      x: args.x,
      y: args.y,
      scale: vfxDisplayScale(hit, spec.hitScale) * intensity,
      flip: false,
    });
    // Secondary smaller impact for weight
    const hit2 = pick([...spec.hitIds].reverse());
    if (hit2 && hit2.id !== hit.id) {
      hits.push({
        vfx: hit2,
        x: args.x + (args.flip ? -12 : 12),
        y: args.y - 10,
        scale: vfxDisplayScale(hit2, spec.hitScale * 0.75) * intensity,
        flip: args.flip,
      });
    }
  }

  return { swings, hits };
}

/** Battle / turn-based effect name → catalog id. */
export function battleEffectToVfxId(effectName: string): string {
  const n = effectName.toLowerCase();
  if (n.includes("slash") || n === "impact") return "slashRedMd";
  if (n.includes("crit")) return "critSlash";
  if (n.includes("fire")) return "impactFireA";
  if (n.includes("ice") || n.includes("frost")) return "impactCyanA";
  if (n.includes("holy") || n.includes("heal")) return "holyImpact";
  if (n.includes("arcane") || n.includes("magic")) return "arcaneslash";
  if (n.includes("lightning") || n.includes("thunder")) return "thunderHit";
  if (n.includes("hit")) return "hitEffect1";
  return "slashRedMd";
}
