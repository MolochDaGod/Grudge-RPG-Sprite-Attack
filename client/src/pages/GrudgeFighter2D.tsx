import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crosshair, Shield, Zap, Wifi, Globe } from "lucide-react";
import { usePvP } from "@/hooks/usePvP";
import { GRUDA_ROSTER, type GrudaCharDef } from "@/lib/grudaRoster";

type FighterId = "p1" | "p2";
type AnimationState = "idle" | "run" | "jump" | "fall" | "attack" | "takeHit" | "death";
type SpecialMoveKind = "neutral" | "up" | "down";

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
    attack: FighterSpriteDef;
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
    moveSet: CharacterMoveSet;
}

interface Projectile {
    id: string;
    owner: FighterId;
    x: number;
    y: number;
    vx: number;
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
const GRAVITY = 0.75 * 0.7; // 30% slower
const FRICTION = 0.82;
const SPEED_SCALE = 0.7; // 30% slower global
const MAX_AIR_JUMPS = 2;
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
        bgColor1: '#0c1a0c', bgColor2: '#1a2e1a', floorColor: '#2d5a1e', platformColor: '#3a6b2a',
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
        bgColor1: '#0a1628', bgColor2: '#1a2a4a', floorColor: '#5a3a1e', platformColor: '#6b4a2e',
        bgFeatures: 'ocean',
    },
    {
        id: 'fortress', name: 'Dark Fortress',
        mainFloorY: 700, mainFloorX: 460, mainFloorW: 1000,
        platforms: [],
        blastZone: { top: -200, bottom: 1280, left: -300, right: 2220 },
        bgColor1: '#0a0a14', bgColor2: '#1a1020', floorColor: '#2a1a2a', platformColor: '#3a2a3a',
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
        bgColor1: '#0a1a0a', bgColor2: '#102a10', floorColor: '#1e4a1e', platformColor: '#2a5a2a',
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
    const targetZoom = clamp(VIEWPORT_W / maxSpan, 0.45, 1.3);
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

// ─── Character Roster (GrudgeRPG 100x100 sprites) ───────────────────────

interface EffectSpriteDef {
    src: string;
    frames: number;
    hold: number;
}

interface CharacterDef {
    id: string;
    name: string;
    sprites: FighterSpriteSet;
    moveSet: CharacterMoveSet;
    color: string;
    attackEffect: EffectSpriteDef;
    projectileSrc?: string; // single-frame projectile image
    projectileFrames?: number; // animated projectile strip
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
    const s = (file: string, frames: number, loop: boolean) => ({
        src: base + file, frames, hold: autoHold(frames), loop,
    });
    return {
        id: g.id,
        name: g.name,
        color: g.color,
        sprites: {
            idle:    s(g.idle[0], g.idle[1], true),
            run:     s(g.walk[0], g.walk[1], true),
            jump:    s(g.jump?.[0] ?? g.idle[0], g.jump?.[1] ?? g.idle[1], false),
            fall:    s(g.idle[0], g.idle[1], false),
            attack:  s(g.attack[0], g.attack[1], false),
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
    };
}

const CHARACTER_ROSTER: CharacterDef[] = GRUDA_ROSTER.map(grudaToCharDef);

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function createInitialFighter(id: FighterId, moveSet: CharacterMoveSet, stage: StageDefinition): FighterRuntime {
    const spawnX = id === "p1" ? stage.mainFloorX + 200 : stage.mainFloorX + stage.mainFloorW - 200;
    return {
        id,
        x: spawnX,
        y: stage.mainFloorY,
        vx: 0,
        vy: 0,
        width: 120,
        height: 220,
        facing: id === "p1" ? 1 : -1,
        hp: 100,
        maxHp: 100,
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
        hp: 100,
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
    };
}

function isOnPlatform(fighter: FighterRuntime, stage: StageDefinition): number | null {
    // Check main floor
    if (fighter.vy >= 0 && fighter.y >= stage.mainFloorY - 2 && fighter.y <= stage.mainFloorY + 10
        && fighter.x >= stage.mainFloorX && fighter.x <= stage.mainFloorX + stage.mainFloorW) {
        return stage.mainFloorY;
    }
    // Check platforms (one-way: only land from above)
    for (const p of stage.platforms) {
        if (fighter.vy >= 0 && fighter.y >= p.y - 2 && fighter.y <= p.y + 10
            && fighter.x >= p.x && fighter.x <= p.x + p.w) {
            return p.y;
        }
    }
    return null;
}

function hurtBox(fighter: FighterRuntime) {
    return {
        x: fighter.x - fighter.width / 2,
        y: fighter.y - fighter.height,
        w: fighter.width,
        h: fighter.height,
    };
}

function intersectRect(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleIntersectsRect(
    circle: { x: number; y: number; r: number },
    rect: { x: number; y: number; w: number; h: number }
): boolean {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy <= circle.r * circle.r;
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
        const newAttackerHp = Math.max(0, attacker.hp - target.moveSet.counterDamage);
        const nextAttacker = setState(
            {
                ...attacker,
                hp: newAttackerHp,
                vx: -target.facing * 6,
                vy: -5,
                stateLockUntil: now + 260,
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
    const damagedTarget = setState(
        {
            ...target,
            hp: nextHp,
            vx: attacker.facing * 4,
            vy: -4,
            stateLockUntil: now + 230,
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
    const animationFrameRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hud, setHud] = useState({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null as FighterId | null, elapsed: 0 });
    const [vsAI, setVsAI] = useState(true);
    const aiTimerRef = useRef(0);

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
        setHud({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null, elapsed: 0 });
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const resetMatch = useCallback(() => {
        if (!p1Pick || !p2Pick) return;
        const stage = stageRef.current;
        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet, stage),
            p2: createInitialFighter("p2", p2Pick.moveSet, stage),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };
        cameraRef.current = { x: stage.mainFloorX, y: stage.mainFloorY - 400, zoom: 1 };
        setHud({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, p1Stocks: STARTING_STOCKS, p2Stocks: STARTING_STOCKS, p1AirJumps: MAX_AIR_JUMPS, p2AirJumps: MAX_AIR_JUMPS, winner: null, elapsed: 0 });
    }, [p1Pick, p2Pick]);

    const queueNormalAttack = useCallback((fighterId: FighterId) => {
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
            },
            "attack",
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

        // Ranged costs 1 stamina
        if (kind === "neutral") {
            if (actor.stamina < STAMINA_COST_RANGED) {
                const exhausted = { ...actor, stateLockUntil: now + EXHAUSTION_PENALTY_MS };
                if (fighterId === "p1") world.p1 = exhausted; else world.p2 = exhausted;
                return;
            }
            const projectile: Projectile = {
                id: `${fighterId}-${now}`,
                owner: fighterId,
                x: actor.x + actor.facing * 40,
                y: actor.y - actor.height * 0.55,
                vx: actor.facing * 10 * SPEED_SCALE,
                radius: 14,
                damage: actor.moveSet.projectileDamage,
                expiresAt: now + 1800,
            };

            const next = setState(
                {
                    ...actor,
                    stamina: actor.stamina - STAMINA_COST_RANGED,
                    stateLockUntil: now + 300,
                    specialCooldownUntil: now + 800,
                    attackHasConnected: false,
                },
                "attack",
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
                },
                "jump",
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
            },
            "attack",
            now
        );
        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, []);

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
            const next = setState({ ...actor, vy: -actor.moveSet.jumpForce * SPEED_SCALE, airJumpsLeft: MAX_AIR_JUMPS }, "jump", now);
            if (fighterId === "p1") world.p1 = next; else world.p2 = next;
        } else if (actor.airJumpsLeft > 0) {
            // Air jump (double jump)
            const next = setState({ ...actor, vy: -actor.moveSet.jumpForce * SPEED_SCALE * 0.85, airJumpsLeft: actor.airJumpsLeft - 1 }, "jump", now);
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
        const next = setState({ ...actor, superMeter: 0, stateLockUntil: now + SUPER_FREEZE_DURATION + 200 }, "attack", now);
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
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
            },
            "attack",
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
            },
            "idle",
            now
        );
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
    }, []);

    const processInput = useCallback((fighterId: FighterId, controls: typeof P1_CONTROLS, key: string) => {
        const keys = pressedKeysRef.current;
        if (key === controls.jump) tryJump(fighterId);
        if (key === controls.attack1 || key === controls.attack2) {
            const up = keys.has(controls.jump);
            const down = keys.has(controls.down);
            if (up) queueSpecial(fighterId, "up");
            else if (down) queueSpecial(fighterId, "down");
            else queueNormalAttack(fighterId);
        }
        if (key === controls.ranged) queueSpecial(fighterId, "neutral");
        if (key === controls.super) queueSuper(fighterId);
    }, [tryJump, queueNormalAttack, queueSpecial, queueSuper]);

    // AI opponent logic
    const runAI = useCallback((now: number) => {
        const world = worldRef.current;
        if (!world || world.winner || world.superFreeze) return;
        const ai = world.p2; const player = world.p1;
        if (ai.hp <= 0) return;
        if (now - aiTimerRef.current < 200 + Math.random() * 200) return;
        aiTimerRef.current = now;
        const dist = Math.abs(ai.x - player.x);
        if (now < ai.stateLockUntil) return;
        const incoming = world.projectiles.find(p => p.owner === "p1" && Math.abs(p.x - ai.x) < 200);
        if (incoming && ai.y >= FLOOR_Y - 1) { tryJump("p2"); return; }
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

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase(); pressedKeysRef.current.add(key);
            if (e.repeat) return;
            processInput("p1", P1_CONTROLS, key);
            if (!vsAI) processInput("p2", P2_CONTROLS, key);
        };
        const onKeyUp = (e: KeyboardEvent) => pressedKeysRef.current.delete(e.key.toLowerCase());

        // Mouse: LMB = dash attack, RMB = block/parry (P1 only)
        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 0) queueDashAttack("p1");   // LMB
            if (e.button === 2) queueBlock("p1");         // RMB
        };
        const onContextMenu = (e: MouseEvent) => e.preventDefault(); // disable right-click menu

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("contextmenu", onContextMenu);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("contextmenu", onContextMenu);
            pressedKeysRef.current.clear();
        };
    }, [processInput, vsAI, queueDashAttack, queueBlock]);

    useEffect(() => {
        if (selectPhase !== "fight" || !p1Pick || !p2Pick) return;
        let disposed = false;

        stageRef.current = selectedStage;
        const stage = stageRef.current;
        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet, stage),
            p2: createInitialFighter("p2", p2Pick.moveSet, stage),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };
        cameraRef.current = { x: stage.mainFloorX, y: stage.mainFloorY - 400, zoom: 1 };

        const maybeLoad = (src?: string) => src ? loadImage(src).catch(() => null) : Promise.resolve(null);

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
        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            pressedKeysRef.current.add(key);

            if (event.repeat) return;

            if (key === P1_CONTROLS.jump) tryJump("p1");
            if (key === P2_CONTROLS.jump) tryJump("p2");
            if (key === P1_CONTROLS.normal) queueNormalAttack("p1");
            if (key === P2_CONTROLS.normal) queueNormalAttack("p2");

            if (key === P1_CONTROLS.special) {
                const up = pressedKeysRef.current.has(P1_CONTROLS.jump);
                const down = pressedKeysRef.current.has(P1_CONTROLS.down);
                queueSpecial("p1", up ? "up" : down ? "down" : "neutral");
            }

            if (key === P2_CONTROLS.special) {
                const up = pressedKeysRef.current.has(P2_CONTROLS.jump);
                const down = pressedKeysRef.current.has(P2_CONTROLS.down);
                queueSpecial("p2", up ? "up" : down ? "down" : "neutral");
            }
        };

        const onKeyUp = (event: KeyboardEvent) => {
            pressedKeysRef.current.delete(event.key.toLowerCase());
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            pressedKeysRef.current.clear();
        };
    }, [queueNormalAttack, queueSpecial, tryJump]);

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
            // Scale all characters to ~300px tall regardless of original frame size
            const targetHeight = 300;
            const scale = targetHeight / currentSprite.frameHeight;
            const drawWidth = currentSprite.frameWidth * scale;
            const drawHeight = currentSprite.frameHeight * scale;
            const drawX = fighter.x - drawWidth / 2;
            const drawY = fighter.y - drawHeight;

            // Hit flash — tint the fighter white briefly
            const now = performance.now();
            const flash = hitFlashRef.current;
            const isFlashing = flash && flash.target === fighter.id && now < flash.until;

            ctx.save();
            if (fighter.facing < 0) {
                ctx.translate(drawX + drawWidth / 2, 0);
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + drawWidth / 2), 0);
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
                // Dark castle silhouettes
                for (let i = 0; i < 5; i++) {
                    const cx = parallaxX + 200 + i * 350;
                    const ch = 80 + (i % 3) * 50;
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(cx, VIEWPORT_H - 200 + parallaxY - ch, 60, ch);
                    ctx.fillRect(cx - 10, VIEWPORT_H - 200 + parallaxY - ch - 20, 80, 20);
                }
            } else if (stage.bgFeatures === 'ocean') {
                // Waves
                ctx.fillStyle = '#0a2040';
                for (let wx = 0; wx < VIEWPORT_W + 100; wx += 30) {
                    const wy = VIEWPORT_H - 80 + parallaxY + Math.sin((wx + now / 20) * 0.03) * 15;
                    ctx.fillRect(wx + parallaxX * 0.1, wy, 28, VIEWPORT_H);
                }
            } else if (stage.bgFeatures === 'lava') {
                // Lava glow
                ctx.fillStyle = `rgba(200, 50, 0, ${0.15 + 0.1 * Math.sin(now / 300)})`;
                ctx.fillRect(0, VIEWPORT_H - 120, VIEWPORT_W, 120);
            } else if (stage.bgFeatures === 'forest') {
                // Tree silhouettes
                ctx.fillStyle = '#0a1a0a';
                for (let i = 0; i < 8; i++) {
                    const tx = parallaxX + 100 + i * 200;
                    const th = 100 + (i % 3) * 60;
                    ctx.beginPath();
                    ctx.moveTo(tx, VIEWPORT_H - 160 + parallaxY);
                    ctx.lineTo(tx + 30, VIEWPORT_H - 160 + parallaxY - th);
                    ctx.lineTo(tx + 60, VIEWPORT_H - 160 + parallaxY);
                    ctx.fill();
                }
            }
            ctx.restore();

            // Camera transform
            ctx.save();
            ctx.translate(shakeX, shakeY);
            ctx.scale(cam.zoom, cam.zoom);
            ctx.translate(-cam.x, -cam.y);

            // Draw main floor
            ctx.fillStyle = stage.floorColor;
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY, stage.mainFloorW, 30);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(stage.mainFloorX, stage.mainFloorY, stage.mainFloorW, 3);

            // Draw platforms
            for (const p of stage.platforms) {
                ctx.fillStyle = stage.platformColor;
                ctx.fillRect(p.x, p.y, p.w, 12);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(p.x, p.y, p.w, 2);
            }

            // Fighters
            drawFighter(world.p1, assets.p1);
            drawFighter(world.p2, assets.p2);

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
                ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
                // Radial burst lines
                ctx.globalAlpha = 0.3 + 0.3 * Math.sin(now / 30);
                const attacker = world.superFreeze.attacker === "p1" ? world.p1 : world.p2;
                ctx.strokeStyle = "#ffd700";
                ctx.lineWidth = 2;
                for (let i = 0; i < 24; i++) {
                    const angle = (i / 24) * Math.PI * 2 + now / 200;
                    ctx.beginPath();
                    ctx.moveTo(attacker.x + Math.cos(angle) * 40, (attacker.y - attacker.height * 0.5) + Math.sin(angle) * 40);
                    ctx.lineTo(attacker.x + Math.cos(angle) * (200 + progress * 400), (attacker.y - attacker.height * 0.5) + Math.sin(angle) * (200 + progress * 400));
                    ctx.stroke();
                }
                // Super name text
                ctx.globalAlpha = Math.min(1, progress * 3);
                ctx.fillStyle = "#ffd700";
                ctx.font = "bold 48px serif";
                ctx.textAlign = "center";
                const name = (world.superFreeze.attacker === "p1" ? p1Pick : p2Pick)?.moveSet.superName ?? "SUPER";
                ctx.fillText(name, ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 30);
                ctx.font = "24px serif";
                ctx.fillStyle = "#fff";
                ctx.fillText((world.superFreeze.attacker === "p1" ? p1Pick : p2Pick)?.name ?? "", ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 20);
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
            now: number
        ): FighterRuntime => {
            const isLocked = now < fighter.stateLockUntil;
            const keys = pressedKeysRef.current;
            const leftPressed = keys.has(controls.left);
            const rightPressed = keys.has(controls.right);

            let vx = fighter.vx;
            if (!isLocked && fighter.hp > 0) {
                if (leftPressed && !rightPressed) vx = -fighter.moveSet.runSpeed * SPEED_SCALE;
                else if (!leftPressed && rightPressed) vx = fighter.moveSet.runSpeed * SPEED_SCALE;
                else vx *= FRICTION;
            } else {
                vx *= 0.92;
            }

            let x = fighter.x + vx;
            let y = fighter.y + fighter.vy;
            let vy = fighter.vy + GRAVITY;

            // Platform collision
            const stage = stageRef.current;
            const floorY = isOnPlatform({ ...fighter, x, y, vy }, stage);
            if (floorY !== null && vy >= 0) {
                y = floorY;
                vy = 0;
            }

            // NO clamping to arena edges — fighters can fall off!

            const facing = opponent.x >= x ? 1 : -1;
            let next = {
                ...fighter,
                x,
                y,
                vx,
                vy,
                facing,
            };

            if (next.hp <= 0) {
                return setState(next, "death", now);
            }

            if (now >= next.stateLockUntil) {
                if (next.y < FLOOR_Y - 0.5) {
                    next = setState(next, next.vy < 0 ? "jump" : "fall", now);
                } else if (Math.abs(next.vx) > 1.4) {
                    next = setState(next, "run", now);
                } else {
                    next = setState(next, "idle", now);
                }
            }

            return next;
        };

        const processMeleeHit = (attacker: FighterRuntime, defender: FighterRuntime, now: number) => {
            if (attacker.state !== "attack") return { attacker, defender };
            if (attacker.attackHasConnected) return { attacker, defender };
            if (attacker.frameIndex < attacker.attackHitFrame) return { attacker, defender };

            const hitBox = {
                x: attacker.x + attacker.facing * 30 - (attacker.facing > 0 ? 0 : 80),
                y: attacker.y - attacker.height * 0.78,
                w: 80,
                h: 100,
            };
            const targetHurt = hurtBox(defender);
            if (!intersectRect(hitBox, targetHurt)) {
                return {
                    attacker: { ...attacker, attackHasConnected: true },
                    defender,
                };
            }

            const result = applyDamage(defender, attacker, attacker.moveSet.baseDamage, now);

            // Spawn attack effect sprite at the hit point
            const fxAssets = assetsRef.current;
            const effectImg = fxAssets ? (attacker.id === "p1" ? fxAssets.p1Effect : fxAssets.p2Effect) : null;
            const effectDef = attacker.id === "p1" ? p1Pick?.attackEffect : p2Pick?.attackEffect;
            if (effectImg && effectDef) {
                spawnEffect(effectImg, effectDef.frames, effectDef.hold,
                    defender.x, defender.y - defender.height * 0.5, attacker.facing < 0);
            }

            // Screen shake and hit flash on damage
            triggerScreenShake(result.wasCounter ? 12 : 6, result.wasCounter ? 200 : 120);
            triggerHitFlash(defender.id as FighterId, 100);

            return {
                attacker: { ...result.attacker, attackHasConnected: true },
                defender: result.target,
            };
        };

        const updateWorld = (now: number) => {
            const assets = assetsRef.current;
            if (!assets) return;

            let world = worldRef.current;

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

            let nextP1 = updateMovement(world.p1, world.p2, P1_CONTROLS, now);
            let nextP2 = updateMovement(world.p2, world.p1, P2_CONTROLS, now);

            nextP1 = tickFighterAnimation(nextP1, assets.p1, now);
            nextP2 = tickFighterAnimation(nextP2, assets.p2, now);

            const p1Melee = processMeleeHit(nextP1, nextP2, now);
            nextP1 = p1Melee.attacker;
            nextP2 = p1Melee.defender;

            const p2Melee = processMeleeHit(nextP2, nextP1, now);
            nextP2 = p2Melee.attacker;
            nextP1 = p2Melee.defender;

            const nextProjectiles: Projectile[] = [];
            for (const projectile of world.projectiles) {
                if (now > projectile.expiresAt) continue;

                const updated = {
                    ...projectile,
                    x: projectile.x + projectile.vx,
                };
                if (updated.x < -30 || updated.x > ARENA_WIDTH + 30) continue;

                const target = updated.owner === "p1" ? nextP2 : nextP1;
                const targetBox = hurtBox(target);
                const hit = circleIntersectsRect(
                    { x: updated.x, y: updated.y, r: updated.radius },
                    targetBox
                );

                if (hit) {
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
                    triggerScreenShake(8, 150);
                    triggerHitFlash(hitTarget.id as FighterId, 80);

                    continue;
                }

                nextProjectiles.push(updated);
            }

            if (nextP1.state === "jump" && now < nextP1.stateLockUntil) {
                const strikeBox = {
                    x: nextP1.x + nextP1.facing * 26 - (nextP1.facing > 0 ? 0 : 72),
                    y: nextP1.y - nextP1.height * 0.7,
                    w: 72,
                    h: 92,
                };
                if (intersectRect(strikeBox, hurtBox(nextP2))) {
                    const result = applyDamage(nextP2, nextP1, nextP1.moveSet.upSpecialDamage, now);
                    nextP2 = result.target;
                    nextP1 = result.attacker;
                }
            }

            if (nextP2.state === "jump" && now < nextP2.stateLockUntil) {
                const strikeBox = {
                    x: nextP2.x + nextP2.facing * 26 - (nextP2.facing > 0 ? 0 : 72),
                    y: nextP2.y - nextP2.height * 0.7,
                    w: 72,
                    h: 92,
                };
                if (intersectRect(strikeBox, hurtBox(nextP1))) {
                    const result = applyDamage(nextP1, nextP2, nextP2.moveSet.upSpecialDamage, now);
                    nextP1 = result.target;
                    nextP2 = result.attacker;
                }
            }

            // Stock system: blast zone death + HP death
            const stage = stageRef.current;
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
            const landingFloorP1 = isOnPlatform(nextP1, stage);
            const landingFloorP2 = isOnPlatform(nextP2, stage);
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

    // ─── MODE SELECT ─────────────────────────────────────────────
    if (selectPhase === "mode") {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
                <div className="max-w-[600px] mx-auto space-y-8 pt-20">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-amber-300 font-serif">Grudge Fighter</h1>
                        <p className="text-white/50">Choose your mode</p>
                    </div>
                    <div className="space-y-4">
                        <Button onClick={() => { setVsAI(true); setSelectPhase("p1"); }} className="w-full h-16 text-lg bg-emerald-600 hover:bg-emerald-500">
                            <Shield className="w-5 h-5 mr-3" /> vs AI
                        </Button>
                        <Button onClick={() => { pvp.connect(); setSelectPhase("lobby"); }} className="w-full h-16 text-lg bg-purple-600 hover:bg-purple-500">
                            <Globe className="w-5 h-5 mr-3" /> Online PvP
                        </Button>
                    </div>
                    <Button variant="ghost" className="text-white/50 mx-auto block" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
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
                        {CHARACTER_ROSTER.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => handleCharacterPick(char)}
                                className="group relative bg-slate-900/80 border border-white/10 rounded-lg p-4 hover:border-amber-400/60 hover:bg-slate-800/80 transition-all text-left"
                            >
                                <div className="w-full h-32 flex items-center justify-center mb-3 overflow-hidden bg-black/30 rounded">
                                    <img
                                        src={char.sprites.attack.src}
                                        alt={char.name}
                                        className="h-full w-full object-cover" style={{ imageRendering: "pixelated", objectPosition: "center" }}
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">{char.name}</div>
                                    <div className="text-xs text-white/50 mt-1">
                                        ATK {char.moveSet.baseDamage} · SPD {char.moveSet.runSpeed.toFixed(1)}
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: char.color }} />
                            </button>
                        ))}
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
                                P1: {p1Pick?.name}
                                <span className="flex gap-1 ml-2">
                                    {Array.from({ length: STARTING_STOCKS }, (_, i) => (
                                        <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full ${i < hud.p1Stocks ? 'bg-emerald-400' : 'bg-white/10'}`} />
                                    ))}
                                </span>
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p1-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p1Hp / 10) ? "bg-emerald-500" : "bg-white/10"}`} />
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
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p2-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p2Hp / 10) ? "bg-sky-400" : "bg-white/10"}`} />
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
                            <div>Q or E: melee · F: ranged</div>
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
                                <div>/ or .: melee attack</div>
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
