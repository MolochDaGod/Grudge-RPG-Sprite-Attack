import { useCallback, useEffect, useRef, useState } from "react";
import { GRUDA_ROSTER, type GrudaCharDef } from "@/lib/grudaRoster";
import { ACTION_SLOTS, type ActionSlotKey, type CharOverrides, loadOverrides, setCharOverrides, deleteCharOverrides, exportAllOverrides, importOverrides, saveOverridesToServer } from "@/lib/charConfig";
import { getAllVfx, getVfxCategories, searchVfx, preloadVfx, getVfxById, getVfxImage, drawVfxFrame, type VfxDef } from "@/lib/vfxLibrary";
import { getFaction } from "@/lib/factions";

// ─── Helpers ─────────────────────────────────────────────────────
function getCharAnims(char: GrudaCharDef): { key: string; file: string; frames: number }[] {
  const anims: { key: string; file: string; frames: number }[] = [];
  const add = (key: string, val?: [string, number]) => { if (val) anims.push({ key, file: val[0], frames: val[1] }); };
  add("idle", char.idle); add("walk", char.walk); add("attack", char.attack); add("fall", char.fall);
  add("hurt", char.hurt); add("death", char.death);
  add("attack2", char.attack2); add("block", char.block); add("jump", char.jump);
  add("cast", char.cast); add("special", char.special); add("roll", char.roll);
  return anims;
}

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
const STAGE_W = 800;
const STAGE_H = 500;
const GRID_SIZE = 40;
const FLOOR_Y = 380;
const PLATFORM_Y = 260;
const PLATFORM_W = 200;
const PLATFORM_X = 300;

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
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

  // Current animation source
  const getSlotAnim = (slot: ActionSlotKey) => {
    const ov = charOv.actions[slot];
    if (ov) return ov;
    const def = (char as any)[slot] as [string, number] | undefined;
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

      // Platform
      ctx.fillStyle = "#3a5a3a";
      ctx.fillRect(PLATFORM_X, PLATFORM_Y, PLATFORM_W, 5);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(PLATFORM_X, PLATFORM_Y, PLATFORM_W, 2);

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

        // Current frame
        ctx.drawImage(img, frameRef.current * fw, 0, fw, fh, drawX, drawY, dw, dh);

        // Collision overlay
        if (showCollision) {
          const isSmall = char.frameSize <= 100;
          const scY = char.renderScaleY ?? char.renderScale ?? (isSmall ? 2 : 1);
          const scX = char.renderScaleX ?? (char.renderScale !== undefined && isSmall ? (char.renderScale ?? 1) * 0.75 : (char.renderScale ?? (isSmall ? 1.5 : 1)));
          const colW = Math.round(80 * Math.max(0.6, Math.min(scX, 2.0)));
          const colH = Math.round(160 * Math.max(0.6, Math.min(scY, 2.0)));
          const eCx = cx;
          const eCy = cy - colH / 2;
          const eRx = colW / 2;
          const eRy = colH / 2;

          // Body ellipse
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
          ctx.save();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.35;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(cx - colW * 0.3, cy - colH, colW * 0.6, colH * 0.25);
          ctx.restore();

          // Body zone
          ctx.save();
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.35;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(cx - colW * 0.4, cy - colH * 0.75, colW * 0.8, colH * 0.4);
          ctx.restore();

          // Legs zone
          ctx.save();
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.35;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(cx - colW * 0.35, cy - colH * 0.35, colW * 0.7, colH * 0.35);
          ctx.restore();

          // Weapon hitbox (attack frames only)
          const isAttack = previewAnimKey === "attack" || previewAnimKey === "attack2" || previewAnimKey === "special";
          if (isAttack) {
            const atkReach = scX * 80;
            ctx.save();
            ctx.strokeStyle = "#f472b6";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.strokeRect(cx + 30, cy - colH * 0.78, atkReach, colH * 0.5);
            ctx.fillStyle = "#f472b6";
            ctx.globalAlpha = 0.08;
            ctx.fillRect(cx + 30, cy - colH * 0.78, atkReach, colH * 0.5);
            ctx.globalAlpha = 0.6;
            ctx.font = "bold 9px monospace";
            ctx.fillText("WEAPON", cx + 32, cy - colH * 0.78 + 10);
            ctx.restore();
          }

          // Foot dot
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();

          // Labels
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "9px monospace";
          ctx.fillText("body", eCx - eRx + 2, eCy - eRy + 10);
        }

        // VFX preview
        if (showVfx && isAttackAnim()) {
          const slot = previewAnimKey as ActionSlotKey;
          const slotOv = charOv.actions[slot];
          const hitVfxId = slotOv?.hitVfx;
          const swingVfxId = slotOv?.swingVfx;
          if (hitVfxId) {
            const vfx = getVfxById(hitVfxId);
            if (vfx) {
              const vfxFrame = Math.floor(frameRef.current * 0.7) % vfx.frames;
              drawVfxFrame(ctx, vfx, vfxFrame, cx + 60, cy - 80, 2.5, false);
            }
          }
          if (swingVfxId) {
            const vfx = getVfxById(swingVfxId);
            if (vfx) {
              const vfxFrame = Math.floor(frameRef.current * 0.8) % vfx.frames;
              drawVfxFrame(ctx, vfx, vfxFrame, cx + 40, cy - 60, 2, false);
            }
          }
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
  }, [previewSrc, previewFrameCount, scale, playing, speed, showCollision, showOnion, showVfx, char, charOv, previewAnimKey]);

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

  // Keyboard: arrow keys step frames
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { frameRef.current = (frameRef.current + 1) % totalFrames; setFrame(frameRef.current); setPlaying(false); }
      if (e.key === "ArrowLeft") { frameRef.current = (frameRef.current - 1 + totalFrames) % totalFrames; setFrame(frameRef.current); setPlaying(false); }
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalFrames]);

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

  // Slot override helpers
  const setSlotAnim = (slot: ActionSlotKey, file: string, frames: number) => {
    const newOv = { ...overrides };
    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
    newOv[selectedId].actions[slot] = { file, frames, hold: autoHold(frames), loop: slot === "idle" || slot === "walk" };
    setOverrides(newOv);
  };
  const setSlotField = (slot: ActionSlotKey, field: string, value: any) => {
    const newOv = { ...overrides };
    const current = getSlotAnim(slot);
    if (!current) return;
    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
    newOv[selectedId].actions[slot] = { ...current, [field]: value };
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
        {/* Left: Hero list */}
        <div className="w-48 border-r border-white/10 overflow-y-auto bg-zinc-950 flex-shrink-0">
          <div className="p-1.5 text-[10px] text-white/20 uppercase tracking-widest">Heroes ({GRUDA_ROSTER.length})</div>
          {GRUDA_ROSTER.map(c => {
            const f = getFaction(c.faction);
            return (
              <button key={c.id} onClick={() => { setSelectedId(c.id); setPreviewAnimKey(null); frameRef.current = 0; }}
                className={`w-full text-left px-2 py-1.5 text-[11px] flex items-center gap-1.5 ${selectedId === c.id ? "bg-red-900/30 border-l-2 border-red-500 text-white" : "hover:bg-white/5 text-white/50 border-l-2 border-transparent"}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.colorPrimary }} />
                <span className="truncate">{c.name}</span>
                {overrides[c.id] && <span className="text-red-400 text-[8px] ml-auto">M</span>}
              </button>
            );
          })}
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
            <div className="ml-auto flex items-center gap-1">
              <span className="text-white/30">Scale</span>
              <input type="range" min={1} max={8} step={0.5} value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-16 accent-red-500" />
              <span className="text-white/50 w-6">{scale}x</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} className="border border-white/5 rounded" style={{ imageRendering: "pixelated" }} />
          </div>

          {/* Frame scrubber timeline */}
          <div className="px-3 py-2 bg-black/40 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-white/30 font-bold">{char.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: faction.colorPrimary + "30", color: faction.colorPrimary }}>{faction.name}</span>
              <span className="text-[9px] text-white/20">{char.frameSize}px</span>
              <span className="text-[9px] text-white/20">ATK {char.atk} SPD {char.spd}</span>
              {previewAnimKey && <span className="text-red-400 text-[9px] ml-auto">{previewAnimKey}</span>}
            </div>
            <div className="h-6 bg-zinc-800 rounded cursor-pointer relative" onClick={handleScrubberClick}>
              {/* Frame markers */}
              {Array.from({ length: totalFrames }, (_, i) => (
                <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / totalFrames) * 100}%`, width: `${100 / totalFrames}%` }}>
                  <div className={`h-full border-r border-white/10 ${i === frame ? "bg-red-500/30" : "hover:bg-white/5"}`} />
                </div>
              ))}
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${(frame / Math.max(1, totalFrames)) * 100}%` }} />
            </div>
            <div className="text-[8px] text-white/20 mt-0.5">Arrow keys: step frames | Space: play/pause</div>
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

          {ACTION_SLOTS.map(slot => {
            const current = getSlotAnim(slot.key);
            const isOv = !!charOv.actions[slot.key];
            return (
              <div key={slot.key} className="border-b border-white/5 px-2 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase ${slot.required ? "text-white/70" : "text-white/30"}`}>{slot.label}</span>
                  {isOv && <span className="text-[8px] text-red-400">mod</span>}
                </div>
                <select value={current?.file ?? ""} onChange={e => { const a = charAnims.find(x => x.file === e.target.value); if (a) setSlotAnim(slot.key, a.file, a.frames); }}
                  className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white/70 mb-1">
                  <option value="">-- none --</option>
                  {charAnims.map(a => <option key={a.file} value={a.file}>{a.key} ({a.file}, {a.frames}f)</option>)}
                </select>
                {current && (
                  <div className="flex items-center gap-2 text-[9px]">
                    <label className="flex items-center gap-0.5 text-white/30">
                      Hold <input type="number" min={1} max={20} value={current.hold} onChange={e => setSlotField(slot.key, "hold", parseInt(e.target.value) || 5)} className="w-8 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/60 text-center" />
                    </label>
                    <label className="flex items-center gap-0.5 text-white/30 cursor-pointer">
                      <input type="checkbox" checked={current.loop} onChange={e => setSlotField(slot.key, "loop", e.target.checked)} className="accent-red-500" /> Loop
                    </label>
                    <button onClick={() => { setPreviewAnimKey(slot.key); frameRef.current = 0; }} className="ml-auto text-red-400 hover:text-red-300">Preview</button>
                  </div>
                )}
                {/* VFX assignment for attack slots */}
                {["attack", "attack2", "special", "cast", "block"].includes(slot.key) && current && (
                  <div className="mt-1 flex gap-1">
                    <select value={charOv.actions[slot.key]?.hitVfx ?? ""} onChange={e => setSlotField(slot.key, "hitVfx", e.target.value || undefined)}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[9px] text-white/50">
                      <option value="">-- hit VFX --</option>
                      {getAllVfx().filter(v => v.categories.includes("impact") || v.categories.includes("melee")).map(v => <option key={v.id} value={v.id}>{v.name} ({v.frames}f)</option>)}
                    </select>
                    <select value={charOv.actions[slot.key]?.swingVfx ?? ""} onChange={e => setSlotField(slot.key, "swingVfx", e.target.value || undefined)}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[9px] text-white/50">
                      <option value="">-- swing VFX --</option>
                      {getAllVfx().filter(v => v.categories.includes("melee") || v.categories.includes("fire") || v.categories.includes("cast")).map(v => <option key={v.id} value={v.id}>{v.name} ({v.frames}f)</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}

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
                <button key={v.id} onClick={() => showToast(`${v.name}: ${v.frames}f [${v.categories.join(",")}]`)}
                  className="border border-white/10 rounded p-1 hover:border-red-500/50 bg-zinc-900 text-center">
                  <div className="text-[8px] text-white/50 truncate">{v.name}</div>
                  <div className="text-[7px] text-white/20">{v.frames}f</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-3 right-3 bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded text-[11px] font-bold z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
