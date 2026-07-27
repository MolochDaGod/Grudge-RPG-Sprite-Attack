/**
 * 2D fighter ragdoll + hit-reaction physics (canvas, no physics engine).
 *
 * When a fighter is launched by damage they enter a short "limp" window:
 * - angular tumble (sprite rotation)
 * - gravity + ground bounce
 * - friction on land
 * - recover into takeHit/idle once velocity dies or timer ends
 *
 * Tuned for Sprite Attack feel — readable, punchy, not simulation-perfect.
 */

export type HitZone = "head" | "body" | "legs";
export type KnockbackAngle = "neutral" | "up" | "down" | "spike" | "forward" | "launch" | "wall";

export interface RagdollState {
  /** True while limp / tumbling from a hit */
  active: boolean;
  /** Sprite rotation radians (visual only) */
  angle: number;
  /** rad/frame-ish (scaled by dt internally) */
  spin: number;
  /** When ragdoll started (ms) */
  startedAt: number;
  /** Force recover after this (ms) */
  until: number;
  /** Soft ground bounce count remaining */
  bouncesLeft: number;
  /** Visual stretch along launch (squash/stretch) */
  stretch: number;
  /** Flash intensity 0–1 decaying */
  flash: number;
  /** Last impact strength for VFX scale */
  impactForce: number;
  hitZone: HitZone;
}

export interface KnockbackResult {
  kbX: number;
  kbY: number;
  hitstun: number;
  tumbleMs: number;
  spin: number;
  stretch: number;
  force: number;
}

const DEG = Math.PI / 180;

export function createIdleRagdoll(): RagdollState {
  return {
    active: false,
    angle: 0,
    spin: 0,
    startedAt: 0,
    until: 0,
    bouncesLeft: 0,
    stretch: 1,
    flash: 0,
    impactForce: 0,
    hitZone: "body",
  };
}

/**
 * Smash-style knockback with ragdoll spin magnitude.
 * Low HP → farther launch + longer tumble.
 */
export function calcKnockbackRagdoll(
  damage: number,
  targetHp: number,
  targetMaxHp: number,
  angle: KnockbackAngle = "neutral",
  zone: HitZone = "body",
  distanceScale = 3,
): KnockbackResult {
  const hpPercent = 1 - targetHp / Math.max(1, targetMaxHp);
  const zoneMul = zone === "head" ? 1.25 : zone === "legs" ? 0.85 : 1;
  const baseKb = (3.2 + damage * 0.28) * zoneMul * (0.55 + distanceScale * 0.15);
  const scaledKb = baseKb * (1 + hpPercent * 2.8);
  let kbX = scaledKb;
  let kbY = -(2.4 + hpPercent * 9 + damage * 0.18);

  if (angle === "up" || angle === "launch") {
    kbY *= angle === "launch" ? 2.1 : 1.65;
    kbX *= angle === "launch" ? 0.55 : 0.4;
  } else if (angle === "down" || angle === "spike") {
    kbY = Math.abs(kbY) * 0.95;
    kbX *= 0.45;
  } else if (angle === "forward") {
    kbY *= 0.45;
    kbX *= 1.45;
  } else if (angle === "wall") {
    kbY *= 0.35;
    kbX *= 1.7;
  }

  const force = Math.min(3.5, 0.55 + damage * 0.04 + hpPercent * 1.2);
  const hitstun = 180 + hpPercent * 380 + damage * 4;
  const tumbleMs = Math.min(1400, 280 + hitstun * 1.15 + force * 120);
  // Spin: headshots flip harder; spikes spin less
  let spin = (force * 0.09 + hpPercent * 0.05) * (zone === "head" ? 1.4 : 1);
  if (angle === "spike" || angle === "down") spin *= 0.55;
  if (angle === "launch" || angle === "up") spin *= 1.25;
  const stretch = 1 + force * 0.12;

  return {
    kbX,
    kbY,
    hitstun,
    tumbleMs,
    spin,
    stretch,
    force,
  };
}

/** Begin ragdoll from a hit. `facing` of attacker (+1 right). */
export function beginRagdollFromHit(
  now: number,
  kb: KnockbackResult,
  attackerFacing: 1 | -1,
  zone: HitZone,
): RagdollState {
  const spinDir = attackerFacing >= 0 ? 1 : -1;
  return {
    active: true,
    angle: 0,
    spin: kb.spin * spinDir * (0.85 + Math.random() * 0.3),
    startedAt: now,
    until: now + kb.tumbleMs,
    bouncesLeft: kb.force > 1.6 ? 2 : 1,
    stretch: kb.stretch,
    flash: Math.min(1, 0.45 + kb.force * 0.2),
    impactForce: kb.force,
    hitZone: zone,
  };
}

export interface RagdollTickInput {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  floorY: number | null;
  gravity: number;
  now: number;
  ragdoll: RagdollState;
}

export interface RagdollTickResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ragdoll: RagdollState;
  /** Just bounced — spawn dust / impact VFX */
  bounced: boolean;
  /** Recovered this frame */
  recovered: boolean;
}

/**
 * Integrate ragdoll for one frame (~1/60). Call only while ragdoll.active.
 */
export function tickRagdoll(input: RagdollTickInput, dt = 1 / 60): RagdollTickResult {
  let { x, y, vx, vy, ragdoll } = input;
  let bounced = false;
  let recovered = false;

  if (!ragdoll.active) {
    return { x, y, vx, vy, ragdoll, bounced, recovered };
  }

  // Gravity a bit heavier while limp so arcs read as body weight
  vy += input.gravity * 1.15;
  x += vx;
  y += vy;

  // Spin damps slowly in air, faster on ground
  let spin = ragdoll.spin * (input.grounded ? 0.88 : 0.995);
  let angle = ragdoll.angle + spin * 60 * dt;
  // Keep angle bounded for numeric stability
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;

  let stretch = 1 + (ragdoll.stretch - 1) * 0.92;
  let flash = ragdoll.flash * 0.9;
  let bouncesLeft = ragdoll.bouncesLeft;

  if (input.floorY != null && vy >= 0 && y >= input.floorY - 2) {
    y = input.floorY;
    if (bouncesLeft > 0 && Math.abs(vy) > 3.5) {
      vy = -Math.abs(vy) * 0.42;
      vx *= 0.72;
      spin *= -0.65;
      stretch = 0.75; // squash on bounce
      bouncesLeft -= 1;
      bounced = true;
      flash = Math.max(flash, 0.35);
    } else {
      vy = 0;
      vx *= 0.82;
      spin *= 0.75;
      // Settle rotation toward lying flat or upright based on speed
      if (Math.abs(vx) < 1.2 && Math.abs(spin) < 0.02) {
        // Ease angle toward 0 (stand) or ±90° (knocked down)
        const flat = Math.abs(angle) > 50 * DEG;
        const target = flat ? (angle > 0 ? 90 * DEG : -90 * DEG) * 0.35 : 0;
        angle = angle + (target - angle) * 0.2;
      }
    }
  }

  // Time-out or rest recovery
  const resting =
    input.grounded &&
    Math.abs(vx) < 0.8 &&
    Math.abs(vy) < 0.8 &&
    Math.abs(spin) < 0.025 &&
    input.now - ragdoll.startedAt > 220;

  if (input.now >= ragdoll.until || resting) {
    recovered = true;
    ragdoll = {
      ...createIdleRagdoll(),
      flash: flash * 0.5,
    };
    // Zero residual velocity for clean recover
    if (input.grounded) {
      vx *= 0.3;
      vy = 0;
    }
    return {
      x,
      y,
      vx,
      vy,
      ragdoll,
      bounced,
      recovered,
    };
  }

  ragdoll = {
    ...ragdoll,
    angle,
    spin,
    stretch,
    flash,
    bouncesLeft,
  };

  return { x, y, vx, vy, ragdoll, bounced, recovered };
}

/** Draw helpers: rotation + stretch around feet anchor. */
export function ragdollDrawTransform(ragdoll: RagdollState): {
  angle: number;
  scaleX: number;
  scaleY: number;
  alphaBoost: number;
} {
  if (!ragdoll.active && ragdoll.flash < 0.05) {
    return { angle: 0, scaleX: 1, scaleY: 1, alphaBoost: 0 };
  }
  const s = ragdoll.stretch || 1;
  // Stretch along tumble: longer when spinning hard
  const scaleX = s;
  const scaleY = 2 - s * 0.85;
  return {
    angle: ragdoll.angle,
    scaleX: Math.max(0.65, Math.min(1.45, scaleX)),
    scaleY: Math.max(0.65, Math.min(1.35, scaleY)),
    alphaBoost: ragdoll.flash,
  };
}
