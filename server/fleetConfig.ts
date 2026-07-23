/**
 * Server-side fleet URLs — mirrors client/src/lib/fleetConfig.ts defaults.
 * Canonical public origin: https://water.grudge-studio.com
 */
export const GRUDGE_GAME_DATA_API =
  process.env.GRUDGE_GAME_DATA_API ||
  process.env.VITE_GAME_DATA_API ||
  "https://grudge-api-production-0d46.up.railway.app";

export const GRUDGE_AUTH_GATEWAY =
  process.env.GRUDGE_ID_API ||
  process.env.VITE_AUTH_GATEWAY_URL ||
  "https://id.grudge-studio.com";

export const GRUDGE_PVP_URL =
  process.env.GRUDGE_PVP_URL ||
  process.env.VITE_PVP_SERVER_URL ||
  "https://grudge-pvp-server-production.up.railway.app";

/** Origins allowed to call this app's /api (Express/Railway game server). */
export const PRODUCTION_CORS_ORIGINS = [
  "https://water.grudge-studio.com",
  "https://grudge-rpg-sprite-attack-grudgenexus.vercel.app",
  "https://id.grudge-studio.com",
  "https://grudgewarlords.com",
  "https://grudge-studio.com",
  "https://wcs.grudge-studio.com",
  "https://dcq.grudge-studio.com",
] as const;

/** True when origin is a known Grudge satellite / preview host. */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if ((PRODUCTION_CORS_ORIGINS as readonly string[]).includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (u.hostname.endsWith(".grudge-studio.com")) return true;
    if (u.hostname.endsWith(".vercel.app")) return true;
  } catch {
    /* ignore */
  }
  return false;
}
