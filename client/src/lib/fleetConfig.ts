/**
 * Grudge Studio fleet — canonical production URLs for Sprite Attack.
 * Override via Vite env for staging only; production defaults are live services.
 */
const env = import.meta.env;

/** Canonical game-data API (GrudgeBuilder on Railway). Proxied same-origin as /api in Vercel. */
export const GRUDGE_GAME_DATA_API =
  env.VITE_GAME_DATA_API ||
  "https://grudge-api-production-0d46.up.railway.app";

export const GRUDGE_AUTH_GATEWAY =
  env.VITE_AUTH_GATEWAY_URL || "https://id.grudge-studio.com";

export const GRUDGE_ASSETS_CDN =
  env.VITE_ASSETS_URL || "https://assets.grudge-studio.com";

/** PvP Socket.IO — dedicated Railway pvp-server (live). */
export const GRUDGE_PVP_URL =
  env.VITE_PVP_SERVER_URL || "https://grudge-pvp-server-production.up.railway.app";

/** Production app origin for SSO redirect_uri (Vercel prod deployment). */
export const GRUDGE_APP_ORIGIN =
  env.VITE_APP_ORIGIN ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "https://grudge-rpg-sprite-attack-grudgenexus.vercel.app");

/** Fleet game embeds — production subdomains, not preview URLs. */
export const FLEET_EMBEDS = {
  engine: env.VITE_ENGINE_URL || "https://dcq.grudge-studio.com/editor",
  gdevelop: env.VITE_GDEVELOP_URL || "https://wcs.grudge-studio.com",
  warlords: env.VITE_WARLORDS_URL || "https://grudgewarlords.com",
} as const;