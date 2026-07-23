/**
 * Grudge unified auth — id.grudge-studio.com SSO for Tethical (water.grudge-studio.com).
 */
import { buildSsoLoginUrl, purgeGrudgeClientState } from "./grudgeConfig";
import {
  isAuthenticated,
  pickupSsoFromUrl,
  bridgeGrudgeLaunchToken,
  clearToken,
} from "./grudgeBackend";

const DEFAULT_POST_LOGIN_ROUTE = "fighter";

/**
 * Runs on page load / callback to consume auth params.
 * Awaits launch-token bridge when present so callback can gate on isAuthenticated().
 */
export async function consumeGrudgeAuthAsync(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const launchToken = params.get("grudge_token");
  if (launchToken) {
    params.delete("grudge_token");
    const clean = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (clean ? `?${clean}` : "") + window.location.hash,
    );
    await bridgeGrudgeLaunchToken(launchToken);
    return isAuthenticated();
  }
  return pickupSsoFromUrl();
}

/**
 * Sync convenience — starts launch bridge without waiting (boot path).
 * Prefer consumeGrudgeAuthAsync on /auth/callback.
 */
export function consumeGrudgeAuth(): boolean {
  const params = new URLSearchParams(window.location.search);
  const launchToken = params.get("grudge_token");
  if (launchToken) {
    void consumeGrudgeAuthAsync();
    return isAuthenticated();
  }
  return pickupSsoFromUrl();
}

export function getPendingRoute(): string {
  return localStorage.getItem("grudge_auth_pending_route") || DEFAULT_POST_LOGIN_ROUTE;
}

export function clearPendingRoute(): void {
  localStorage.removeItem("grudge_auth_pending_route");
}

/**
 * Redirect to Grudge ID login. Stashes current hash route for post-login return.
 * redirect_uri always uses the current browser origin (water / vercel / localhost).
 */
export function requireGrudgeAuth(): boolean {
  if (isAuthenticated()) return true;

  const currentRoute = window.location.hash.replace(/^#\/?/, "");
  const pathnameRoute = window.location.pathname.replace(/^\//, "").toLowerCase();
  const stash =
    currentRoute ||
    (pathnameRoute && pathnameRoute !== "auth/callback" ? pathnameRoute : "");
  if (stash) localStorage.setItem("grudge_auth_pending_route", stash);

  window.location.href = buildSsoLoginUrl();
  return false;
}

export function grudgeSignOut(): void {
  purgeGrudgeClientState();
  clearToken();
  window.location.href = window.location.origin;
}

export function isGrudgeAuthed(): boolean {
  return isAuthenticated();
}
