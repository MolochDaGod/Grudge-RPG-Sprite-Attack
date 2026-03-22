import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crosshair, Shield, Zap, Wifi, Globe } from "lucide-react";
import { usePvP } from "@/hooks/usePvP";
import { GRUDA_ROSTER, type GrudaCharDef } from "@/lib/grudaRoster";
import { preloadVfx, getVfxById, getVfxImage, drawVfxFrame, type VfxDef } from "@/lib/vfxLibrary";
import { getFaction, type FactionId } from "@/lib/factions";

type FighterId = "p1" | "p2";
type AnimationState = "idle" | "run" | "jump" | "fall" | "attack" | "attack2" | "special" | "takeHit" | "death" | "dodge";
type SpecialMoveKind = "neutral" | "up" | "down" | "airForward" | "airDown";
type MoveVariant = "none" | "normal" | "altNormal" | "dash" | "ranged" | "upSpecial" | "downSpecial" | "rescue";

interface FighterSpriteDef {
    src: string;
    frames: number;
    hold: number;
    loop: boolean;
}

interface FighterSpriteSet {
    idle: FighterSpriteDef;
    run: FighterSpriteDef;
    jump: FighterSpriteDef;
    fall: FighterSpriteDef;
    dodge: FighterSpriteDef;
    attack: FighterSpriteDef;
    attack2: FighterSpriteDef;
    special: FighterSpriteDef;
    takeHit: FighterSpriteDef;
    death: FighterSpriteDef;
}

interface CharacterMoveSet {
    name: string;
    normalName: string;
    neutralSpecialName: string;
    upSpecialName: string;
    downSpecialName: string;
    superName: string;
    runSpeed: number;
    jumpForce: number;
    baseDamage: number;
    projectileDamage: number;
    upSpecialDamage: number;
    counterDamage: number;
    superDamage: number;
}

interface RuntimeSprite {
    image: HTMLImageElement;
    frameWidth: number;
    frameHeight: number;
    bottomPadding: number;
    def: FighterSpriteDef;
}

interface FighterRuntime {
    id: FighterId;
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    facing: 1 | -1;
    hp: number;
    maxHp: number;
    stocks: number;
    airJumpsLeft: number;
    invulnUntil: number;
    state: AnimationState;
    stateSince: number;
    frameIndex: number;
    frameTick: number;
    stateLockUntil: number;
    attackHitFrame: number;
    attackHasConnected: boolean;
    counterUntil: number;
    specialCooldownUntil: number;
    superMeter: number;
    stamina: number;
    lastStaminaRegen: number;
    dropThroughUntil: number;
    moveVariant: MoveVariant;
    moveSet: CharacterMoveSet;
}

interface Projectile {
    id: string;
    owner: FighterId;
    moveVariant: MoveVariant;
    swingVfxId: string;
    hitVfxId: string;
    isBouncingBomb: boolean;
    bouncesRemaining: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    hasGravity: boolean;
    radius: number;
    damage: number;
    expiresAt: number;
}

interface WorldState {
    p1: FighterRuntime;
    p2: FighterRuntime;
    projectiles: Projectile[];
    winner: FighterId | null;
    startedAt: number;
    superFreeze: { attacker: FighterId; until: number; damageAt: number; dealt: boolean } | null;
}

interface GrudgeFighter2DProps {
    onBack: () => void;
}

const ARENA_WIDTH = 1920;
const ARENA_HEIGHT = 1080;
const VIEWPORT_W = 1280;
const VIEWPORT_H = 720;
const GRAVITY = 0.75 * 0.63; // 37% slower total (30% + 10%)
const FALL_GRAVITY_SCALE = 0.80; // characters fall 20% slower than raw gravity
const GROUND_FRICTION = 0.78;
const AIR_FRICTION = 0.94;
const GROUND_ACCEL = 1.8;
const AIR_ACCEL = 0.9;
const GROUND_SPEED_MULT = 1.08;
const AIR_SPEED_MULT = 1.0;
const SPEED_SCALE = 0.63; // 37% slower global (30% + 10%)
const PROJECTILE_GRAVITY = GRAVITY * 0.6; // gravity for arcing projectiles
const MAX_AIR_JUMPS = 2;
const PARRY_WINDOW_MS = 180; // tight timing window for perfect parry
const PARRY_RECOIL_KB = 8; // knockback on successful parry
const PARRY_RECOIL_DAMAGE = 10; // damage reflected on parry
const STARTING_STOCKS = 5;
const RESPAWN_INVULN_MS = 2000;

// ─── Stage system ────────────────────────────────────────────────
interface Platform {
    x: number; y: number; w: number;
    oneWay: boolean; // can jump through from below
}

interface BlastZone {
    top: number; bottom: number; left: number; right: number;
}

interface StageDefinition {
    id: string;
    name: string;
    mainFloorY: number;
    mainFloorX: number;
    mainFloorW: number;
    platforms: Platform[];
    blastZone: BlastZone;
    bgColor1: string;
    bgColor2: string;
    floorColor: string;
    platformColor: string;
    bgFeatures: string; // 'castle' | 'ocean' | 'lava' | 'forest'
}

const STAGES: StageDefinition[] = [
    {
        id: 'battlefield', name: 'Grudge Battlefield',
        mainFloorY: 700, mainFloorX: 360, mainFloorW: 1200,
        platforms: [
            { x: 560, y: 540, w: 240, oneWay: true },
            { x: 860, y: 420, w: 200, oneWay: true },
            { x: 660, y: 300, w: 200, oneWay: true },
        ],
        blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
        bgColor1: '#0c1a0c', bgColor2: '#1a2e1a', floorColor: '#4a7a30', platformColor: '#5a8a3a',
        bgFeatures: 'castle',
    },
    {
        id: 'pirate', name: "Pirate's Cove",
        mainFloorY: 720, mainFloorX: 400, mainFloorW: 1100,
        platforms: [
            { x: 500, y: 560, w: 180, oneWay: true },
            { x: 900, y: 480, w: 160, oneWay: true },
            { x: 1200, y: 560, w: 180, oneWay: true },
        ],
        blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
        bgColor1: '#0a1628', bgColor2: '#1a2a4a', floorColor: '#7a5a30', platformColor: '#8a6a40',
        bgFeatures: 'ocean',
    },
    {
        id: 'fortress', name: 'Dark Fortress',
        mainFloorY: 700, mainFloorX: 460, mainFloorW: 1000,
        platforms: [],
        blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
        bgColor1: '#0a0a14', bgColor2: '#1a1020', floorColor: '#5a3a5a', platformColor: '#6a4a6a',
        bgFeatures: 'lava',
    },
    {
        id: 'canopy', name: 'Elven Canopy',
        mainFloorY: 750, mainFloorX: 300, mainFloorW: 1300,
        platforms: [
            { x: 420, y: 580, w: 200, oneWay: true },
            { x: 720, y: 460, w: 180, oneWay: true },
            { x: 1020, y: 340, w: 200, oneWay: true },
            { x: 1280, y: 520, w: 160, oneWay: true },
        ],
        blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
        bgColor1: '#0a1a0a', bgColor2: '#102a10', floorColor: '#3a6a2a', platformColor: '#4a7a3a',
        bgFeatures: 'forest',
    },
];

// ─── Dynamic camera ──────────────────────────────────────────────
interface CameraState {
    x: number;
    y: number;
    zoom: number;
}

function updateCamera(cam: CameraState, p1: FighterRuntime, p2: FighterRuntime): CameraState {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    const maxSpan = Math.max(dx + 400, dy + 300);
    const targetZoom = clamp(VIEWPORT_W / maxSpan, 0.4, 0.95);
    const targetX = midX - (VIEWPORT_W / targetZoom) / 2;
    const targetY = midY - (VIEWPORT_H / targetZoom) / 2 - 60;
    const lerp = 0.06;
    return {
        x: cam.x + (targetX - cam.x) * lerp,
        y: cam.y + (targetY - cam.y) * lerp,
        zoom: cam.zoom + (targetZoom - cam.zoom) * lerp,
    };
}

const P1_CONTROLS = {
    left: "a",
    right: "d",
    jump: "w",
    attack1: "q",
    attack2: "e",
    ranged: "f",
    super: "r",
    down: "s",
};

const P2_CONTROLS = {
    left: "arrowleft",
    right: "arrowright",
    jump: "arrowup",
    attack1: "/",
    attack2: ".",
    ranged: ";",
    super: "'",
    down: "arrowdown",
};

const SUPER_METER_MAX = 100;
const SUPER_METER_ON_HIT = 12;
const SUPER_METER_ON_HURT = 8;
const SUPER_FREEZE_DURATION = 800;
const SUPER_DAMAGE_MULTIPLIER = 3;

// Stamina system — resource bar for dash, ranged, specials
const STAMINA_MAX = 3;
const STAMINA_REGEN_MS = 3000; // 1 point every 3 seconds
const STAMINA_COST_DASH = 3;   // full 3 for max half-screen lunge
const STAMINA_COST_RANGED = 1;
const STAMINA_COST_SPECIAL = 2;
const EXHAUSTION_PENALTY_MS = 300; // lockout when spamming at 0 stamina
const DASH_VX_PER_POINT = 7;      // velocity per stamina point spent
const DODGE_DOUBLE_TAP_MS = 220;   // AA / DD input window
const DOWN_DROP_DOUBLE_TAP_MS = 220; // SS input window
const DODGE_LOCK_MS = 340;         // total dodge action duration
const DODGE_IFRAME_MS = 260;       // invulnerable window during dodge
const DODGE_COOLDOWN_MS = 520;     // prevent dodge spam
const DODGE_SPEED = 13 * SPEED_SCALE;
const DODGE_AIR_SPEED = 14.5 * SPEED_SCALE;
const DROP_THROUGH_LOCK_MS = 140;
const DROP_THROUGH_IGNORE_MS = 260;
const DROP_THROUGH_VY = 8;

// ─── Character Roster (GrudgeRPG 100x100 sprites) ───────────────────────

interface EffectSpriteDef {
    src: string;
    frames: number;
    hold: number;
}

interface CharacterDef {
    id: string;
    name: string;
    faction: FactionId;
    sprites: FighterSpriteSet;
    moveSet: CharacterMoveSet;
    color: string;
    attackEffect: EffectSpriteDef;
    projectileSrc?: string;
    projectileFrames?: number;
    renderScaleX: number; // horizontal render multiplier
    renderScaleY: number; // vertical render multiplier
    hasRollAnimation: boolean;
}

// Active visual effects rendered on the canvas
interface ActiveEffect {
    id: string;
    x: number;
    y: number;
    image: HTMLImageElement;
    frames: number;
    hold: number;
    frameIndex: number;
    frameTick: number;
    scale: number;
    flip: boolean;
}

// Convert GRUDA roster data into CharacterDef for the fighter engine
// frameSize is used to calculate correct frame widths (sprites aren't all 100x100)
function grudaToCharDef(g: GrudaCharDef): CharacterDef {
    const base = `/fighter2d/characters/${g.folder}/`;
    // hold = frames per tick; higher frame count anims need faster hold to not drag
    const autoHold = (frames: number) => frames > 20 ? 2 : frames > 10 ? 3 : frames > 6 ? 4 : 5;
    const isSmallSprite = g.frameSize <= 100;
    const defaultScaleY = isSmallSprite ? 2 : 1;
    const defaultScaleX = isSmallSprite ? 1.5 : 1;
    const scaleY = g.renderScaleY ?? g.renderScale ?? defaultScaleY;
    const scaleX = g.renderScaleX ?? (
        g.renderScale !== undefined && isSmallSprite
            ? g.renderScale * 0.75
            : (g.renderScale ?? defaultScaleX)
    );
    const s = (file: string, frames: number, loop: boolean) => ({
        src: base + file, frames, hold: autoHold(frames), loop,
    });
    return {
        id: g.id,
        name: g.name,
        faction: g.faction,
        color: g.color,
        sprites: {
            idle:    s(g.idle[0], g.idle[1], true),
            run:     s(g.walk[0], g.walk[1], true),
            jump:    s(g.jump?.[0] ?? g.idle[0], g.jump?.[1] ?? g.idle[1], false),
            fall:    s(g.fall?.[0] ?? g.idle[0], g.fall?.[1] ?? g.idle[1], false),
            dodge:   s(g.roll?.[0] ?? g.walk[0], g.roll?.[1] ?? g.walk[1], g.roll ? false : true),
            attack:  s(g.attack[0], g.attack[1], false),
            attack2: s(g.attack2?.[0] ?? g.attack[0], g.attack2?.[1] ?? g.attack[1], false),
            special: s(g.special?.[0] ?? g.cast?.[0] ?? g.attack2?.[0] ?? g.attack[0], g.special?.[1] ?? g.cast?.[1] ?? g.attack2?.[1] ?? g.attack[1], false),
            takeHit: s(g.hurt[0], g.hurt[1], false),
            death:   s(g.death[0], g.death[1], false),
        },
        moveSet: {
            name: g.name,
            normalName: "Strike",
            neutralSpecialName: "Ranged",
            upSpecialName: "Up Special",
            downSpecialName: "Counter",
            superName: g.superName,
            runSpeed: g.spd,
            jumpForce: 16,
            baseDamage: g.atk,
            projectileDamage: Math.round(g.atk * 0.8),
            upSpecialDamage: Math.round(g.atk * 1.1),
            counterDamage: Math.round(g.atk * 1.5),
            superDamage: g.superDmg,
        },
        attackEffect: g.effectSrc
            ? { src: `/fighter2d/effects/${g.effectSrc}`, frames: g.effectFrames ?? 6, hold: 3 }
            : { src: "/fighter2d/effects/slash_arc.png", frames: 6, hold: 3 },
        projectileSrc: g.projectile ? `/fighter2d/projectiles/${g.projectile}` : undefined,
        projectileFrames: g.projectile ? 1 : undefined,
        renderScaleX: scaleX,
        renderScaleY: scaleY,
        hasRollAnimation: !!g.roll,
    };
}

const CHARACTER_ROSTER: CharacterDef[] = GRUDA_ROSTER.map(grudaToCharDef);

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function approach(value: number, target: number, delta: number): number {
    if (value < target) return Math.min(value + delta, target);
    if (value > target) return Math.max(value - delta, target);
    return target;
}

const SWING_VFX_BY_MOVE: Record<MoveVariant, string[]> = {
    none: ["smearH1"],
    normal: ["smearH1", "smearH2", "vineWhip"],
    altNormal: ["smearH3", "shadowSlash", "smearV1"],
    dash: ["smearV2", "smearV3", "dustCloud"],
    ranged: ["fireBreath", "electricChain", "darkMist", "leafStorm"],
    upSpecial: ["lightningStrike", "holySmite", "smearV2"],
    downSpecial: ["voidPulse", "rockSmash", "bloodSplat"],
    rescue: ["energyBurst", "dustCloud", "smearV3"],
};

const HIT_VFX_BY_MOVE: Record<MoveVariant, string[]> = {
    none: ["hit_effect_1"],
    normal: ["hit_effect_1", "explosionSmall"],
    altNormal: ["sparkBurst", "hit_effect_1"],
    dash: ["explosionSmall", "bloodSplat", "hit_effect_1"],
    ranged: ["fireBreathHit", "iceShatter", "sparkBurst", "waterSplash"],
    upSpecial: ["lightningStrike", "energyBurst", "holySmite"],
    downSpecial: ["voidPulse", "rockSmash", "bloodSplat"],
    rescue: ["energyBurst", "explosionSmall", "hit_effect_1"],
};

function hashString(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function pickMoveVfxId(move: MoveVariant, fighterKey: string, pool: Record<MoveVariant, string[]>): string {
    const ids = pool[move] ?? pool.none;
    return ids[hashString(`${fighterKey}:${move}`) % ids.length];
}

function createInitialFighter(id: FighterId, moveSet: CharacterMoveSet, stage: StageDefinition, scaleX = 1, scaleY = 1): FighterRuntime {
    const spawnX = id === "p1" ? stage.mainFloorX + 200 : stage.mainFloorX + stage.mainFloorW - 200;
    return {
        id,
        x: spawnX,
        y: stage.mainFloorY,
        vx: 0,
        vy: 0,
        width: Math.round(80 * Math.max(0.6, Math.min(scaleX, 2.0))),
        height: Math.round(160 * Math.max(0.6, Math.min(scaleY, 2.0))),
        facing: id === "p1" ? 1 : -1,
        hp: 200,
        maxHp: 200,
        stocks: STARTING_STOCKS,
        airJumpsLeft: MAX_AIR_JUMPS,
        invulnUntil: 0,
        state: "idle",
        stateSince: performance.now(),
        frameIndex: 0,
        frameTick: 0,
        stateLockUntil: 0,
        attackHitFrame: 4,
        attackHasConnected: false,
        counterUntil: 0,
        specialCooldownUntil: 0,
        superMeter: 0,
        stamina: STAMINA_MAX,
        lastStaminaRegen: performance.now(),
        dropThroughUntil: 0,
        moveVariant: "none",
        moveSet,
    };
}

function respawnFighter(fighter: FighterRuntime, stage: StageDefinition): FighterRuntime {
    const now = performance.now();
    return {
        ...fighter,
        x: stage.mainFloorX + stage.mainFloorW / 2,
        y: stage.mainFloorY - 300,
        vx: 0,
        vy: 0,
        hp: 200,
        airJumpsLeft: MAX_AIR_JUMPS,
        invulnUntil: now + RESPAWN_INVULN_MS,
        state: "fall",
        stateSince: now,
        frameIndex: 0,
        frameTick: 0,
        stateLockUntil: 0,
        attackHasConnected: false,
        counterUntil: 0,
        superMeter: fighter.superMeter,
        stamina: STAMINA_MAX,
        lastStaminaRegen: now,
        dropThroughUntil: 0,
        moveVariant: "none",
    };
}

function isOnPlatform(fighter: FighterRuntime, stage: StageDefinition, ignoreOneWayPlatforms = false): number | null {
    // Wider tolerance prevents fast-falling characters from clipping through
    const tolerance = Math.max(16, Math.abs(fighter.vy) * 1.5);
    // Check main floor
    if (fighter.vy >= 0 && fighter.y >= stage.mainFloorY - 4 && fighter.y <= stage.mainFloorY + tolerance
        && fighter.x >= stage.mainFloorX - 20 && fighter.x <= stage.mainFloorX + stage.mainFloorW + 20) {
        return stage.mainFloorY;
    }
    if (ignoreOneWayPlatforms) return null;
    // Check platforms (one-way: only land from above)
    for (const p of stage.platforms) {
        if (fighter.vy >= 0 && fighter.y >= p.y - 4 && fighter.y <= p.y + tolerance
            && fighter.x >= p.x - 10 && fighter.x <= p.x + p.w + 10) {
            return p.y;
        }
    }
    return null;
}

function getProjectileFloorY(projectile: { x: number; y: number }, stage: StageDefinition): number | null {
    if (
        projectile.x >= stage.mainFloorX - 10 &&
        projectile.x <= stage.mainFloorX + stage.mainFloorW + 10 &&
        projectile.y >= stage.mainFloorY - 2 &&
        projectile.y <= stage.mainFloorY + 18
    ) {
        return stage.mainFloorY;
    }
    for (const p of stage.platforms) {
        if (
            projectile.x >= p.x - 8 &&
            projectile.x <= p.x + p.w + 8 &&
            projectile.y >= p.y - 2 &&
            projectile.y <= p.y + 16
        ) {
            return p.y;
        }
    }
    return null;
}

// ─── Elliptical body collider (follows character outline) ────────
interface BodyEllipse {
    cx: number; cy: number; rx: number; ry: number;
}

/** Body ellipse: rx/ry sized to character's body — naturally excludes weapon reach */
function bodyEllipse(fighter: FighterRuntime): BodyEllipse {
    return {
        cx: fighter.x,
        cy: fighter.y - fighter.height / 2,
        rx: fighter.width / 2,
        ry: fighter.height / 2,
    };
}

function pointInEllipse(px: number, py: number, e: BodyEllipse): boolean {
    const dx = (px - e.cx) / e.rx;
    const dy = (py - e.cy) / e.ry;
    return dx * dx + dy * dy <= 1;
}

/** Does a rect (weapon hitbox) intersect an ellipse (body)? */
function rectIntersectsEllipse(
    rect: { x: number; y: number; w: number; h: number },
    e: BodyEllipse
): boolean {
    const closestX = clamp(e.cx, rect.x, rect.x + rect.w);
    const closestY = clamp(e.cy, rect.y, rect.y + rect.h);
    return pointInEllipse(closestX, closestY, e);
}

/** Does a circle (projectile) intersect an ellipse (body)? */
function circleIntersectsEllipse(
    circle: { x: number; y: number; r: number },
    e: BodyEllipse
): boolean {
    // Scale space so ellipse becomes unit circle, then do circle test
    const ndx = (circle.x - e.cx) / e.rx;
    const ndy = (circle.y - e.cy) / e.ry;
    const nr = circle.r / Math.min(e.rx, e.ry);
    const dist = Math.sqrt(ndx * ndx + ndy * ndy);
    return dist <= 1 + nr;
}

/** Do two body ellipses overlap? (for push resolution) */
function ellipsesOverlap(a: BodyEllipse, b: BodyEllipse): boolean {
    const ndx = (a.cx - b.cx) / (a.rx + b.rx);
    const ndy = (a.cy - b.cy) / (a.ry + b.ry);
    return ndx * ndx + ndy * ndy < 1;
}

/** Compute horizontal push needed to separate two overlapping ellipses */
function ellipsePushX(a: BodyEllipse, b: BodyEllipse): number {
    if (!ellipsesOverlap(a, b)) return 0;
    // Approximate horizontal overlap
    const combinedRx = a.rx + b.rx;
    const dx = Math.abs(a.cx - b.cx);
    return Math.max(0, combinedRx - dx);
}

// Damage zone sub-regions (inscribed within body ellipse)
function headBox(fighter: FighterRuntime) {
    return { x: fighter.x - fighter.width * 0.3, y: fighter.y - fighter.height, w: fighter.width * 0.6, h: fighter.height * 0.25 };
}
function bodyBox(fighter: FighterRuntime) {
    return { x: fighter.x - fighter.width * 0.4, y: fighter.y - fighter.height * 0.75, w: fighter.width * 0.8, h: fighter.height * 0.4 };
}
function legsBox(fighter: FighterRuntime) {
    return { x: fighter.x - fighter.width * 0.35, y: fighter.y - fighter.height * 0.35, w: fighter.width * 0.7, h: fighter.height * 0.35 };
}

function intersectRect(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}


function resolveFighterSeparation(a: FighterRuntime, b: FighterRuntime): { a: FighterRuntime; b: FighterRuntime } {
    const ae = bodyEllipse(a);
    const be = bodyEllipse(b);
    const push = ellipsePushX(ae, be);
    if (push <= 0) return { a, b };

    const dir = a.x === b.x ? (a.id === "p1" ? -1 : 1) : Math.sign(a.x - b.x);
    const pushEach = push * 0.5 + 0.01;
    return {
        a: { ...a, x: a.x + dir * pushEach },
        b: { ...b, x: b.x - dir * pushEach },
    };
}

function setState(fighter: FighterRuntime, state: AnimationState, now: number): FighterRuntime {
    if (fighter.state === state) return fighter;
    return {
        ...fighter,
        state,
        stateSince: now,
        frameIndex: 0,
        frameTick: 0,
    };
}

// Smash-style knockback: the lower your HP, the further you fly
function calcKnockback(damage: number, targetHp: number, targetMaxHp: number): { kbX: number; kbY: number; hitstun: number } {
    const hpPercent = 1 - (targetHp / targetMaxHp); // 0 at full HP, ~1 at near-death
    const baseKb = 3 + damage * 0.25;
    const scaledKb = baseKb * (1 + hpPercent * 2.5); // up to 3.5x knockback at low HP
    const kbY = -(2 + hpPercent * 8 + damage * 0.15); // more upward launch at low HP
    const hitstun = 200 + hpPercent * 300; // longer hitstun at low HP
    return { kbX: scaledKb, kbY, hitstun };
}

function applyDamage(
    target: FighterRuntime,
    attacker: FighterRuntime,
    damage: number,
    now: number
): { target: FighterRuntime; attacker: FighterRuntime; wasCounter: boolean } {
    // Invulnerability check (respawn protection)
    if (target.invulnUntil > now) {
        return { target, attacker, wasCounter: false };
    }
    if (target.counterUntil > now && target.state !== "death") {
        const counterKb = calcKnockback(target.moveSet.counterDamage, attacker.hp, attacker.maxHp);
        const newAttackerHp = Math.max(0, attacker.hp - target.moveSet.counterDamage);
        const nextAttacker = setState(
            {
                ...attacker,
                hp: newAttackerHp,
                vx: -target.facing * counterKb.kbX,
                vy: counterKb.kbY,
                stateLockUntil: now + counterKb.hitstun,
            },
            newAttackerHp <= 0 ? "death" : "takeHit",
            now
        );
        return {
            target: { ...target, counterUntil: 0 },
            attacker: nextAttacker,
            wasCounter: true,
        };
    }

    const nextHp = Math.max(0, target.hp - damage);
    const kb = calcKnockback(damage, target.hp, target.maxHp);
    const damagedTarget = setState(
        {
            ...target,
            hp: nextHp,
            vx: attacker.facing * kb.kbX,
            vy: kb.kbY,
            stateLockUntil: now + kb.hitstun,
            counterUntil: 0,
        },
        nextHp <= 0 ? "death" : "takeHit",
        now
    );

    return {
        target: { ...damagedTarget, superMeter: Math.min(SUPER_METER_MAX, damagedTarget.superMeter + SUPER_METER_ON_HURT) },
        attacker: { ...attacker, superMeter: Math.min(SUPER_METER_MAX, attacker.superMeter + SUPER_METER_ON_HIT) },
        wasCounter: false,
    };
}
const IMAGE_ALPHA_THRESHOLD = 8;
const spriteBottomPaddingCache = new Map<string, number>();

function getImageBottomPadding(image: HTMLImageElement): number {
    const cacheKey = image.currentSrc || image.src;
    const cached = spriteBottomPaddingCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let bottomPadding = 0;
    let found = false;
    for (let y = height - 1; y >= 0 && !found; y--) {
        const rowStart = y * width * 4;
        for (let x = 0; x < width; x++) {
            const alpha = data[rowStart + x * 4 + 3];
            if (alpha > IMAGE_ALPHA_THRESHOLD) {
                bottomPadding = height - 1 - y;
                found = true;
                break;
            }
        }
    }

    spriteBottomPaddingCache.set(cacheKey, bottomPadding);
    return bottomPadding;
}

function loadSpriteSet(set: FighterSpriteSet): Promise<Record<AnimationState, RuntimeSprite>> {
    const entries = Object.entries(set) as [AnimationState, FighterSpriteDef][];
    return Promise.all(
        entries.map(
            ([state, def]) =>
                new Promise<[AnimationState, RuntimeSprite]>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        resolve([
                            state,
                            {
                                image,
                                frameWidth: image.width / def.frames,
                                frameHeight: image.height,
                                bottomPadding: getImageBottomPadding(image),
                                def,
                            },
                        ]);
                    };
                    image.onerror = () => reject(new Error(`Failed to load sprite: ${def.src}`));
                    image.src = def.src;
                })
        )
    ).then((loaded) => Object.fromEntries(loaded) as Record<AnimationState, RuntimeSprite>);
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Discord webhook for match results
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1484799745661734975/9Ffcrz3bmzsyi3342_1MKRkiv_xtThAAaTULB-bKAfw8BQBKIOQj4ZBh7Ivmv3oe-glB";

function postMatchResult(winner: string, loser: string, winnerChar: string, loserChar: string, duration: string, wasOnline: boolean) {
    const embed = {
        embeds: [{
            title: "GRUDGE FIGHTER -- Match Result",
            color: 0xb91c1c,
            fields: [
                { name: "Winner", value: `**${winner}** (${winnerChar})`, inline: true },
                { name: "Defeated", value: `${loser} (${loserChar})`, inline: true },
                { name: "Duration", value: duration, inline: true },
                { name: "Mode", value: wasOnline ? "Online PvP" : "vs AI", inline: true },
            ],
            footer: { text: "Grudge Fighter | grudge-studio.com" },
            timestamp: new Date().toISOString(),
        }],
    };
    fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embed),
    }).catch(() => {}); // fire and forget
}

// Renders a single mid-attack frame from the sprite strip onto a canvas
function AttackFrameCanvas({ src, frames, frameSize, size }: { src: string; frames: number; frameSize: number; size: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            const fw = img.width / frames;
            const fh = img.height;
            // Pick a frame ~60% through the attack (the juicy part of the swing)
            const pickFrame = Math.min(Math.floor(frames * 0.6), frames - 1);
            ctx.clearRect(0, 0, size, size);
            ctx.imageSmoothingEnabled = false;
            const bottomPadding = getImageBottomPadding(img);
            const visibleHeight = Math.max(1, fh - bottomPadding);
            // Draw the single frame scaled to fill the canvas with feet on the visible bottom edge
            const scale = Math.min(size / fw, size / visibleHeight);
            const dw = fw * scale;
            const dh = fh * scale;
            const drawX = (size - dw) / 2;
            const drawY = size - visibleHeight * scale - bottomPadding * scale;
            ctx.drawImage(img, pickFrame * fw, 0, fw, fh, drawX, drawY, dw, dh);
        };
        img.src = src;
    }, [src, frames, frameSize, size]);
    return <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />;
}

export default function GrudgeFighter2D({ onBack }: GrudgeFighter2DProps) {
    const [p1Pick, setP1Pick] = useState<CharacterDef | null>(null);
    const [p2Pick, setP2Pick] = useState<CharacterDef | null>(null);
    const [selectedStage, setSelectedStage] = useState<StageDefinition>(STAGES[0]);
    const [selectPhase, setSelectPhase] = useState<"mode" | "lobby" | "p1" | "p2" | "stage" | "fight">("mode");
    const stageRef = useRef<StageDefinition>(STAGES[0]);
    const cameraRef = useRef<CameraState>({ x: 0, y: 0, zoom: 1 });
    const [joinCode, setJoinCode] = useState("");
    const pvp = usePvP();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const worldRef = useRef<WorldState | null>(null);
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const movementTapRef = useRef<Record<FighterId, { left: number; right: number; down: number }>>({
        p1: { left: 0, right: 0, down: 0 },
        p2: { left: 0, right: 0, down: 0 },
    });
    const animationFrameRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hud, setHud] = useState({ p1Hp: 200, p2Hp: 200, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null as FighterId | null, elapsed: 0 });
    const [vsAI, setVsAI] = useState(true);
    const aiTimerRef = useRef(0);
    const mouseScreenRef = useRef({ x: VIEWPORT_W / 2, y: VIEWPORT_H / 2 });
    const mouseWorldRef = useRef({ x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 });

    const assetsRef = useRef<{
        p1: Record<AnimationState, RuntimeSprite>;
        p2: Record<AnimationState, RuntimeSprite>;
        background: HTMLImageElement;
        castle: HTMLImageElement;
        p1Effect: HTMLImageElement | null;
        p2Effect: HTMLImageElement | null;
        p1Projectile: HTMLImageElement | null;
        p2Projectile: HTMLImageElement | null;
    } | null>(null);

    const activeEffectsRef = useRef<ActiveEffect[]>([]);
    const screenShakeRef = useRef({ intensity: 0, until: 0 });
    const hitFlashRef = useRef<{ target: FighterId; until: number } | null>(null);
    const debugBoxesRef = useRef(false);

    // When PvP fight starts, set both picks from server data
    useEffect(() => {
        if (pvp.state === "fighting" && pvp.fightData) {
            const p1Char = CHARACTER_ROSTER.find(c => c.id === pvp.fightData!.p1Character);
            const p2Char = CHARACTER_ROSTER.find(c => c.id === pvp.fightData!.p2Character);
            if (p1Char && p2Char) {
                setP1Pick(p1Char);
                setP2Pick(p2Char);
                setVsAI(false);
                setSelectPhase("fight");
            }
        }
    }, [pvp.state, pvp.fightData]);

    const handleCharacterPick = useCallback((char: CharacterDef) => {
        if (selectPhase === "p1") {
            setP1Pick(char);
            if (pvp.state === "waiting" || pvp.state === "in-room") {
                pvp.pickCharacter(char.id);
                pvp.setReady();
                return;
            }
            setSelectPhase("p2");
        } else if (selectPhase === "p2") {
            setP2Pick(char);
            setSelectPhase("stage");
        }
    }, [selectPhase, pvp]);

    const resetToSelect = useCallback(() => {
        setP1Pick(null);
        setP2Pick(null);
        setSelectPhase("mode");
        setIsReady(false);
        pvp.disconnect();
        assetsRef.current = null;
        worldRef.current = null;
        setHud({ p1Hp: 200, p2Hp: 200, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null, elapsed: 0 });
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const queueRescueRoll = useCallback((fighterId: FighterId, targetX: number, targetY: number) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil || now < actor.specialCooldownUntil) return;

        const dx = targetX - actor.x;
        const dy = targetY - (actor.y - actor.height * 0.5);
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        const rescueSpeed = DODGE_AIR_SPEED * 1.2;

        const next = setState(
            {
                ...actor,
                vx: nx * rescueSpeed,
                vy: ny * rescueSpeed,
                facing: nx >= 0 ? 1 : -1,
                attackHasConnected: false,
                moveVariant: "rescue",
                counterUntil: 0,
                stateLockUntil: now + DODGE_LOCK_MS + 70,
                specialCooldownUntil: now + DODGE_COOLDOWN_MS + 220,
                invulnUntil: Math.max(actor.invulnUntil, now + DODGE_IFRAME_MS),
            },
            "dodge",
            now
        );
        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, []);

    const resetMatch = useCallback(() => {
        if (!p1Pick || !p2Pick) return;
        const stage = stageRef.current;
        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet, stage, p1Pick.renderScaleX, p1Pick.renderScaleY),
            p2: createInitialFighter("p2", p2Pick.moveSet, stage, p2Pick.renderScaleX, p2Pick.renderScaleY),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };
        cameraRef.current = { x: stage.mainFloorX, y: stage.mainFloorY - 400, zoom: 1 };
        setHud({ p1Hp: 200, p2Hp: 200, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null, elapsed: 0 });
    }, [p1Pick, p2Pick]);

    const updateMouseRefsFromClient = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const screenX = ((clientX - rect.left) / rect.width) * VIEWPORT_W;
        const screenY = ((clientY - rect.top) / rect.height) * VIEWPORT_H;
        mouseScreenRef.current = { x: screenX, y: screenY };
        const cam = cameraRef.current;
        mouseWorldRef.current = {
            x: cam.x + screenX / cam.zoom,
            y: cam.y + screenY / cam.zoom,
        };
    }, []);

    const queueNormalAttack = useCallback((fighterId: FighterId, useAltAnimation = false) => {
        const world = worldRef.current;
        if (!world) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil) return;

        const next = setState(
            {
                ...actor,
                stateLockUntil: now + 330,
                attackHasConnected: false,
                moveVariant: useAltAnimation ? "altNormal" : "normal",
            },
            useAltAnimation ? "attack2" : "attack",
            now
        );

        if (fighterId === "p1") {
            world.p1 = next;
        } else {
            world.p2 = next;
        }
    }, []);

    const queueSpecial = useCallback((fighterId: FighterId, kind: SpecialMoveKind) => {
        const world = worldRef.current;
        if (!world) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil || now < actor.specialCooldownUntil) return;
        const isProjectileSpecial = kind === "neutral" || kind === "airForward" || kind === "airDown";

        // Projectile specials cost 1 stamina
        if (isProjectileSpecial) {
            if (actor.stamina < STAMINA_COST_RANGED) {
                const exhausted = { ...actor, stateLockUntil: now + EXHAUSTION_PENALTY_MS };
                if (fighterId === "p1") world.p1 = exhausted; else world.p2 = exhausted;
                return;
            }
            const charDef = CHARACTER_ROSTER.find(c => c.moveSet.name === actor.moveSet.name);
            const projSrc = charDef?.projectileSrc ?? '';
            const isPhysical = /arrow|axe|bolt|bullet/i.test(projSrc);
            const fighterKey = fighterId === "p1" ? (p1Pick?.id ?? actor.moveSet.name) : (p2Pick?.id ?? actor.moveSet.name);
            let vx = actor.facing * 10 * SPEED_SCALE;
            let vy = isPhysical ? -1.5 : 0;
            let hasGravity = isPhysical;
            if (kind === "airForward") {
                vx = actor.facing * 12 * SPEED_SCALE;
                vy = 0;
                hasGravity = false;
            } else if (kind === "airDown") {
                vx = actor.facing * 9.5 * SPEED_SCALE;
                vy = 4.5;
                hasGravity = true;
            }
            const projectile: Projectile = {
                id: `${fighterId}-${now}`,
                owner: fighterId,
                moveVariant: "ranged",
                swingVfxId: pickMoveVfxId("ranged", fighterKey, SWING_VFX_BY_MOVE),
                hitVfxId: pickMoveVfxId("ranged", fighterKey, HIT_VFX_BY_MOVE),
                isBouncingBomb: kind === "airDown",
                bouncesRemaining: kind === "airDown" ? 2 : 0,
                x: actor.x + actor.facing * 40,
                y: actor.y - actor.height * 0.45,
                vx,
                vy,
                hasGravity,
                radius: 14,
                damage: actor.moveSet.projectileDamage,
                expiresAt: now + 2200,
            };

            const next = setState(
                {
                    ...actor,
                    stamina: actor.stamina - STAMINA_COST_RANGED,
                    stateLockUntil: now + 300,
                    specialCooldownUntil: now + 800,
                    attackHasConnected: false,
                    moveVariant: "ranged",
                },
                "special",
                now
            );

            if (fighterId === "p1") world.p1 = next;
            else world.p2 = next;

            world.projectiles.push(projectile);
            return;
        }

        // Up/Down specials cost 2 stamina
        if (actor.stamina < STAMINA_COST_SPECIAL) {
            const exhausted = { ...actor, stateLockUntil: now + EXHAUSTION_PENALTY_MS };
            if (fighterId === "p1") world.p1 = exhausted; else world.p2 = exhausted;
            return;
        }

        if (kind === "up") {
            const next = setState(
                {
                    ...actor,
                    stamina: actor.stamina - STAMINA_COST_SPECIAL,
                    vy: -actor.moveSet.jumpForce * 0.95,
                    vx: actor.facing * 8,
                    stateLockUntil: now + 340,
                    specialCooldownUntil: now + 1050,
                    attackHasConnected: false,
                    moveVariant: "upSpecial",
                },
                "special",
                now
            );
            if (fighterId === "p1") world.p1 = next;
            else world.p2 = next;
            return;
        }

        const next = setState(
            {
                ...actor,
                stamina: actor.stamina - STAMINA_COST_SPECIAL,
                stateLockUntil: now + 360,
                specialCooldownUntil: now + 1200,
                counterUntil: now + 420,
                attackHasConnected: false,
                moveVariant: "downSpecial",
            },
            "special",
            now
        );
        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, [p1Pick?.id, p2Pick?.id]);

    const tryJump = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil) return;
        const stage = stageRef.current;
        const grounded = stage ? isOnPlatform(actor, stage) !== null : actor.y >= 600;
        if (grounded) {
            // Ground jump
            const next = setState({ ...actor, vy: -actor.moveSet.jumpForce * SPEED_SCALE, airJumpsLeft: MAX_AIR_JUMPS, moveVariant: "none", attackHasConnected: false }, "jump", now);
            if (fighterId === "p1") world.p1 = next; else world.p2 = next;
        } else if (actor.airJumpsLeft > 0) {
            // Air jump (double jump)
            const next = setState({ ...actor, vy: -actor.moveSet.jumpForce * SPEED_SCALE * 0.85, airJumpsLeft: actor.airJumpsLeft - 1, moveVariant: "none", attackHasConnected: false }, "jump", now);
            if (fighterId === "p1") world.p1 = next; else world.p2 = next;
        }
    }, []);

    const queueSuper = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
        if (!world || world.superFreeze || world.winner) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (actor.hp <= 0 || actor.superMeter < SUPER_METER_MAX) return;
        if (now < actor.stateLockUntil) return;
        world.superFreeze = { attacker: fighterId, until: now + SUPER_FREEZE_DURATION, damageAt: now + SUPER_FREEZE_DURATION * 0.7, dealt: false };
        const next = setState({ ...actor, superMeter: 0, stateLockUntil: now + SUPER_FREEZE_DURATION + 200, attackHasConnected: false, moveVariant: "none" }, "special", now);
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
    }, []);

    const queueDodge = useCallback((fighterId: FighterId, direction: -1 | 1) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil || now < actor.specialCooldownUntil) return;

        const stage = stageRef.current;
        const grounded = isOnPlatform(actor, stage) !== null;
        const dodgeSpeed = grounded ? DODGE_SPEED : DODGE_AIR_SPEED;
        const dodgeVy = grounded ? actor.vy : Math.min(actor.vy * 0.55, 2);

        const next = setState(
            {
                ...actor,
                vx: direction * dodgeSpeed,
                vy: dodgeVy,
                attackHasConnected: false,
                moveVariant: "none",
                counterUntil: 0,
                stateLockUntil: now + DODGE_LOCK_MS,
                specialCooldownUntil: now + DODGE_COOLDOWN_MS,
                invulnUntil: Math.max(actor.invulnUntil, now + DODGE_IFRAME_MS),
            },
            "dodge",
            now
        );

        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, []);

    const queueDropThrough = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil) return;

        const stage = stageRef.current;
        const floorY = isOnPlatform(actor, stage);
        if (floorY === null) return;
        const onMainFloor = Math.abs(floorY - stage.mainFloorY) < 0.5;
        if (onMainFloor) return;

        const next = setState(
            {
                ...actor,
                y: actor.y + 2,
                vy: Math.max(actor.vy, DROP_THROUGH_VY),
                dropThroughUntil: now + DROP_THROUGH_IGNORE_MS,
                stateLockUntil: now + DROP_THROUGH_LOCK_MS,
                counterUntil: 0,
                attackHasConnected: false,
                moveVariant: "none",
            },
            "fall",
            now
        );
        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, []);

    // LMB: Dash Attack — spends up to 3 stamina for proportional lunge
    const queueDashAttack = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil) return;

        // Exhaustion: if 0 stamina, apply penalty and block attack
        if (actor.stamina <= 0) {
            const exhausted = { ...actor, stateLockUntil: now + EXHAUSTION_PENALTY_MS };
            if (fighterId === "p1") world.p1 = exhausted; else world.p2 = exhausted;
            return;
        }

        // Spend up to 3 stamina, always try max
        const spend = Math.min(actor.stamina, STAMINA_COST_DASH);
        const dashVx = actor.facing * spend * DASH_VX_PER_POINT * SPEED_SCALE;

        const next = setState(
            {
                ...actor,
                vx: dashVx,
                stamina: actor.stamina - spend,
                stateLockUntil: now + 350,
                attackHasConnected: false,
                moveVariant: "dash",
            },
            "attack2",
            now
        );
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
    }, []);

    // RMB: Block / Parry — enter counter stance
    const queueBlock = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
        if (!world || world.superFreeze) return;
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (now < actor.stateLockUntil || now < actor.specialCooldownUntil) return;

        const next = setState(
            {
                ...actor,
                vx: 0,
                stateLockUntil: now + 400,
                specialCooldownUntil: now + 900,
                counterUntil: now + 500,
                moveVariant: "none",
            },
            "idle",
            now
        );
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
    }, []);

    const processInput = useCallback((fighterId: FighterId, controls: typeof P1_CONTROLS, key: string) => {
        const keys = pressedKeysRef.current;
        if (key === controls.jump) tryJump(fighterId);
        if (key === controls.attack1) {
            const up = keys.has(controls.jump);
            const down = keys.has(controls.down);
            if (up) queueSpecial(fighterId, "up");
            else if (down) queueSpecial(fighterId, "down");
            else queueNormalAttack(fighterId);
        }
        if (key === controls.attack2) {
            const world = worldRef.current;
            const actor = world ? (fighterId === "p1" ? world.p1 : world.p2) : null;
            const stage = stageRef.current;
            const airborne = actor ? isOnPlatform(actor, stage, performance.now() < actor.dropThroughUntil) === null : false;
            if (airborne) {
                const down = keys.has(controls.down);
                queueSpecial(fighterId, down ? "airDown" : "airForward");
            } else {
                const up = keys.has(controls.jump);
                const down = keys.has(controls.down);
                if (up) queueSpecial(fighterId, "up");
                else if (down) queueSpecial(fighterId, "down");
                else queueNormalAttack(fighterId, true);
            }
        }
        if (key === controls.ranged) queueSpecial(fighterId, "neutral");
        if (key === controls.super) queueSuper(fighterId);
    }, [tryJump, queueNormalAttack, queueSpecial, queueSuper]);

    const tryDoubleTapDodge = useCallback((
        fighterId: FighterId,
        controls: typeof P1_CONTROLS,
        key: string
    ): -1 | 1 | null => {
        const now = performance.now();
        const taps = movementTapRef.current[fighterId];

        if (key === controls.left) {
            const isDoubleTap = now - taps.left <= DODGE_DOUBLE_TAP_MS;
            taps.left = now;
            if (isDoubleTap) {
                taps.left = 0;
                queueDodge(fighterId, -1);
                return -1;
            }
        }

        if (key === controls.right) {
            const isDoubleTap = now - taps.right <= DODGE_DOUBLE_TAP_MS;
            taps.right = now;
            if (isDoubleTap) {
                taps.right = 0;
                queueDodge(fighterId, 1);
                return 1;
            }
        }

        return null;
    }, [queueDodge]);

    const tryDoubleTapDrop = useCallback((
        fighterId: FighterId,
        controls: typeof P1_CONTROLS,
        key: string
    ): boolean => {
        if (key !== controls.down) return false;
        const now = performance.now();
        const taps = movementTapRef.current[fighterId];
        const isDoubleTap = now - taps.down <= DOWN_DROP_DOUBLE_TAP_MS;
        taps.down = now;
        if (!isDoubleTap) return false;
        taps.down = 0;
        queueDropThrough(fighterId);
        return true;
    }, [queueDropThrough]);

    // AI opponent logic
    const runAI = useCallback((now: number) => {
        const world = worldRef.current;
        if (!world || world.winner || world.superFreeze) return;
        const ai = world.p2; const player = world.p1;
        if (ai.hp <= 0) return;
        if (now - aiTimerRef.current < 200 + Math.random() * 200) return;
        aiTimerRef.current = now;
        const dist = Math.abs(ai.x - player.x);
        const stage = stageRef.current;
        if (now < ai.stateLockUntil) return;
        const incoming = world.projectiles.find(p => p.owner === "p1" && Math.abs(p.x - ai.x) < 200);
        if (incoming && ai.y >= stage.mainFloorY - 1) { tryJump("p2"); return; }
        if (ai.superMeter >= SUPER_METER_MAX && dist < 200) { queueSuper("p2"); return; }
        if (dist < 150) {
            const r = Math.random();
            if (r < 0.3) queueNormalAttack("p2");
            else if (r < 0.45) queueDashAttack("p2");
            else if (r < 0.6) queueBlock("p2");
            else if (r < 0.75) queueSpecial("p2", "up");
            else queueSpecial("p2", "neutral");
            return;
        }
        if (dist < 400) { if (Math.random() < 0.4) queueSpecial("p2", "neutral"); else { const d = player.x > ai.x ? P2_CONTROLS.right : P2_CONTROLS.left; pressedKeysRef.current.add(d); setTimeout(() => pressedKeysRef.current.delete(d), 200); } return; }
        const d = player.x > ai.x ? P2_CONTROLS.right : P2_CONTROLS.left; pressedKeysRef.current.add(d); setTimeout(() => pressedKeysRef.current.delete(d), 300);
    }, [tryJump, queueNormalAttack, queueSpecial, queueSuper, queueDashAttack, queueBlock]);

    // Gamepad polling
    const prevGpRef = useRef<Map<number, boolean[]>>(new Map());
    const pollGamepads = useCallback(() => {
        const gps = navigator.getGamepads?.() ?? [];
        for (let gi = 0; gi < gps.length; gi++) {
            const gp = gps[gi]; if (!gp) continue;
            const fid: FighterId = gi === 0 ? "p1" : "p2";
            if (fid === "p2" && vsAI) continue;
            const ctrl = fid === "p1" ? P1_CONTROLS : P2_CONTROLS;
            const prev = prevGpRef.current.get(gi) ?? []; const curr = gp.buttons.map(b => b.pressed);
            const jp = (i: number) => curr[i] && !prev[i];
            const lx = gp.axes[0] ?? 0; const ly = gp.axes[1] ?? 0;
            if (lx < -0.3 || gp.buttons[14]?.pressed) pressedKeysRef.current.add(ctrl.left); else pressedKeysRef.current.delete(ctrl.left);
            if (lx > 0.3 || gp.buttons[15]?.pressed) pressedKeysRef.current.add(ctrl.right); else pressedKeysRef.current.delete(ctrl.right);
            if (ly < -0.5 || gp.buttons[12]?.pressed) pressedKeysRef.current.add(ctrl.jump); else pressedKeysRef.current.delete(ctrl.jump);
            if (ly > 0.5 || gp.buttons[13]?.pressed) pressedKeysRef.current.add(ctrl.down); else pressedKeysRef.current.delete(ctrl.down);
            if (jp(3)) tryJump(fid);
            if (jp(0) || jp(2)) { const u = pressedKeysRef.current.has(ctrl.jump); const d = pressedKeysRef.current.has(ctrl.down); if (u) queueSpecial(fid, "up"); else if (d) queueSpecial(fid, "down"); else queueNormalAttack(fid); }
            if (jp(1)) queueSpecial(fid, "neutral");
            if (jp(5)) queueSuper(fid);
            if (jp(7)) queueDashAttack(fid);  // RT = dash attack
            if (jp(6)) queueBlock(fid);        // LT = block/parry
            prevGpRef.current.set(gi, curr);
        }
    }, [vsAI, tryJump, queueNormalAttack, queueSpecial, queueSuper, queueDashAttack, queueBlock]);

    // In PvP, determine which fighter this client controls
    const myFighter: FighterId = pvp.mySlot === "p2" ? "p2" : "p1";
    const isOnline = pvp.state === "fighting";

    // Handle remote PvP actions from opponent
    const remoteKeysRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isOnline) return;
        const opponentSlot: FighterId = myFighter === "p1" ? "p2" : "p1";

        pvp.onRemoteInput((data) => {
            // Store remote keys separately — do NOT mix with local pressedKeys
            remoteKeysRef.current = new Set(data.keys);
        });

        pvp.onRemoteAction((data) => {
            const a = data.action;
            if (a === "attack") queueNormalAttack(opponentSlot);
            else if (a === "attack2") queueNormalAttack(opponentSlot, true);
            else if (a === "dash") queueDashAttack(opponentSlot);
            else if (a === "dodge") {
                const rawDirection = Number(data.params?.direction);
                const direction: -1 | 1 = rawDirection < 0 ? -1 : 1;
                queueDodge(opponentSlot, direction);
            }
            else if (a === "block") queueBlock(opponentSlot);
            else if (a === "jump") tryJump(opponentSlot);
            else if (a === "super") queueSuper(opponentSlot);
            else if (a === "ranged") queueSpecial(opponentSlot, "neutral");
            else if (a === "up-special") queueSpecial(opponentSlot, "up");
            else if (a === "down-special") queueSpecial(opponentSlot, "down");
            else if (a === "air-forward") queueSpecial(opponentSlot, "airForward");
            else if (a === "air-down") queueSpecial(opponentSlot, "airDown");
            else if (a === "drop") queueDropThrough(opponentSlot);
            else if (a === "rescue") {
                const tx = Number(data.params?.tx);
                const ty = Number(data.params?.ty);
                if (Number.isFinite(tx) && Number.isFinite(ty)) queueRescueRoll(opponentSlot, tx, ty);
            }
        });
    }, [isOnline, myFighter, pvp, queueNormalAttack, queueDashAttack, queueDodge, queueBlock, tryJump, queueSuper, queueSpecial, queueDropThrough, queueRescueRoll]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase(); pressedKeysRef.current.add(key);
            if (key === "`") { debugBoxesRef.current = !debugBoxesRef.current; return; }
            if (e.repeat) return;

            if (isOnline) {
                // In PvP: always use P1 controls, mapped to our assigned slot
                const dodgeDirection = tryDoubleTapDodge(myFighter, P1_CONTROLS, key);
                const didDrop = tryDoubleTapDrop(myFighter, P1_CONTROLS, key);
                processInput(myFighter, P1_CONTROLS, key);
                // Send action to opponent
                if (key === P1_CONTROLS.attack1) {
                    const up = pressedKeysRef.current.has(P1_CONTROLS.jump);
                    const down = pressedKeysRef.current.has(P1_CONTROLS.down);
                    if (up) pvp.sendAction("up-special");
                    else if (down) pvp.sendAction("down-special");
                    else pvp.sendAction("attack");
                }
                if (key === P1_CONTROLS.attack2) {
                    const world = worldRef.current;
                    const actor = world ? (myFighter === "p1" ? world.p1 : world.p2) : null;
                    const stage = stageRef.current;
                    const airborne = actor ? isOnPlatform(actor, stage, performance.now() < actor.dropThroughUntil) === null : false;
                    if (airborne) {
                        const down = pressedKeysRef.current.has(P1_CONTROLS.down);
                        pvp.sendAction(down ? "air-down" : "air-forward");
                    } else {
                        const up = pressedKeysRef.current.has(P1_CONTROLS.jump);
                        const down = pressedKeysRef.current.has(P1_CONTROLS.down);
                        if (up) pvp.sendAction("up-special");
                        else if (down) pvp.sendAction("down-special");
                        else pvp.sendAction("attack2");
                    }
                }
                if (key === P1_CONTROLS.ranged) pvp.sendAction("ranged");
                if (key === P1_CONTROLS.super) pvp.sendAction("super");
                if (key === P1_CONTROLS.jump) pvp.sendAction("jump");
                if (dodgeDirection !== null) pvp.sendAction("dodge", { direction: dodgeDirection });
                if (didDrop) pvp.sendAction("drop");
                // Send movement keys
                pvp.sendInput([...pressedKeysRef.current].filter(k =>
                    k === P1_CONTROLS.left || k === P1_CONTROLS.right || k === P1_CONTROLS.jump || k === P1_CONTROLS.down
                ));
            } else {
                tryDoubleTapDodge("p1", P1_CONTROLS, key);
                tryDoubleTapDrop("p1", P1_CONTROLS, key);
                processInput("p1", P1_CONTROLS, key);
                if (!vsAI) {
                    tryDoubleTapDodge("p2", P2_CONTROLS, key);
                    tryDoubleTapDrop("p2", P2_CONTROLS, key);
                    processInput("p2", P2_CONTROLS, key);
                }
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            pressedKeysRef.current.delete(e.key.toLowerCase());
            if (isOnline) {
                pvp.sendInput([...pressedKeysRef.current].filter(k =>
                    k === P1_CONTROLS.left || k === P1_CONTROLS.right || k === P1_CONTROLS.jump || k === P1_CONTROLS.down
                ));
            }
        };

        // Mouse: LMB = dash attack, RMB = block/parry
        const onMouseMove = (e: MouseEvent) => {
            updateMouseRefsFromClient(e.clientX, e.clientY);
        };
        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 0) {
                updateMouseRefsFromClient(e.clientX, e.clientY);
                const controlledFighter = isOnline ? myFighter : "p1";
                const jumpKey = isOnline ? P1_CONTROLS.jump : (controlledFighter === "p1" ? P1_CONTROLS.jump : P2_CONTROLS.jump);
                const isJumpHeld = pressedKeysRef.current.has(jumpKey);
                if (isJumpHeld) {
                    const target = mouseWorldRef.current;
                    queueRescueRoll(controlledFighter, target.x, target.y);
                    if (isOnline) pvp.sendAction("rescue", { tx: target.x, ty: target.y });
                } else {
                    queueDashAttack(controlledFighter);
                    if (isOnline) pvp.sendAction("dash");
                }
            }
            if (e.button === 2) { queueBlock(isOnline ? myFighter : "p1"); if (isOnline) pvp.sendAction("block"); }
        };
        const onContextMenu = (e: MouseEvent) => e.preventDefault();

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("contextmenu", onContextMenu);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("contextmenu", onContextMenu);
            pressedKeysRef.current.clear();
        };
    }, [processInput, tryDoubleTapDodge, tryDoubleTapDrop, vsAI, queueDashAttack, queueDodge, queueBlock, queueRescueRoll, updateMouseRefsFromClient, isOnline, myFighter, pvp]);

    useEffect(() => {
        if (selectPhase !== "fight" || !p1Pick || !p2Pick) return;
        let disposed = false;

        stageRef.current = selectedStage;
        const stage = stageRef.current;
        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet, stage, p1Pick.renderScaleX, p1Pick.renderScaleY),
            p2: createInitialFighter("p2", p2Pick.moveSet, stage, p2Pick.renderScaleX, p2Pick.renderScaleY),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };
        cameraRef.current = { x: stage.mainFloorX, y: stage.mainFloorY - 400, zoom: 1 };

        const maybeLoad = (src?: string) => src ? loadImage(src).catch(() => null) : Promise.resolve(null);

        // Preload ObjectStore VFX in background
        preloadVfx();

        Promise.all([
            loadSpriteSet(p1Pick.sprites),
            loadSpriteSet(p2Pick.sprites),
            loadImage("/fighter2d/image/Hills.png"),
            loadImage("/fighter2d/image/castle.png"),
            maybeLoad(p1Pick.attackEffect.src),
            maybeLoad(p2Pick.attackEffect.src),
            maybeLoad(p1Pick.projectileSrc),
            maybeLoad(p2Pick.projectileSrc),
        ])
            .then(([p1, p2, background, castle, p1Effect, p2Effect, p1Proj, p2Proj]) => {
                if (disposed) return;
                assetsRef.current = {
                    p1, p2, background, castle,
                    p1Effect: p1Effect as HTMLImageElement | null,
                    p2Effect: p2Effect as HTMLImageElement | null,
                    p1Projectile: p1Proj as HTMLImageElement | null,
                    p2Projectile: p2Proj as HTMLImageElement | null,
                };
                activeEffectsRef.current = [];
                setIsReady(true);
            })
            .catch((err: unknown) => {
                if (disposed) return;
                setLoadError(err instanceof Error ? err.message : "Failed to load fighter assets");
            });

        return () => {
            disposed = true;
        };
    }, [selectPhase, p1Pick, p2Pick]);


    useEffect(() => {
        if (!isReady || !assetsRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let previousTime = performance.now();

        // ─── Helper: spawn a visual effect at a position ───────────
        const spawnEffect = (image: HTMLImageElement | null, frames: number, hold: number, x: number, y: number, flip: boolean) => {
            if (!image) return;
            activeEffectsRef.current.push({
                id: `fx-${performance.now()}-${Math.random()}`,
                x, y, image, frames, hold,
                frameIndex: 0, frameTick: 0, scale: 3, flip,
            });
        };

        const triggerScreenShake = (intensity: number, duration: number) => {
            screenShakeRef.current = { intensity, until: performance.now() + duration };
        };

        const triggerHitFlash = (target: FighterId, duration: number) => {
            hitFlashRef.current = { target, until: performance.now() + duration };
        };

        const drawFighter = (
            fighter: FighterRuntime,
            sprites: Record<AnimationState, RuntimeSprite>
        ) => {
            const currentSprite = sprites[fighter.state];
            const sourceX = fighter.frameIndex * currentSprite.frameWidth;
            // Scale to ~300px base, then apply per-character non-uniform multipliers
            const charDef = fighter.id === "p1" ? p1Pick : p2Pick;
            const renderMulX = charDef?.renderScaleX ?? 1;
            const renderMulY = charDef?.renderScaleY ?? 1;
            const baseScale = 300 / currentSprite.frameHeight;
            const scaleY = baseScale * renderMulY;
            const drawWidth = currentSprite.frameWidth * baseScale * renderMulX;
            const drawHeight = currentSprite.frameHeight * scaleY;

            // Hit flash — tint the fighter white briefly
            const now = performance.now();
            const flash = hitFlashRef.current;
            const isFlashing = flash && flash.target === fighter.id && now < flash.until;
            const isFallbackDodgeSpin = fighter.state === "dodge" && !charDef?.hasRollAnimation;
            const dodgeProgress = clamp((now - fighter.stateSince) / DODGE_LOCK_MS, 0, 1);
            const dodgeSpinDirection = fighter.vx >= 0 ? -1 : 1; // backward flip relative to travel
            const dodgeSpin = isFallbackDodgeSpin ? dodgeSpinDirection * dodgeProgress * Math.PI * 2 : 0;

            // fighter.y = foot position (on platform)
            // Draw sprite so bottom visible pixel aligns with fighter.y (ignores transparent strip padding)
            const drawX = fighter.x - drawWidth / 2;
            const drawY = fighter.y - drawHeight + currentSprite.bottomPadding * scaleY;

            ctx.save();
            if (fighter.facing < 0) {
                ctx.translate(fighter.x, 0);
                ctx.scale(-1, 1);
                ctx.translate(-fighter.x, 0);
            }

            if (isFallbackDodgeSpin) {
                const spinCenterY = drawY + drawHeight / 2;
                ctx.translate(fighter.x, spinCenterY);
                ctx.rotate(dodgeSpin);
                ctx.translate(-fighter.x, -spinCenterY);
            }

            // Invulnerability flicker (respawn protection)
            if (fighter.invulnUntil > now && Math.floor(now / 80) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }

            // Hurt flash: alternate visibility
            if (isFlashing && Math.floor(now / 40) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }

            ctx.drawImage(
                currentSprite.image,
                sourceX, 0,
                currentSprite.frameWidth, currentSprite.frameHeight,
                drawX, drawY,
                drawWidth, drawHeight
            );

            ctx.globalAlpha = 1;
            ctx.restore();

            // Counter shield aura
            if (fighter.counterUntil > now) {
                ctx.save();
                const pulse = 0.6 + 0.4 * Math.sin(now / 60);
                ctx.strokeStyle = `rgba(125, 245, 255, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = "cyan";
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(fighter.x, fighter.y - fighter.height * 0.5, fighter.width * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };

        // ─── Draw active sprite effects ─────────────────────────────
        const drawEffects = () => {
            const alive: ActiveEffect[] = [];
            for (const fx of activeEffectsRef.current) {
                const frameW = fx.image.width / fx.frames;
                const frameH = fx.image.height;
                const srcX = fx.frameIndex * frameW;
                const dW = frameW * fx.scale;
                const dH = frameH * fx.scale;

                ctx.save();
                if (fx.flip) {
                    ctx.translate(fx.x, 0);
                    ctx.scale(-1, 1);
                    ctx.translate(-fx.x, 0);
                }
                ctx.drawImage(fx.image, srcX, 0, frameW, frameH, fx.x - dW / 2, fx.y - dH / 2, dW, dH);
                ctx.restore();

                // Advance frame
                fx.frameTick++;
                if (fx.frameTick >= fx.hold) {
                    fx.frameTick = 0;
                    fx.frameIndex++;
                }
                if (fx.frameIndex < fx.frames) alive.push(fx);
            }
            activeEffectsRef.current = alive;
        };

        const draw = (world: WorldState) => {
            const assets = assetsRef.current;
            if (!assets) return;
            const now = performance.now();
            const stage = stageRef.current;
            const cam = cameraRef.current;

            // Screen shake offset
            let shakeX = 0, shakeY = 0;
            if (now < screenShakeRef.current.until) {
                const t = screenShakeRef.current.intensity;
                shakeX = (Math.random() - 0.5) * t * 2;
                shakeY = (Math.random() - 0.5) * t * 2;
            }

            ctx.save();
            ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);

            // Dark fantasy background (parallax)
            const bgGrad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
            bgGrad.addColorStop(0, stage.bgColor1);
            bgGrad.addColorStop(1, stage.bgColor2);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

            // Background features (drawn at half parallax speed)
            const parallaxX = -cam.x * 0.3;
            const parallaxY = -cam.y * 0.2;
            ctx.save();
            ctx.globalAlpha = 0.25;
            if (stage.bgFeatures === 'castle') {
                // Far castle silhouettes
                for (let i = 0; i < 5; i++) {
                    const cx = parallaxX + 200 + i * 350;
                    const ch = 80 + (i % 3) * 50;
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(cx, VIEWPORT_H - 200 + parallaxY - ch, 60, ch);
                    ctx.fillRect(cx - 10, VIEWPORT_H - 200 + parallaxY - ch - 20, 80, 20);
                    // Turret caps
                    ctx.fillRect(cx + 5, VIEWPORT_H - 200 + parallaxY - ch - 36, 14, 18);
                    ctx.fillRect(cx + 38, VIEWPORT_H - 200 + parallaxY - ch - 30, 14, 14);
                }
                // Distant mountain range
                ctx.fillStyle = '#0d140d';
                ctx.beginPath();
                ctx.moveTo(0, VIEWPORT_H - 160 + parallaxY * 0.5);
                for (let mx = 0; mx <= VIEWPORT_W + 100; mx += 80) {
                    ctx.lineTo(mx, VIEWPORT_H - 180 + parallaxY * 0.5 - Math.abs(Math.sin(mx * 0.005)) * 70);
                }
                ctx.lineTo(VIEWPORT_W + 100, VIEWPORT_H);
                ctx.lineTo(0, VIEWPORT_H);
                ctx.fill();
            } else if (stage.bgFeatures === 'ocean') {
                // Animated waves with depth layers
                for (let layer = 0; layer < 3; layer++) {
                    const alpha = 0.12 + layer * 0.06;
                    const speed = 12 + layer * 8;
                    const amp = 12 + layer * 6;
                    const yBase = VIEWPORT_H - 60 - layer * 30 + parallaxY;
                    ctx.fillStyle = `rgba(10, 32, 64, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(0, VIEWPORT_H);
                    for (let wx = 0; wx <= VIEWPORT_W; wx += 8) {
                        ctx.lineTo(wx, yBase + Math.sin((wx + now / speed) * 0.025 + layer) * amp);
                    }
                    ctx.lineTo(VIEWPORT_W, VIEWPORT_H);
                    ctx.fill();
                }
            } else if (stage.bgFeatures === 'lava') {
                // Pulsing lava glow + rising heat distortion
                const lavaAlpha = 0.15 + 0.1 * Math.sin(now / 300);
                const lavaGrad = ctx.createLinearGradient(0, VIEWPORT_H - 140, 0, VIEWPORT_H);
                lavaGrad.addColorStop(0, 'rgba(200, 50, 0, 0)');
                lavaGrad.addColorStop(0.4, `rgba(200, 50, 0, ${lavaAlpha * 0.5})`);
                lavaGrad.addColorStop(1, `rgba(255, 80, 0, ${lavaAlpha})`);
                ctx.fillStyle = lavaGrad;
                ctx.fillRect(0, VIEWPORT_H - 140, VIEWPORT_W, 140);
                // Embers
                for (let i = 0; i < 6; i++) {
                    const ex = (now * 0.02 * (1 + i * 0.3) + i * 217) % VIEWPORT_W;
                    const ey = VIEWPORT_H - 100 - ((now * 0.03 + i * 131) % 120);
                    ctx.fillStyle = `rgba(255, ${120 + i * 20}, 0, ${0.4 + 0.3 * Math.sin(now / 80 + i)})`;
                    ctx.fillRect(ex, ey, 2, 2);
                }
            } else if (stage.bgFeatures === 'forest') {
                // Layered tree silhouettes (far + near)
                for (let layer = 0; layer < 2; layer++) {
                    const tint = layer === 0 ? '#060d06' : '#0a1a0a';
                    const count = layer === 0 ? 12 : 8;
                    const baseY = layer === 0 ? VIEWPORT_H - 190 : VIEWPORT_H - 160;
                    const px = parallaxX * (0.15 + layer * 0.15);
                    ctx.fillStyle = tint;
                    for (let i = 0; i < count; i++) {
                        const tx = px + 50 + i * (VIEWPORT_W / count);
                        const th = 80 + (i % 3) * 50 + layer * 30;
                        // Trunk
                        ctx.fillRect(tx + 12, baseY + parallaxY, 10, 30);
                        // Canopy triangle
                        ctx.beginPath();
                        ctx.moveTo(tx, baseY + parallaxY);
                        ctx.lineTo(tx + 17, baseY + parallaxY - th);
                        ctx.lineTo(tx + 34, baseY + parallaxY);
                        ctx.fill();
                    }
                }
            }
            ctx.restore();

            // Camera transform
            ctx.save();
            ctx.translate(shakeX, shakeY);
            ctx.scale(cam.zoom, cam.zoom);
            ctx.translate(-cam.x, -cam.y);

            // Draw main floor — thick solid platform
            const floorH = 50;
            ctx.fillStyle = stage.floorColor;
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY, stage.mainFloorW, floorH);
            // Top edge highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY, stage.mainFloorW, 4);
            // Bottom darker edge
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY + floorH - 6, stage.mainFloorW, 6);
            // Left/right edges
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY, 4, floorH);
            ctx.fillRect(stage.mainFloorX + stage.mainFloorW - 4, stage.mainFloorY, 4, floorH);

            // Draw platforms — thick with visible edges
            for (const p of stage.platforms) {
                const platH = 24;
                ctx.fillStyle = stage.platformColor;
                ctx.fillRect(p.x, p.y, p.w, platH);
                // Top edge bright highlight
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fillRect(p.x, p.y, p.w, 3);
                // Bottom shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(p.x, p.y + platH - 4, p.w, 4);
                // Rounded corner illusion
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(p.x + 2, p.y + 3, p.w - 4, platH - 7);
            }

            // Fighters
            drawFighter(world.p1, assets.p1);
            drawFighter(world.p2, assets.p2);

            // Debug collision overlay (toggle with ` key)
            if (debugBoxesRef.current) {
                const drawEllipse = (e: BodyEllipse, color: string, label?: string) => {
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    // Light fill
                    ctx.globalAlpha = 0.08;
                    ctx.fillStyle = color;
                    ctx.fill();
                    if (label) {
                        ctx.globalAlpha = 0.6;
                        ctx.fillStyle = color;
                        ctx.font = 'bold 10px monospace';
                        ctx.fillText(label, e.cx - e.rx + 2, e.cy - e.ry + 12);
                    }
                    ctx.restore();
                };
                const drawBox = (box: { x: number; y: number; w: number; h: number }, color: string, label?: string) => {
                    ctx.save();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.4;
                    ctx.setLineDash([4, 3]);
                    ctx.strokeRect(box.x, box.y, box.w, box.h);
                    if (label) {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.4;
                        ctx.font = '9px monospace';
                        ctx.fillText(label, box.x + 2, box.y + 9);
                    }
                    ctx.restore();
                };
                for (const f of [world.p1, world.p2]) {
                    // Body ellipse (main collision shape)
                    drawEllipse(bodyEllipse(f), '#facc15', 'body');
                    // Damage sub-zones (dashed)
                    drawBox(headBox(f), '#ef4444', 'head');
                    drawBox(bodyBox(f), '#22c55e', 'torso');
                    drawBox(legsBox(f), '#3b82f6', 'legs');
                    // Foot anchor
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                // Weapon hitbox — only visible during attack frames
                for (const f of [world.p1, world.p2]) {
                    const isAttacking = f.state === 'attack' || f.state === 'attack2' || f.state === 'special';
                    if (!isAttacking) continue;
                    const charDef = f.id === 'p1' ? p1Pick : p2Pick;
                    const variantReachMul = f.moveVariant === 'dash' ? 1.3 : f.moveVariant === 'upSpecial' ? 1.15 : 1;
                    const atkReach = (charDef?.renderScaleX ?? 1) * 80 * variantReachMul;
                    const weaponBox = {
                        x: f.x + f.facing * 30 - (f.facing > 0 ? 0 : atkReach),
                        y: f.y - f.height * 0.78,
                        w: atkReach,
                        h: f.height * 0.5,
                    };
                    ctx.save();
                    ctx.strokeStyle = '#f472b6';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.7;
                    ctx.strokeRect(weaponBox.x, weaponBox.y, weaponBox.w, weaponBox.h);
                    ctx.fillStyle = '#f472b6';
                    ctx.globalAlpha = 0.12;
                    ctx.fillRect(weaponBox.x, weaponBox.y, weaponBox.w, weaponBox.h);
                    ctx.globalAlpha = 0.7;
                    ctx.font = 'bold 10px monospace';
                    ctx.fillText('WEAPON', weaponBox.x + 2, weaponBox.y + 11);
                    ctx.restore();
                }
            }

            // Projectiles — use sprite images if available
            for (const projectile of world.projectiles) {
                const projImg = projectile.owner === "p1" ? assets.p1Projectile : assets.p2Projectile;
                const projPick = projectile.owner === "p1" ? p1Pick : p2Pick;
                const projFrames = projPick?.projectileFrames || 1;

                if (projImg && projImg.complete) {
                    const frameW = projImg.width / projFrames;
                    const frameH = projImg.height;
                    // Animate projectile frames based on time
                    const frameIdx = projFrames > 1 ? Math.floor((now / 60) % projFrames) : 0;
                    const size = 60;
                    ctx.save();
                    if (projectile.vx < 0) {
                        ctx.translate(projectile.x, 0);
                        ctx.scale(-1, 1);
                        ctx.translate(-projectile.x, 0);
                    }
                    ctx.drawImage(projImg, frameIdx * frameW, 0, frameW, frameH, projectile.x - size / 2, projectile.y - size / 2, size, size);
                    ctx.restore();

                    // Glow trail behind projectile
                    ctx.save();
                    ctx.globalAlpha = 0.35;
                    const trailGrad = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, 28);
                    trailGrad.addColorStop(0, projectile.owner === "p1" ? "#ffd56a" : "#8de7ff");
                    trailGrad.addColorStop(1, "transparent");
                    ctx.fillStyle = trailGrad;
                    ctx.fillRect(projectile.x - 30, projectile.y - 30, 60, 60);
                    ctx.restore();
                } else {
                    // Fallback: gradient orb
                    const grad = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, projectile.radius);
                    grad.addColorStop(0, projectile.owner === "p1" ? "#ffd56a" : "#8de7ff");
                    grad.addColorStop(1, "rgba(255,255,255,0.1)");
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Sprite-based attack/hit effects
            drawEffects();

            // Hit flash full-screen tint
            const flash = hitFlashRef.current;
            if (flash && now < flash.until) {
                ctx.save();
                ctx.globalAlpha = 0.12;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
                ctx.restore();
            }

            // End camera transform
            ctx.restore();

            // HUD (drawn in screen space, not world space)
            // Stock pips
            const drawStocks = (x: number, stocks: number, color: string) => {
                for (let i = 0; i < STARTING_STOCKS; i++) {
                    ctx.beginPath();
                    ctx.arc(x + i * 22, VIEWPORT_H - 30, 7, 0, Math.PI * 2);
                    ctx.fillStyle = i < stocks ? color : 'rgba(255,255,255,0.15)';
                    ctx.fill();
                    if (i < stocks) {
                        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '9px monospace';
                ctx.fillText('STOCKS', x, VIEWPORT_H - 12);
            };
            drawStocks(40, world.p1.stocks, '#4ade80');
            drawStocks(VIEWPORT_W - 160, world.p2.stocks, '#60a5fa');

            // Jump pips (air jumps remaining)
            const drawJumpPips = (x: number, airJumps: number) => {
                for (let i = 0; i < MAX_AIR_JUMPS; i++) {
                    ctx.beginPath();
                    ctx.arc(x + i * 16, VIEWPORT_H - 50, 5, 0, Math.PI * 2);
                    ctx.fillStyle = i < airJumps ? '#fbbf24' : 'rgba(255,255,255,0.1)';
                    ctx.fill();
                }
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '8px monospace';
                ctx.fillText('JUMPS', x, VIEWPORT_H - 40);
            };
            drawJumpPips(40, world.p1.airJumpsLeft);
            drawJumpPips(VIEWPORT_W - 160, world.p2.airJumpsLeft);

            // Super meter bars
            const drawMeter = (x: number, meter: number, color: string) => {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(x, VIEWPORT_H - 80, 200, 12);
                ctx.fillStyle = meter >= SUPER_METER_MAX ? "#ffd700" : color;
                ctx.fillRect(x + 1, VIEWPORT_H - 79, (meter / SUPER_METER_MAX) * 198, 10);
                if (meter >= SUPER_METER_MAX) {
                    ctx.save();
                    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(now / 100);
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(x + 1, VIEWPORT_H - 79, 198, 10);
                    ctx.restore();
                    ctx.fillStyle = "#ffd700"; ctx.font = "bold 11px monospace";
                    ctx.fillText("R  SUPER", x + 60, VIEWPORT_H - 72);
                }
            };
            drawMeter(40, world.p1.superMeter, "#4ade80");
            drawMeter(VIEWPORT_W - 240, world.p2.superMeter, "#60a5fa");

            // Stamina pips
            const drawStamina = (x: number, stamina: number) => {
                for (let i = 0; i < STAMINA_MAX; i++) {
                    const px = x + i * 28;
                    ctx.fillStyle = i < stamina ? "#38bdf8" : "rgba(255,255,255,0.1)";
                    ctx.fillRect(px, VIEWPORT_H - 64, 24, 8);
                    if (i < stamina) {
                        ctx.fillStyle = "rgba(255,255,255,0.3)";
                        ctx.fillRect(px, VIEWPORT_H - 64, 24, 3);
                    }
                }
            };
            drawStamina(40, world.p1.stamina);
            drawStamina(VIEWPORT_W - 240, world.p2.stamina);

            // Super freeze cutscene overlay
            if (world.superFreeze && now < world.superFreeze.until) {
                const progress = (now - (world.superFreeze.until - SUPER_FREEZE_DURATION)) / SUPER_FREEZE_DURATION;
                ctx.save();
                // Darken + zoom lines
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
                // Radial burst lines
                ctx.globalAlpha = 0.3 + 0.3 * Math.sin(now / 30);
                ctx.strokeStyle = "#ffd700";
                ctx.lineWidth = 2;
                for (let i = 0; i < 24; i++) {
                    const angle = (i / 24) * Math.PI * 2 + now / 200;
                    ctx.beginPath();
                    ctx.moveTo(VIEWPORT_W / 2 + Math.cos(angle) * 40, VIEWPORT_H / 2 + Math.sin(angle) * 40);
                    ctx.lineTo(VIEWPORT_W / 2 + Math.cos(angle) * (200 + progress * 400), VIEWPORT_H / 2 + Math.sin(angle) * (200 + progress * 400));
                    ctx.stroke();
                }
                // Super name text
                ctx.globalAlpha = Math.min(1, progress * 3);
                ctx.fillStyle = "#ffd700";
                ctx.font = "bold 48px serif";
                ctx.textAlign = "center";
                const name = (world.superFreeze.attacker === "p1" ? p1Pick : p2Pick)?.moveSet.superName ?? "SUPER";
                ctx.fillText(name, VIEWPORT_W / 2, VIEWPORT_H / 2 - 30);
                ctx.font = "24px serif";
                ctx.fillStyle = "#fff";
                ctx.fillText((world.superFreeze.attacker === "p1" ? p1Pick : p2Pick)?.name ?? "", VIEWPORT_W / 2, VIEWPORT_H / 2 + 20);
                ctx.textAlign = "left";
                ctx.restore();
            }

            ctx.restore(); // end screen shake
        };

        const tickFighterAnimation = (
            fighter: FighterRuntime,
            sprites: Record<AnimationState, RuntimeSprite>,
            now: number
        ): FighterRuntime => {
            const sprite = sprites[fighter.state];
            let nextFrameTick = fighter.frameTick + 1;
            let nextFrame = fighter.frameIndex;

            if (nextFrameTick >= sprite.def.hold) {
                nextFrameTick = 0;
                nextFrame += 1;

                if (nextFrame >= sprite.def.frames) {
                    nextFrame = sprite.def.loop ? 0 : sprite.def.frames - 1;
                }
            }

            return {
                ...fighter,
                frameTick: nextFrameTick,
                frameIndex: nextFrame,
            };
        };

        const updateMovement = (
            fighter: FighterRuntime,
            opponent: FighterRuntime,
            controls: typeof P1_CONTROLS | typeof P2_CONTROLS,
            now: number,
            keySource?: Set<string>
        ): FighterRuntime => {
            const isLocked = now < fighter.stateLockUntil;
            const stage = stageRef.current;
            const ignoreOneWayPlatforms = now < fighter.dropThroughUntil;
            const keys = keySource ?? pressedKeysRef.current;
            const leftPressed = keys.has(controls.left);
            const rightPressed = keys.has(controls.right);
            const currentlyGrounded = isOnPlatform(fighter, stage, ignoreOneWayPlatforms) !== null;

            let vx = fighter.vx;
            if (!isLocked && fighter.hp > 0) {
                const direction = leftPressed === rightPressed ? 0 : (leftPressed ? -1 : 1);
                if (direction !== 0) {
                    const targetSpeed = fighter.moveSet.runSpeed * SPEED_SCALE * (currentlyGrounded ? GROUND_SPEED_MULT : AIR_SPEED_MULT);
                    const accel = currentlyGrounded ? GROUND_ACCEL : AIR_ACCEL;
                    vx = approach(vx, direction * targetSpeed, accel);
                } else {
                    vx *= currentlyGrounded ? GROUND_FRICTION : AIR_FRICTION;
                }
            } else {
                vx *= currentlyGrounded ? 0.9 : AIR_FRICTION;
            }

            let x = fighter.x + vx;
            let y = fighter.y + fighter.vy;
            // Characters fall 20% slower than raw gravity
            // AIR SLAM: attacking while falling accelerates downward
            const isAirAttacking = (fighter.state === "attack" || fighter.state === "attack2" || fighter.state === "special") && fighter.vy > 0;
            const gravScale = isAirAttacking ? 2.5 : FALL_GRAVITY_SCALE;
            let vy = fighter.vy + GRAVITY * gravScale;

            // Platform collision
            const floorY = isOnPlatform({ ...fighter, x, y, vy }, stage, ignoreOneWayPlatforms);
            if (floorY !== null && vy >= 0) {
                y = floorY;
                vy = 0;
            }

            // NO clamping to arena edges — fighters can fall off!
            // Body collision push — elliptical body collider
            const selfEllipse = bodyEllipse({ ...fighter, x, y } as FighterRuntime);
            const opponentEllipse = bodyEllipse(opponent);
            const pushAmount = ellipsePushX(selfEllipse, opponentEllipse);
            if (pushAmount > 0) {
                const pushDir = x === opponent.x ? (fighter.id === "p1" ? -1 : 1) : Math.sign(x - opponent.x);
                x += pushDir * (pushAmount * 0.5 + 0.01);
            }

            const facing = opponent.x >= x ? 1 : -1;
            const grounded = floorY !== null;
            let next = {
                ...fighter,
                x,
                y,
                vx,
                vy,
                facing,
                dropThroughUntil: floorY !== null ? 0 : fighter.dropThroughUntil,
            };

            if (next.hp <= 0) {
                return setState(next, "death", now);
            }

            if (now >= next.stateLockUntil) {
                if (!grounded && next.vy !== 0) {
                    next = { ...setState(next, next.vy < 0 ? "jump" : "fall", now), moveVariant: "none", attackHasConnected: false };
                } else if (Math.abs(next.vx) > 1.4) {
                    next = { ...setState(next, "run", now), moveVariant: "none", attackHasConnected: false };
                } else {
                    next = { ...setState(next, "idle", now), moveVariant: "none", attackHasConnected: false };
                }
            }

            return next;
        };

        const processMeleeHit = (attacker: FighterRuntime, defender: FighterRuntime, now: number) => {
            const canMelee =
                attacker.state === "attack" ||
                attacker.state === "attack2" ||
                (attacker.state === "special" && (attacker.moveVariant === "upSpecial" || attacker.moveVariant === "downSpecial"));
            if (!canMelee) return { attacker, defender };
            if (attacker.attackHasConnected) return { attacker, defender };
            const hitFrame =
                attacker.moveVariant === "dash" ? Math.max(1, attacker.attackHitFrame - 2) :
                    attacker.moveVariant === "altNormal" ? Math.max(1, attacker.attackHitFrame - 1) :
                        attacker.attackHitFrame;
            if (attacker.frameIndex < hitFrame) return { attacker, defender };

            // Attack hitbox scales with character render size
            const charDef = attacker.id === "p1" ? p1Pick : p2Pick;
            const variantReachMul = attacker.moveVariant === "dash" ? 1.3 : attacker.moveVariant === "upSpecial" ? 1.15 : 1;
            const atkReach = (charDef?.renderScaleX ?? 1) * 80 * variantReachMul;
            const hitBox = {
                x: attacker.x + attacker.facing * 30 - (attacker.facing > 0 ? 0 : atkReach),
                y: attacker.y - attacker.height * 0.78,
                w: atkReach,
                h: attacker.height * 0.5,
            };

            // Does the weapon hitbox reach the defender's body ellipse?
            const defBody = bodyEllipse(defender);
            if (!rectIntersectsEllipse(hitBox, defBody)) {
                return { attacker: { ...attacker, attackHasConnected: true }, defender };
            }

            // Determine which damage zone was hit (for multiplier)
            const headHit = intersectRect(hitBox, headBox(defender));
            const legsHit = !headHit && intersectRect(hitBox, legsBox(defender));

            // Dodge i-frames
            if (defender.invulnUntil > now) {
                return { attacker: { ...attacker, attackHasConnected: true }, defender };
            }

            // Head hits deal 1.3x damage
            const damageMultiplier = headHit ? 1.3 : legsHit ? 0.8 : 1.0;
            const baseDamage =
                attacker.moveVariant === "dash" ? Math.round(attacker.moveSet.baseDamage * 1.2) :
                    attacker.moveVariant === "upSpecial" ? attacker.moveSet.upSpecialDamage :
                        attacker.moveVariant === "downSpecial" ? Math.round(attacker.moveSet.counterDamage * 0.9) :
                            attacker.moveSet.baseDamage;
            const result = applyDamage(defender, attacker, Math.round(baseDamage * damageMultiplier), now);

            // Spawn attack effect sprite at the hit point
            const fxAssets = assetsRef.current;
            const effectImg = fxAssets ? (attacker.id === "p1" ? fxAssets.p1Effect : fxAssets.p2Effect) : null;
            const effectDef = attacker.id === "p1" ? p1Pick?.attackEffect : p2Pick?.attackEffect;
            if (effectImg && effectDef) {
                spawnEffect(effectImg, effectDef.frames, effectDef.hold,
                    defender.x, defender.y - defender.height * 0.5, attacker.facing < 0);
            }

            // Move-specific VFX
            const fighterKey = attacker.id === "p1" ? (p1Pick?.id ?? "p1") : (p2Pick?.id ?? "p2");
            const move = attacker.moveVariant === "none" ? "normal" : attacker.moveVariant;
            const smearVfx = getVfxById(pickMoveVfxId(move, fighterKey, SWING_VFX_BY_MOVE));
            const hitVfx = getVfxById(pickMoveVfxId(move, fighterKey, HIT_VFX_BY_MOVE));
            if (smearVfx) {
                const smearImg = getVfxImage(smearVfx.id);
                if (smearImg) spawnEffect(smearImg, smearVfx.frames, 2, attacker.x + attacker.facing * 40, attacker.y - attacker.height * 0.5, attacker.facing < 0);
            }
            if (hitVfx) {
                const hitImg = getVfxImage(hitVfx.id);
                if (hitImg) spawnEffect(hitImg, hitVfx.frames, 2, defender.x, defender.y - defender.height * 0.5, false);
            }

            // Screen shake and hit flash — stronger on headshots
            const baseShake = attacker.moveVariant === "dash" ? 11 : attacker.moveVariant === "upSpecial" ? 12 : 8;
            triggerScreenShake(headHit ? baseShake + 3 : result.wasCounter ? 12 : baseShake, result.wasCounter ? 220 : 140);
            triggerHitFlash(defender.id as FighterId, 100);

            return {
                attacker: { ...result.attacker, attackHasConnected: true },
                defender: result.target,
            };
        };

        const processRescueRollHit = (attacker: FighterRuntime, defender: FighterRuntime, now: number) => {
            if (attacker.moveVariant !== "rescue" || attacker.state !== "dodge") return { attacker, defender };
            if (attacker.attackHasConnected) return { attacker, defender };
            const hitBox = {
                x: attacker.x - attacker.width * 0.45,
                y: attacker.y - attacker.height * 0.78,
                w: attacker.width * 0.9,
                h: attacker.height * 0.65,
            };
            if (!rectIntersectsEllipse(hitBox, bodyEllipse(defender))) return { attacker, defender };
            if (defender.invulnUntil > now) return { attacker: { ...attacker, attackHasConnected: true }, defender };

            const result = applyDamage(defender, attacker, Math.round(attacker.moveSet.baseDamage * 1.1), now);
            const fighterKey = attacker.id === "p1" ? (p1Pick?.id ?? "p1") : (p2Pick?.id ?? "p2");
            const swingVfx = getVfxById(pickMoveVfxId("rescue", fighterKey, SWING_VFX_BY_MOVE));
            const hitVfx = getVfxById(pickMoveVfxId("rescue", fighterKey, HIT_VFX_BY_MOVE));
            if (swingVfx) {
                const img = getVfxImage(swingVfx.id);
                if (img) spawnEffect(img, swingVfx.frames, 2, attacker.x, attacker.y - attacker.height * 0.5, attacker.facing < 0);
            }
            if (hitVfx) {
                const img = getVfxImage(hitVfx.id);
                if (img) spawnEffect(img, hitVfx.frames, 2, defender.x, defender.y - defender.height * 0.5, false);
            }
            triggerScreenShake(13, 180);
            triggerHitFlash(defender.id as FighterId, 120);
            return {
                attacker: { ...result.attacker, attackHasConnected: true },
                defender: result.target,
            };
        };

        const updateWorld = (now: number) => {
            const assets = assetsRef.current;
            if (!assets) return;

            let world = worldRef.current;
            const stage = stageRef.current;

            // Process super freeze
            if (world.superFreeze) {
                if (now >= world.superFreeze.damageAt && !world.superFreeze.dealt) {
                    world.superFreeze.dealt = true;
                    const atkId = world.superFreeze.attacker;
                    const atk = atkId === "p1" ? world.p1 : world.p2;
                    const def = atkId === "p1" ? world.p2 : world.p1;
                    const result = applyDamage(def, atk, atk.moveSet.superDamage, now);
                    if (atkId === "p1") { world.p1 = result.attacker; world.p2 = result.target; }
                    else { world.p2 = result.attacker; world.p1 = result.target; }
                    const fxA = assetsRef.current;
                    const fxImg = fxA ? (atkId === "p1" ? fxA.p1Effect : fxA.p2Effect) : null;
                    const fxDef = atkId === "p1" ? p1Pick?.attackEffect : p2Pick?.attackEffect;
                    if (fxImg && fxDef) spawnEffect(fxImg, fxDef.frames, fxDef.hold, def.x, def.y - def.height * 0.5, atk.facing < 0);
                    triggerScreenShake(18, 400);
                    triggerHitFlash(def.id as FighterId, 200);
                }
                if (now >= world.superFreeze.until) {
                    world.superFreeze = null;
                }
                worldRef.current = world;
                draw(world);
                return;
            }

            // Stamina regen: +1 every 3 seconds
            const regenFighter = (f: FighterRuntime): FighterRuntime => {
                if (f.stamina >= STAMINA_MAX) return { ...f, lastStaminaRegen: now };
                if (now - f.lastStaminaRegen >= STAMINA_REGEN_MS) {
                    return { ...f, stamina: Math.min(STAMINA_MAX, f.stamina + 1), lastStaminaRegen: now };
                }
                return f;
            };
            world = { ...world, p1: regenFighter(world.p1), p2: regenFighter(world.p2) };

            // In online PvP:
            // - Local player's keys are in pressedKeysRef (P1_CONTROLS)
            // - Remote player's keys are in remoteKeysRef (also P1_CONTROLS since both clients use WASD)
            // - Each fighter reads from the correct key source
            let nextP1: FighterRuntime;
            let nextP2: FighterRuntime;
            if (isOnline) {
                const localKeys = pressedKeysRef.current;
                const remoteKeys = remoteKeysRef.current;
                nextP1 = myFighter === "p1"
                    ? updateMovement(world.p1, world.p2, P1_CONTROLS, now, localKeys)
                    : updateMovement(world.p1, world.p2, P1_CONTROLS, now, remoteKeys);
                nextP2 = myFighter === "p2"
                    ? updateMovement(world.p2, world.p1, P1_CONTROLS, now, localKeys)
                    : updateMovement(world.p2, world.p1, P1_CONTROLS, now, remoteKeys);
            } else {
                nextP1 = updateMovement(world.p1, world.p2, P1_CONTROLS, now);
                nextP2 = updateMovement(world.p2, world.p1, P2_CONTROLS, now);
            }

            // Symmetric push: resolve body overlap evenly for both fighters
            const separated = resolveFighterSeparation(nextP1, nextP2);
            nextP1 = separated.a;
            nextP2 = separated.b;

            nextP1 = tickFighterAnimation(nextP1, assets.p1, now);
            nextP2 = tickFighterAnimation(nextP2, assets.p2, now);

            const p1Melee = processMeleeHit(nextP1, nextP2, now);
            nextP1 = p1Melee.attacker;
            nextP2 = p1Melee.defender;

            const p2Melee = processMeleeHit(nextP2, nextP1, now);
            nextP2 = p2Melee.attacker;
            nextP1 = p2Melee.defender;

            const p1Rescue = processRescueRollHit(nextP1, nextP2, now);
            nextP1 = p1Rescue.attacker;
            nextP2 = p1Rescue.defender;

            const p2Rescue = processRescueRollHit(nextP2, nextP1, now);
            nextP2 = p2Rescue.attacker;
            nextP1 = p2Rescue.defender;

            const nextProjectiles: Projectile[] = [];
            for (const projectile of world.projectiles) {
                if (now > projectile.expiresAt) continue;
                let updated = {
                    ...projectile,
                    x: projectile.x + projectile.vx,
                    y: projectile.y + projectile.vy,
                    vy: projectile.hasGravity ? projectile.vy + PROJECTILE_GRAVITY : projectile.vy,
                };
                if (updated.x < -100 || updated.x > ARENA_WIDTH + 100 || updated.y > 1400) continue;

                if (updated.isBouncingBomb && updated.vy > 0) {
                    const floorY = getProjectileFloorY(updated, stage);
                    if (floorY !== null && updated.y >= floorY) {
                        if (updated.bouncesRemaining > 0) {
                            updated = {
                                ...updated,
                                y: floorY - 2,
                                vy: -Math.max(4, Math.abs(updated.vy) * 0.62),
                                vx: updated.vx * 0.9,
                                bouncesRemaining: updated.bouncesRemaining - 1,
                            };
                            const bounceVfx = getVfxById("waterSplash") ?? getVfxById("dustCloud");
                            if (bounceVfx) {
                                const bounceImg = getVfxImage(bounceVfx.id);
                                if (bounceImg) spawnEffect(bounceImg, bounceVfx.frames, 2, updated.x, floorY, false);
                            }
                            triggerScreenShake(5, 80);
                        } else {
                            // Final bounce: splash damage to nearby fighters
                            const SPLASH_RADIUS = 120;
                            const splashDmg = Math.round(updated.damage * 0.75);
                            const targets = updated.owner === "p1" ? [{ ref: "p2" as const, f: nextP2 }] : [{ ref: "p1" as const, f: nextP1 }];
                            for (const t of targets) {
                                const dx = t.f.x - updated.x;
                                const dy = (t.f.y - t.f.height * 0.5) - floorY;
                                if (Math.hypot(dx, dy) < SPLASH_RADIUS && t.f.invulnUntil <= now) {
                                    const result = applyDamage(
                                        t.ref === "p1" ? nextP1 : nextP2,
                                        t.ref === "p1" ? nextP2 : nextP1,
                                        splashDmg, now
                                    );
                                    if (t.ref === "p1") { nextP1 = result.target; nextP2 = result.attacker; }
                                    else { nextP2 = result.target; nextP1 = result.attacker; }
                                    triggerHitFlash(t.ref, 100);
                                }
                            }
                            const endVfx = getVfxById(updated.hitVfxId) ?? getVfxById("explosionSmall");
                            if (endVfx) {
                                const endImg = getVfxImage(endVfx.id);
                                if (endImg) spawnEffect(endImg, endVfx.frames, 2, updated.x, floorY - 8, false);
                            }
                            triggerScreenShake(12, 160);
                            continue;
                        }
                    }
                }

                const target = updated.owner === "p1" ? nextP2 : nextP1;
                const targetBody = bodyEllipse(target);
                const hit = circleIntersectsEllipse(
                    { x: updated.x, y: updated.y, r: updated.radius },
                    targetBody
                );

                if (hit) {
                    // Perfect parry check: if target is in counter stance and timing is right
                    const isParrying = target.counterUntil > now;
                    if (isParrying) {
                        // Deflect projectile back! Recoil the shooter.
                        const shooter = updated.owner === "p1" ? nextP1 : nextP2;
                        const parryKb = calcKnockback(PARRY_RECOIL_DAMAGE, shooter.hp, shooter.maxHp);
                        const knockedShooter = setState({
                            ...shooter,
                            hp: Math.max(0, shooter.hp - PARRY_RECOIL_DAMAGE),
                            vx: -updated.vx * 0.5,
                            vy: parryKb.kbY * 0.5,
                            stateLockUntil: now + parryKb.hitstun,
                            attackHasConnected: false,
                            moveVariant: "none",
                        }, shooter.hp <= PARRY_RECOIL_DAMAGE ? "death" : "takeHit", now);
                        if (updated.owner === "p1") nextP1 = knockedShooter;
                        else nextP2 = knockedShooter;
                        triggerScreenShake(14, 250);
                        triggerHitFlash(shooter.id as FighterId, 120);
                        continue; // projectile destroyed
                    }

                    // Dodge i-frames: projectile passes through without collision effects
                    if (target.invulnUntil > now) {
                        nextProjectiles.push(updated);
                        continue;
                    }

                    const hitTarget = updated.owner === "p1" ? nextP2 : nextP1;
                    if (updated.owner === "p1") {
                        const result = applyDamage(nextP2, nextP1, updated.damage, now);
                        nextP2 = result.target;
                        nextP1 = result.attacker;
                    } else {
                        const result = applyDamage(nextP1, nextP2, updated.damage, now);
                        nextP1 = result.target;
                        nextP2 = result.attacker;
                    }

                    // Projectile hit effects
                    const ownerEffect = updated.owner === "p1" ? assets.p1Effect : assets.p2Effect;
                    const ownerDef = updated.owner === "p1" ? p1Pick?.attackEffect : p2Pick?.attackEffect;
                    if (ownerEffect && ownerDef) {
                        spawnEffect(ownerEffect, ownerDef.frames, ownerDef.hold,
                            hitTarget.x, hitTarget.y - hitTarget.height * 0.5, updated.vx < 0);
                    }
                    const projHitVfx = getVfxById(updated.hitVfxId);
                    if (projHitVfx) {
                        const projHitImg = getVfxImage(projHitVfx.id);
                        if (projHitImg) spawnEffect(projHitImg, projHitVfx.frames, 2, hitTarget.x, hitTarget.y - hitTarget.height * 0.5, false);
                    }
                    triggerScreenShake(8, 150);
                    triggerHitFlash(hitTarget.id as FighterId, 80);

                    continue;
                }

                nextProjectiles.push(updated);
            }

            if (nextP1.moveVariant === "upSpecial" && now < nextP1.stateLockUntil) {
                const strikeBox = {
                    x: nextP1.x + nextP1.facing * 26 - (nextP1.facing > 0 ? 0 : 72),
                    y: nextP1.y - nextP1.height * 0.7,
                    w: 72,
                    h: 92,
                };
                if (rectIntersectsEllipse(strikeBox, bodyEllipse(nextP2))) {
                    const result = applyDamage(nextP2, nextP1, nextP1.moveSet.upSpecialDamage, now);
                    nextP2 = result.target;
                    nextP1 = result.attacker;
                }
            }

            if (nextP2.moveVariant === "upSpecial" && now < nextP2.stateLockUntil) {
                const strikeBox = {
                    x: nextP2.x + nextP2.facing * 26 - (nextP2.facing > 0 ? 0 : 72),
                    y: nextP2.y - nextP2.height * 0.7,
                    w: 72,
                    h: 92,
                };
                if (rectIntersectsEllipse(strikeBox, bodyEllipse(nextP1))) {
                    const result = applyDamage(nextP1, nextP2, nextP2.moveSet.upSpecialDamage, now);
                    nextP1 = result.target;
                    nextP2 = result.attacker;
                }
            }

            // Stock system: blast zone death + HP death
            const bz = stage.blastZone;
            const checkStockLoss = (f: FighterRuntime): FighterRuntime => {
                const oob = f.x < bz.left || f.x > bz.right || f.y < bz.top || f.y > bz.bottom;
                const hpDead = f.hp <= 0;
                if (oob || hpDead) {
                    const newStocks = f.stocks - 1;
                    if (newStocks <= 0) {
                        return { ...f, stocks: 0, hp: 0, state: "death" as AnimationState, stateSince: now };
                    }
                    return { ...respawnFighter(f, stage), stocks: newStocks };
                }
                return f;
            };
            nextP1 = checkStockLoss(nextP1);
            nextP2 = checkStockLoss(nextP2);

            // Reset air jumps on landing
            const landingFloorP1 = isOnPlatform(nextP1, stage, now < nextP1.dropThroughUntil);
            const landingFloorP2 = isOnPlatform(nextP2, stage, now < nextP2.dropThroughUntil);
            if (landingFloorP1 !== null) nextP1 = { ...nextP1, airJumpsLeft: MAX_AIR_JUMPS };
            if (landingFloorP2 !== null) nextP2 = { ...nextP2, airJumpsLeft: MAX_AIR_JUMPS };

            const winner = nextP1.stocks <= 0 ? "p2" : nextP2.stocks <= 0 ? "p1" : null;

            world = {
                ...world,
                p1: nextP1,
                p2: nextP2,
                projectiles: nextProjectiles,
                winner,
            };

            // Update camera
            cameraRef.current = updateCamera(cameraRef.current, nextP1, nextP2);

            worldRef.current = world;

            setHud((prev) => {
                const elapsed = (now - world.startedAt) / 1000;
                return {
                    p1Hp: world.p1.hp,
                    p2Hp: world.p2.hp,
                    p1Super: world.p1.superMeter,
                    p2Super: world.p2.superMeter,
                    p1Stocks: world.p1.stocks,
                    p2Stocks: world.p2.stocks,
                    p1AirJumps: world.p1.airJumpsLeft,
                    p2AirJumps: world.p2.airJumpsLeft,
                    winner: world.winner,
                    elapsed,
                };
            });

            draw(world);
        };

        const loop = (now: number) => {
            if (now - previousTime > 13) {
                previousTime = now;
                if (vsAI) runAI(now);
                pollGamepads();
                updateWorld(now);
            }
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isReady]);

    const winnerLabel = useMemo(() => {
        if (hud.winner === "p1") return `${p1Pick?.name ?? "P1"} Wins`;
        if (hud.winner === "p2") return `${p2Pick?.name ?? "P2"} Wins`;
        return null;
    }, [hud.winner, p1Pick, p2Pick]);

    // Post match result to Discord when game ends
    const matchPostedRef = useRef(false);
    useEffect(() => {
        if (!hud.winner) { matchPostedRef.current = false; return; }
        if (matchPostedRef.current) return;
        matchPostedRef.current = true;
        const winner = hud.winner === "p1" ? (p1Pick?.name ?? "P1") : (p2Pick?.name ?? "P2");
        const loser = hud.winner === "p1" ? (p2Pick?.name ?? "P2") : (p1Pick?.name ?? "P1");
        const winChar = hud.winner === "p1" ? (p1Pick?.name ?? "?") : (p2Pick?.name ?? "?");
        const loseChar = hud.winner === "p1" ? (p2Pick?.name ?? "?") : (p1Pick?.name ?? "?");
        postMatchResult(winner, loser, winChar, loseChar, formatTime(hud.elapsed), isOnline);
    }, [hud.winner]);

    // Pick 2 random characters for the demo battle sprites on menu
    const [demoP1] = useState(() => CHARACTER_ROSTER[Math.floor(Math.random() * CHARACTER_ROSTER.length)]);
    const [demoP2] = useState(() => CHARACTER_ROSTER[Math.floor(Math.random() * CHARACTER_ROSTER.length)]);

    // ─── MODE SELECT ─────────────────────────────────────────────
    if (selectPhase === "mode") {
        return (
            <div className="min-h-screen text-white relative overflow-hidden" style={{ background: '#000' }}>
                {/* Dark vignette overlay */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
                }} />

                {/* Animated battle sprites in background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="relative" style={{ width: 800, height: 400 }}>
                        {/* P1 sprite - left side, facing right */}
                        <img src={demoP1.sprites.attack.src} alt="" className="absolute" style={{
                            left: 80, bottom: 40, height: 200, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 20px rgba(185,28,28,0.5))',
                        }} />
                        {/* VS spark */}
                        <div className="absolute text-6xl font-black" style={{
                            left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                            color: '#b91c1c', textShadow: '0 0 40px rgba(185,28,28,0.8)', fontFamily: 'Georgia, serif',
                        }}>VS</div>
                        {/* P2 sprite - right side, facing left, flipped */}
                        <img src={demoP2.sprites.attack.src} alt="" className="absolute" style={{
                            right: 80, bottom: 40, height: 200, imageRendering: 'pixelated', transform: 'scaleX(-1)',
                            filter: 'drop-shadow(0 0 20px rgba(109,40,217,0.5))',
                        }} />
                    </div>
                </div>

                <div className="relative z-10 max-w-[520px] mx-auto pt-12 px-6 pb-8">
                    {/* Logo + Title */}
                    <div className="text-center mb-8">
                        <img src="/favicon.png" alt="Grudge" className="w-20 h-20 mx-auto mb-3 rounded-full" style={{
                            border: '2px solid rgba(185,28,28,0.5)',
                            boxShadow: '0 0 40px rgba(185,28,28,0.3)',
                        }} />
                        <h1 className="text-4xl font-black tracking-wider" style={{
                            fontFamily: 'Georgia, serif',
                            background: 'linear-gradient(180deg, #fff 0%, #b91c1c 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 20px rgba(185,28,28,0.4))',
                        }}>GRUDGE FIGHTER</h1>
                        <p className="text-white/25 text-xs mt-1 tracking-[0.4em] uppercase">39 Warriors · No Mercy</p>
                        <p className="text-white/15 text-[10px] mt-0.5">{demoP1.name} vs {demoP2.name}</p>
                    </div>

                    {/* Main action buttons with sprite thumbnails */}
                    <div className="space-y-3">
                        <button onClick={() => { setVsAI(true); setSelectPhase("p1"); }}
                            className="w-full flex items-center gap-4 py-3 px-5 rounded-lg font-bold text-lg tracking-wider transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)', boxShadow: '0 4px 24px rgba(185,28,28,0.35)' }}>
                            <img src={demoP1.sprites.idle.src} alt="" className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
                            <span>VS AI</span>
                        </button>
                        <button onClick={() => { pvp.connect(); setSelectPhase("lobby"); }}
                            className="w-full flex items-center gap-4 py-3 px-5 rounded-lg font-bold text-lg tracking-wider transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, #6d28d9, #4c1d95)', boxShadow: '0 4px 24px rgba(109,40,217,0.35)' }}>
                            <img src={demoP2.sprites.idle.src} alt="" className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
                            <span>ONLINE PVP</span>
                        </button>
                    </div>

                    {/* Tools row */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button onClick={() => { window.location.hash = 'toonadmin'; }}
                            className="flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-semibold border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-amber-300">
                            <img src="/fighter2d/effects/slash_arc.png" alt="" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />
                            Character Editor
                        </button>
                        <a href="https://molochdagod.github.io/Grudge-RPG-Sprite-Attack/" target="_blank"
                            className="flex items-center gap-2 justify-center py-2.5 rounded-lg text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center">
                            <img src="/favicon.png" alt="" className="w-5 h-5 rounded-full" />
                            Landing Page
                        </a>
                    </div>

                    {/* Links row */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                        <a href="https://molochdagod.github.io/Grudge-RPG-Sprite-Attack/serverconnect.html" target="_blank"
                            className="py-2 rounded text-[10px] font-medium text-white/35 border border-white/5 hover:bg-white/5 text-center">Servers</a>
                        <a href="https://discord.gg/grudge" target="_blank"
                            className="py-2 rounded text-[10px] font-medium text-[#7289da] border border-[#7289da]/15 hover:bg-[#7289da]/10 text-center">Discord</a>
                        <a href="https://github.com/MolochDaGod/Grudge-RPG-Sprite-Attack" target="_blank"
                            className="py-2 rounded text-[10px] font-medium text-white/35 border border-white/5 hover:bg-white/5 text-center">GitHub</a>
                        <a href="https://grudge-studio.com" target="_blank"
                            className="py-2 rounded text-[10px] font-medium text-red-400/60 border border-red-500/10 hover:bg-red-500/5 text-center">About Us</a>
                    </div>

                    {/* Footer: legal + credits */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="flex justify-center gap-4 text-[9px] text-white/20">
                            <a href="https://grudge-studio.com/privacy" target="_blank" className="hover:text-white/40">Privacy Policy</a>
                            <span>·</span>
                            <a href="https://grudge-studio.com/tos" target="_blank" className="hover:text-white/40">Terms of Service</a>
                            <span>·</span>
                            <button onClick={() => alert('GRUDGE FIGHTER\n\nCreated by Grudge Studio\nBy Racalvin The Pirate King\n\n39 Fighters \u00b7 4 Stages \u00b7 Online PvP\n\nSprites: Zerie Tiny RPG, CraftPix Wizard & RPG Heroes, GRUDA Wars\nEngine: React + Canvas 2D + Socket.io\nBackend: Railway + Vercel\n\ngrudge-studio.com')} className="hover:text-white/40">Credits</button>
                        </div>
                        <div className="text-center mt-2 text-[8px] text-white/10 tracking-widest uppercase">
                            Grudge Studio · By Racalvin The Pirate King
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── ONLINE LOBBY ──────────────────────────────────────────────
    if (selectPhase === "lobby") {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
                <div className="max-w-[600px] mx-auto space-y-6 pt-12">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-white/80" onClick={() => { pvp.disconnect(); setSelectPhase("mode"); }}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">
                            <Wifi className="w-3 h-3 mr-1" /> Online PvP
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-white/60">{pvp.state}</Badge>
                    </div>

                    {pvp.error && (
                        <Card className="p-3 bg-red-950/70 border-red-500/40 text-red-200 text-sm">{pvp.error}</Card>
                    )}

                    {pvp.state === "connected" && !pvp.roomId && (
                        <div className="space-y-4">
                            <Card className="p-6 bg-slate-900/80 border-white/10 text-center space-y-4">
                                <h2 className="text-xl font-bold text-amber-300">Create a Room</h2>
                                <p className="text-white/60 text-sm">Create a room and share the code with your opponent</p>
                                <Button onClick={() => pvp.createRoom()} className="bg-amber-600 hover:bg-amber-500">Create Room</Button>
                            </Card>
                            <Card className="p-6 bg-slate-900/80 border-white/10 text-center space-y-4">
                                <h2 className="text-xl font-bold text-sky-300">Join a Room</h2>
                                <div className="flex gap-2 justify-center">
                                    <input
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                                        placeholder="ABCD"
                                        className="bg-slate-800 border border-white/20 rounded px-4 py-2 text-center text-2xl font-mono tracking-widest w-40 uppercase"
                                        maxLength={4}
                                    />
                                    <Button onClick={() => pvp.joinRoom(joinCode)} disabled={joinCode.length < 4} className="bg-sky-600 hover:bg-sky-500">Join</Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {pvp.roomId && pvp.state !== "fighting" && (
                        <Card className="p-8 bg-slate-900/80 border-amber-400/20 text-center space-y-4">
                            <div className="text-white/60 text-sm">Room Code</div>
                            <div className="text-5xl font-mono font-bold text-amber-300 tracking-[0.3em]">{pvp.roomId}</div>
                            <div className="text-white/50 text-sm">Share this code with your opponent</div>
                            {pvp.state === "in-room" && <p className="text-white/40 animate-pulse">Waiting for opponent to join...</p>}
                            {(pvp.state === "waiting" || pvp.state === "ready") && (
                                <div className="space-y-2">
                                    <p className="text-emerald-400">Opponent joined! Pick your character below.</p>
                                    <Button onClick={() => setSelectPhase("p1")} className="bg-amber-600 hover:bg-amber-500">Pick Character</Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {pvp.state === "disconnected" && (
                        <Card className="p-6 bg-slate-900/80 border-white/10 text-center space-y-3">
                            <p className="text-white/60">Connecting to Grudge Server...</p>
                            <Button onClick={() => pvp.connect()} variant="secondary">Retry</Button>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    // ─── STAGE SELECT SCREEN ─────────────────────────────────────
    if (selectPhase === "stage") {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
                <div className="max-w-[900px] mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-white/80" onClick={() => setSelectPhase("p2")}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">Grudge Fighter</Badge>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-amber-300 font-serif">Select Stage</h1>
                        <p className="text-white/50 mt-1">{p1Pick?.name} vs {p2Pick?.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {STAGES.map(stage => (
                            <button
                                key={stage.id}
                                onClick={() => { setSelectedStage(stage); stageRef.current = stage; setSelectPhase("fight"); }}
                                className={`relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02] ${
                                    selectedStage.id === stage.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-slate-900/80 hover:border-amber-400/40'
                                }`}
                            >
                                <div className="h-24 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${stage.bgColor1}, ${stage.bgColor2})` }}>
                                    <div className="h-full flex items-end justify-center pb-2">
                                        <div className="rounded" style={{ width: `${stage.mainFloorW / 15}px`, height: 4, backgroundColor: stage.floorColor }} />
                                        {stage.platforms.map((p, i) => (
                                            <div key={i} className="rounded mx-1" style={{
                                                width: `${p.w / 15}px`, height: 3,
                                                backgroundColor: stage.platformColor,
                                                marginBottom: `${(stage.mainFloorY - p.y) / 10}px`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white">{stage.name}</h3>
                                <p className="text-xs text-white/50">{stage.platforms.length} platforms · {stage.bgFeatures} theme</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── CHARACTER SELECT SCREEN ─────────────────────────────────
    if (selectPhase === "p1" || selectPhase === "p2") {
        const isPvPWaiting = pvp.state === "ready" || pvp.state === "waiting";
        return (
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
                <div className="max-w-[1100px] mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-white/80 hover:text-white" onClick={() => setSelectPhase(pvp.roomId ? "lobby" : "mode")}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">Grudge Fighter</Badge>
                        {pvp.roomId && <Badge className="bg-purple-500/20 text-purple-300">Online · {pvp.roomId}</Badge>}
                    </div>

                    {isPvPWaiting && selectPhase === "p1" && (
                        <Card className="p-3 bg-purple-950/50 border-purple-400/30 text-purple-200 text-sm text-center">
                            Pick your character — opponent is picking too. Fight starts when both are ready.
                        </Card>
                    )}

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-amber-300 font-serif">
                            {selectPhase === "p1" ? "Player 1 — Choose Your Fighter" : "Player 2 — Choose Your Fighter"}
                        </h1>
                        {p1Pick && selectPhase === "p2" && (
                            <p className="text-white/60">P1 picked <span className="text-emerald-400 font-semibold">{p1Pick.name}</span></p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {CHARACTER_ROSTER.map((char) => {
                            const faction = getFaction(char.faction);
                            return (
                            <button
                                key={char.id}
                                onClick={() => handleCharacterPick(char)}
                                className="group relative bg-slate-900/80 border border-white/10 rounded-lg p-4 hover:border-amber-400/60 hover:bg-slate-800/80 transition-all text-left"
                                style={{ borderColor: `${faction.colorPrimary}33` }}
                            >
                                <div className="w-full h-32 flex items-center justify-center mb-3 overflow-hidden bg-black/30 rounded">
                                    <AttackFrameCanvas
                                        src={char.sprites.attack.src}
                                        frames={char.sprites.attack.frames}
                                        frameSize={GRUDA_ROSTER.find(g => g.id === char.id)?.frameSize ?? 100}
                                        size={128}
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">{char.name}</div>
                                    <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <img src={faction.emblemSrc} alt={faction.name} className="w-4 h-4 object-contain" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
                                        <span className="text-xs font-medium" style={{ color: faction.colorPrimary }}>{faction.name}</span>
                                    </div>
                                    <div className="text-xs text-white/50 mt-0.5">
                                        ATK {char.moveSet.baseDamage} · SPD {char.moveSet.runSpeed.toFixed(1)}
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: char.color }} />
                            </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ─── FIGHT SCREEN ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
            <div className="max-w-[1300px] mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back To Menu
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">Grudge Fighter</Badge>
                        <Badge variant="outline" className="border-white/30 text-white/90">Match Time {formatTime(hud.elapsed)}</Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setVsAI(!vsAI)} variant="outline" className={vsAI ? "border-amber-400/40 text-amber-300" : "border-white/20 text-white/70"}>
                            {vsAI ? "vs AI" : "vs P2"}
                        </Button>
                        <Button onClick={resetMatch} variant="secondary">Rematch</Button>
                        <Button onClick={resetToSelect} variant="outline" className="border-white/20 text-white/70">New Fighters</Button>
                    </div>
                </div>

                {loadError && (
                    <Card className="p-4 bg-red-950/70 border-red-500/40 text-red-100">
                        Could not load fighter assets: {loadError}
                    </Card>
                )}

                <Card className="relative overflow-hidden border-white/10 bg-slate-900/80">
                    <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4 justify-between">
                        <div className="min-w-[260px]">
                            <div className="text-sm text-white/70 mb-1 flex items-center gap-2" style={{ color: p1Pick?.color }}>
                                <img src={getFaction(p1Pick?.faction).emblemSrc} alt="" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }} />
                                P1: {p1Pick?.name}
                                <span className="flex gap-1 ml-2">
                                    {Array.from({ length: STARTING_STOCKS }, (_, i) => (
                                        <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${i < hud.p1Stocks ? 'bg-emerald-400' : 'bg-white/10'}`} />
                                    ))}
                                </span>
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p1-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p1Hp / 20) ? "bg-emerald-500" : "bg-white/10"}`} />
                                ))}
                            </div>
                        </div>
                        <div className="min-w-[260px]">
                            <div className="text-sm text-white/70 mb-1 text-right flex items-center justify-end gap-2" style={{ color: p2Pick?.color }}>
                                <span className="flex gap-1 mr-2">
                                    {Array.from({ length: STARTING_STOCKS }, (_, i) => (
                                        <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${i < hud.p2Stocks ? 'bg-sky-400' : 'bg-white/10'}`} />
                                    ))}
                                </span>
                                P2: {p2Pick?.name}
                                <img src={getFaction(p2Pick?.faction).emblemSrc} alt="" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }} />
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p2-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p2Hp / 20) ? "bg-sky-400" : "bg-white/10"}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <canvas ref={canvasRef} width={VIEWPORT_W} height={VIEWPORT_H} className="w-full h-auto max-h-[70vh] block bg-black" />

                    {!isReady && !loadError && (
                        <div className="absolute inset-0 bg-black/60 grid place-items-center text-white/80 text-lg">Loading sprites...</div>
                    )}

                    {winnerLabel && (
                        <div className="absolute inset-0 bg-black/65 grid place-items-center">
                            <Card className="p-8 bg-slate-900/95 border-amber-400/40 text-center">
                                <h2 className="text-3xl font-bold text-amber-300">{winnerLabel}</h2>
                                <p className="text-white/70 mt-2">Fight complete. Press Rematch or pick New Fighters.</p>
                            </Card>
                        </div>
                    )}
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-slate-900/70 border-emerald-400/20">
                        <div className="font-semibold mb-2 flex items-center gap-2 text-emerald-300">
                            <Crosshair className="w-4 h-4" /> P1: {p1Pick?.name}
                        </div>
                        <div className="text-sm text-white/80 space-y-1">
                            <div>A/D: move · W: jump</div>
                            <div className="text-emerald-300">AA / DD: dodge roll (ground + air quick dodge)</div>
                            <div className="text-cyan-300">SS: drop through floating platforms</div>
                            <div>Q: melee 1 · E: melee 2 (ground)</div>
                            <div className="text-sky-300">Air E: forward projectile · Air E+S: down-angle projectile</div>
                            <div className="text-amber-300">W + LMB: rescue roll toward mouse (damages on collision)</div>
                            <div className="text-sky-300">LMB: dash attack · RMB: block/parry</div>
                            <div>W+Q/E: {p1Pick?.moveSet.upSpecialName}</div>
                            <div>S+Q/E: {p1Pick?.moveSet.downSpecialName}</div>
                            <div className="text-amber-300">R: {p1Pick?.moveSet.superName} (when meter full)</div>
                            <div className="text-white/50 mt-1">Gamepad: A/X=attack B=ranged RT=dash LT=block RB=super</div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-slate-900/70 border-sky-400/20">
                        <div className="font-semibold mb-2 flex items-center gap-2 text-sky-300">
                            <Zap className="w-4 h-4" /> P2: {p2Pick?.name} {vsAI && <Badge className="ml-1 bg-amber-500/20 text-amber-300 text-xs">AI</Badge>}
                        </div>
                        {vsAI ? (
                            <div className="text-sm text-white/60">AI-controlled opponent. Toggle "vs P2" for local 2-player.</div>
                        ) : (
                            <div className="text-sm text-white/80 space-y-1">
                                <div>Arrows: move + jump</div>
                                <div className="text-emerald-300">Double-tap Left/Right: dodge roll</div>
                                <div className="text-cyan-300">Double-tap Down: drop through floating platforms</div>
                                <div>/: melee 1 · .: melee 2</div>
                                <div>;: ranged · ': super</div>
                                <div>Gamepad 2: same button layout</div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
