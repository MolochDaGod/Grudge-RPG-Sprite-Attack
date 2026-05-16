/**
 * Central API configuration for Grudge RPG Sprite Attack.
 *
 * In dev (Vite dev server), the Express backend runs on the same host so
 * API_BASE defaults to '' (same-origin). In production the frontend is on
 * Vercel while the backend + PvP WebSocket live on Railway, so
 * VITE_API_URL must be set (e.g. https://rpg-api.grudge-studio.com).
 */

/** Base URL for all REST API calls. Empty string = same-origin. */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';

/** Base URL for the PvP WebSocket server (Socket.IO). */
export const PVP_SERVER_URL: string =
  import.meta.env.VITE_PVP_SERVER_URL
  || import.meta.env.VITE_API_URL
  || window.location.origin;
