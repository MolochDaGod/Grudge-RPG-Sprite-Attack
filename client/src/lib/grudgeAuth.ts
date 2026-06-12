// ── Grudge Unified Auth ──
// Centralised auth helpers for id.grudge-studio.com

const GRUDGE_AUTH_URL = 'https://id.grudge-studio.com/auth';
const GRUDGE_APP_ORIGIN = 'https://grudge-rpg-sprite-attack.vercel.app';

/**
 * Runs once on page load (IIFE in App.tsx) to consume the auth callback
 * params and stash the token in localStorage.
 */
export function consumeGrudgeAuth() {
  // Try query params first (preferred callback format)
  const qp = new URLSearchParams(window.location.search);
  let token = qp.get('token');
  let grudgeId = qp.get('grudgeId');
  let name = qp.get('name');

  // Fallback: token in hash (backwards compat)
  if (!token && location.hash && location.hash.includes('token=')) {
    const hp = new URLSearchParams(location.hash.slice(1));
    token = hp.get('token');
    grudgeId = hp.get('grudgeId');
    name = hp.get('name');
  }

  if (!token) return;

  localStorage.setItem('grudge_auth_token', token);
  if (grudgeId) localStorage.setItem('grudge_id', grudgeId);
  if (name) localStorage.setItem('grudge_username', name);

  // Restore the route the user was trying to reach before the auth redirect
  const pendingRoute = localStorage.getItem('grudge_auth_pending_route') || 'gdevelop';
  localStorage.removeItem('grudge_auth_pending_route');
  window.history.replaceState(null, '', location.pathname + '#' + pendingRoute);
}

/**
 * Returns true if the user has a Grudge token. Otherwise redirects to
 * id.grudge-studio.com/auth and returns false.
 */
export function requireGrudgeAuth(): boolean {
  if (localStorage.getItem('grudge_auth_token')) return true;
  // Stash the current hash route so we land back on it after login
  const currentRoute = window.location.hash.replace(/^#\/?/, '');
  if (currentRoute) localStorage.setItem('grudge_auth_pending_route', currentRoute);
  const redirect = encodeURIComponent(GRUDGE_APP_ORIGIN);
  window.location.href = `${GRUDGE_AUTH_URL}?redirect=${redirect}&app=rpg-sprite-attack`;
  return false;
}

/**
 * Clears all Grudge auth state and reloads the page (which will trigger
 * requireGrudgeAuth → redirect to id.grudge-studio.com).
 */
export function grudgeSignOut() {
  localStorage.removeItem('grudge_auth_token');
  localStorage.removeItem('grudge_id');
  localStorage.removeItem('grudge_username');
  localStorage.removeItem('grudge_auth_pending_route');
  window.location.href = GRUDGE_APP_ORIGIN;
}

/** Quick check without side-effects. */
export function isGrudgeAuthed(): boolean {
  return !!localStorage.getItem('grudge_auth_token');
}
