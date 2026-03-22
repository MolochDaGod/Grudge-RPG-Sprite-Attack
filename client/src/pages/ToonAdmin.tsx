import { useCallback, useEffect, useRef, useState } from "react";
import { GRUDA_ROSTER, type GrudaCharDef } from "@/lib/grudaRoster";
import { ACTION_SLOTS, type ActionSlotKey, type ActionOverride, type CharOverrides, loadOverrides, setCharOverrides, deleteCharOverrides, exportAllOverrides, importOverrides } from "@/lib/charConfig";
import { ALL_VFX, preloadVfx, type VfxDef } from "@/lib/vfxLibrary";

// Get all animation files for a character
function getCharAnims(char: GrudaCharDef): { key: string; file: string; frames: number }[] {
  const anims: { key: string; file: string; frames: number }[] = [];
  const add = (key: string, val?: [string, number]) => { if (val) anims.push({ key, file: val[0], frames: val[1] }); };
  add("idle", char.idle); add("walk", char.walk); add("attack", char.attack); add("fall", char.fall);
  add("hurt", char.hurt); add("death", char.death);
  add("attack2", char.attack2); add("block", char.block); add("jump", char.jump);
  add("cast", char.cast); add("special", char.special); add("roll", char.roll);
  return anims;
}
const PREVIEW_ALPHA_THRESHOLD = 8;
const previewBottomPaddingCache = new Map<string, number>();

function getPreviewBottomPadding(image: HTMLImageElement): number {
  const cacheKey = image.currentSrc || image.src;
  const cached = previewBottomPaddingCache.get(cacheKey);
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
      if (alpha > PREVIEW_ALPHA_THRESHOLD) {
        bottomPadding = height - 1 - y;
        found = true;
        break;
      }
    }
  }

  previewBottomPaddingCache.set(cacheKey, bottomPadding);
  return bottomPadding;
}

// Sprite animation preview component
function SpritePreview({ src, frames, scale, playing, onFrame }: {
  src: string; frames: number; scale: number; playing: boolean;
  onFrame?: (frame: number, total: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const bottomPaddingRef = useRef(0);
  const frameRef = useRef(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      bottomPaddingRef.current = getPreviewBottomPadding(img);
      frameRef.current = 0;
    };
    img.src = src;
    return () => {
      imgRef.current = null;
      bottomPaddingRef.current = 0;
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf: number;
    const draw = () => {
      const img = imgRef.current;
      if (!img || !img.complete) { raf = requestAnimationFrame(draw); return; }

      const fw = img.width / Math.max(1, frames);
      const fh = img.height;
      const bottomPadding = bottomPaddingRef.current;
      const visibleHeight = Math.max(1, fh - bottomPadding);
      const dw = fw * scale;
      const dh = fh * scale;
      const visibleDh = visibleHeight * scale;

      canvas.width = dw;
      canvas.height = visibleDh;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, dw, visibleDh);
      ctx.drawImage(img, frameRef.current * fw, 0, fw, fh, 0, -bottomPadding * scale, dw, dh);

      if (playing) {
        tickRef.current++;
        if (tickRef.current >= 5) {
          tickRef.current = 0;
          frameRef.current = (frameRef.current + 1) % frames;
        }
      }
      onFrame?.(frameRef.current, frames);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [src, frames, scale, playing, onFrame]);

  return <canvas ref={canvasRef} style={{ imageRendering: "pixelated" }} />;
}

export default function ToonAdmin({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<string>(GRUDA_ROSTER[0].id);
  const [overrides, setOverrides] = useState(loadOverrides);
  const [previewAnim, setPreviewAnim] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [globalScale, setGlobalScale] = useState(3);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(1);
  const [toast, setToast] = useState("");

  const selectedChar = GRUDA_ROSTER.find(c => c.id === selectedId)!;
  const charAnims = getCharAnims(selectedChar);
  const charOverride = overrides[selectedId] ?? { actions: {} };
  const basePath = `/fighter2d/characters/${selectedChar.folder}/`;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // Get the current animation source for a slot
  const getSlotAnim = (slot: ActionSlotKey): { file: string; frames: number; hold: number; loop: boolean } | null => {
    const ov = charOverride.actions[slot];
    if (ov) return ov;
    // Fall back to default from roster
    const def = (selectedChar as any)[slot] as [string, number] | undefined;
    if (!def) return null;
    const autoHold = (f: number) => f > 20 ? 2 : f > 10 ? 3 : f > 6 ? 4 : 5;
    return { file: def[0], frames: def[1], hold: autoHold(def[1]), loop: slot === "idle" || slot === "walk" };
  };

  // Set override for a slot
  const setSlotAnim = (slot: ActionSlotKey, file: string, frames: number) => {
    const autoHold = (f: number) => f > 20 ? 2 : f > 10 ? 3 : f > 6 ? 4 : 5;
    const newOverrides = { ...overrides };
    if (!newOverrides[selectedId]) newOverrides[selectedId] = { actions: {} };
    newOverrides[selectedId].actions[slot] = {
      file, frames,
      hold: autoHold(frames),
      loop: slot === "idle" || slot === "walk",
    };
    setOverrides(newOverrides);
  };

  const setSlotHold = (slot: ActionSlotKey, hold: number) => {
    const newOverrides = { ...overrides };
    const current = getSlotAnim(slot);
    if (!current) return;
    if (!newOverrides[selectedId]) newOverrides[selectedId] = { actions: {} };
    newOverrides[selectedId].actions[slot] = { ...current, hold };
    setOverrides(newOverrides);
  };

  const setSlotLoop = (slot: ActionSlotKey, loop: boolean) => {
    const newOverrides = { ...overrides };
    const current = getSlotAnim(slot);
    if (!current) return;
    if (!newOverrides[selectedId]) newOverrides[selectedId] = { actions: {} };
    newOverrides[selectedId].actions[slot] = { ...current, loop };
    setOverrides(newOverrides);
  };

  const saveAll = () => {
    for (const [id, ov] of Object.entries(overrides)) {
      if (Object.keys(ov.actions).length > 0 || ov.stats || ov.projectile || ov.effectSrc) {
        setCharOverrides(id, ov);
      }
    }
    showToast("Saved! Changes will apply in the game.");
  };

  const resetChar = () => {
    deleteCharOverrides(selectedId);
    const newOverrides = { ...overrides };
    delete newOverrides[selectedId];
    setOverrides(newOverrides);
    showToast(`${selectedChar.name} reset to defaults`);
  };

  const handleExport = () => {
    const blob = new Blob([exportAllOverrides()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "grudge-char-config.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported config");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      file.text().then(text => {
        if (importOverrides(text)) {
          setOverrides(loadOverrides());
          showToast("Imported config");
        } else {
          showToast("Invalid config file");
        }
      });
    };
    input.click();
  };

  // Preview: default to idle
  const previewSrc = previewAnim
    ? basePath + previewAnim
    : basePath + selectedChar.idle[0];
  const previewFrameCount = previewAnim
    ? (charAnims.find(a => a.file === previewAnim)?.frames ?? 1)
    : selectedChar.idle[1];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-950">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/50 hover:text-white text-sm">← Back to Game</button>
          <span className="text-red-500 font-bold text-lg tracking-wider">TOON ADMIN</span>
          <span className="text-white/30 text-xs">Character Editor</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="px-3 py-1.5 text-xs bg-zinc-800 border border-white/10 rounded hover:bg-zinc-700">Import</button>
          <button onClick={handleExport} className="px-3 py-1.5 text-xs bg-zinc-800 border border-white/10 rounded hover:bg-zinc-700">Export</button>
          <button onClick={saveAll} className="px-4 py-1.5 text-xs bg-red-700 rounded hover:bg-red-600 font-bold">Save All</button>
        </div>
      </div>

      <div className="flex" style={{ height: "calc(100vh - 52px)" }}>
        {/* Left: Hero list */}
        <div className="w-56 border-r border-white/10 overflow-y-auto bg-zinc-950 flex-shrink-0">
          <div className="p-2 text-xs text-white/30 uppercase tracking-widest">Heroes ({GRUDA_ROSTER.length})</div>
          {GRUDA_ROSTER.map(char => (
            <button
              key={char.id}
              onClick={() => { setSelectedId(char.id); setPreviewAnim(null); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                selectedId === char.id
                  ? "bg-red-900/30 border-l-2 border-red-500 text-white"
                  : "hover:bg-white/5 text-white/60 border-l-2 border-transparent"
              }`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: char.color }} />
              <span className="truncate">{char.name}</span>
              {overrides[char.id] && <span className="text-red-400 text-[10px]">●</span>}
            </button>
          ))}
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col items-center bg-zinc-900 relative overflow-hidden">
          {/* Scale control */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded z-10">
            <span className="text-xs text-white/40">Scale</span>
            <input type="range" min={1} max={8} step={0.5} value={globalScale}
              onChange={e => setGlobalScale(parseFloat(e.target.value))}
              className="w-24 accent-red-500" />
            <span className="text-xs text-white/60 w-8">{globalScale}x</span>
          </div>

          {/* Play/Pause */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <button onClick={() => setPreviewPlaying(!previewPlaying)}
              className="px-3 py-1 text-xs bg-black/60 rounded hover:bg-black/80">
              {previewPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <span className="text-xs text-white/40 self-center">
              Frame {currentFrame + 1}/{totalFrames}
            </span>
          </div>

          {/* Ground line + sprite */}
          <div className="flex-1 flex items-end justify-center pb-0 relative w-full">
            {/* Ground line at Y=0 */}
            <div className="absolute bottom-24 left-0 right-0 h-px bg-white/20" />
            <div className="absolute bottom-24 left-4 text-[10px] text-white/20">Y = 0</div>

            <div className="mb-24">
              <SpritePreview
                src={previewSrc}
                frames={previewFrameCount}
                scale={globalScale}
                playing={previewPlaying}
                onFrame={(f, t) => { setCurrentFrame(f); setTotalFrames(t); }}
              />
            </div>
          </div>

          {/* Anim info bar */}
          <div className="w-full px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-4">
            <span className="text-white font-bold">{selectedChar.name}</span>
            <span className="text-white/30 text-xs">{selectedChar.folder}</span>
            <span className="text-white/30 text-xs">{selectedChar.frameSize}px frames</span>
            <span className="text-white/30 text-xs">ATK {selectedChar.atk} · SPD {selectedChar.spd}</span>
            {previewAnim && <span className="text-red-400 text-xs ml-auto">{previewAnim}</span>}
          </div>

          {/* Animation thumbnails strip */}
          <div className="w-full bg-zinc-950 border-t border-white/10 p-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {charAnims.map(anim => (
                <button
                  key={anim.key}
                  onClick={() => setPreviewAnim(anim.file)}
                  className={`flex-shrink-0 border rounded px-2 py-1.5 text-center transition-all ${
                    previewAnim === anim.file
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/10 bg-zinc-900 hover:border-white/30"
                  }`}
                >
                  <div className="h-12 w-12 mx-auto mb-1 flex items-end justify-center overflow-hidden">
                    <SpritePreview src={basePath + anim.file} frames={anim.frames} scale={0.8} playing={true} />
                  </div>
                  <div className="text-[10px] text-white/60 truncate w-16">{anim.key}</div>
                  <div className="text-[9px] text-white/30">{anim.frames}f</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Action mapping */}
        <div className="w-80 border-l border-white/10 overflow-y-auto bg-zinc-950 flex-shrink-0">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-widest">Action Mapping</span>
            <button onClick={resetChar} className="text-xs text-red-400 hover:text-red-300">Reset</button>
          </div>

          {ACTION_SLOTS.map(slot => {
            const current = getSlotAnim(slot.key);
            const isOverridden = !!charOverride.actions[slot.key];

            return (
              <div key={slot.key} className="border-b border-white/5 px-3 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${slot.required ? "text-white/80" : "text-white/40"}`}>
                    {slot.label}
                  </span>
                  {isOverridden && <span className="text-[9px] text-red-400">modified</span>}
                </div>

                {/* Animation file dropdown */}
                <select
                  value={current?.file ?? ""}
                  onChange={e => {
                    const anim = charAnims.find(a => a.file === e.target.value);
                    if (anim) setSlotAnim(slot.key, anim.file, anim.frames);
                  }}
                  className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1.5 text-xs text-white/80 mb-2"
                >
                  <option value="">— none —</option>
                  {charAnims.map(anim => (
                    <option key={anim.file} value={anim.file}>{anim.key} ({anim.file}, {anim.frames}f)</option>
                  ))}
                </select>

                {current && (
                  <div className="flex items-center gap-3 text-[10px]">
                    {/* Hold speed */}
                    <label className="flex items-center gap-1 text-white/40">
                      Hold
                      <input type="number" min={1} max={20} value={current.hold}
                        onChange={e => setSlotHold(slot.key, parseInt(e.target.value) || 5)}
                        className="w-10 bg-zinc-800 border border-white/10 rounded px-1 py-0.5 text-white/70 text-center"
                      />
                    </label>
                    {/* Loop toggle */}
                    <label className="flex items-center gap-1 text-white/40 cursor-pointer">
                      <input type="checkbox" checked={current.loop}
                        onChange={e => setSlotLoop(slot.key, e.target.checked)}
                        className="accent-red-500"
                      />
                      Loop
                    </label>
                    {/* Preview button */}
                    <button
                      onClick={() => setPreviewAnim(current.file)}
                      className="ml-auto text-red-400 hover:text-red-300"
                    >
                      ▶ Preview
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* VFX Assignment */}
          <div className="p-3 border-t border-white/10">
            <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Hit VFX</div>
            <p className="text-[9px] text-white/20 mb-2">Assign visual effects to attack actions</p>
            {ACTION_SLOTS.filter(s => ["attack","attack2","block","cast","special"].includes(s.key)).map(slot => {
              const current = charOverride.actions[slot.key];
              return (
                <div key={`vfx-${slot.key}`} className="mb-2">
                  <div className="text-[10px] text-white/50 mb-0.5">{slot.label}</div>
                  <div className="flex gap-1">
                    <select
                      value={current?.hitVfx ?? ""}
                      onChange={e => {
                        const newOv = { ...overrides };
                        if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                        const existing = newOv[selectedId].actions[slot.key] ?? getSlotAnim(slot.key);
                        if (existing) {
                          newOv[selectedId].actions[slot.key] = { ...existing, hitVfx: e.target.value || undefined };
                          setOverrides(newOv);
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white/70"
                    >
                      <option value="">— no hit VFX —</option>
                      {ALL_VFX.filter(v => v.categories.includes("impact") || v.categories.includes("melee")).map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.frames}f)</option>
                      ))}
                    </select>
                    <select
                      value={current?.swingVfx ?? ""}
                      onChange={e => {
                        const newOv = { ...overrides };
                        if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                        const existing = newOv[selectedId].actions[slot.key] ?? getSlotAnim(slot.key);
                        if (existing) {
                          newOv[selectedId].actions[slot.key] = { ...existing, swingVfx: e.target.value || undefined };
                          setOverrides(newOv);
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white/70"
                    >
                      <option value="">— no swing VFX —</option>
                      {ALL_VFX.filter(v => v.categories.includes("melee") || v.categories.includes("fire")).map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.frames}f)</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats section */}
          <div className="p-3 border-t border-white/10">
            <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Stats</div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] text-white/40">
                ATK
                <input type="number" value={charOverride.stats?.atk ?? selectedChar.atk}
                  onChange={e => {
                    const newOv = { ...overrides };
                    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                    newOv[selectedId].stats = { ...newOv[selectedId].stats, atk: parseInt(e.target.value) || 10 };
                    setOverrides(newOv);
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-white/70 text-xs mt-0.5"
                />
              </label>
              <label className="text-[10px] text-white/40">
                SPD
                <input type="number" step={0.1} value={charOverride.stats?.spd ?? selectedChar.spd}
                  onChange={e => {
                    const newOv = { ...overrides };
                    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                    newOv[selectedId].stats = { ...newOv[selectedId].stats, spd: parseFloat(e.target.value) || 5.0 };
                    setOverrides(newOv);
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-white/70 text-xs mt-0.5"
                />
              </label>
              <label className="text-[10px] text-white/40">
                Super DMG
                <input type="number" value={charOverride.stats?.superDmg ?? selectedChar.superDmg}
                  onChange={e => {
                    const newOv = { ...overrides };
                    if (!newOv[selectedId]) newOv[selectedId] = { actions: {} };
                    newOv[selectedId].stats = { ...newOv[selectedId].stats, superDmg: parseInt(e.target.value) || 35 };
                    setOverrides(newOv);
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-white/70 text-xs mt-0.5"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-900/90 border border-green-500/50 text-green-300 px-4 py-2 rounded text-sm font-bold z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
