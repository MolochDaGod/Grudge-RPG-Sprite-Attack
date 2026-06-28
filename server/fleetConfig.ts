/**
 * Server-side fleet URLs — mirrors client/src/lib/fleetConfig.ts defaults.
 */
export const GRUDGE_GAME_DATA_API =
  process.env.GRUDGE_GAME_DATA_API ||
  process.env.VITE_GAME_DATA_API ||
  "https://grudge-api-production-0d46.up.railway.app";

export const GRUDGE_PVP_URL =
  process.env.GRUDGE_PVP_URL ||
  process.env.VITE_PVP_SERVER_URL ||
  "https://grudge-pvp-server-production.up.railway.app";

export const PRODUCTION_CORS_ORIGINS = [
  "https://grudge-rpg-sprite-attack-grudgenexus.vercel.app",
  "https://id.grudge-studio.com",
  "https://grudgewarlords.com",
  "https://wcs.grudge-studio.com",
  "https://dcq.grudge-studio.com",
] as const;