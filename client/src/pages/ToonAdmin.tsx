import { useCallback, useEffect, useRef, useState } from "react";
import { GRUDA_ROSTER, type GrudaCharDef, computeCollisionSize, computeRenderScale, getCharAnimData, computeCollisionSizeWithOverrides } from "@/lib/grudaRoster";
import { ACTION_SLOTS, type ActionSlotKey, type CharOverrides, type KnockbackAngle, loadOverrides, setCharOverrides, deleteCharOverrides, exportAllOverrides, importOverrides, saveOverridesToServer } from "@/lib/charConfig";
import { getAllVfx, getVfxCategories, searchVfx, preloadVfx, getVfxById, getVfxImage, drawVfxFrame, type VfxDef } from "@/lib/vfxLibrary";
import { getFaction, FACTION_IDS } from "@/lib/factions";
import { getDefaultVfx } from "@/lib/defaultVfx";

// ─── Editor types ────────────────────────────────────────────────
type CanvasElement = "sprite" | "head" | "body" | "legs" | "weapon" | "platform" | "floor" | null;

interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
  element: CanvasElement;
}

const EDITOR_STAGES = [
  { id: "battlefield", name: "Grudge Battlefield" },
  { id: "pirate", name: "Pirate's Cove" },
  { id: "fortress", name: "Dark Fortress" },
  { id: "canopy", name: "Elven Canopy" },
];

// ─── Helpers ─────────────────────────────────────────────────────
function getCharAnims(char: GrudaCharDef): { key: string; file: string; frames: number }[] {
  const anims: { key: string; file: string; frames: number }[] = [];
  const add = (key: string, val?: [string, number]) => { if (val) anims.push({ key, file: val[0], frames: val[1] }); };
  add("idle", char.idle); add("walk", char.walk); add("jump", char.jump); add("fall", char.fall);
  add("attack", char.attack); add("attack2", char.attack2);
  add("special", char.special); add("cast", char.cast);
  add("block", char.block); add("roll", char.roll);
  add("hurt", char.hurt); add("death", char.death);
  return anims;
}

const SLOT_GROUPS = ["movement", "melee", "special", "defense"] as const;
const GROUP_LABELS: Record<string, string> = {
  movement: "MOVEMENT",
  melee: "MELEE / COMBOS",
  special: "SPECIALS",
  defense: "DEFENSE",
};
const GROUP_COLORS: Record<string, string> = {
  movement: "#60a5fa",
  melee: "#f87171",
  special: "#a78bfa",
  defense: "#4ade80",
};

const ALPHA_THRESHOLD = 8;
const paddingCache = new Map<string, number>();
function getBottomPadding(img: HTMLImageElement): number {
  const key = img.src;
  if (paddingCache.has(key)) return paddingCache.get(key)!;
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let pad = 0;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) { pad = height - 1 - y; paddingCache.set(key, pad); return pad; }
    }
  }
  paddingCache.set(key, pad);
  return pad;
}

const autoHold = (f: number) => f > 20 ? 2 : f > 10 ? 3 : f > 6 ? 4 : 5;

// ─── Canvas Stage Constants ──────────────────────────────────────
// Proportions match actual game arenas (floor at ~70% of height)
const STAGE_W = 800;
const STAGE_H = 500;
const GRID_SIZE = 40;
const FLOOR_Y = Math.round(STAGE_H * 0.76); // ~380, matches game floor-to-arena ratio
const PLATFORM_Y = Math.round(STAGE_H * 0.52); // ~260
const PLATFORM_W = 200;
const PLATFORM_X = 300;
const DEFAULT_HIT_FRAME = 4; // same as attackHitFrame in GrudgeFighter2D

// ─── Main Component ─────────────────────────────────────────────
export default function ToonAdmin({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState(GRUDA_ROSTER[0].id);
  const [overrides, setOverrides] = useState(loadOverrides);
  const [previewAnimKey, setPreviewAnimKey] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [frame, setFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(1);
  const [scale, setScale] = useState(3);
  const [showCollision, setShowCollision] = useState(true);
  const [showOnion, setShowOnion] = useState(false);
  const [showVfx, setShowVfx] = useState(true);
  const [vfxTab, setVfxTab] = useState<string>("all");
  const [vfxSearch, setVfxSearch] = useState("");
  const [toast, setToast] = useState("");
  const [serverStatus, setServerStatus] = useState<"saved" | "saving" | "offline" | "">(""); 
  const [vfxLoaded, setVfxLoaded] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [comboPlaying, setComboPlaying] = useState(false);
  const [dragVfxId, setDragVfxId] = useState<string | null>(null);

  // ─── Undo/Redo ────────────────────────────────────────────────
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const pushUndo = useCallback(() => {
    undoStackRef.current.push(JSON.stringify(overrides));
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, [overrides]);

  // ─── Editor interaction state ──────────────────────────────────
  const [selectedElement, setSelectedElement] = useState<CanvasElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false, element: null });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["toons", "crusade", "legion", "fabled", "maps"]));
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const hitRegionsRef = useRef<{ id: CanvasElement; x: number; y: number; w: number; h: number }[]>([]);
  const selectedElementRef = useRef<CanvasElement>(null);

  // ─── Drag state for hitbox editing ─────────────────────────────
  const dragRef = useRef<{
    element: CanvasElement;
    edge: "move" | "left" | "right" | "top" | "bottom";
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const overridesAtDragStart = useRef<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const opponentImgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const tickRef = useRef(0);

  const char = GRUDA_ROSTER.find(c => c.id === selectedId)!;
  const charAnims = getCharAnims(char);
  const charOv = overrides[selectedId] ?? { actions: {} };
  const basePath = `/fighter2d/characters/${char.folder}/`;
  const faction = getFaction(char.faction);

  // Load VFX on mount
  useEffect(() => { preloadVfx().then(() => setVfxLoaded(true)); }, []);

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); }, []);

  // Keep ref in sync for render loop
  useEffect(() => { selectedElementRef.current = selectedElement; }, [selectedElement]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu.visible) return;
    const close = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu.visible]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (STAGE_W / rect.width), y: (e.clientY - rect.top) * (STAGE_H / rect.height) };
  }, []);

  const hitTestCanvas = useCallback((px: number, py: number): CanvasElement => {
    for (let i = hitRegionsRef.current.length - 1; i >= 0; i--) {
      const r = hitRegionsRef.current[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r.id;
    }
    return null;
  }, []);

  // Detect if click is near an edge (for resize) or center (for move)
  const detectEdge = useCallback((px: number, py: number, region: { x: number; y: number; w: number; h: number }): "move" | "left" | "right" | "top" | "bottom" => {
    const EDGE = 8;
    if (px - region.x < EDGE) return "left";
    if (region.x + region.w - px < EDGE) return "right";
    if (py - region.y < EDGE) return "top";
    if (region.y + region.h - py < EDGE) return "bottom";
    return "move";
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      // right-click: context menu
      e.preventDefault();
      const pos = getCanvasPos(e);
      if (!pos) return;
      const el = hitTestCanvas(pos.x, pos.y);
      setSelectedElement(el);
      setContextMenu({ x: e.clientX, y: e.clientY, visible: true, element: el });
      return;
    }
    const pos = getCanvasPos(e);
    if (!pos) return;
    setContextMenu(prev => ({ ...prev, visible: false }));
    const el = hitTestCanvas(pos.x, pos.y);
    setSelectedElement(el);
    // Start drag on collider elements
    if (el && ["body", "head", "legs", "weapon"].includes(el)) {
      const region = hitRegionsRef.current.find(r => r.id === el);
      if (region) {
        overridesAtDragStart.current = JSON.stringify(overrides);
        dragRef.current = {
          element: el,
          edge: detectEdge(pos.x, pos.y, region),
          startX: pos.x,
          startY: pos.y,
          startRect: { ...region },
        };
      }
    }
  }, [getCanvasPos, hitTestCanvas, detectEdge, overrides]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      // Update cursor based on what's under mouse
      const pos = getCanvasPos(e);
      if (!pos) return;
      const el = hitTestCanvas(pos.x, pos.y);
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (el && ["body", "head", "legs", "weapon"].includes(el)) {
        const region = hitRegionsRef.current.find(r => r.id === el);
        if (region) {
          const edge = detectEdge(pos.x, pos.y, region);
          canvas.style.cursor = edge === "left" || edge === "right" ? "ew-resize" : edge === "top" || edge === "bottom" ? "ns-resize" : "grab";
        }
      } else {
        canvas.style.cursor = "crosshair";
      }
      return;
    }
    const pos = getCanvasPos(e);
    if (!pos) return;
    const dx = pos.x - drag.startX;
    const dy = pos.y - drag.startY;
    const { startRect, element, edge } = drag;

    // Compute the actual game-space collision size for ratio calculations
    const { scaleX: scX } = computeRenderScale(char);
    const baseColW = Math.round(80 * Math.max(0.6, Math.min(scX, 2.0)));
    const { scaleY: scY } = computeRenderScale(char);
    const baseColH = Math.round(160 * Math.max(0.6, Math.min(scY, 2.0)));

    if (element === "body") {
      // Dragging body = resize overall collider width/height
      const curOv = overrides[selectedId]?.collider ?? {};
      const curWM = curOv.widthMult ?? 1.0;
      const curHM = curOv.heightMult ?? 1.0;
      let newWM = curWM, newHM = curHM;
      if (edge === "left" || edge === "right") {
        const pixelDelta = edge === "right" ? dx : -dx;
        newWM = Math.max(0.3, curWM + (pixelDelta / baseColW) * 2);
      } else if (edge === "top" || edge === "bottom") {
        const pixelDelta = edge === "bottom" ? dy : -dy;
        newHM = Math.max(0.3, curHM + (pixelDelta / baseColH) * 2);
      } else {
        // move = adjust both
        newWM = Math.max(0.3, curWM + (dx / baseColW) * 0.5);
        newHM = Math.max(0.3, curHM + (-dy / baseColH) * 0.5);
      }
      const newOv = { ...overrides };
      if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
      newOv[selectedId].collider = { ...newOv[selectedId].collider, widthMult: Math.round(newWM * 100) / 100, heightMult: Math.round(newHM * 100) / 100 };
      setOverrides(newOv);
    } else if (element === "weapon") {
      // Dragging weapon = resize reach
      const curReach = overrides[selectedId]?.collider?.weaponReach ?? scX * 80;
      let newReach = curReach;
      if (edge === "right" || edge === "left") {
        newReach = Math.max(10, curReach + dx);
      } else if (edge === "move") {
        newReach = Math.max(10, curReach + dx);
      }
      const newOv = { ...overrides };
      if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
      newOv[selectedId].collider = { ...newOv[selectedId].collider, weaponReach: Math.round(newReach) };
      setOverrides(newOv);
    }
    // Update start position for next delta
    drag.startX = pos.x;
    drag.startY = pos.y;
  }, [getCanvasPos, hitTestCanvas, detectEdge, char, overrides, selectedId]);

  const handleCanvasMouseUp = useCallback(() => {
    if (dragRef.current) {
      // Push undo with the state from before drag started
      const before = overridesAtDragStart.current;
      if (before && before !== JSON.stringify(overrides)) {
        undoStackRef.current.push(before);
        if (undoStackRef.current.length > 50) undoStackRef.current.shift();
        redoStackRef.current = [];
      }
      dragRef.current = null;
    }
  }, [overrides]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  }, []);

  // Current animation source (uses typed accessor instead of unsafe cast)
  const getSlotAnim = (slot: ActionSlotKey) => {
    const ov = charOv.actions[slot];
    if (ov) return ov;
    const def = getCharAnimData(char, slot);
    if (!def) return null;
    return { file: def[0], frames: def[1], hold: autoHold(def[1]), loop: slot === "idle" || slot === "walk" };
  };

  const previewFile = previewAnimKey
    ? charAnims.find(a => a.key === previewAnimKey)?.file ?? char.idle[0]
    : char.idle[0];
  const previewFrameCount = previewAnimKey
    ? charAnims.find(a => a.key === previewAnimKey)?.frames ?? char.idle[1]
    : char.idle[1];
  const previewSrc = basePath + previewFile;

  // Load sprite image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; frameRef.current = 0; setFrame(0); setTotalFrames(previewFrameCount); };
    img.src = previewSrc;
    return () => { imgRef.current = null; };
  }, [previewSrc, previewFrameCount]);

  // ─── Canvas Render Loop ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf: number;
    const render = () => {
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      hitRegionsRef.current = [];

      // Dark background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < STAGE_W; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, STAGE_H); ctx.stroke(); }
      for (let y = 0; y < STAGE_H; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(STAGE_W, y); ctx.stroke(); }

      // Main floor
      ctx.fillStyle = "#2a4a2a";
      ctx.fillRect(0, FLOOR_Y, STAGE_W, 6);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(0, FLOOR_Y, STAGE_W, 2);
      hitRegionsRef.current.push({ id: "floor", x: 0, y: FLOOR_Y - 10, w: STAGE_W, h: 26 });

      // Platform
      ctx.fillStyle = "#3a5a3a";
      ctx.fillRect(PLATFORM_X, PLATFORM_Y, PLATFORM_W, 5);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(PLATFORM_X, PLATFORM_Y, PLATFORM_W, 2);
      hitRegionsRef.current.push({ id: "platform", x: PLATFORM_X, y: PLATFORM_Y - 10, w: PLATFORM_W, h: 25 });

      // Character sprite
      const img = imgRef.current;
      if (img && img.complete) {
        const fw = img.width / Math.max(1, previewFrameCount);
        const fh = img.height;
        const bp = getBottomPadding(img);
        const dw = fw * scale;
        const dh = fh * scale;
        const cx = STAGE_W / 2;
        const cy = FLOOR_Y;
        const drawX = cx - dw / 2;
        const drawY = cy - dh + bp * scale;

        // Onion skinning: ghost of prev/next frames
        if (showOnion && previewFrameCount > 1) {
          ctx.save();
          ctx.globalAlpha = 0.15;
          const prevF = (frameRef.current - 1 + previewFrameCount) % previewFrameCount;
          const nextF = (frameRef.current + 1) % previewFrameCount;
          // Prev frame (red tint)
          ctx.filter = "hue-rotate(-30deg) saturate(2)";
          ctx.drawImage(img, prevF * fw, 0, fw, fh, drawX, drawY, dw, dh);
          // Next frame (blue tint)
          ctx.filter = "hue-rotate(180deg) saturate(2)";
          ctx.drawImage(img, nextF * fw, 0, fw, fh, drawX, drawY, dw, dh);
          ctx.filter = "none";
          ctx.restore();
        }

        // Current frame — flip sprite when facing left
        ctx.save();
        if (!facingRight) {
          ctx.translate(cx, 0);
          ctx.scale(-1, 1);
          ctx.translate(-cx, 0);
        }
        ctx.drawImage(img, frameRef.current * fw, 0, fw, fh, drawX, drawY, dw, dh);
        ctx.restore();
        hitRegionsRef.current.push({ id: "sprite", x: drawX, y: drawY, w: dw, h: dh });

        // Opponent preview (idle sprite at fight distance)
        const oppImg = opponentImgRef.current;
        if (oppImg && oppImg.complete) {
          const opp = GRUDA_ROSTER.find(c => c.id === opponentId);
          if (opp) {
            const oppFw = oppImg.width / Math.max(1, opp.idle[1]);
            const oppFh = oppImg.height;
            const oppBp = getBottomPadding(oppImg);
            const oppDw = oppFw * scale;
            const oppDh = oppFh * scale;
            const oppX = facingRight ? cx + 180 : cx - 180;
            const oppDrawX = oppX - oppDw / 2;
            const oppDrawY = cy - oppDh + oppBp * scale;
            ctx.save();
            ctx.globalAlpha = 0.5;
            // Flip opponent to face the main character
            if (facingRight) {
              ctx.translate(oppX, 0);
              ctx.scale(-1, 1);
              ctx.translate(-oppX, 0);
            }
            ctx.drawImage(oppImg, 0, 0, oppFw, oppFh, oppDrawX, oppDrawY, oppDw, oppDh);
            ctx.restore();
          }
        }

        // ─── Collision overlay ─────────────────────────────────────
        // Sizes match the GAME exactly: uses the same formula as createInitialFighter
        // then scaled to canvas via (canvasSize / gameSize) so boxes wrap the sprite correctly.
        if (showCollision) {
          const { scaleX: scX, scaleY: scY } = computeRenderScale(char);
          const colOv = charOv.collider;
          // Game-truth collision size (px in game world)
          const gameW = Math.round(80 * Math.max(0.6, Math.min(scX, 2.0))) * (colOv?.widthMult ?? 1.0);
          const gameH = Math.round(160 * Math.max(0.6, Math.min(scY, 2.0))) * (colOv?.heightMult ?? 1.0);
          // Scale factor: how many canvas pixels per game pixel
          // The sprite is drawn at (fw * scale) wide / (fh * scale) tall on canvas
          // In-game the sprite is drawn at ~300px base height * renderScaleY
          // So canvas-to-game ratio = (fh * scale) / (300 * scY)
          const canvasSpriteH = fh * scale;
          const gameSpriteH = 300 * scY; // drawHeight in GrudgeFighter2D
          const pxRatio = canvasSpriteH / gameSpriteH;
          // Collision rect in canvas space
          const colW = gameW * pxRatio;
          const colH = gameH * pxRatio;
          const facing = facingRight ? 1 : -1;

          // Game uses these exact fractions (headBox, bodyBox, legsBox in GrudgeFighter2D)
          const headR = { x: cx - colW * 0.3, y: cy - colH, w: colW * 0.6, h: colH * 0.25 };
          const bodyR = { x: cx - colW * 0.4, y: cy - colH * 0.75, w: colW * 0.8, h: colH * 0.4 };
          const legsR = { x: cx - colW * 0.35, y: cy - colH * 0.35, w: colW * 0.7, h: colH * 0.35 };
          hitRegionsRef.current.push({ id: "head", ...headR });
          hitRegionsRef.current.push({ id: "body", x: cx - colW / 2, y: cy - colH, w: colW, h: colH }); // full body for dragging
          hitRegionsRef.current.push({ id: "legs", ...legsR });

          // Body ellipse (game uses bodyEllipse: cx=fighter.x, cy=fighter.y-height/2, rx=width/2, ry=height/2)
          const eCx = cx;
          const eCy = cy - colH / 2;
          const eRx = colW / 2;
          const eRy = colH / 2;
          ctx.save();
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.ellipse(eCx, eCy, eRx, eRy, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = "#facc15";
          ctx.fill();
          ctx.restore();

          // Head zone
          ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.setLineDash([3, 3]);
          ctx.strokeRect(headR.x, headR.y, headR.w, headR.h);
          ctx.restore();
          // Body zone
          ctx.save(); ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.setLineDash([3, 3]);
          ctx.strokeRect(bodyR.x, bodyR.y, bodyR.w, bodyR.h);
          ctx.restore();
          // Legs zone
          ctx.save(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.setLineDash([3, 3]);
          ctx.strokeRect(legsR.x, legsR.y, legsR.w, legsR.h);
          ctx.restore();

          // Size label
          ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "9px monospace";
          ctx.fillText(`${Math.round(gameW)}×${Math.round(gameH)}`, eCx - eRx + 2, eCy - eRy + 10);

          // Weapon hitbox
          const isAttack = ["attack", "attack2", "special", "comboQ2", "comboQ3", "dashAttack", "cast"].includes(previewAnimKey ?? "");
          if (isAttack) {
            const slotOv = charOv.actions[previewAnimKey as ActionSlotKey];
            const slotHitFrame = slotOv?.hitFrame ?? DEFAULT_HIT_FRAME;
            const slotHitEnd = slotOv?.activeFrameEnd ?? slotHitFrame + 2;
            // Game weapon reach in game pixels, then scale to canvas
            const gameReach = colOv?.weaponReach ?? scX * 80;
            const atkReach = gameReach * pxRatio;
            const atkHeight = colH * 0.5;
            const isActiveHitFrame = frameRef.current >= slotHitFrame && frameRef.current <= slotHitEnd;
            // Game offsets weapon at +30px from center — scale that too
            const weaponOffset = 30 * pxRatio;
            const weaponX = facing > 0 ? cx + weaponOffset : cx - weaponOffset - atkReach;
            const weaponY = cy - colH * 0.78;
            const weaponAlpha = isActiveHitFrame ? 0.7 : 0.2;
            hitRegionsRef.current.push({ id: "weapon", x: weaponX, y: weaponY, w: atkReach, h: atkHeight });
            ctx.save();
            ctx.strokeStyle = isActiveHitFrame ? "#f472b6" : "#f472b650";
            ctx.lineWidth = 2;
            ctx.globalAlpha = weaponAlpha;
            ctx.strokeRect(weaponX, weaponY, atkReach, atkHeight);
            ctx.fillStyle = "#f472b6";
            ctx.globalAlpha = isActiveHitFrame ? 0.12 : 0.03;
            ctx.fillRect(weaponX, weaponY, atkReach, atkHeight);
            ctx.globalAlpha = weaponAlpha;
            ctx.font = "bold 9px monospace";
            ctx.fillText(isActiveHitFrame ? `WEAPON (HIT) ${Math.round(gameReach)}px` : `WEAPON ${Math.round(gameReach)}px`, weaponX + 2, weaponY + 10);
            ctx.restore();
          }

          // Foot position dot
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        }

        // VFX preview at weapon hitbox center
        if (showVfx && previewAnimKey) {
          const slot = previewAnimKey as ActionSlotKey;
          const slotOvVfx = charOv.actions[slot];
          const hitVfxId = slotOvVfx?.hitVfx;
          const swingVfxId = slotOvVfx?.swingVfx;
          if (hitVfxId || swingVfxId) {
            const { scaleX: vScX, scaleY: vScY } = computeRenderScale(char);
            const vGameH = Math.round(160 * Math.max(0.6, Math.min(vScY, 2.0))) * (charOv.collider?.heightMult ?? 1.0);
            const vPxRatio = (fh * scale) / (300 * vScY);
            const vColH = vGameH * vPxRatio;
            const vReach = (charOv.collider?.weaponReach ?? vScX * 80) * vPxRatio;
            const vOff = 30 * vPxRatio;
            const vCenterX = facingRight ? cx + vOff + vReach / 2 : cx - vOff - vReach / 2;
            const vCenterY = cy - vColH * 0.53;
            if (hitVfxId) {
              const vfx = getVfxById(hitVfxId);
              if (vfx) drawVfxFrame(ctx, vfx, Math.floor(frameRef.current * 0.7) % vfx.frames, vCenterX, vCenterY, 2.5, !facingRight);
            }
            if (swingVfxId) {
              const vfx = getVfxById(swingVfxId);
              if (vfx) drawVfxFrame(ctx, vfx, Math.floor(frameRef.current * 0.8) % vfx.frames, vCenterX, vCenterY + 15, 2, !facingRight);
            }
          }
        }
      }

      // Selection highlight (drawn on top of everything)
      const sel = selectedElementRef.current;
      if (sel) {
        const region = hitRegionsRef.current.find(r => r.id === sel);
        if (region) {
          ctx.save();
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.9;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(region.x - 1, region.y - 1, region.w + 2, region.h + 2);
          // Label
          ctx.fillStyle = "#fbbf24";
          ctx.globalAlpha = 0.7;
          ctx.font = "bold 9px monospace";
          ctx.setLineDash([]);
          ctx.fillText(sel.toUpperCase(), region.x, region.y - 4);
          ctx.restore();
        }
      }

      // Advance frame
      if (playing && img?.complete) {
        tickRef.current++;
        const holdTicks = Math.round(5 / speed);
        if (tickRef.current >= holdTicks) {
          tickRef.current = 0;
          frameRef.current = (frameRef.current + 1) % previewFrameCount;
          setFrame(frameRef.current);
        }
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [previewSrc, previewFrameCount, scale, playing, speed, showCollision, showOnion, showVfx, facingRight, char, charOv, previewAnimKey]);

  function isAttackAnim() {
    return previewAnimKey === "attack" || previewAnimKey === "attack2" || previewAnimKey === "special" || previewAnimKey === "cast";
  }

  // Frame scrubber: click to set frame
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const f = Math.floor(pct * totalFrames);
    frameRef.current = f;
    setFrame(f);
    setPlaying(false);
  };

  // Load opponent sprite
  useEffect(() => {
    if (!opponentId) { opponentImgRef.current = null; return; }
    const opp = GRUDA_ROSTER.find(c => c.id === opponentId);
    if (!opp) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { opponentImgRef.current = img; };
    img.src = `/fighter2d/characters/${opp.folder}/${opp.idle[0]}`;
    return () => { opponentImgRef.current = null; };
  }, [opponentId]);

  // Keyboard: arrow keys step frames, Ctrl+Z/Y undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { frameRef.current = (frameRef.current + 1) % totalFrames; setFrame(frameRef.current); setPlaying(false); }
      if (e.key === "ArrowLeft") { frameRef.current = (frameRef.current - 1 + totalFrames) % totalFrames; setFrame(frameRef.current); setPlaying(false); }
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undoStackRef.current.pop();
        if (prev) {
          redoStackRef.current.push(JSON.stringify(overrides));
          setOverrides(JSON.parse(prev));
          showToast("Undo");
        }
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        const next = redoStackRef.current.pop();
        if (next) {
          undoStackRef.current.push(JSON.stringify(overrides));
          setOverrides(JSON.parse(next));
          showToast("Redo");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalFrames, overrides, showToast]);

  // Save all
  const saveAll = async () => {
    setServerStatus("saving");
    for (const [id, ov] of Object.entries(overrides)) {
      if (Object.keys(ov.actions).length > 0 || ov.stats || ov.projectile || ov.effectSrc) {
        setCharOverrides(id, ov);
      }
    }
    const ok = await saveOverridesToServer(overrides);
    setServerStatus(ok ? "saved" : "offline");
    showToast(ok ? "Saved to server + local" : "Saved locally (server offline)");
    setTimeout(() => setServerStatus(""), 3000);
  };

  const resetChar = () => {
    deleteCharOverrides(selectedId);
    const newOv = { ...overrides };
    delete newOv[selectedId];
    setOverrides(newOv);
    showToast(`${char.name} reset`);
  };

  const handleExport = () => {
    const blob = new Blob([exportAllOverrides()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "grudge-char-config.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      file.text().then(text => {
        if (importOverrides(text)) { setOverrides(loadOverrides()); showToast("Imported"); }
        else showToast("Invalid file");
      });
    };
    input.click();
  };

  // Slot override helpers (with undo)
  const setSlotAnim = (slot: ActionSlotKey, file: string, frames: number) => {
    pushUndo();
    const newOv = { ...overrides };
    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
    newOv[selectedId].actions[slot] = { file, frames, hold: autoHold(frames), loop: slot === "idle" || slot === "walk" };
    setOverrides(newOv);
  };
  const setSlotField = (slot: ActionSlotKey, field: string, value: any) => {
    pushUndo();
    const newOv = { ...overrides };
    const current = getSlotAnim(slot);
    if (!current) return;
    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
    newOv[selectedId].actions[slot] = { ...current, [field]: value };
    setOverrides(newOv);
  };
  const setColliderField = (field: string, value: number) => {
    pushUndo();
    const newOv = { ...overrides };
    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
    newOv[selectedId].collider = { ...newOv[selectedId].collider, [field]: value };
    setOverrides(newOv);
  };

  // VFX list
  const vfxList = vfxSearch
    ? searchVfx(vfxSearch)
    : vfxTab === "all" ? getAllVfx() : getAllVfx().filter(v => v.categories.includes(vfxTab));
  const categories = ["all", ...getVfxCategories()];

  return (
    <div className="min-h-screen bg-black text-white select-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-zinc-950">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/40 hover:text-white text-xs">Back to Game</button>
          <span className="text-red-500 font-bold tracking-wider">TOON ADMIN PRO</span>
          <span className="text-white/20 text-[10px]">Sprite Animation Studio</span>
          {serverStatus === "saved" && <span className="text-emerald-400 text-[10px]">Server synced</span>}
          {serverStatus === "saving" && <span className="text-amber-400 text-[10px]">Saving...</span>}
          {serverStatus === "offline" && <span className="text-red-400 text-[10px]">Offline (local only)</span>}
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleImport} className="px-2 py-1 text-[10px] bg-zinc-800 border border-white/10 rounded hover:bg-zinc-700">Import</button>
          <button onClick={handleExport} className="px-2 py-1 text-[10px] bg-zinc-800 border border-white/10 rounded hover:bg-zinc-700">Export</button>
          <button onClick={saveAll} className="px-3 py-1 text-[10px] bg-red-700 rounded hover:bg-red-600 font-bold">Save All</button>
        </div>
      </div>

      <div className="flex" style={{ height: "calc(100vh - 40px)" }}>
        {/* Left: Hierarchy */}
        <div className="w-52 border-r border-white/10 overflow-y-auto bg-zinc-950 flex-shrink-0">
          {/* TOONS section */}
          <button onClick={() => toggleGroup("toons")} className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] text-white/30 uppercase tracking-widest hover:bg-white/5 font-bold">
            <span className="text-[8px]">{expandedGroups.has("toons") ? "▼" : "▶"}</span>
            TOONS ({GRUDA_ROSTER.length})
          </button>
          {expandedGroups.has("toons") && FACTION_IDS.map(fid => {
            const fac = getFaction(fid);
            const chars = GRUDA_ROSTER.filter(c => c.faction === fid);
            return (
              <div key={fid}>
                <button onClick={() => toggleGroup(fid)}
                  className="w-full flex items-center gap-1.5 px-3 py-1 text-[10px] hover:bg-white/5"
                  style={{ color: fac.colorPrimary + "aa" }}>
                  <span className="text-[8px]">{expandedGroups.has(fid) ? "▼" : "▶"}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: fac.colorPrimary }} />
                  {fac.name} ({chars.length})
                </button>
                {expandedGroups.has(fid) && chars.map(c => (
                  <button key={c.id}
                    onClick={() => { setSelectedId(c.id); setSelectedMapId(null); setPreviewAnimKey(null); frameRef.current = 0; }}
                    className={`w-full text-left pl-7 pr-2 py-1 text-[11px] flex items-center gap-1.5 ${
                      selectedId === c.id && !selectedMapId
                        ? "bg-red-900/30 border-l-2 border-red-500 text-white"
                        : "hover:bg-white/5 text-white/50 border-l-2 border-transparent"
                    }`}>
                    <span className="truncate">{c.name}</span>
                    {overrides[c.id] && <span className="text-red-400 text-[8px] ml-auto">M</span>}
                  </button>
                ))}
              </div>
            );
          })}

          {/* MAPS section */}
          <button onClick={() => toggleGroup("maps")} className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] text-white/30 uppercase tracking-widest hover:bg-white/5 font-bold mt-1 border-t border-white/5 pt-2">
            <span className="text-[8px]">{expandedGroups.has("maps") ? "▼" : "▶"}</span>
            MAPS ({EDITOR_STAGES.length})
          </button>
          {expandedGroups.has("maps") && EDITOR_STAGES.map(s => (
            <button key={s.id}
              onClick={() => { setSelectedMapId(s.id); showToast(`Map: ${s.name}`); }}
              className={`w-full text-left pl-5 pr-2 py-1 text-[11px] flex items-center gap-1.5 ${
                selectedMapId === s.id
                  ? "bg-amber-900/20 border-l-2 border-amber-500 text-amber-300"
                  : "hover:bg-white/5 text-white/40 border-l-2 border-transparent"
              }`}>
              <span className="text-[9px]">◆</span>
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>

        {/* Center: Canvas Stage */}
        <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
          {/* Controls bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border-b border-white/5 text-[10px]">
            <button onClick={() => setPlaying(!playing)} className="px-2 py-0.5 bg-zinc-800 rounded hover:bg-zinc-700">
              {playing ? "Pause" : "Play"}
            </button>
            <span className="text-white/30">F{frame + 1}/{totalFrames}</span>
            <span className="text-white/20">|</span>
            {[0.25, 0.5, 1, 2].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${speed === s ? "bg-red-700 text-white" : "bg-zinc-800 text-white/50 hover:bg-zinc-700"}`}>
                {s}x
              </button>
            ))}
            <span className="text-white/20">|</span>
            <label className="flex items-center gap-1 text-white/40 cursor-pointer">
              <input type="checkbox" checked={showCollision} onChange={e => setShowCollision(e.target.checked)} className="accent-red-500" />
              Collision
            </label>
            <label className="flex items-center gap-1 text-white/40 cursor-pointer">
              <input type="checkbox" checked={showOnion} onChange={e => setShowOnion(e.target.checked)} className="accent-amber-500" />
              Onion
            </label>
            <label className="flex items-center gap-1 text-white/40 cursor-pointer">
              <input type="checkbox" checked={showVfx} onChange={e => setShowVfx(e.target.checked)} className="accent-sky-500" />
              VFX
            </label>
            <button onClick={() => setFacingRight(f => !f)}
              className={`px-2 py-0.5 rounded ${facingRight ? "bg-zinc-800 text-white/50" : "bg-purple-700 text-white"}`}>
              {facingRight ? "Face →" : "Face ←"}
            </button>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-white/30">Scale</span>
              <input type="range" min={1} max={8} step={0.5} value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-16 accent-red-500" />
              <span className="text-white/50 w-6">{scale}x</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onContextMenu={e => e.preventDefault()}
              className="border border-white/5 rounded cursor-crosshair" style={{ imageRendering: "pixelated" }} />
          </div>

          {/* Frame scrubber timeline */}
          <div className="px-3 py-2 bg-black/40 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-white/30 font-bold">{char.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: faction.colorPrimary + "30", color: faction.colorPrimary }}>{faction.name}</span>
              <span className="text-[9px] text-white/20">{char.frameSize}px</span>
              <span className="text-[9px] text-white/20">ATK {char.atk} SPD {char.spd}</span>
              {selectedElement && <span className="text-amber-400 text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">⬡ {selectedElement}</span>}
              {previewAnimKey && <span className="text-red-400 text-[9px] ml-auto">{previewAnimKey}</span>}
            </div>
            <div className="h-6 bg-zinc-800 rounded cursor-pointer relative" onClick={handleScrubberClick}>
              {/* Frame markers — hit frame highlighted for attack anims */}
              {Array.from({ length: totalFrames }, (_, i) => {
                const slotOvTimeline = previewAnimKey ? charOv.actions[previewAnimKey as ActionSlotKey] : undefined;
                const hitStart = slotOvTimeline?.hitFrame ?? DEFAULT_HIT_FRAME;
                const hitEnd = slotOvTimeline?.activeFrameEnd ?? hitStart + 2;
                const isAtkAnim = ["attack", "attack2", "special", "comboQ2", "comboQ3", "dashAttack", "cast"].includes(previewAnimKey ?? "");
                const isInHitWindow = isAtkAnim && i >= hitStart && i <= hitEnd;
                const isHitStart = isAtkAnim && i === hitStart;
                return (
                <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / totalFrames) * 100}%`, width: `${100 / totalFrames}%` }}>
                  <div className={`h-full border-r border-white/10 ${i === frame ? "bg-red-500/30" : isInHitWindow ? "bg-pink-500/20" : "hover:bg-white/5"}`} />
                  {isInHitWindow && <div className="absolute top-0 left-0 w-full h-1 bg-pink-500/60" title={isHitStart ? "Hit start" : "Active"} />}
                </div>
                );
              })}
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${(frame / Math.max(1, totalFrames)) * 100}%` }} />
            </div>
      <div className="text-[8px] text-white/20 mt-0.5">Arrow keys: step frames | Space: play/pause | LMB: select | RMB: context menu</div>
          </div>

          {/* Animation strip */}
          <div className="bg-zinc-950 border-t border-white/10 p-2 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {charAnims.map(a => (
                <button key={a.key} onClick={() => { setPreviewAnimKey(a.key); frameRef.current = 0; setFrame(0); }}
                  className={`flex-shrink-0 border rounded px-1.5 py-1 text-center ${previewAnimKey === a.key ? "border-red-500 bg-red-500/10" : "border-white/10 bg-zinc-900 hover:border-white/20"}`}>
                  <div className="text-[9px] text-white/50 truncate w-14">{a.key}</div>
                  <div className="text-[8px] text-white/25">{a.frames}f</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Action Mapping + VFX Browser */}
        <div className="w-72 border-l border-white/10 overflow-y-auto bg-zinc-950 flex-shrink-0">
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-widest">Action Mapping</span>
            <button onClick={resetChar} className="text-[10px] text-red-400 hover:text-red-300">Reset</button>
          </div>

          {SLOT_GROUPS.map(group => (
            <div key={group}>
              <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest border-b border-white/5" style={{ color: GROUP_COLORS[group], background: GROUP_COLORS[group] + "08" }}>
                {GROUP_LABELS[group]}
              </div>
              {ACTION_SLOTS.filter(s => s.group === group).map(slot => {
                const current = getSlotAnim(slot.key);
                const isOv = !!charOv.actions[slot.key];
                const isAttackSlot = ["attack", "attack2", "comboQ2", "comboQ3", "dashAttack", "special", "cast", "block", "rescueRoll"].includes(slot.key);
                const isComboSlot = ["attack", "comboQ2", "comboQ3"].includes(slot.key);
                const isBlockSlot = slot.key === "block";
                return (
                  <div key={slot.key} className="border-b border-white/5 px-2 py-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[10px] font-bold ${slot.required ? "text-white/70" : "text-white/30"}`}>{slot.label}</span>
                      {isOv && <span className="text-[8px] text-red-400">mod</span>}
                    </div>
                    <select value={current?.file ?? ""} onChange={e => { const a = charAnims.find(x => x.file === e.target.value); if (a) setSlotAnim(slot.key, a.file, a.frames); }}
                      className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white/70 mb-1">
                      <option value="">-- none --</option>
                      {charAnims.map(a => <option key={a.file} value={a.file}>{a.key} ({a.file}, {a.frames}f)</option>)}
                    </select>
                    {current && (
                      <>
                        <div className="flex items-center gap-2 text-[9px] mb-1">
                          <label className="flex items-center gap-0.5 text-white/30">
                            Hold <input type="number" min={1} max={20} value={current.hold} onChange={e => setSlotField(slot.key, "hold", parseInt(e.target.value) || 5)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                          </label>
                          <label className="flex items-center gap-0.5 text-white/30 cursor-pointer">
                            <input type="checkbox" checked={current.loop} onChange={e => setSlotField(slot.key, "loop", e.target.checked)} className="accent-red-500" /> Loop
                          </label>
                          <button onClick={() => { setPreviewAnimKey(slot.key); frameRef.current = 0; }} className="ml-auto text-red-400 hover:text-red-300">Preview</button>
                        </div>
                        {/* Advanced maneuver fields */}
                        {(isComboSlot || isBlockSlot || slot.key === "dashAttack" || slot.key === "rescueRoll") && (
                          <div className="flex flex-wrap gap-1.5 text-[8px] mb-1">
                            {isComboSlot && (
                              <label className="flex items-center gap-0.5 text-amber-400/60">
                                Fwd px <input type="number" min={0} max={30} value={current.forwardMotion ?? 0} onChange={e => setSlotField(slot.key, "forwardMotion", parseInt(e.target.value) || 0)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                              </label>
                            )}
                            {isComboSlot && (
                              <label className="flex items-center gap-0.5 text-amber-400/60">
                                Combo ms <input type="number" min={0} max={1000} step={50} value={current.comboWindow ?? 300} onChange={e => setSlotField(slot.key, "comboWindow", parseInt(e.target.value) || 300)} className="w-12 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                              </label>
                            )}
                            {isBlockSlot && (
                              <>
                                <label className="flex items-center gap-0.5 text-emerald-400/60">
                                  Freeze F# <input type="number" min={0} max={30} value={current.freezeFrame ?? Math.floor((current.frames || 1) * 0.5)} onChange={e => setSlotField(slot.key, "freezeFrame", parseInt(e.target.value) || 0)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                                </label>
                                <label className="flex items-center gap-0.5 text-emerald-400/60 cursor-pointer">
                                  <input type="checkbox" checked={current.reverseOnEnd ?? true} onChange={e => setSlotField(slot.key, "reverseOnEnd", e.target.checked)} className="accent-emerald-500" /> Reverse
                                </label>
                              </>
                            )}
                            {(slot.key === "dashAttack" || slot.key === "rescueRoll") && (
                              <label className="flex items-center gap-0.5 text-sky-400/60">
                                Fwd px <input type="number" min={0} max={50} value={current.forwardMotion ?? 0} onChange={e => setSlotField(slot.key, "forwardMotion", parseInt(e.target.value) || 0)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                              </label>
                            )}
                          </div>
                        )}
                        {/* Hit frame + damage/knockback for attack slots */}
                        {isAttackSlot && (
                          <div className="flex flex-wrap gap-1.5 text-[8px] mb-1">
                            <label className="flex items-center gap-0.5 text-pink-400/60">
                              Hit F# <input type="number" min={0} max={30} value={current.hitFrame ?? DEFAULT_HIT_FRAME} onChange={e => setSlotField(slot.key, "hitFrame", parseInt(e.target.value) || DEFAULT_HIT_FRAME)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                            </label>
                            <label className="flex items-center gap-0.5 text-pink-400/60">
                              End F# <input type="number" min={0} max={30} value={current.activeFrameEnd ?? (current.hitFrame ?? DEFAULT_HIT_FRAME) + 2} onChange={e => setSlotField(slot.key, "activeFrameEnd", parseInt(e.target.value) || (current.hitFrame ?? DEFAULT_HIT_FRAME) + 2)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                            </label>
                            <label className="flex items-center gap-0.5 text-orange-400/60">
                              Dmg× <input type="number" min={0.1} max={5} step={0.1} value={current.damageMult ?? 1.0} onChange={e => setSlotField(slot.key, "damageMult", parseFloat(e.target.value) || 1.0)} className="w-10 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                            </label>
                            <label className="flex items-center gap-0.5 text-cyan-400/60">
                              KB
                              <select value={current.knockbackAngle ?? "neutral"} onChange={e => setSlotField(slot.key, "knockbackAngle", e.target.value as KnockbackAngle)}
                                className="bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60">
                                <option value="neutral">neutral</option>
                                <option value="up">up</option>
                                <option value="down">down</option>
                                <option value="spike">spike</option>
                                <option value="forward">forward</option>
                              </select>
                            </label>
                          </div>
                        )}
                        {/* VFX assignment for attack/special slots */}
                        {isAttackSlot && (() => {
                          const defaults = getDefaultVfx(selectedId, slot.key);
                          const currentHit = charOv.actions[slot.key]?.hitVfx ?? defaults.hit ?? "";
                          const currentSwing = charOv.actions[slot.key]?.swingVfx ?? defaults.swing ?? "";
                          return (
                          <div className="flex gap-1">
                            <select value={currentHit} onChange={e => setSlotField(slot.key, "hitVfx", e.target.value || undefined)}
                              className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[8px] text-white/40">
                              <option value="">-- hit VFX --</option>
                              {getAllVfx().filter(v => v.categories.includes("impact") || v.categories.includes("melee")).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <select value={currentSwing} onChange={e => setSlotField(slot.key, "swingVfx", e.target.value || undefined)}
                              className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[8px] text-white/40">
                              <option value="">-- swing VFX --</option>
                              {getAllVfx().filter(v => v.categories.includes("melee") || v.categories.includes("fire") || v.categories.includes("cast") || v.categories.includes("impact")).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                          </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Stats */}
          <div className="p-2 border-t border-white/10">
            <div className="text-[10px] text-white/20 uppercase mb-1">Stats</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: "atk", label: "ATK", def: char.atk },
                { key: "spd", label: "SPD", def: char.spd, step: 0.1 },
                { key: "superDmg", label: "Super", def: char.superDmg },
              ].map(s => (
                <label key={s.key} className="text-[9px] text-white/30">
                  {s.label}
                  <input type="number" step={s.step ?? 1} value={(charOv.stats as any)?.[s.key] ?? s.def}
                    onChange={e => {
                      pushUndo();
                      const newOv = { ...overrides };
                      if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                      newOv[selectedId].stats = { ...newOv[selectedId].stats, [s.key]: parseFloat(e.target.value) || s.def };
                      setOverrides(newOv);
                    }}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-1.5 py-0.5 text-white/60 text-[10px] mt-0.5" />
                </label>
              ))}
            </div>
          </div>

          {/* Collider Overrides */}
          <div className="p-2 border-t border-white/10">
            <div className="text-[10px] text-white/20 uppercase mb-1">Collider</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: "widthMult", label: "Width×", def: 1.0 },
                { key: "heightMult", label: "Height×", def: 1.0 },
                { key: "weaponReach", label: "Weapon", def: Math.round(computeRenderScale(char).scaleX * 80) },
                { key: "headScale", label: "Head×", def: 1.0 },
                { key: "bodyScale", label: "Body×", def: 1.0 },
                { key: "legsScale", label: "Legs×", def: 1.0 },
              ].map(s => (
                <label key={s.key} className="text-[9px] text-white/30">
                  {s.label}
                  <input type="number" step={0.05} value={(charOv.collider as any)?.[s.key] ?? s.def}
                    onChange={e => setColliderField(s.key, parseFloat(e.target.value) || s.def)}
                    className="w-full bg-zinc-800 border border-white/10 rounded px-1.5 py-0.5 text-white/60 text-[10px] mt-0.5" />
                </label>
              ))}
            </div>
          </div>

          {/* Opponent Preview */}
          <div className="p-2 border-t border-white/10">
            <div className="text-[10px] text-white/20 uppercase mb-1">Opponent Preview</div>
            <select value={opponentId ?? ""} onChange={e => setOpponentId(e.target.value || null)}
              className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white/60">
              <option value="">-- none --</option>
              {GRUDA_ROSTER.filter(c => c.id !== selectedId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* VFX Browser */}
          <div className="p-2 border-t border-white/10">
            <div className="text-[10px] text-white/20 uppercase mb-1">VFX Browser ({getAllVfx().length})</div>
            <input type="text" placeholder="Search VFX..." value={vfxSearch} onChange={e => setVfxSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white/60 mb-1.5" />
            <div className="flex flex-wrap gap-1 mb-2">
              {categories.slice(0, 12).map(cat => (
                <button key={cat} onClick={() => { setVfxTab(cat); setVfxSearch(""); }}
                  className={`px-1.5 py-0.5 rounded text-[8px] ${vfxTab === cat ? "bg-red-700 text-white" : "bg-zinc-800 text-white/40 hover:bg-zinc-700"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-60 overflow-y-auto">
              {vfxList.slice(0, 60).map(v => (
                <button key={v.id}
                  draggable
                  onDragStart={() => setDragVfxId(v.id)}
                  onDragEnd={() => setDragVfxId(null)}
                  onClick={() => showToast(`${v.name}: ${v.frames}f [${v.categories.join(",")}]`)}
                  className={`border rounded p-1 bg-zinc-900 text-center cursor-grab active:cursor-grabbing ${
                    dragVfxId === v.id ? "border-red-500 bg-red-500/10" : "border-white/10 hover:border-red-500/50"
                  }`}>
                  <div className="text-[8px] text-white/50 truncate">{v.name}</div>
                  <div className="text-[7px] text-white/20">{v.frames}f</div>
                </button>
              ))}
            </div>
            {dragVfxId && <div className="text-[8px] text-amber-400/60 mt-1">Drag onto an attack slot to assign as VFX</div>}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div className="fixed z-[60] min-w-[180px] max-h-[400px] overflow-y-auto bg-zinc-900 border border-white/15 rounded-lg shadow-2xl py-1 text-[11px]"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
          onClick={e => e.stopPropagation()}>
          {/* Element header */}
          {contextMenu.element && (
            <div className="px-3 py-1 text-[9px] text-amber-400/70 uppercase tracking-widest border-b border-white/5 mb-0.5 font-bold">
              ⬡ {contextMenu.element}
            </div>
          )}

          {/* Sprite/null: show animation quick-switch */}
          {(contextMenu.element === "sprite" || contextMenu.element === null) && (
            <>
              <div className="px-3 py-0.5 text-[8px] text-white/20 uppercase">Animations</div>
              {charAnims.map(a => (
                <button key={a.key} onClick={() => { setPreviewAnimKey(a.key); frameRef.current = 0; setFrame(0); setContextMenu(p => ({ ...p, visible: false })); }}
                  className={`w-full text-left px-3 py-1 hover:bg-white/10 flex items-center justify-between ${
                    previewAnimKey === a.key ? "text-red-400" : "text-white/60"
                  }`}>
                  <span>▶ {a.key}</span>
                  <span className="text-white/20 text-[9px]">{a.frames}f</span>
                </button>
              ))}
              <div className="border-t border-white/5 my-0.5" />
            </>
          )}

          {/* Weapon: attack-related actions */}
          {contextMenu.element === "weapon" && (
            <>
              <button onClick={() => { setPreviewAnimKey("attack"); frameRef.current = 0; setContextMenu(p => ({ ...p, visible: false })); }}
                className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">▶ Preview Attack</button>
              {charAnims.find(a => a.key === "attack2") && (
                <button onClick={() => { setPreviewAnimKey("attack2"); frameRef.current = 0; setContextMenu(p => ({ ...p, visible: false })); }}
                  className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">▶ Preview Attack2</button>
              )}
              {charAnims.find(a => a.key === "special") && (
                <button onClick={() => { setPreviewAnimKey("special"); frameRef.current = 0; setContextMenu(p => ({ ...p, visible: false })); }}
                  className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">▶ Preview Special</button>
              )}
              <div className="border-t border-white/5 my-0.5" />
            </>
          )}

          {/* Collision zone info */}
          {(contextMenu.element === "head" || contextMenu.element === "body" || contextMenu.element === "legs") && (
            <>
              <div className="px-3 py-1 text-white/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: contextMenu.element === "head" ? "#ef4444" : contextMenu.element === "body" ? "#22c55e" : "#3b82f6" }} />
                {contextMenu.element.toUpperCase()} Hitzone
              </div>
              <div className="border-t border-white/5 my-0.5" />
            </>
          )}

          {/* Platform / floor info */}
          {(contextMenu.element === "platform" || contextMenu.element === "floor") && (
            <>
              <div className="px-3 py-1 text-white/40">
                {contextMenu.element === "platform" ? `Platform @ Y${PLATFORM_Y}` : `Floor @ Y${FLOOR_Y}`}
              </div>
              <div className="border-t border-white/5 my-0.5" />
            </>
          )}

          {/* Common toggle actions */}
          <button onClick={() => { setShowCollision(!showCollision); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">
            {showCollision ? "☑" : "☐"} Collision Overlay
          </button>
          <button onClick={() => { setShowOnion(!showOnion); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">
            {showOnion ? "☑" : "☐"} Onion Skin
          </button>
          <button onClick={() => { setShowVfx(!showVfx); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/60">
            {showVfx ? "☑" : "☐"} VFX Preview
          </button>

          <div className="border-t border-white/5 my-0.5" />

          {/* Danger zone */}
          <button onClick={() => { resetChar(); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-3 py-1 hover:bg-red-900/30 text-red-400">
            Reset {char.name}
          </button>
          <button onClick={() => { setSelectedElement(null); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-3 py-1 hover:bg-white/10 text-white/40">
            Deselect
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-3 right-3 bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded text-[11px] font-bold z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
