import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Save, Sword, Users, Wand2, Shield, Crosshair, Zap, Eye, Move, Moon, Sun, Image, Play, RefreshCw, User } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

import { effectSprites, getEffectSprite, type EffectSpriteConfig } from "@/lib/effectSprites";
import { AnimatedEffectSprite, EffectAnimation } from "@/components/game/AnimatedEffectSprite";
import { SPRITE_CHARACTERS, CharacterSprite, getAnimationCategories } from "@/lib/spriteManifest";
import { getUnitSpriteId, getDefaultSpriteIdForClass } from "@/lib/unitSprites";
import { SpriteAnimator, SpriteColorTints } from "@/components/SpriteAnimator";
import { Slider } from "@/components/ui/slider";

import { RACES, CLASSES, FACTIONS } from "@shared/gameDefinitions/racesClasses";
import { CharacterStatsPanel } from "@/components/game/CharacterStatsPanel";
import { ALL_WEAPONS, WEAPON_TYPES, type Weapon } from "@shared/gameDefinitions/weapons";
import { 
  CHARACTER_SPRITES, 
  MONSTER_SPRITES, 
  EFFECT_SPRITES, 
  SPELL_ICONS,
  ANIMATION_STATES,
  type SpriteDefinition 
} from "@shared/gameDefinitions/sprites";

interface SpriteAssignment {
  raceId: string;
  classId: string;
  spriteId: string;
  spritePath: string;
}

interface WeaponEffectConfig {
  weaponId: string;
  attackEffect: string;
  effectColor: string;
  animationType: "slash" | "thrust" | "swing" | "projectile" | "spell";
  attackRange: number;
  attackSpeed: number;
  projectileSpeed: number;
  impactEffect: string;
  soundEffect: string;
}

const ALL_SPRITES: SpriteDefinition[] = [
  ...Object.values(CHARACTER_SPRITES),
  ...Object.values(MONSTER_SPRITES),
  ...Object.values(EFFECT_SPRITES),
];

const EFFECT_TYPES = Object.keys(effectSprites);
const ANIMATION_TYPES = ["slash", "thrust", "swing", "projectile", "spell"];

interface SpriteCanvasProps {
  spritePath: string;
  spriteId: string;
  frameWidth?: number;
  frameHeight?: number;
  size?: number;
  animate?: boolean;
}

function SpriteCanvas({ spritePath, spriteId, frameWidth = 64, frameHeight = 64, size = 128, animate = true }: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setError(true);
      setImageLoaded(false);
    };
    
    img.src = spritePath;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [spritePath]);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;
    
    const frameDuration = 200;
    if (timestamp - lastTimeRef.current > frameDuration && animate) {
      frameRef.current = (frameRef.current + 1) % 4;
      lastTimeRef.current = timestamp;
    }
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sourceX = frameRef.current * frameWidth;
    const sourceY = 0;
    
    const scale = Math.min(size / frameWidth, size / frameHeight);
    const destWidth = frameWidth * scale;
    const destHeight = frameHeight * scale;
    const destX = (size - destWidth) / 2;
    const destY = (size - destHeight) / 2;
    
    ctx.drawImage(
      img,
      sourceX, sourceY, frameWidth, frameHeight,
      destX, destY, destWidth, destHeight
    );
    
    animationRef.current = requestAnimationFrame(drawFrame);
  }, [frameWidth, frameHeight, size, animate]);

  useEffect(() => {
    if (imageLoaded) {
      animationRef.current = requestAnimationFrame(drawFrame);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageLoaded, drawFrame]);

  if (error) {
    return (
      <div 
        className="bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30"
        style={{ width: size, height: size }}
        data-testid="sprite-preview"
      >
        <Users className="w-8 h-8 mb-2 opacity-50 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center px-2">{spriteId}</p>
        <p className="text-xs text-destructive/70 mt-1">No image</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="bg-muted rounded-lg border border-border"
      style={{ width: size, height: size }}
      data-testid="sprite-preview"
    />
  );
}

interface EffectPreviewPanelProps {
  attackEffect: string;
  impactEffect: string;
  effectColor: string;
  animationType: string;
  attackRange: number;
}

function EffectPreviewPanel({ attackEffect, impactEffect, effectColor, animationType, attackRange }: EffectPreviewPanelProps) {
  const [playKey, setPlayKey] = useState(0);
  const attackSprite = effectSprites[attackEffect];
  const impactSprite = effectSprites[impactEffect];

  const replayEffects = () => {
    setPlayKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold">Effect Preview</p>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={replayEffects}
          className="h-6 px-2"
          data-testid="button-replay-effects"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Replay
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Attack Effect</p>
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center bg-black/20 border border-border relative overflow-hidden"
            style={{ boxShadow: `inset 0 0 20px ${effectColor}33` }}
          >
            {attackSprite ? (
              <AnimatedEffectSprite 
                key={`attack-${playKey}`}
                config={{ ...attackSprite, loop: true }}
                size={56}
              />
            ) : (
              <Wand2 className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs truncate">{attackSprite?.name || attackEffect}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Impact Effect</p>
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center bg-black/20 border border-border relative overflow-hidden"
            style={{ boxShadow: `inset 0 0 20px ${effectColor}33` }}
          >
            {impactSprite ? (
              <AnimatedEffectSprite 
                key={`impact-${playKey}`}
                config={{ ...impactSprite, loop: true }}
                size={56}
              />
            ) : (
              <Shield className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs truncate">{impactSprite?.name || impactEffect}</p>
        </div>
      </div>
      <div className="mt-3 text-xs space-y-1 text-muted-foreground">
        <p><strong className="text-foreground">Animation:</strong> {animationType}</p>
        <p><strong className="text-foreground">Range:</strong> {attackRange} tile{attackRange > 1 ? 's' : ''}</p>
        <p><strong className="text-foreground">Color:</strong> <span style={{ color: effectColor }}>{effectColor}</span></p>
      </div>
    </div>
  );
}

export default function Admin({ onBack, onViewSprites, onViewAssets }: { onBack: () => void; onViewSprites?: () => void; onViewAssets?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("sprites");
  
  const [spriteAssignments, setSpriteAssignments] = useState<SpriteAssignment[]>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('tethical_sprite_assignments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved sprite assignments');
      }
    }
    
    // Default assignments
    const assignments: SpriteAssignment[] = [];
    Object.keys(RACES).forEach(raceId => {
      Object.keys(CLASSES).forEach(classId => {
        if (classId === 'worge') {
          assignments.push({
            raceId,
            classId: 'worge_caster',
            spriteId: 'priest',
            spritePath: CHARACTER_SPRITES['priest']?.path || `/2dassets/characters/priest.png`,
          });
          assignments.push({
            raceId,
            classId: 'worge_bear',
            spriteId: 'werebear',
            spritePath: CHARACTER_SPRITES['werebear']?.path || `/2dassets/characters/werebear.png`,
          });
        } else {
          assignments.push({
            raceId,
            classId,
            spriteId: classId,
            spritePath: CHARACTER_SPRITES[classId]?.path || `/2dassets/characters/${classId}.png`,
          });
        }
      });
    });
    return assignments;
  });

  const [weaponEffects, setWeaponEffects] = useState<WeaponEffectConfig[]>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('tethical_weapon_effects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved weapon effects');
      }
    }
    
    // Default weapon effects
    return ALL_WEAPONS.map(weapon => ({
      weaponId: weapon.id,
      attackEffect: weapon.type.includes("Staff") || weapon.type.includes("Tome") ? "arcanebolt" : 
                    weapon.category === "Ranged 2h" ? "arrow" : "extraoverlay",
      effectColor: weapon.type.includes("Fire") ? "#ff4500" : 
                   weapon.type.includes("Frost") ? "#00bfff" :
                   weapon.type.includes("Nature") ? "#32cd32" :
                   weapon.type.includes("Holy") ? "#ffd700" :
                   weapon.type.includes("Arcane") ? "#9370db" :
                   weapon.type.includes("Lightning") ? "#ffff00" :
                   "#ffffff",
      animationType: weapon.category === "Ranged 2h" ? "projectile" : 
                     weapon.type.includes("Staff") || weapon.type.includes("Tome") ? "spell" :
                     weapon.type === "Dagger" ? "thrust" :
                     weapon.type === "Sword" || weapon.type === "Axe" ? "slash" : "swing",
      attackRange: weapon.category === "Ranged 2h" ? 6 : 
                   weapon.type.includes("Staff") ? 4 : 
                   weapon.type.includes("Tome") ? 3 : 1,
      attackSpeed: weapon.stats.speedBase / 100,
      projectileSpeed: weapon.category === "Ranged 2h" ? 500 : 0,
      impactEffect: weapon.type.includes("Fire") ? "flamestrike" : 
                    weapon.type.includes("Frost") ? "frostbolt" : 
                    weapon.type.includes("Holy") ? "holyheal" :
                    weapon.type.includes("Arcane") ? "arcanebolt" : "hit",
      soundEffect: weapon.type === "Bow" ? "arrow_release" : 
                   weapon.type === "Sword" ? "sword_swing" : "weapon_swing",
    }));
  });

  const [selectedRace, setSelectedRace] = useState<string>("human");
  const [selectedClass, setSelectedClass] = useState<string>("warrior");
  const [selectedWeapon, setSelectedWeapon] = useState<string>(ALL_WEAPONS[0]?.id || "");
  const [selectedWeaponType, setSelectedWeaponType] = useState<string>("All");
  const [selectedCharacterSprite, setSelectedCharacterSprite] = useState<CharacterSprite>(SPRITE_CHARACTERS[0]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("idle");
  const [colorTints, setColorTints] = useState<SpriteColorTints>({
    hueRotate: 0,
    saturate: 100,
    brightness: 100,
  });
  const [worgeForm, setWorgeForm] = useState<"caster" | "bear">("caster");
  const [showEffect, setShowEffect] = useState(false);
  const [effectKey, setEffectKey] = useState(0);

  const currentAssignment = useMemo(() => {
    const effectiveClassId = selectedClass === 'worge' 
      ? `worge_${worgeForm}` 
      : selectedClass;
    return spriteAssignments.find(a => a.raceId === selectedRace && a.classId === effectiveClassId);
  }, [spriteAssignments, selectedRace, selectedClass, worgeForm]);

  // Sync selected sprite with current assignment when race/class changes
  useEffect(() => {
    const effectiveClassId = selectedClass === 'worge' ? `worge_${worgeForm}` : selectedClass;
    const savedSpriteId = getUnitSpriteId(selectedRace, effectiveClassId);
    const defaultSpriteId = getDefaultSpriteIdForClass(effectiveClassId);
    const spriteId = savedSpriteId || defaultSpriteId;
    
    if (spriteId) {
      const sprite = SPRITE_CHARACTERS.find(c => c.id === spriteId);
      if (sprite && sprite.id !== selectedCharacterSprite.id) {
        setSelectedCharacterSprite(sprite);
        setSelectedAnimation('idle');
      }
    }
  }, [selectedRace, selectedClass, worgeForm]);

  const currentWeaponEffect = useMemo(() => {
    return weaponEffects.find(w => w.weaponId === selectedWeapon);
  }, [weaponEffects, selectedWeapon]);

  const currentWeapon = useMemo(() => {
    return ALL_WEAPONS.find(w => w.id === selectedWeapon);
  }, [selectedWeapon]);

  const filteredWeapons = useMemo(() => {
    if (selectedWeaponType === "All") return ALL_WEAPONS;
    return ALL_WEAPONS.filter(w => w.type === selectedWeaponType);
  }, [selectedWeaponType]);

  const getEffectiveClassId = () => {
    return selectedClass === 'worge' ? `worge_${worgeForm}` : selectedClass;
  };

  const updateSpriteAssignment = (spriteId: string) => {
    const effectiveClassId = getEffectiveClassId();
    setSpriteAssignments(prev => prev.map(a => 
      a.raceId === selectedRace && a.classId === effectiveClassId
        ? { ...a, spriteId, spritePath: ALL_SPRITES.find(s => s.id === spriteId)?.path || a.spritePath }
        : a
    ));
  };

  const updateSpritePath = (spriteId: string) => {
    const effectiveClassId = getEffectiveClassId();
    const sprite = SPRITE_CHARACTERS.find(c => c.id === spriteId);
    if (!sprite) return;
    
    const spritePath = `/attached_assets/GrudgeRPGAssets2d/${sprite.folder}/${sprite.animations.idle?.fileName || Object.values(sprite.animations)[0]?.fileName}.png`;
    
    setSpriteAssignments(prev => prev.map(a => 
      a.raceId === selectedRace && a.classId === effectiveClassId
        ? { ...a, spriteId, spritePath }
        : a
    ));
  };

  const updateWeaponEffect = (field: keyof WeaponEffectConfig, value: string | number) => {
    setWeaponEffects(prev => prev.map(w => 
      w.weaponId === selectedWeapon
        ? { ...w, [field]: value }
        : w
    ));
  };

  const handleSave = () => {
    localStorage.setItem('tethical_sprite_assignments', JSON.stringify(spriteAssignments));
    localStorage.setItem('tethical_weapon_effects', JSON.stringify(weaponEffects));
    
    // Log each assignment individually to avoid truncation
    console.log("=== SPRITE ASSIGNMENTS ===");
    spriteAssignments.forEach(a => {
      console.log(`${a.raceId} ${a.classId}: ${a.spriteId}`);
    });
    console.log("=== END SPRITE ASSIGNMENTS ===");
    
    alert("Configuration saved!");
  };

  // Auto-save sprite assignments when they change
  useEffect(() => {
    localStorage.setItem('tethical_sprite_assignments', JSON.stringify(spriteAssignments));
  }, [spriteAssignments]);

  // Auto-save weapon effects when they change
  useEffect(() => {
    localStorage.setItem('tethical_weapon_effects', JSON.stringify(weaponEffects));
  }, [weaponEffects]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between gap-4 p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-admin-back">
            <Home className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Admin: Sprite & Weapon Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          {onViewSprites && (
            <Button variant="outline" onClick={onViewSprites} data-testid="button-view-2d-sprites">
              <Image className="w-4 h-4 mr-2" />
              2D Sprites
            </Button>
          )}
          {onViewAssets && (
            <Button variant="outline" onClick={onViewAssets} data-testid="button-view-3d-assets">
              <Eye className="w-4 h-4 mr-2" />
              3D Assets
            </Button>
          )}
          <Button onClick={handleSave} data-testid="button-save-config">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="sprites" data-testid="tab-sprites">
              <Users className="w-4 h-4 mr-2" />
              Character Sprites
            </TabsTrigger>
            <TabsTrigger value="weapons" data-testid="tab-weapons">
              <Sword className="w-4 h-4 mr-2" />
              Weapon Effects
            </TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">
              <User className="w-4 h-4 mr-2" />
              Character Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sprites" className="flex-1 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Select Race & Class</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Faction</Label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(FACTIONS).map(faction => (
                            <Badge
                              key={faction.id}
                              variant={(faction.races as readonly string[]).includes(selectedRace) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setSelectedRace(faction.races[0])}
                              data-testid={`badge-faction-${faction.id}`}
                            >
                              {faction.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Race</Label>
                        <Select value={selectedRace} onValueChange={setSelectedRace}>
                          <SelectTrigger data-testid="select-race">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(RACES).map(race => (
                              <SelectItem key={race.id} value={race.id}>
                                <span className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {race.faction}
                                  </Badge>
                                  {race.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(CLASSES).map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="text-sm text-muted-foreground">
                        <p><strong>Selected:</strong></p>
                        <p>{RACES[selectedRace]?.name} {CLASSES[selectedClass]?.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-5">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sprite Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedClass === "worge" && (
                        <div className="space-y-2">
                          <Label>Worge Form</Label>
                          <div className="flex gap-2">
                            <Button
                              variant={worgeForm === "caster" ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setWorgeForm("caster")}
                              data-testid="button-worge-caster"
                            >
                              Caster/Healer
                            </Button>
                            <Button
                              variant={worgeForm === "bear" ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() => setWorgeForm("bear")}
                              data-testid="button-worge-bear"
                            >
                              Bear Form
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {worgeForm === "caster" 
                              ? "Default healing/casting sprite" 
                              : "Melee abilities & beast form"}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>
                          Character Sprite
                          {selectedClass === "worge" && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {worgeForm === "caster" ? "Caster" : "Bear"}
                            </Badge>
                          )}
                        </Label>
                        <Select 
                          value={selectedCharacterSprite.id} 
                          onValueChange={(id) => {
                            const char = SPRITE_CHARACTERS.find(c => c.id === id);
                            if (char) {
                              setSelectedCharacterSprite(char);
                              updateSpritePath(id);
                              if (!char.animations[selectedAnimation]) {
                                setSelectedAnimation('idle');
                              }
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-character-sprite">
                            <SelectValue placeholder="Select character sprite" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPRITE_CHARACTERS.map(char => (
                              <SelectItem key={char.id} value={char.id}>
                                {char.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label>Color Tinting</Label>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Hue Rotation</span>
                              <span>{colorTints.hueRotate}°</span>
                            </div>
                            <Slider
                              value={[colorTints.hueRotate || 0]}
                              min={0}
                              max={360}
                              step={1}
                              onValueChange={([v]) => setColorTints(prev => ({ ...prev, hueRotate: v }))}
                              data-testid="slider-hue"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Saturation</span>
                              <span>{colorTints.saturate}%</span>
                            </div>
                            <Slider
                              value={[colorTints.saturate || 100]}
                              min={0}
                              max={200}
                              step={1}
                              onValueChange={([v]) => setColorTints(prev => ({ ...prev, saturate: v }))}
                              data-testid="slider-saturation"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Brightness</span>
                              <span>{colorTints.brightness}%</span>
                            </div>
                            <Slider
                              value={[colorTints.brightness || 100]}
                              min={50}
                              max={150}
                              step={1}
                              onValueChange={([v]) => setColorTints(prev => ({ ...prev, brightness: v }))}
                              data-testid="slider-brightness"
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setColorTints({ hueRotate: 0, saturate: 100, brightness: 100 })}
                            className="w-full"
                            data-testid="button-reset-colors"
                          >
                            Reset Colors
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-4">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Preview: {selectedCharacterSprite.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex flex-col items-center gap-3">
                      {(() => {
                        const effectAnimKey = selectedAnimation.endsWith('_effect') 
                          ? null 
                          : (selectedAnimation.startsWith('attack') || selectedAnimation === 'heal')
                            ? `${selectedAnimation}_effect`
                            : null;
                        const hasEffect = effectAnimKey && selectedCharacterSprite.animations[effectAnimKey];
                        const isAttackAnim = selectedAnimation.startsWith('attack') && !selectedAnimation.endsWith('_effect');
                        
                        return (
                          <>
                            <div className="flex gap-4 items-center">
                              <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center">
                                <SpriteAnimator
                                  character={selectedCharacterSprite}
                                  animation={selectedAnimation}
                                  scale={2}
                                  fps={10}
                                  playing={true}
                                  colorTints={colorTints}
                                  onAnimationEnd={() => {
                                    if (hasEffect && isAttackAnim) {
                                      setShowEffect(true);
                                      setEffectKey(k => k + 1);
                                    }
                                  }}
                                />
                                <span className="text-xs text-muted-foreground mt-1">Character</span>
                              </div>
                              
                              {hasEffect && (
                                <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center">
                                  <SpriteAnimator
                                    key={effectKey}
                                    character={selectedCharacterSprite}
                                    animation={effectAnimKey}
                                    scale={2}
                                    fps={10}
                                    playing={showEffect}
                                    colorTints={colorTints}
                                    onAnimationEnd={() => setShowEffect(false)}
                                  />
                                  <span className="text-xs text-muted-foreground mt-1">Effect</span>
                                </div>
                              )}
                            </div>
                            
                            {hasEffect && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setShowEffect(true);
                                  setEffectKey(k => k + 1);
                                }}
                                data-testid="button-play-combo"
                              >
                                Play Attack + Effect
                              </Button>
                            )}
                          </>
                        );
                      })()}
                      
                      <div className="text-center text-sm">
                        <p className="font-semibold">
                          {RACES[selectedRace]?.name} {CLASSES[selectedClass]?.name}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {selectedAnimation}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold mb-2">Animations ({Object.keys(selectedCharacterSprite.animations).length})</p>
                      <ScrollArea className="h-[200px]">
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(selectedCharacterSprite.animations).map(([key, anim]) => (
                            <Button
                              key={key}
                              variant={selectedAnimation === key ? "default" : "ghost"}
                              size="sm"
                              className="justify-start text-xs h-8"
                              onClick={() => setSelectedAnimation(key)}
                              data-testid={`button-anim-${key}`}
                            >
                              <span className="truncate">{anim.name}</span>
                              <Badge variant="secondary" className="ml-auto text-[10px] px-1">
                                {anim.frames}f
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weapons" className="flex-1 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Select Weapon</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-2 mb-3">
                      <Label>Filter by Type</Label>
                      <Select value={selectedWeaponType} onValueChange={setSelectedWeaponType}>
                        <SelectTrigger data-testid="select-weapon-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Types</SelectItem>
                          {WEAPON_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="space-y-1">
                        {filteredWeapons.map(weapon => (
                          <Button
                            key={weapon.id}
                            variant={selectedWeapon === weapon.id ? "default" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => setSelectedWeapon(weapon.id)}
                            data-testid={`button-weapon-${weapon.id}`}
                          >
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-sm">{weapon.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {weapon.type} ({weapon.category})
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-5">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sword className="w-4 h-4" />
                      {currentWeapon?.name || "Select a Weapon"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentWeaponEffect && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Wand2 className="w-3 h-3" />
                              Attack Effect
                            </Label>
                            <Select 
                              value={currentWeaponEffect.attackEffect} 
                              onValueChange={(v) => updateWeaponEffect("attackEffect", v)}
                            >
                              <SelectTrigger data-testid="select-attack-effect">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EFFECT_TYPES.map(effect => (
                                  <SelectItem key={effect} value={effect}>{effect}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Effect Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={currentWeaponEffect.effectColor}
                                onChange={(e) => updateWeaponEffect("effectColor", e.target.value)}
                                className="w-12 h-9 p-1"
                                data-testid="input-effect-color"
                              />
                              <Input
                                value={currentWeaponEffect.effectColor}
                                onChange={(e) => updateWeaponEffect("effectColor", e.target.value)}
                                className="flex-1"
                                data-testid="input-effect-color-hex"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Move className="w-3 h-3" />
                              Animation Type
                            </Label>
                            <Select 
                              value={currentWeaponEffect.animationType} 
                              onValueChange={(v) => updateWeaponEffect("animationType", v)}
                            >
                              <SelectTrigger data-testid="select-animation-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ANIMATION_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Crosshair className="w-3 h-3" />
                              Attack Range
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={currentWeaponEffect.attackRange}
                              onChange={(e) => updateWeaponEffect("attackRange", parseInt(e.target.value) || 1)}
                              data-testid="input-attack-range"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Attack Speed
                            </Label>
                            <Input
                              type="number"
                              step={0.1}
                              min={0.1}
                              max={3}
                              value={currentWeaponEffect.attackSpeed}
                              onChange={(e) => updateWeaponEffect("attackSpeed", parseFloat(e.target.value) || 1)}
                              data-testid="input-attack-speed"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Move className="w-3 h-3" />
                              Projectile Speed
                            </Label>
                            <Input
                              type="number"
                              step={50}
                              min={0}
                              max={1000}
                              value={currentWeaponEffect.projectileSpeed}
                              onChange={(e) => updateWeaponEffect("projectileSpeed", parseInt(e.target.value) || 0)}
                              disabled={currentWeaponEffect.animationType !== "projectile"}
                              data-testid="input-projectile-speed"
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Impact Effect
                            </Label>
                            <Select 
                              value={currentWeaponEffect.impactEffect} 
                              onValueChange={(v) => updateWeaponEffect("impactEffect", v)}
                            >
                              <SelectTrigger data-testid="select-impact-effect">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EFFECT_TYPES.map(effect => (
                                  <SelectItem key={effect} value={effect}>{effect}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Sound Effect</Label>
                            <Input
                              value={currentWeaponEffect.soundEffect}
                              onChange={(e) => updateWeaponEffect("soundEffect", e.target.value)}
                              placeholder="sword_swing"
                              data-testid="input-sound-effect"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-4">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Weapon Stats & Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentWeapon && (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{currentWeapon.name}</span>
                            <Badge variant="outline">{currentWeapon.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground italic mb-3">
                            {currentWeapon.lore}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>Damage:</span>
                              <span>{currentWeapon.stats.damageBase} +{currentWeapon.stats.damagePerTier}/tier</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Speed:</span>
                              <span>{currentWeapon.stats.speedBase} +{currentWeapon.stats.speedPerTier}/tier</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Crit:</span>
                              <span>{currentWeapon.stats.critBase}% +{currentWeapon.stats.critPerTier}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Block:</span>
                              <span>{currentWeapon.stats.blockBase}% +{currentWeapon.stats.blockPerTier}%</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <EffectPreviewPanel 
                          attackEffect={currentWeaponEffect?.attackEffect || "hit"}
                          impactEffect={currentWeaponEffect?.impactEffect || "hit"}
                          effectColor={currentWeaponEffect?.effectColor || "#ffffff"}
                          animationType={currentWeaponEffect?.animationType || "slash"}
                          attackRange={currentWeaponEffect?.attackRange || 1}
                        />

                        <Separator />

                        <div>
                          <p className="text-xs font-semibold mb-2">Abilities</p>
                          <div className="flex flex-wrap gap-1">
                            {currentWeapon.abilities.slice(0, 4).map((ability, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {ability.split(" (")[0]}
                              </Badge>
                            ))}
                            {currentWeapon.abilities.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{currentWeapon.abilities.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-hidden">
            <div className="flex items-start justify-center h-full p-4">
              <CharacterStatsPanel showClassRaceSelect={true} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
