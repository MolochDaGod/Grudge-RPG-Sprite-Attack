/**
 * Fighter 2D motion / blend / trail utilities
 * -------------------------------------------
 * Canvas-sprite fighting best practices (no extra engine required):
 * - Exponential velocity smoothing for snappy directional starts/stops
 * - Short crossfade between animation states (idle↔run, attack startup)
 * - Motion-blur trails for projectiles + dash ghosts (position history)
 * - Velocity-aligned stretch for fast projectiles
 * - Additive / soft-light composite for skill FX pop
 *
 * Stack already available in this repo (prefer reusing, not adding more):
 * - canvas 2D (this game's SSOT renderer in GrudgeFighter2D)
 * - d3-ease (optional easing curves)
 * - howler (SFX)
 * - pixi.js / @pixi/particle-emitter (optional future GPU layer)
 * - phaser (battle arena mode only — not fighter main loop)
 * - ObjectStore + /fighter2d/* sprite library (characters, projectiles, Split Effects)
 */

// ─── Math ────────────────────────────────────────────────────────

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smoothstep 0→1 (Hermite). Good for camera / UI, not combat hitboxes. */
export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Ease-out cubic — fast start, soft land (dodges, cameras). */
export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

/** Ease-out expo — snappier than cubic for short moves. */
export function easeOutExpo(t: number): number {
  const x = clamp(t, 0, 1);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Frame-rate independent exponential approach.
 * `lambda` ~ 8–18 for ground run, ~4–8 for air, ~20–30 for ultra-snappy.
 * Pass dt in seconds.
 */
export function expApproach(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  const k = 1 - Math.exp(-lambda * dt);
  return current + (target - current) * k;
}

// ─── Animation crossfade ─────────────────────────────────────────

export interface AnimBlendState {
  /** Previous animation pose to fade out */
  prevState: string;
  prevFrame: number;
  /** 0 = fully previous, 1 = fully current */
  weight: number;
  /** When the blend started (ms) */
  startedAt: number;
  durationMs: number;
}

export const ANIM_BLEND_MS = {
  locomotion: 90, // idle ↔ run ↔ jump soft
  attack: 45, // keep attacks readable / punchy
  hit: 30,
  none: 0,
} as const;

export function beginAnimBlend(
  prevState: string,
  prevFrame: number,
  durationMs: number,
  now: number,
): AnimBlendState {
  return {
    prevState,
    prevFrame,
    weight: 0,
    startedAt: now,
    durationMs: Math.max(0, durationMs),
  };
}

export function tickAnimBlend(blend: AnimBlendState | null, now: number): AnimBlendState | null {
  if (!blend || blend.durationMs <= 0) return null;
  const t = (now - blend.startedAt) / blend.durationMs;
  if (t >= 1) return null;
  return { ...blend, weight: smoothstep(t) };
}

// ─── Motion trail (projectiles / dash ghosts) ────────────────────

export interface TrailSample {
  x: number;
  y: number;
  angle: number;
  at: number;
}

export interface MotionTrail {
  samples: TrailSample[];
  maxSamples: number;
  maxAgeMs: number;
  minSpacing: number;
}

export function createMotionTrail(maxSamples = 8, maxAgeMs = 140, minSpacing = 10): MotionTrail {
  return { samples: [], maxSamples, maxAgeMs, minSpacing };
}

export function pushTrailSample(trail: MotionTrail, x: number, y: number, angle: number, now: number): void {
  const last = trail.samples[trail.samples.length - 1];
  if (last) {
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy < trail.minSpacing * trail.minSpacing) return;
  }
  trail.samples.push({ x, y, angle, at: now });
  while (trail.samples.length > trail.maxSamples) trail.samples.shift();
  // Drop stale
  const cutoff = now - trail.maxAgeMs;
  while (trail.samples.length && trail.samples[0].at < cutoff) trail.samples.shift();
}

export function pruneTrail(trail: MotionTrail, now: number): void {
  const cutoff = now - trail.maxAgeMs;
  while (trail.samples.length && trail.samples[0].at < cutoff) trail.samples.shift();
}

/** Velocity angle in radians (0 = right). */
export function velocityAngle(vx: number, vy: number): number {
  if (vx === 0 && vy === 0) return 0;
  return Math.atan2(vy, vx);
}

/**
 * Stretch factors for motion feel: longer along travel axis when fast.
 * Returns { sx, sy } multipliers for a square projectile sprite.
 */
export function velocityStretch(speed: number, base = 1, maxStretch = 1.55, soft = 14): {
  sx: number;
  sy: number;
} {
  const t = clamp(speed / soft, 0, 1);
  const along = lerp(base, maxStretch, t * t);
  const across = lerp(base, 0.72, t * 0.85);
  return { sx: along, sy: across };
}

// ─── Canvas draw helpers ─────────────────────────────────────────

export type FxBlendMode = "source-over" | "lighter" | "screen" | "soft-light" | "multiply";

export interface TrailDrawOpts {
  size: number;
  /** base alpha of newest trail ghost */
  peakAlpha?: number;
  blend?: FxBlendMode;
  /** optional tint rgba — drawn under the sprite as soft glow */
  glowColor?: string;
  glowRadius?: number;
}

/**
 * Draw a motion-blur trail: older samples fade + shrink.
 * `drawSprite` is called with world-space center + alpha + scaleMul.
 */
export function drawMotionTrail(
  ctx: CanvasRenderingContext2D,
  trail: MotionTrail,
  now: number,
  drawSprite: (x: number, y: number, angle: number, alpha: number, scaleMul: number) => void,
  opts: TrailDrawOpts,
): void {
  const peak = opts.peakAlpha ?? 0.45;
  const n = trail.samples.length;
  if (n === 0) return;

  ctx.save();
  if (opts.blend) ctx.globalCompositeOperation = opts.blend;

  for (let i = 0; i < n; i++) {
    const s = trail.samples[i];
    const age = (now - s.at) / Math.max(1, trail.maxAgeMs);
    const life = 1 - clamp(age, 0, 1);
    // older = more transparent + slightly smaller
    const rank = (i + 1) / n;
    const alpha = peak * life * rank * rank;
    if (alpha < 0.02) continue;
    const scaleMul = lerp(0.55, 1, rank) * life;

    if (opts.glowColor) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      const r = (opts.glowRadius ?? opts.size * 0.55) * scaleMul;
      const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, r);
      g.addColorStop(0, opts.glowColor);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawSprite(s.x, s.y, s.angle, alpha, scaleMul);
  }

  ctx.restore();
}

/**
 * Draw one sprite frame with rotation + non-uniform scale (motion stretch).
 * Source is a horizontal strip frame.
 */
export function drawRotatedStripFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frameIdx: number,
  frameCount: number,
  x: number,
  y: number,
  size: number,
  angle: number,
  stretchX = 1,
  stretchY = 1,
  alpha = 1,
  flipX = false,
): void {
  if (!img.complete || !img.naturalWidth) return;
  const frames = Math.max(1, frameCount);
  const frameW = img.naturalWidth / frames;
  const frameH = img.naturalHeight;
  const fi = ((frameIdx % frames) + frames) % frames;
  const dw = size * stretchX;
  const dh = size * stretchY;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, fi * frameW, 0, frameW, frameH, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/**
 * Soft silhouette afterimage (dodge / dash ghosts).
 * Uses screen blend for a readable glow without hard outlines.
 */
export function drawGhostSilhouette(
  ctx: CanvasRenderingContext2D,
  drawBody: () => void,
  alpha: number,
  tint?: string,
): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.globalCompositeOperation = "screen";
  if (tint) {
    // Draw once, then soft color overlay via source-atop would require offscreen —
    // keep simple: body draw with elevated alpha + cyan/gold glow pass.
    ctx.shadowColor = tint;
    ctx.shadowBlur = 12;
  }
  drawBody();
  ctx.restore();
}

// ─── Movement tuning presets (fighting-game feel) ────────────────

export const FIGHTER_MOVE_TUNING = {
  /** Higher = snappier ground start/stop */
  groundLambda: 16,
  airLambda: 7,
  /** Extra friction when releasing keys (helps stop without skating) */
  groundStopLambda: 20,
  airStopLambda: 5,
  /** Run anim speed scales with |vx| / maxSpeed */
  runFrameSpeedMin: 0.65,
  runFrameSpeedMax: 1.45,
  /** Projectile trail */
  projTrailSamples: 7,
  projTrailAgeMs: 120,
  projTrailSpacing: 12,
  /** Skill FX composite */
  skillBlend: "lighter" as FxBlendMode,
  impactBlend: "screen" as FxBlendMode,
} as const;

/**
 * Recommended package map for 2D fighter systems (use what we already ship):
 *
 * | Need                    | Package / approach                         | Notes |
 * |-------------------------|--------------------------------------------|-------|
 * | Sprite strip playback   | canvas 2D (current)                        | SSOT for #fighter |
 * | Easing / blend curves   | this module + d3-ease                      | d3-ease already in package.json |
 * | Audio                   | howler                                     | already wired via gameSounds |
 * | Particle skill FX       | @pixi/particle-emitter OR canvas trails    | Pixi optional layer; trails first |
 * | Full 2D engine (alt)    | phaser 3                                   | used for turn-based battle only |
 * | Spine skeletal (future) | pixi-spine                                 | only if assets go Spine |
 * | Tween sequences         | framer-motion (UI) / local eases (combat)  | keep combat off React render |
 * | Sprite library assets   | /fighter2d + ObjectStore effectSprites     | Split Effects + projectiles |
 *
 * Avoid adding gsap/excalibur/kaboom for this mode — duplicates work and bloats the
 * Vercel upload. Prefer tightening canvas systems + library sheets.
 */
export const FIGHTER_2D_DEP_GUIDE = {
  keep: ["howler", "d3-ease", "pixi.js", "@pixi/particle-emitter", "phaser"],
  optionalFuture: ["pixi-spine"],
  doNotAddForFighter: ["gsap", "excalibur", "kaboom", "kontra", "matter-js"],
  assetRoots: [
    "/fighter2d/characters/*",
    "/fighter2d/effects/*",
    "/fighter2d/projectiles/*",
    "client/src/assets/GrudgeRPGAssets2d/**",
    "ObjectStore api/v1/effectSprites.json",
  ],
} as const;
