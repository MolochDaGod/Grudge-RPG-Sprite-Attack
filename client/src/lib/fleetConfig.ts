/**
 * Grudge Studio fleet — canonical production URLs for Tethical (water.grudge-studio.com).
 * Override via Vite env for staging only; production defaults are live services.
 */
const env = import.meta.env;

/** Canonical public origin for this satellite app. */
export const CANONICAL_APP_ORIGIN = "https://water.grudge-studio.com";

/** Canonical game-data API (GrudgeBuilder on Railway). Proxied same-origin as /api in Vercel. */
export const GRUDGE_GAME_DATA_API =
  env.VITE_GAME_DATA_API ||
  "https://grudge-api-production-0d46.up.railway.app";

/** Auth gateway SSOT — full-page login lives here (NOT game.grudge-studio.com). */
export const GRUDGE_AUTH_GATEWAY =
  env.VITE_AUTH_GATEWAY_URL || "https://id.grudge-studio.com";

export const GRUDGE_ASSETS_CDN =
  env.VITE_ASSETS_URL || "https://assets.grudge-studio.com";

/** JSON catalogs (weapons, classes, races). Prefer same-origin /api/objectstore proxy in prod. */
export const GRUDGE_OBJECTSTORE =
  env.VITE_OBJECTSTORE_URL || "https://objectstore.grudge-studio.com";

/** PvP Socket.IO — dedicated Railway pvp-server (live). */
export const GRUDGE_PVP_URL =
  env.VITE_PVP_SERVER_URL || "https://grudge-pvp-server-production.up.railway.app";

/**
 * Production app origin for SSO redirect_uri.
 * Prefer live window origin so water + Vercel aliases both work;
 * env/default only used at build or SSR.
 */
export const GRUDGE_APP_ORIGIN =
  (typeof window !== "undefined" ? window.location.origin : null) ||
  env.VITE_APP_ORIGIN ||
  CANONICAL_APP_ORIGIN;

/** Fleet game embeds — production subdomains, not preview URLs. */
export const FLEET_EMBEDS = {
  engine: env.VITE_ENGINE_URL || "https://dcq.grudge-studio.com/editor",
  gdevelop: env.VITE_GDEVELOP_URL || "https://wcs.grudge-studio.com",
  warlords: env.VITE_WARLORDS_URL || "https://grudgewarlords.com",
} as const;
