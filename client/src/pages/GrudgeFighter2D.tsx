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
    runSpeed: number;
    jumpForce: number;
    baseDamage: number;
    projectileDamage: number;
    upSpecialDamage: number;
    counterDamage: number;
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
    normal: "q",
    special: "e",
    down: "s",
};

const P2_CONTROLS = {
    left: "arrowleft",
    right: "arrowright",
    jump: "arrowup",
    normal: "/",
    special: ".",
    down: "arrowdown",
};

const player1Sprites: FighterSpriteSet = {
    idle: { src: "/fighter2d/image/player1/Idle.png", frames: 11, hold: 5, loop: true },
    run: { src: "/fighter2d/image/player1/Run.png", frames: 8, hold: 4, loop: true },
    jump: { src: "/fighter2d/image/player1/Jump.png", frames: 3, hold: 6, loop: false },
    fall: { src: "/fighter2d/image/player1/Fall.png", frames: 3, hold: 6, loop: false },
    attack: { src: "/fighter2d/image/player1/Attack2.png", frames: 7, hold: 4, loop: false },
    takeHit: { src: "/fighter2d/image/player1/Take Hit.png", frames: 4, hold: 5, loop: false },
    death: { src: "/fighter2d/image/player1/Death.png", frames: 11, hold: 6, loop: false },
};

const player2Sprites: FighterSpriteSet = {
    idle: { src: "/fighter2d/image/player2/Idle.png", frames: 10, hold: 5, loop: true },
    run: { src: "/fighter2d/image/player2/Run.png", frames: 8, hold: 4, loop: true },
    jump: { src: "/fighter2d/image/player2/Jump.png", frames: 3, hold: 6, loop: false },
    fall: { src: "/fighter2d/image/player2/Fall.png", frames: 3, hold: 6, loop: false },
    attack: { src: "/fighter2d/image/player2/Attack3.png", frames: 8, hold: 4, loop: false },
    takeHit: { src: "/fighter2d/image/player2/Take hit.png", frames: 3, hold: 5, loop: false },
    death: { src: "/fighter2d/image/player2/Death.png", frames: 7, hold: 6, loop: false },
};

const roninMoveSet: CharacterMoveSet = {
    name: "Ronin Vanguard",
    normalName: "Steel Arc",
    neutralSpecialName: "Tempest Edge (Ranged)",
    upSpecialName: "Skybreaker Dash",
    downSpecialName: "Iron Reversal (Counter)",
    runSpeed: 6.2,
    jumpForce: 16.5,
    baseDamage: 11,
    projectileDamage: 14,
    upSpecialDamage: 12,
    counterDamage: 18,
};

const assassinMoveSet: CharacterMoveSet = {
    name: "Shade Wraith",
    normalName: "Phantom Claw",
    neutralSpecialName: "Shadow Bolt (Ranged)",
    upSpecialName: "Nightstep Dash",
    downSpecialName: "Mirror Trap (Counter)",
    runSpeed: 6.6,
    jumpForce: 17.2,
    baseDamage: 10,
    projectileDamage: 13,
    upSpecialDamage: 11,
    counterDamage: 20,
};

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
        target: damagedTarget,
        attacker,
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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const worldRef = useRef<WorldState>({
        p1: createInitialFighter("p1", roninMoveSet),
        p2: createInitialFighter("p2", assassinMoveSet),
        projectiles: [],
        winner: null,
        startedAt: performance.now(),
    });
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const animationFrameRef = useRef<number | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hud, setHud] = useState({ p1Hp: 100, p2Hp: 100, winner: null as FighterId | null, elapsed: 0 });

    const assetsRef = useRef<{
        p1: Record<AnimationState, RuntimeSprite>;
        p2: Record<AnimationState, RuntimeSprite>;
        background: HTMLImageElement;
        castle: HTMLImageElement;
    } | null>(null);

    const resetMatch = useCallback(() => {
        worldRef.current = {
            p1: createInitialFighter("p1", roninMoveSet),
            p2: createInitialFighter("p2", assassinMoveSet),
            projectiles: [],
            winner: null,
            startedAt: performance.now(),
        };
        setHud({ p1Hp: 100, p2Hp: 100, winner: null, elapsed: 0 });
    }, []);

    const queueNormalAttack = useCallback((fighterId: FighterId) => {
        const world = worldRef.current;
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
        const now = performance.now();
        const actor = fighterId === "p1" ? world.p1 : world.p2;
        if (world.winner || actor.hp <= 0) return;
        if (actor.y < FLOOR_Y - 1) return;
        if (now < actor.stateLockUntil) return;

        const next = setState(
            {
                ...actor,
                vy: -actor.moveSet.jumpForce,
            },
            "jump",
            now
        );

        if (fighterId === "p1") world.p1 = next;
        else world.p2 = next;
    }, []);

    useEffect(() => {
        let disposed = false;

        Promise.all([
            loadSpriteSet(player1Sprites),
            loadSpriteSet(player2Sprites),
            loadImage("/fighter2d/image/Hills.png"),
            loadImage("/fighter2d/image/castle.png"),
        ])
            .then(([p1, p2, background, castle]) => {
                if (disposed) return;
                assetsRef.current = { p1, p2, background, castle };
                setIsReady(true);
            })
            .catch((err: unknown) => {
                if (disposed) return;
                setLoadError(err instanceof Error ? err.message : "Failed to load fighter assets");
            });

        return () => {
            disposed = true;
        };
    }, []);

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

        const drawFighter = (
            fighter: FighterRuntime,
            sprites: Record<AnimationState, RuntimeSprite>
        ) => {
            const currentSprite = sprites[fighter.state];
            const sourceX = fighter.frameIndex * currentSprite.frameWidth;
            const drawWidth = currentSprite.frameWidth * 2;
            const drawHeight = currentSprite.frameHeight * 2;
            const drawX = fighter.x - drawWidth / 2;
            const drawY = fighter.y - drawHeight;

            ctx.save();
            if (fighter.facing < 0) {
                ctx.translate(drawX + drawWidth / 2, 0);
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + drawWidth / 2), 0);
            }

            ctx.drawImage(
                currentSprite.image,
                sourceX,
                0,
                currentSprite.frameWidth,
                currentSprite.frameHeight,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );

            ctx.restore();

            if (fighter.counterUntil > performance.now()) {
                ctx.save();
                ctx.strokeStyle = "rgba(125, 245, 255, 0.9)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(fighter.x, fighter.y - fighter.height * 0.5, fighter.width * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };

        const draw = (world: WorldState) => {
            const assets = assetsRef.current;
            if (!assets) return;

            ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            ctx.drawImage(assets.background, 0, 0, ARENA_WIDTH, ARENA_HEIGHT);
            ctx.globalAlpha = 0.85;
            ctx.drawImage(assets.castle, ARENA_WIDTH - 220, FLOOR_Y - 90, 200, 120);
            ctx.globalAlpha = 1;

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

            drawFighter(world.p1, assets.p1);
            drawFighter(world.p2, assets.p2);

            for (const projectile of world.projectiles) {
                const projectileGradient = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, projectile.radius);
                projectileGradient.addColorStop(0, projectile.owner === "p1" ? "#ffd56a" : "#8de7ff");
                projectileGradient.addColorStop(1, "rgba(255,255,255,0.1)");
                ctx.fillStyle = projectileGradient;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
                ctx.fill();
            }
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
            return {
                attacker: { ...result.attacker, attackHasConnected: true },
                defender: result.target,
            };
        };

        const updateWorld = (now: number) => {
            const assets = assetsRef.current;
            if (!assets) return;

            let world = worldRef.current;

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
                    if (updated.owner === "p1") {
                        const result = applyDamage(nextP2, nextP1, updated.damage, now);
                        nextP2 = result.target;
                        nextP1 = result.attacker;
                    } else {
                        const result = applyDamage(nextP1, nextP2, updated.damage, now);
                        nextP1 = result.target;
                        nextP2 = result.attacker;
                    }
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
                    winner: world.winner,
                    elapsed,
                };
            });

            draw(world);
        };

        const loop = (now: number) => {
            if (now - previousTime > 13) {
                previousTime = now;
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
        if (hud.winner === "p1") return `${roninMoveSet.name} Wins`;
        if (hud.winner === "p2") return `${assassinMoveSet.name} Wins`;
        return null;
    }, [hud.winner]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
            <div className="max-w-[1300px] mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={onBack}
                        data-testid="button-back-from-grudge-fighter"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back To Menu
                    </Button>

                    <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">
                            Grudge Fighter Mode
                        </Badge>
                        <Badge variant="outline" className="border-white/30 text-white/90">
                            Match Time {formatTime(hud.elapsed)}
                        </Badge>
                    </div>

                    <Button onClick={resetMatch} variant="secondary" data-testid="button-reset-grudge-fighter">
                        Rematch
                    </Button>
                </div>

                {loadError && (
                    <Card className="p-4 bg-red-950/70 border-red-500/40 text-red-100">
                        Could not load fighter assets: {loadError}
                    </Card>
                )}

                <Card className="relative overflow-hidden border-white/10 bg-slate-900/80">
                    <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4 justify-between">
                        <div className="min-w-[260px]">
                            <div className="text-sm text-white/70 mb-1">Player 1: {roninMoveSet.name}</div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div
                                        key={`p1-hp-${idx}`}
                                        className={`h-3 rounded-sm ${idx < Math.ceil(hud.p1Hp / 10) ? "bg-emerald-500" : "bg-white/10"}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="min-w-[260px]">
                            <div className="text-sm text-white/70 mb-1 text-right">Player 2: {assassinMoveSet.name}</div>
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 10 }, (_, idx) => (
                                    <div
                                        key={`p2-hp-${idx}`}
                                        className={`h-3 rounded-sm ${idx < Math.ceil(hud.p2Hp / 10) ? "bg-sky-400" : "bg-white/10"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={ARENA_WIDTH}
                        height={ARENA_HEIGHT}
                        className="w-full h-auto max-h-[70vh] block bg-black"
                        data-testid="grudge-fighter-canvas"
                    />

                    {!isReady && !loadError && (
                        <div className="absolute inset-0 bg-black/60 grid place-items-center text-white/80 text-lg">
                            Loading sprites and animation sheets...
                        </div>
                    )}

                    {winnerLabel && (
                        <div className="absolute inset-0 bg-black/65 grid place-items-center">
                            <Card className="p-8 bg-slate-900/95 border-amber-400/40 text-center">
                                <h2 className="text-3xl font-bold text-amber-300">{winnerLabel}</h2>
                                <p className="text-white/70 mt-2">Fight complete. Press rematch to restart instantly.</p>
                            </Card>
                        </div>
                    )}
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-slate-900/70 border-emerald-400/20">
                        <div className="font-semibold mb-2 flex items-center gap-2 text-emerald-300">
                            <Crosshair className="w-4 h-4" />
                            P1 Controls (Ronin)
                        </div>
                        <div className="text-sm text-white/80 space-y-1">
                            <div>A / D: move, W: jump</div>
                            <div>Q: normal attack ({roninMoveSet.normalName})</div>
                            <div>E: neutral special ({roninMoveSet.neutralSpecialName})</div>
                            <div>W + E: up special ({roninMoveSet.upSpecialName})</div>
                            <div>S + E: down special ({roninMoveSet.downSpecialName})</div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/70 border-sky-400/20">
                        <div className="font-semibold mb-2 flex items-center gap-2 text-sky-300">
                            <Zap className="w-4 h-4" />
                            P2 Controls (Wraith)
                        </div>
                        <div className="text-sm text-white/80 space-y-1">
                            <div>Arrow Left / Right: move, Arrow Up: jump</div>
                            <div>/ : normal attack ({assassinMoveSet.normalName})</div>
                            <div>. : neutral special ({assassinMoveSet.neutralSpecialName})</div>
                            <div>Arrow Up + . : up special ({assassinMoveSet.upSpecialName})</div>
                            <div>Arrow Down + . : down special ({assassinMoveSet.downSpecialName})</div>
                        </div>
                    </Card>
                </div>

                <Card className="p-4 bg-slate-900/70 border-amber-400/20 text-sm text-white/75">
                    <div className="font-semibold mb-2 flex items-center gap-2 text-amber-300">
                        <Shield className="w-4 h-4" />
                        Combat Notes
                    </div>
                    <div>
                        All reference fighter animations are used in this mode: idle, run, jump, fall, attack, take hit, and death.
                        Directional specials are mapped in a Smash-like style with neutral, up, and down variants. Down specials open a brief
                        counter window, while neutral specials fire ranged attacks and up specials perform airborne dash strikes.
                    </div>
                </Card>
            </div>
        </div>
    );
}
