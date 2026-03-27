import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Save, FolderOpen, Trash2, Plus, MousePointer, Eraser,
  Move, Grid3X3, Eye, Layers, Download, Upload,
} from "lucide-react";
import {
  MAP_ASSETS, ALL_CATEGORIES, getAssetsByCategory, getAssetById,
  type AssetCategory, type MapAssetDef,
} from "@/lib/mapAssets";
import {
  type CustomMapData, type PlacedAsset,
  newMapData, saveMap, loadMap, listMaps, deleteMap,
} from "@/lib/mapStorage";

// ─── Constants ───────────────────────────────────────────────────
const GRID_SIZE = 32;
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const EDITOR_SCALE_MIN = 0.2;
const EDITOR_SCALE_MAX = 2.0;

type EditorTool = "select" | "place" | "erase" | "platform" | "floor";

interface MapAdminProps {
  onBack: () => void;
}

// ─── Image cache ─────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();

function loadImg(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = () => resolve(img); // still resolve to avoid blocking
    img.src = src;
  });
}

// ─── Component ───────────────────────────────────────────────────
export default function MapAdmin({ onBack }: MapAdminProps) {
  // Map state
  const [mapData, setMapData] = useState<CustomMapData>(newMapData());
  const [savedMaps, setSavedMaps] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
  const [showLoadPanel, setShowLoadPanel] = useState(false);

  // Editor state
  const [tool, setTool] = useState<EditorTool>("place");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>("tiles");
  const [selectedAsset, setSelectedAsset] = useState<MapAssetDef | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [placementLayer, setPlacementLayer] = useState<"bg" | "main" | "fg">("main");
  const [showGrid, setShowGrid] = useState(true);
  const [showColliders, setShowColliders] = useState(true);
  const [zoom, setZoom] = useState(0.6);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [mapName, setMapName] = useState("Untitled Map");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragAsset = useRef<{ assetId: string; offsetX: number; offsetY: number } | null>(null);
  const dragPlacement = useRef<{ uid: string; offsetX: number; offsetY: number } | null>(null);
  const mouseWorld = useRef({ x: 0, y: 0 });
  const ghostPos = useRef<{ x: number; y: number } | null>(null);
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const drawDirty = useRef(false);
  const drawRafRef = useRef<number | null>(null);

  // Preload all unique asset images used in current map + the selected asset
  useEffect(() => {
    const srcs = new Set<string>();
    for (const a of mapData.assets) {
      const def = getAssetById(a.assetId);
      if (def) srcs.add(def.src);
    }
    if (selectedAsset) srcs.add(selectedAsset.src);
    // Also preload all assets in current category for the panel
    for (const a of getAssetsByCategory(selectedCategory)) srcs.add(a.src);

    Promise.all([...srcs].map(async s => {
      const img = await loadImg(s);
      loadedImages.current.set(s, img);
    })).then(() => requestDraw());
  }, [mapData.assets, selectedAsset, selectedCategory]);

  // Refresh saved maps list
  const refreshMapList = useCallback(async () => {
    const maps = await listMaps();
    setSavedMaps(maps);
  }, []);

  useEffect(() => { refreshMapList(); }, [refreshMapList]);

  // ─── Coordinate transforms ──────────────────────────────────────
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = sx - rect.left;
    const cy = sy - rect.top;
    return {
      x: cx / zoom - panX,
      y: cy / zoom - panY,
    };
  }, [zoom, panX, panY]);

  const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  // rAF-gated redraw: batches multiple draw requests into one per frame
  const requestDraw = useCallback(() => {
    if (drawDirty.current) return;
    drawDirty.current = true;
    if (drawRafRef.current !== null) cancelAnimationFrame(drawRafRef.current);
    drawRafRef.current = requestAnimationFrame(() => {
      drawDirty.current = false;
      drawCanvas();
    });
  }, []);

  // ─── Canvas draw ────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX, panY);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, mapData.bgColor1);
    bg.addColorStop(1, mapData.bgColor2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid overlay
    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_W; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_H; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }
    }

    // Draw placed assets by layer
    const layers: ("bg" | "main" | "fg")[] = ["bg", "main", "fg"];
    for (const layer of layers) {
      for (const pa of mapData.assets.filter(a => a.layer === layer)) {
        const def = getAssetById(pa.assetId);
        if (!def) continue;
        const img = loadedImages.current.get(def.src);
        if (img && img.complete && img.naturalWidth) {
          ctx.save();
          if (pa.flipX) {
            ctx.translate(pa.x + pa.w, pa.y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, pa.w, pa.h);
          } else {
            ctx.drawImage(img, pa.x, pa.y, pa.w, pa.h);
          }
          ctx.restore();
        } else {
          // Fallback colored rect
          ctx.fillStyle = "rgba(100,100,200,0.3)";
          ctx.fillRect(pa.x, pa.y, pa.w, pa.h);
        }

        // Selection highlight
        if (selectedPlacement === pa.uid) {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(pa.x - 1, pa.y - 1, pa.w + 2, pa.h + 2);
          ctx.setLineDash([]);
        }

        // Collider indicator
        if (showColliders && pa.isCollider) {
          ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
          ctx.lineWidth = 2;
          ctx.strokeRect(pa.x, pa.y, pa.w, pa.h);
        }
      }
    }

    // Main floor indicator
    ctx.strokeStyle = "rgba(74, 222, 128, 0.8)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(mapData.mainFloorX, mapData.mainFloorY, mapData.mainFloorW, 8);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
    ctx.fillRect(mapData.mainFloorX, mapData.mainFloorY, mapData.mainFloorW, 50);
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 14px monospace";
    ctx.fillText("MAIN FLOOR", mapData.mainFloorX + 4, mapData.mainFloorY - 6);

    // Platform indicators
    for (let i = 0; i < mapData.platforms.length; i++) {
      const p = mapData.platforms[i];
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(p.x, p.y, p.w, 6);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fillRect(p.x, p.y, p.w, 24);
      ctx.fillStyle = "#60a5fa";
      ctx.font = "11px monospace";
      ctx.fillText(`PLAT ${i + 1}${p.oneWay ? " (1-way)" : ""}`, p.x + 2, p.y - 4);
    }

    // Blast zone border
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(
      mapData.blastZone.left, mapData.blastZone.top,
      mapData.blastZone.right - mapData.blastZone.left,
      mapData.blastZone.bottom - mapData.blastZone.top
    );
    ctx.setLineDash([]);

    // Ghost preview for placement
    if (tool === "place" && selectedAsset && ghostPos.current) {
      const gx = snapToGrid(ghostPos.current.x);
      const gy = snapToGrid(ghostPos.current.y);
      const gw = selectedAsset.tileW ?? 64;
      const gh = selectedAsset.tileH ?? 64;
      const img = loadedImages.current.get(selectedAsset.src);
      ctx.globalAlpha = 0.5;
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, gx, gy, gw, gh);
      } else {
        ctx.fillStyle = "rgba(250, 204, 21, 0.3)";
        ctx.fillRect(gx, gy, gw, gh);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
    }

    // Coordinates HUD
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, 180, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";
    ctx.fillText(`X:${Math.round(mouseWorld.current.x)} Y:${Math.round(mouseWorld.current.y)}`, 6, 16);

    ctx.restore();
  }, [zoom, panX, panY, mapData, showGrid, showColliders, selectedPlacement, tool, selectedAsset]);

  // Redraw on state changes
  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // ─── Mouse handlers ─────────────────────────────────────────────
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);

    // Middle click or space+click = pan
    if (e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - panX * zoom, y: e.clientY - panY * zoom };
      return;
    }

    if (e.button === 2) {
      // Right-click erase
      const hit = findAssetAt(world.x, world.y);
      if (hit) {
        setMapData(prev => ({
          ...prev,
          assets: prev.assets.filter(a => a.uid !== hit.uid),
        }));
      }
      return;
    }

    if (tool === "select") {
      const hit = findAssetAt(world.x, world.y);
      if (hit) {
        setSelectedPlacement(hit.uid);
        dragPlacement.current = { uid: hit.uid, offsetX: world.x - hit.x, offsetY: world.y - hit.y };
      } else {
        setSelectedPlacement(null);
      }
    } else if (tool === "place" && selectedAsset) {
      placeAsset(world.x, world.y);
    } else if (tool === "erase") {
      const hit = findAssetAt(world.x, world.y);
      if (hit) {
        setMapData(prev => ({
          ...prev,
          assets: prev.assets.filter(a => a.uid !== hit.uid),
        }));
      }
    } else if (tool === "platform") {
      // Click to add a platform collider at position
      const sx = snapToGrid(world.x);
      const sy = snapToGrid(world.y);
      setMapData(prev => ({
        ...prev,
        platforms: [...prev.platforms, { x: sx, y: sy, w: 200, oneWay: true }],
      }));
    } else if (tool === "floor") {
      const sx = snapToGrid(world.x);
      const sy = snapToGrid(world.y);
      setMapData(prev => ({
        ...prev,
        mainFloorX: sx,
        mainFloorY: sy,
      }));
    }
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);
    mouseWorld.current = world;
    ghostPos.current = world;

    if (isPanning.current) {
      setPanX((e.clientX - panStart.current.x) / zoom);
      setPanY((e.clientY - panStart.current.y) / zoom);
      return;
    }

    if (dragPlacement.current) {
      const { uid, offsetX, offsetY } = dragPlacement.current;
      const nx = snapToGrid(world.x - offsetX);
      const ny = snapToGrid(world.y - offsetY);
      setMapData(prev => ({
        ...prev,
        assets: prev.assets.map(a => a.uid === uid ? { ...a, x: nx, y: ny } : a),
      }));
    }

    requestDraw();
  };

  const onCanvasMouseUp
    isPanning.current = false;
    dragPlacement.current = null;
  };

  const onCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(EDITOR_SCALE_MIN, Math.min(EDITOR_SCALE_MAX, z + delta)));
  };

  const onContextMenu = (e: React.MouseEvent) => { e.preventDefault(); };

  // ─── Asset placement ────────────────────────────────────────────
  const placeAsset = (wx: number, wy: number) => {
    if (!selectedAsset) return;
    const gx = snapToGrid(wx);
    const gy = snapToGrid(wy);
    const pa: PlacedAsset = {
      uid: `pa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assetId: selectedAsset.id,
      x: gx,
      y: gy,
      w: selectedAsset.tileW ?? 64,
      h: selectedAsset.tileH ?? 64,
      layer: placementLayer,
      isCollider: !selectedAsset.isDecoration,
    };
    setMapData(prev => ({ ...prev, assets: [...prev.assets, pa] }));
  };

  const findAssetAt = (wx: number, wy: number): PlacedAsset | undefined => {
    // Search in reverse (top-most first)
    for (let i = mapData.assets.length - 1; i >= 0; i--) {
      const a = mapData.assets[i];
      if (wx >= a.x && wx <= a.x + a.w && wy >= a.y && wy <= a.y + a.h) return a;
    }
    return undefined;
  };

  // ─── Drag & drop from asset panel ───────────────────────────────
  const onAssetDragStart = (e: React.DragEvent, asset: MapAssetDef) => {
    e.dataTransfer.setData("assetId", asset.id);
    dragAsset.current = { assetId: asset.id, offsetX: 0, offsetY: 0 };
  };

  const onCanvasDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData("assetId");
    const def = getAssetById(assetId);
    if (!def) return;
    const world = screenToWorld(e.clientX, e.clientY);
    const gx = snapToGrid(world.x);
    const gy = snapToGrid(world.y);
    const pa: PlacedAsset = {
      uid: `pa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assetId: def.id,
      x: gx,
      y: gy,
      w: def.tileW ?? 64,
      h: def.tileH ?? 64,
      layer: placementLayer,
      isCollider: !def.isDecoration,
    };
    setMapData(prev => ({ ...prev, assets: [...prev.assets, pa] }));
    // Also preload image
    loadImg(def.src).then(img => { loadedImages.current.set(def.src, img); requestDraw(); });
  };

  const onCanvasDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  // ─── Save / Load ────────────────────────────────────────────────
  const handleSave = async () => {
    const updated = { ...mapData, name: mapName };
    const ok = await saveMap(updated);
    setMapData(updated);
    setStatusMsg(ok ? "Map saved!" : "Save failed");
    setTimeout(() => setStatusMsg(""), 2000);
    refreshMapList();
  };

  const handleLoad = async (mapId: string) => {
    const data = await loadMap(mapId);
    if (data) {
      setMapData(data);
      setMapName(data.name);
      setShowLoadPanel(false);
      setStatusMsg(`Loaded: ${data.name}`);
      setTimeout(() => setStatusMsg(""), 2000);
      // Preload all images
      for (const a of data.assets) {
        const def = getAssetById(a.assetId);
        if (def) loadImg(def.src).then(img => loadedImages.current.set(def.src, img));
      }
    }
  };

  const handleDelete = async (mapId: string) => {
    await deleteMap(mapId);
    refreshMapList();
  };

  const handleNew = () => {
    const m = newMapData();
    setMapData(m);
    setMapName("Untitled Map");
    setSelectedPlacement(null);
    setStatusMsg("New map created");
    setTimeout(() => setStatusMsg(""), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ ...mapData, name: mapName }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text) as CustomMapData;
        if (data.id && data.mainFloorY !== undefined) {
          setMapData(data);
          setMapName(data.name);
          setStatusMsg("Imported!");
          setTimeout(() => setStatusMsg(""), 2000);
        }
      } catch { setStatusMsg("Invalid JSON"); setTimeout(() => setStatusMsg(""), 2000); }
    };
    input.click();
  };

  // ─── Delete selected ───────────────────────────────────────────
  const deleteSelected = () => {
    if (!selectedPlacement) return;
    setMapData(prev => ({ ...prev, assets: prev.assets.filter(a => a.uid !== selectedPlacement) }));
    setSelectedPlacement(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if (e.key === "g") setShowGrid(g => !g);
      if (e.key === "1") setTool("select");
      if (e.key === "2") setTool("place");
      if (e.key === "3") setTool("erase");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPlacement]);

  // ─── Selected placement properties ──────────────────────────────
  const selectedPA = mapData.assets.find(a => a.uid === selectedPlacement);

  const updateSelectedPA = (updates: Partial<PlacedAsset>) => {
    if (!selectedPlacement) return;
    setMapData(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.uid === selectedPlacement ? { ...a, ...updates } : a),
    }));
  };

  // ─── Render ─────────────────────────────────────────────────────
  const categoryAssets = getAssetsByCategory(selectedCategory);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-white/10 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-300/30">Map Editor</Badge>

        <div className="h-5 w-px bg-white/20 mx-1" />

        <input
          value={mapName}
          onChange={e => setMapName(e.target.value)}
          className="bg-slate-800 border border-white/20 rounded px-2 py-1 text-sm w-48"
          placeholder="Map name..."
        />

        <Button size="sm" variant="outline" onClick={handleNew} className="border-white/20 text-white/70">
          <Plus className="w-3 h-3 mr-1" /> New
        </Button>
        <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500">
          <Save className="w-3 h-3 mr-1" /> Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => { refreshMapList(); setShowLoadPanel(!showLoadPanel); }} className="border-white/20 text-white/70">
          <FolderOpen className="w-3 h-3 mr-1" /> Load
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportJSON} className="border-white/20 text-white/70">
          <Download className="w-3 h-3 mr-1" /> Export
        </Button>
        <Button size="sm" variant="outline" onClick={handleImportJSON} className="border-white/20 text-white/70">
          <Upload className="w-3 h-3 mr-1" /> Import
        </Button>

        <div className="h-5 w-px bg-white/20 mx-1" />

        {/* Tools */}
        {([
          ["select", MousePointer, "Select (1)"],
          ["place", Grid3X3, "Place (2)"],
          ["erase", Eraser, "Erase (3)"],
          ["platform", Layers, "Add Platform"],
          ["floor", Move, "Set Floor"],
        ] as const).map(([id, Icon, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tool === id ? "default" : "outline"}
            onClick={() => setTool(id)}
            className={tool === id ? "bg-amber-600" : "border-white/20 text-white/70"}
            title={label}
          >
            <Icon className="w-3 h-3 mr-1" /> {label}
          </Button>
        ))}

        <div className="h-5 w-px bg-white/20 mx-1" />

        <Button size="sm" variant="outline" onClick={() => setShowGrid(g => !g)} className={showGrid ? "border-amber-400/40 text-amber-300" : "border-white/20 text-white/70"}>
          <Grid3X3 className="w-3 h-3 mr-1" /> Grid
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowColliders(c => !c)} className={showColliders ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-white/70"}>
          <Eye className="w-3 h-3 mr-1" /> Colliders
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/50">Zoom: {Math.round(zoom * 100)}%</span>
          <input type="range" min={20} max={200} value={zoom * 100} onChange={e => setZoom(Number(e.target.value) / 100)} className="w-20" />
        </div>

        {statusMsg && <Badge className="bg-emerald-500/20 text-emerald-300 animate-pulse">{statusMsg}</Badge>}
      </div>

      {/* Load panel overlay */}
      {showLoadPanel && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 w-96">
          <Card className="p-4 bg-slate-900 border-white/20 space-y-2 shadow-2xl">
            <h3 className="font-bold text-amber-300">Saved Maps</h3>
            {savedMaps.length === 0 && <p className="text-white/50 text-sm">No saved maps yet.</p>}
            {savedMaps.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-slate-800 rounded p-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-white/40">{new Date(m.updatedAt).toLocaleString()}</div>
                </div>
                <Button size="sm" onClick={() => handleLoad(m.id)} className="bg-sky-600 hover:bg-sky-500">Load</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setShowLoadPanel(false)} className="w-full border-white/20">Close</Button>
          </Card>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: asset browser */}
        <div className="w-64 shrink-0 bg-slate-900 border-r border-white/10 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 max-h-28 overflow-y-auto">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                    : "bg-slate-800 text-white/60 hover:text-white/80 border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Layer selector */}
          <div className="flex gap-1 p-2 border-b border-white/10">
            {(["bg", "main", "fg"] as const).map(l => (
              <button
                key={l}
                onClick={() => setPlacementLayer(l)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
                  placementLayer === l
                    ? "bg-sky-500/30 text-sky-300 border border-sky-400/40"
                    : "bg-slate-800 text-white/50 border border-transparent"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Asset thumbnails — draggable */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 gap-2">
              {categoryAssets.map(asset => (
                <button
                  key={asset.id}
                  draggable
                  onDragStart={e => onAssetDragStart(e, asset)}
                  onClick={() => { setSelectedAsset(asset); setTool("place"); }}
                  className={`relative group bg-slate-800 rounded border p-1 aspect-square flex items-center justify-center overflow-hidden transition-all hover:border-amber-400/60 ${
                    selectedAsset?.id === asset.id ? "border-amber-400 ring-1 ring-amber-400/40" : "border-white/10"
                  }`}
                  title={asset.name}
                >
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                    loading="lazy"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white/70 px-0.5 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            width={Math.ceil(CANVAS_W * zoom + 200)}
            height={Math.ceil(CANVAS_H * zoom + 200)}
            className="absolute inset-0 cursor-crosshair"
            style={{ width: "100%", height: "100%" }}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={onCanvasMouseUp}
            onWheel={onCanvasWheel}
            onContextMenu={onContextMenu}
            onDrop={onCanvasDrop}
            onDragOver={onCanvasDragOver}
          />
        </div>

        {/* Right sidebar: properties */}
        <div className="w-56 shrink-0 bg-slate-900 border-l border-white/10 p-3 overflow-y-auto space-y-4">
          <h3 className="text-sm font-bold text-amber-300">Stage Properties</h3>

          <div className="space-y-2 text-xs">
            <label className="block">
              <span className="text-white/50">BG Color 1</span>
              <input type="color" value={mapData.bgColor1} onChange={e => setMapData(d => ({ ...d, bgColor1: e.target.value }))} className="block w-full h-6 rounded mt-0.5" />
            </label>
            <label className="block">
              <span className="text-white/50">BG Color 2</span>
              <input type="color" value={mapData.bgColor2} onChange={e => setMapData(d => ({ ...d, bgColor2: e.target.value }))} className="block w-full h-6 rounded mt-0.5" />
            </label>
            <label className="block">
              <span className="text-white/50">BG Theme</span>
              <select value={mapData.bgFeatures} onChange={e => setMapData(d => ({ ...d, bgFeatures: e.target.value }))} className="block w-full bg-slate-800 border border-white/20 rounded px-2 py-1 mt-0.5">
                <option value="castle">Castle</option>
                <option value="ocean">Ocean</option>
                <option value="lava">Lava</option>
                <option value="forest">Forest</option>
              </select>
            </label>
            <label className="block">
              <span className="text-white/50">Floor X</span>
              <input type="number" value={mapData.mainFloorX} onChange={e => setMapData(d => ({ ...d, mainFloorX: Math.max(0, Number(e.target.value)) }))} className="block w-full bg-slate-800 border border-white/20 rounded px-2 py-1 mt-0.5" />
            </label>
            <label className="block">
              <span className="text-white/50">Floor Y</span>
              <input type="number" value={mapData.mainFloorY} onChange={e => setMapData(d => ({ ...d, mainFloorY: Math.max(0, Math.min(CANVAS_H, Number(e.target.value))) }))} className="block w-full bg-slate-800 border border-white/20 rounded px-2 py-1 mt-0.5" />
            </label>
            <label className="block">
              <span className="text-white/50">Floor Width</span>
              <input type="number" value={mapData.mainFloorW} onChange={e => setMapData(d => ({ ...d, mainFloorW: Math.max(32, Number(e.target.value)) }))} className="block w-full bg-slate-800 border border-white/20 rounded px-2 py-1 mt-0.5" />
            </label>
          </div>

          {/* Blast Zone */}
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">Blast Zone</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <label>
                <span className="text-white/40">Top</span>
                <input type="number" value={mapData.blastZone.top} onChange={e => setMapData(d => ({ ...d, blastZone: { ...d.blastZone, top: Number(e.target.value) } }))} className="block w-full bg-slate-800 border border-white/20 rounded px-1 py-0.5" />
              </label>
              <label>
                <span className="text-white/40">Bottom</span>
                <input type="number" value={mapData.blastZone.bottom} onChange={e => setMapData(d => ({ ...d, blastZone: { ...d.blastZone, bottom: Math.max(d.blastZone.top + 100, Number(e.target.value)) } }))} className="block w-full bg-slate-800 border border-white/20 rounded px-1 py-0.5" />
              </label>
              <label>
                <span className="text-white/40">Left</span>
                <input type="number" value={mapData.blastZone.left} onChange={e => setMapData(d => ({ ...d, blastZone: { ...d.blastZone, left: Number(e.target.value) } }))} className="block w-full bg-slate-800 border border-white/20 rounded px-1 py-0.5" />
              </label>
              <label>
                <span className="text-white/40">Right</span>
                <input type="number" value={mapData.blastZone.right} onChange={e => setMapData(d => ({ ...d, blastZone: { ...d.blastZone, right: Math.max(d.blastZone.left + 100, Number(e.target.value)) } }))} className="block w-full bg-slate-800 border border-white/20 rounded px-1 py-0.5" />
              </label>
            </div>
          </div>

          {/* Platforms list */}
          <div>
            <h3 className="text-sm font-bold text-sky-300 mb-1">Platforms ({mapData.platforms.length})</h3>
            {mapData.platforms.map((p, i) => (
              <div key={i} className="bg-slate-800 rounded p-1.5 mb-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Platform {i + 1}</span>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400" onClick={() => {
                    setMapData(prev => ({ ...prev, platforms: prev.platforms.filter((_, j) => j !== i) }));
                  }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <input type="number" value={p.x} onChange={e => {
                    const plats = [...mapData.platforms]; plats[i] = { ...p, x: Number(e.target.value) }; setMapData(d => ({ ...d, platforms: plats }));
                  }} className="bg-slate-700 rounded px-1 py-0.5 text-center" title="X" />
                  <input type="number" value={p.y} onChange={e => {
                    const plats = [...mapData.platforms]; plats[i] = { ...p, y: Number(e.target.value) }; setMapData(d => ({ ...d, platforms: plats }));
                  }} className="bg-slate-700 rounded px-1 py-0.5 text-center" title="Y" />
                  <input type="number" value={p.w} onChange={e => {
                    const plats = [...mapData.platforms]; plats[i] = { ...p, w: Number(e.target.value) }; setMapData(d => ({ ...d, platforms: plats }));
                  }} className="bg-slate-700 rounded px-1 py-0.5 text-center" title="W" />
                </div>
                <label className="flex items-center gap-1 text-white/50">
                  <input type="checkbox" checked={p.oneWay} onChange={e => {
                    const plats = [...mapData.platforms]; plats[i] = { ...p, oneWay: e.target.checked }; setMapData(d => ({ ...d, platforms: plats }));
                  }} />
                  One-way
                </label>
              </div>
            ))}
          </div>

          {/* Selected asset properties */}
          {selectedPA && (
            <div>
              <h3 className="text-sm font-bold text-amber-300 mb-1">Selected Asset</h3>
              <div className="bg-slate-800 rounded p-2 text-xs space-y-1.5">
                <div className="text-white/70">{getAssetById(selectedPA.assetId)?.name}</div>
                <div className="grid grid-cols-2 gap-1">
                  <label>
                    <span className="text-white/40">W</span>
                    <input type="number" value={selectedPA.w} onChange={e => updateSelectedPA({ w: Number(e.target.value) })} className="block w-full bg-slate-700 rounded px-1 py-0.5 text-center" />
                  </label>
                  <label>
                    <span className="text-white/40">H</span>
                    <input type="number" value={selectedPA.h} onChange={e => updateSelectedPA({ h: Number(e.target.value) })} className="block w-full bg-slate-700 rounded px-1 py-0.5 text-center" />
                  </label>
                </div>
                <label className="flex items-center gap-1 text-white/50">
                  <input type="checkbox" checked={!!selectedPA.flipX} onChange={e => updateSelectedPA({ flipX: e.target.checked })} />
                  Flip X
                </label>
                <label className="flex items-center gap-1 text-white/50">
                  <input type="checkbox" checked={!!selectedPA.isCollider} onChange={e => updateSelectedPA({ isCollider: e.target.checked })} />
                  Is Collider
                </label>
                <select value={selectedPA.layer} onChange={e => updateSelectedPA({ layer: e.target.value as "bg" | "main" | "fg" })} className="w-full bg-slate-700 rounded px-1 py-0.5">
                  <option value="bg">Background</option>
                  <option value="main">Main</option>
                  <option value="fg">Foreground</option>
                </select>
                <Button size="sm" variant="ghost" className="w-full text-red-400 hover:text-red-300" onClick={deleteSelected}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="text-xs text-white/40 pt-2 border-t border-white/10">
            <div>Assets: {mapData.assets.length}</div>
            <div>Map ID: {mapData.id.slice(0, 16)}…</div>
          </div>
        </div>
      </div>
    </div>
  );
}
