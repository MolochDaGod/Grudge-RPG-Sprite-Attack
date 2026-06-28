/**
 * REST + PvP configuration for Sprite Attack.
 * Production: same-origin /api (Vercel rewrites) + pvp.grudge-studio.com.
 */
import { GRUDGE_GAME_DATA_API, GRUDGE_PVP_URL, GRUDGE_APP_ORIGIN } from "./fleetConfig";

/** REST API — empty string = same-origin /api via Vercel rewrites. */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? "";

/**
 * PvP Socket.IO server.
 * Production default: dedicated pvp host. Local dev: same origin as Express server.
 */
export const PVP_SERVER_URL: string =
  import.meta.env.VITE_PVP_SERVER_URL ||
  (import.meta.env.DEV ? "" : GRUDGE_PVP_URL) ||
  (typeof window !== "undefined" ? window.location.origin : GRUDGE_APP_ORIGIN);

export { GRUDGE_GAME_DATA_API };