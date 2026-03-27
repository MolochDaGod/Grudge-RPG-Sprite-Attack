// Input Buffer System — standard fighting game technique
// Buffers the last N frames of inputs so moves register even if pressed slightly early
// This prevents dropped inputs during hitstun, attack recovery, etc.

export type BufferedAction =
  | "attack"
  | "attack2"
  | "dashAttack"
  | "special_up"
  | "special_down"
  | "special_neutral"
  | "special_airForward"
  | "special_airDown"
  | "super"
  | "jump"
  | "dodge_left"
  | "dodge_right"
  | "block"
  | "rescue"
  | "dropThrough";

// Priority: higher number = higher priority (consumed first)
const ACTION_PRIORITY: Record<BufferedAction, number> = {
  super: 100,
  rescue: 90,
  special_up: 80,
  special_down: 80,
  special_neutral: 75,
  special_airForward: 75,
  special_airDown: 75,
  block: 60,
  dashAttack: 55,
  attack: 50,
  attack2: 50,
  dodge_left: 40,
  dodge_right: 40,
  jump: 30,
  dropThrough: 20,
};

interface BufferedEntry {
  action: BufferedAction;
  timestamp: number;
  params?: Record<string, number>; // e.g. rescue target coords
}

const BUFFER_WINDOW_MS = 100; // ~6 frames at 60fps
const MAX_BUFFER_SIZE = 8;

export class InputBuffer {
  private buffer: BufferedEntry[] = [];

  /** Add an action to the buffer */
  push(action: BufferedAction, params?: Record<string, number>): void {
    const now = performance.now();
    // Deduplicate: don't re-buffer same action within 50ms
    const recent = this.buffer.find(
      e => e.action === action && now - e.timestamp < 50
    );
    if (recent) return;

    this.buffer.push({ action, timestamp: now, params });

    // Trim oldest if over max
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  /** Consume the highest-priority buffered action that hasn't expired.
   *  Returns null if buffer is empty or all entries have expired. */
  consume(allowedActions?: Set<BufferedAction>): BufferedEntry | null {
    const now = performance.now();
    // Remove expired entries
    this.buffer = this.buffer.filter(e => now - e.timestamp <= BUFFER_WINDOW_MS);

    if (this.buffer.length === 0) return null;

    // Sort by priority (highest first), then by timestamp (oldest first for same priority)
    const candidates = allowedActions
      ? this.buffer.filter(e => allowedActions.has(e.action))
      : [...this.buffer];

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const pDiff = ACTION_PRIORITY[b.action] - ACTION_PRIORITY[a.action];
      if (pDiff !== 0) return pDiff;
      return a.timestamp - b.timestamp; // older first (FIFO within same priority)
    });

    const best = candidates[0];
    // Remove consumed entry from buffer
    const idx = this.buffer.indexOf(best);
    if (idx >= 0) this.buffer.splice(idx, 1);
    return best;
  }

  /** Peek at the highest-priority action without consuming it */
  peek(): BufferedEntry | null {
    const now = performance.now();
    this.buffer = this.buffer.filter(e => now - e.timestamp <= BUFFER_WINDOW_MS);
    if (this.buffer.length === 0) return null;

    return [...this.buffer].sort((a, b) =>
      ACTION_PRIORITY[b.action] - ACTION_PRIORITY[a.action]
    )[0];
  }

  /** Check if a specific action type is in the buffer */
  has(action: BufferedAction): boolean {
    const now = performance.now();
    return this.buffer.some(
      e => e.action === action && now - e.timestamp <= BUFFER_WINDOW_MS
    );
  }

  /** Clear all buffered inputs */
  clear(): void {
    this.buffer.length = 0;
  }

  /** Get current buffer size (for debug display) */
  get size(): number {
    return this.buffer.length;
  }
}
