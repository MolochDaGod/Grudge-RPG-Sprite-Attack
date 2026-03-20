import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crosshair, Shield, Zap } from "lucide-react";

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

const ARENA_WIDTH = 1280;
const ARENA_HEIGHT = 720;
const FLOOR_Y = 610;
const GRAVITY = 0.75;
const FRICTION = 0.82;

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

function charSprites(folder: string, config: {
    idle: [string, number]; run: [string, number]; attack: [string, number];
    takeHit: [string, number]; death: [string, number];
}): FighterSpriteSet {
    const base = `/fighter2d/characters/${folder}/`;
    return {
        idle:    { src: base + config.idle[0],    frames: config.idle[1],    hold: 6, loop: true },
        run:     { src: base + config.run[0],     frames: config.run[1],     hold: 5, loop: true },
        jump:    { src: base + config.idle[0],    frames: config.idle[1],    hold: 6, loop: false }, // reuse idle as jump
        fall:    { src: base + config.idle[0],    frames: config.idle[1],    hold: 6, loop: false }, // reuse idle as fall
        attack:  { src: base + config.attack[0],  frames: config.attack[1],  hold: 4, loop: false },
        takeHit: { src: base + config.takeHit[0], frames: config.takeHit[1], hold: 5, loop: false },
        death:   { src: base + config.death[0],   frames: config.death[1],   hold: 7, loop: false },
    };
}

const CHARACTER_ROSTER: CharacterDef[] = [
    {
        id: "knight",
        name: "Knight",
        color: "#e74c3c",
        sprites: charSprites("Knight", {
            idle: ["Knight-Idle.png", 6], run: ["Knight-Walk.png", 8],
            attack: ["Knight-Attack03.png", 11], takeHit: ["Knight-Hurt.png", 4], death: ["Knight-Death.png", 4],
        }),
        moveSet: {
            name: "Knight", normalName: "Broadsword Slash",
            neutralSpecialName: "Shield Throw (Ranged)", upSpecialName: "Skyward Cleave",
            downSpecialName: "Iron Bulwark (Counter)", superName: "Divine Judgment",
            runSpeed: 5.6, jumpForce: 16, baseDamage: 13, projectileDamage: 10,
            upSpecialDamage: 14, counterDamage: 20, superDamage: 35,
        },
        attackEffect: { src: "/fighter2d/effects/Knight-Attack03_Effect.png", frames: 11, hold: 3 },
    },
    {
        id: "archer",
        name: "Archer",
        color: "#27ae60",
        sprites: charSprites("Archer", {
            idle: ["Archer-Idle.png", 6], run: ["Archer-Walk.png", 8],
            attack: ["Archer-Attack02.png", 12], takeHit: ["Archer-Hurt.png", 4], death: ["Archer-Death.png", 4],
        }),
        moveSet: {
            name: "Archer", normalName: "Quick Shot",
            neutralSpecialName: "Piercing Arrow (Ranged)", upSpecialName: "Aerial Volley",
            downSpecialName: "Evade Counter", superName: "Storm of Arrows",
            runSpeed: 6.8, jumpForce: 17.5, baseDamage: 9, projectileDamage: 15,
            upSpecialDamage: 11, counterDamage: 16, superDamage: 30,
        },
        attackEffect: { src: "/fighter2d/effects/Archer-Attack02_Effect.png", frames: 12, hold: 3 },
        projectileSrc: "/fighter2d/projectiles/Arrow.png",
        projectileFrames: 1,
    },
    {
        id: "wizard",
        name: "Wizard",
        color: "#8e44ad",
        sprites: charSprites("Wizard", {
            idle: ["Wizard-Idle.png", 6], run: ["Wizard-Walk.png", 8],
            attack: ["Wizard-Attack01.png", 6], takeHit: ["Wizard-Hurt.png", 4], death: ["Wizard-DEATH.png", 4],
        }),
        moveSet: {
            name: "Wizard", normalName: "Arcane Blast",
            neutralSpecialName: "Fireball (Ranged)", upSpecialName: "Teleport Strike",
            downSpecialName: "Mana Shield (Counter)", superName: "Arcane Apocalypse",
            runSpeed: 5.4, jumpForce: 16.5, baseDamage: 10, projectileDamage: 16,
            upSpecialDamage: 12, counterDamage: 22, superDamage: 40,
        },
        attackEffect: { src: "/fighter2d/effects/Wizard-Attack01_Effect.png", frames: 10, hold: 3 },
        projectileSrc: "/fighter2d/projectiles/Wizard-Projectile.png",
        projectileFrames: 10,
    },
    {
        id: "orc",
        name: "Orc",
        color: "#2ecc71",
        sprites: charSprites("Orc", {
            idle: ["Orc-Idle.png", 6], run: ["Orc-Walk.png", 8],
            attack: ["Orc-Attack01.png", 6], takeHit: ["Orc-Hurt.png", 4], death: ["Orc-Death.png", 4],
        }),
        moveSet: {
            name: "Orc", normalName: "Axe Swing",
            neutralSpecialName: "Boulder Toss (Ranged)", upSpecialName: "Leap Slam",
            downSpecialName: "Berserker Rage (Counter)", superName: "Waaagh! Smash",
            runSpeed: 5.0, jumpForce: 15, baseDamage: 15, projectileDamage: 12,
            upSpecialDamage: 16, counterDamage: 18, superDamage: 38,
        },
        attackEffect: { src: "/fighter2d/effects/Orc-attack01_Effect.png", frames: 6, hold: 4 },
    },
    {
        id: "skeleton",
        name: "Armored Skeleton",
        color: "#95a5a6",
        sprites: charSprites("Armored-Skeleton", {
            idle: ["Armored Skeleton-Idle.png", 6], run: ["Armored Skeleton-Walk.png", 8],
            attack: ["Armored Skeleton-Attack02.png", 9], takeHit: ["Armored Skeleton-Hurt.png", 4],
            death: ["Armored Skeleton-Death.png", 4],
        }),
        moveSet: {
            name: "Armored Skeleton", normalName: "Bone Slash",
            neutralSpecialName: "Cursed Bolt (Ranged)", upSpecialName: "Death Dive",
            downSpecialName: "Undead Guard (Counter)", superName: "Soul Harvest",
            runSpeed: 5.8, jumpForce: 16, baseDamage: 11, projectileDamage: 13,
            upSpecialDamage: 13, counterDamage: 19, superDamage: 32,
        },
        attackEffect: { src: "/fighter2d/effects/Armored Skeleton-Attack02_Effect.png", frames: 9, hold: 3 },
    },
    {
        id: "swordsman",
        name: "Swordsman",
        color: "#e67e22",
        sprites: charSprites("Swordsman", {
            idle: ["Swordsman-Idle.png", 6], run: ["Swordsman-Walk.png", 8],
            attack: ["Swordsman-Attack01.png", 7], takeHit: ["Swordsman-Hurt.png", 5],
            death: ["Swordsman-Death.png", 4],
        }),
        moveSet: {
            name: "Swordsman", normalName: "Swift Cut",
            neutralSpecialName: "Blade Wave (Ranged)", upSpecialName: "Rising Slash",
            downSpecialName: "Parry (Counter)", superName: "Thousand Cuts",
            runSpeed: 6.4, jumpForce: 17, baseDamage: 12, projectileDamage: 11,
            upSpecialDamage: 13, counterDamage: 17, superDamage: 33,
        },
        attackEffect: { src: "/fighter2d/effects/Swordsman-Attack01_Effect.png", frames: 7, hold: 3 },
    },
    {
        id: "priest",
        name: "Priest",
        color: "#f1c40f",
        sprites: charSprites("Priest", {
            idle: ["Priest-Idle.png", 6], run: ["Priest-Walk.png", 8],
            attack: ["Priest-Attack.png", 9], takeHit: ["Priest-Hurt.png", 4], death: ["Priest-Death.png", 4],
        }),
        moveSet: {
            name: "Priest", normalName: "Holy Strike",
            neutralSpecialName: "Smite (Ranged)", upSpecialName: "Ascension",
            downSpecialName: "Divine Shield (Counter)", superName: "Holy Smite",
            runSpeed: 5.2, jumpForce: 16, baseDamage: 9, projectileDamage: 14,
            upSpecialDamage: 10, counterDamage: 24, superDamage: 36,
        },
        attackEffect: { src: "/fighter2d/effects/Priest-Attack_effect.png", frames: 5, hold: 4 },
    },
];

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function createInitialFighter(id: FighterId, moveSet: CharacterMoveSet): FighterRuntime {
    return {
        id,
        x: id === "p1" ? 280 : 980,
        y: FLOOR_Y,
        vx: 0,
        vy: 0,
        width: 120,
        height: 220,
        facing: id === "p1" ? 1 : -1,
        hp: 100,
        maxHp: 100,
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
        moveSet,
    };
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
    const [selectPhase, setSelectPhase] = useState<"p1" | "p2" | "fight">("p1");

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const worldRef = useRef<WorldState | null>(null);
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const animationFrameRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hud, setHud] = useState({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, winner: null as FighterId | null, elapsed: 0 });
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

    const handleCharacterPick = useCallback((char: CharacterDef) => {
        if (selectPhase === "p1") {
            setP1Pick(char);
            setSelectPhase("p2");
        } else if (selectPhase === "p2") {
            setP2Pick(char);
            setSelectPhase("fight");
        }
    }, [selectPhase]);

    const resetToSelect = useCallback(() => {
        setP1Pick(null);
        setP2Pick(null);
        setSelectPhase("p1");
        setIsReady(false);
        assetsRef.current = null;
        worldRef.current = null;
        setHud({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, winner: null, elapsed: 0 });
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const resetMatch = useCallback(() => {
        if (!p1Pick || !p2Pick) return;
        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet),
            p2: createInitialFighter("p2", p2Pick.moveSet),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };
        setHud({ p1Hp: 100, p2Hp: 100, p1Super: 0, p2Super: 0, winner: null, elapsed: 0 });
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

        if (kind === "neutral") {
            const projectile: Projectile = {
                id: `${fighterId}-${now}`,
                owner: fighterId,
                x: actor.x + actor.facing * 40,
                y: actor.y - actor.height * 0.55,
                vx: actor.facing * 10,
                radius: 14,
                damage: actor.moveSet.projectileDamage,
                expiresAt: now + 1800,
            };

            const next = setState(
                {
                    ...actor,
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

        if (kind === "up") {
            const next = setState(
                {
                    ...actor,
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
        if (actor.y < FLOOR_Y - 1) return;
        if (now < actor.stateLockUntil) return;
        const next = setState({ ...actor, vy: -actor.moveSet.jumpForce }, "jump", now);
        if (fighterId === "p1") world.p1 = next; else world.p2 = next;
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
            if (r < 0.45) queueNormalAttack("p2");
            else if (r < 0.65) queueSpecial("p2", "down");
            else if (r < 0.8) queueSpecial("p2", "up");
            else queueSpecial("p2", "neutral");
            return;
        }
        if (dist < 400) { if (Math.random() < 0.4) queueSpecial("p2", "neutral"); else { const d = player.x > ai.x ? P2_CONTROLS.right : P2_CONTROLS.left; pressedKeysRef.current.add(d); setTimeout(() => pressedKeysRef.current.delete(d), 200); } return; }
        const d = player.x > ai.x ? P2_CONTROLS.right : P2_CONTROLS.left; pressedKeysRef.current.add(d); setTimeout(() => pressedKeysRef.current.delete(d), 300);
    }, [tryJump, queueNormalAttack, queueSpecial, queueSuper]);

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
            prevGpRef.current.set(gi, curr);
        }
    }, [vsAI, tryJump, queueNormalAttack, queueSpecial, queueSuper]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase(); pressedKeysRef.current.add(key);
            if (e.repeat) return;
            processInput("p1", P1_CONTROLS, key);
            if (!vsAI) processInput("p2", P2_CONTROLS, key);
        };
        const onKeyUp = (e: KeyboardEvent) => pressedKeysRef.current.delete(e.key.toLowerCase());
        window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
        return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); pressedKeysRef.current.clear(); };
    }, [processInput, vsAI]);

    useEffect(() => {
        if (selectPhase !== "fight" || !p1Pick || !p2Pick) return;
        let disposed = false;

        worldRef.current = {
            p1: createInitialFighter("p1", p1Pick.moveSet),
            p2: createInitialFighter("p2", p2Pick.moveSet),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
            superFreeze: null,
        };

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
            const drawWidth = currentSprite.frameWidth * 3;
            const drawHeight = currentSprite.frameHeight * 3;
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

            // Screen shake offset
            let shakeX = 0, shakeY = 0;
            if (now < screenShakeRef.current.until) {
                const t = screenShakeRef.current.intensity;
                shakeX = (Math.random() - 0.5) * t * 2;
                shakeY = (Math.random() - 0.5) * t * 2;
            }

            ctx.save();
            ctx.translate(shakeX, shakeY);

            ctx.clearRect(-10, -10, ARENA_WIDTH + 20, ARENA_HEIGHT + 20);

            // Background
            ctx.drawImage(assets.background, 0, 0, ARENA_WIDTH, ARENA_HEIGHT);
            ctx.globalAlpha = 0.85;
            ctx.drawImage(assets.castle, ARENA_WIDTH - 220, FLOOR_Y - 90, 200, 120);
            ctx.globalAlpha = 1;

            // Floor
            const floorGradient = ctx.createLinearGradient(0, FLOOR_Y, 0, ARENA_HEIGHT);
            floorGradient.addColorStop(0, "rgba(18, 22, 40, 0.4)");
            floorGradient.addColorStop(1, "rgba(8, 10, 20, 0.95)");
            ctx.fillStyle = floorGradient;
            ctx.fillRect(0, FLOOR_Y, ARENA_WIDTH, ARENA_HEIGHT - FLOOR_Y);
            ctx.strokeStyle = "rgba(255, 224, 140, 0.35)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, FLOOR_Y + 1);
            ctx.lineTo(ARENA_WIDTH, FLOOR_Y + 1);
            ctx.stroke();

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

            // Super meter bars
            const drawMeter = (x: number, meter: number, color: string) => {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(x, FLOOR_Y + 20, 200, 12);
                ctx.fillStyle = meter >= SUPER_METER_MAX ? "#ffd700" : color;
                ctx.fillRect(x + 1, FLOOR_Y + 21, (meter / SUPER_METER_MAX) * 198, 10);
                if (meter >= SUPER_METER_MAX) {
                    ctx.save();
                    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(now / 100);
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(x + 1, FLOOR_Y + 21, 198, 10);
                    ctx.restore();
                    ctx.fillStyle = "#ffd700"; ctx.font = "bold 11px monospace";
                    ctx.fillText("R  SUPER", x + 60, FLOOR_Y + 30);
                }
            };
            drawMeter(40, world.p1.superMeter, "#4ade80");
            drawMeter(ARENA_WIDTH - 240, world.p2.superMeter, "#60a5fa");

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
                if (leftPressed && !rightPressed) vx = -fighter.moveSet.runSpeed;
                else if (!leftPressed && rightPressed) vx = fighter.moveSet.runSpeed;
                else vx *= FRICTION;
            } else {
                vx *= 0.92;
            }

            let x = fighter.x + vx;
            let y = fighter.y + fighter.vy;
            let vy = fighter.vy + GRAVITY;

            if (y >= FLOOR_Y) {
                y = FLOOR_Y;
                vy = 0;
            }

            x = clamp(x, 60, ARENA_WIDTH - 60);

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

            const winner = nextP1.hp <= 0 ? "p2" : nextP2.hp <= 0 ? "p1" : null;

            world = {
                ...world,
                p1: nextP1,
                p2: nextP2,
                projectiles: nextProjectiles,
                winner,
            };

            worldRef.current = world;

            setHud((prev) => {
                const elapsed = (now - world.startedAt) / 1000;
                if (
                    prev.p1Hp === world.p1.hp &&
                    prev.p2Hp === world.p2.hp &&
                    prev.winner === world.winner &&
                    Math.floor(prev.elapsed) === Math.floor(elapsed)
                ) {
                    return prev;
                }
                return {
                    p1Hp: world.p1.hp,
                    p2Hp: world.p2.hp,
                    p1Super: world.p1.superMeter,
                    p2Super: world.p2.superMeter,
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

    // ─── CHARACTER SELECT SCREEN ─────────────────────────────────
    if (selectPhase !== "fight") {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
                <div className="max-w-[1100px] mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="text-white/80 hover:text-white" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">Grudge Fighter</Badge>
                    </div>

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
                                <div className="w-full h-20 flex items-center justify-center mb-3 overflow-hidden">
                                    <img
                                        src={char.sprites.idle.src}
                                        alt={char.name}
                                        className="h-16 object-contain" style={{ imageRendering: "pixelated" }}
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
                            <div className="text-sm text-white/70 mb-1" style={{ color: p1Pick?.color }}>P1: {p1Pick?.name}</div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p1-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p1Hp / 10) ? "bg-emerald-500" : "bg-white/10"}`} />
                                ))}
                            </div>
                        </div>
                        <div className="min-w-[260px]">
                            <div className="text-sm text-white/70 mb-1 text-right" style={{ color: p2Pick?.color }}>P2: {p2Pick?.name}</div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div key={`p2-hp-${idx}`} className={`h-3 rounded-sm ${idx < Math.ceil(hud.p2Hp / 10) ? "bg-sky-400" : "bg-white/10"}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} className="w-full h-auto max-h-[70vh] block bg-black" />

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
                            <div>Q or E: melee attack</div>
                            <div>F: ranged ({p1Pick?.moveSet.neutralSpecialName})</div>
                            <div>W+Q/E: {p1Pick?.moveSet.upSpecialName}</div>
                            <div>S+Q/E: {p1Pick?.moveSet.downSpecialName}</div>
                            <div className="text-amber-300">R: {p1Pick?.moveSet.superName} (when meter full)</div>
                            <div className="text-white/50 mt-1">Gamepad: A=attack B=ranged X=attack Y=jump RB=super</div>
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
