import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Sword, Shield, Heart, Zap, Target, Move, Users, 
  Sparkles, Star, ChevronRight
} from "lucide-react";

import { RACES, CLASSES, FACTIONS } from "@shared/gameDefinitions/racesClasses";
import { ALL_WEAPONS, type Weapon } from "@shared/gameDefinitions/weapons";
import { 
  heroAttributesSchema, 
  ATTRIBUTE_BONUSES, 
  type AttributeName,
} from "@shared/schema";
import { getUnitSprite } from "@/lib/unitSprites";
import { SpriteAnimator } from "@/components/SpriteAnimator";
import { CharacterSprite as CharacterSpriteType } from "@/lib/spriteManifest";

interface BarracksCharacter {
  id: string;
  name: string;
  race: string;
  class: string;
  faction: string;
  level: number;
  experience: number;
  attributes: Record<AttributeName, number>;
  equipment: {
    weapon?: Weapon;
    offhand?: Weapon;
  };
  sprite: CharacterSpriteType | null;
}

const RACE_NAMES: Record<string, string[]> = {
  human: ["Aldric", "Brynn", "Marcus", "Helena"],
  elf: ["Aelindra", "Thalion", "Seraphina", "Lorien"],
  dwarf: ["Thorin", "Gimli", "Bofur", "Dwalin"],
  orc: ["Grommash", "Thrall", "Durotan", "Garrosh"],
  undead: ["Arthas", "Sylvanas", "Kel'Thuzad", "Mograine"],
  barbarian: ["Conan", "Sonja", "Brak", "Krom"],
};

const CLASS_IDS = ["warrior", "mage", "ranger", "worge"];

const generateAllCharacters = (): BarracksCharacter[] => {
  const characters: BarracksCharacter[] = [];
  const raceIds = Object.keys(RACES);
  
  let charIndex = 0;
  raceIds.forEach((raceId) => {
    const raceNames = RACE_NAMES[raceId] || ["Hero"];
    const factionId = RACES[raceId]?.faction || "crusade";
    
    CLASS_IDS.forEach((classId, classIndex) => {
      const effectiveClassId = classId === "worge" ? "worge_caster" : classId;
      const sprite = getUnitSprite(raceId, effectiveClassId);
      
      characters.push({
        id: `char-${charIndex}`,
        name: raceNames[classIndex % raceNames.length] || `${RACES[raceId]?.name} ${CLASSES[classId]?.name}`,
        race: raceId,
        class: effectiveClassId,
        faction: factionId,
        level: 1 + Math.floor(Math.random() * 10),
        experience: Math.floor(Math.random() * 100),
        attributes: {
          strength: 5 + Math.floor(Math.random() * 10),
          vitality: 5 + Math.floor(Math.random() * 10),
          endurance: 5 + Math.floor(Math.random() * 10),
          intellect: 5 + Math.floor(Math.random() * 10),
          wisdom: 5 + Math.floor(Math.random() * 10),
          dexterity: 5 + Math.floor(Math.random() * 10),
          agility: 5 + Math.floor(Math.random() * 10),
          tactics: 5 + Math.floor(Math.random() * 10),
        },
        equipment: {
          weapon: ALL_WEAPONS[charIndex % ALL_WEAPONS.length],
        },
        sprite,
      });
      charIndex++;
    });
  });
  
  return characters;
};

function UnitSprite({ sprite, size = 96 }: { sprite: CharacterSpriteType | null; size?: number }) {
  if (!sprite) {
    return (
      <div 
        className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-xs">No Sprite</span>
      </div>
    );
  }
  
  return (
    <div 
      className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      <SpriteAnimator 
        character={sprite} 
        animation="idle" 
        scale={size / 100}
        playing={true}
      />
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <Progress value={(value / max) * 100} className="h-2" />
    </div>
  );
}

function AttributeDisplay({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-muted/50">
      <span className="text-sm capitalize">{name}</span>
      <Badge variant="outline" className="font-mono">{value}</Badge>
    </div>
  );
}

export default function Barracks() {
  const [characters] = useState<BarracksCharacter[]>(generateAllCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<BarracksCharacter | null>(characters[0] || null);
  const [activeTab, setActiveTab] = useState("stats");

  const calculateDerivedStats = useMemo(() => {
    if (!selectedCharacter) return null;
    
    const attrs = selectedCharacter.attributes;
    return {
      hp: 100 + attrs.vitality * 26 + attrs.strength * 10,
      maxHp: 100 + attrs.vitality * 26 + attrs.strength * 10,
      mana: 50 + attrs.intellect * 20 + attrs.wisdom * 10,
      maxMana: 50 + attrs.intellect * 20 + attrs.wisdom * 10,
      stamina: 100 + attrs.endurance * 15 + attrs.agility * 5,
      maxStamina: 100 + attrs.endurance * 15 + attrs.agility * 5,
      damage: 10 + attrs.strength * 3,
      defense: 5 + attrs.vitality * 2 + attrs.endurance * 1,
      speed: 10 + attrs.agility * 2,
      movement: 3 + Math.floor(attrs.agility / 10),
      critChance: 5 + attrs.dexterity * 0.5,
      blockChance: 5 + attrs.strength * 0.3,
    };
  }, [selectedCharacter]);

  return (
    <div className="h-full flex bg-background">
      <div className="w-64 border-r bg-card p-4">
        <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Roster
        </h2>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-2">
            {characters.map((char) => (
              <Card 
                key={char.id}
                className={`cursor-pointer transition-all ${
                  selectedCharacter?.id === char.id 
                    ? "ring-2 ring-primary" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedCharacter(char)}
                data-testid={`card-character-${char.id}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <UnitSprite sprite={char.sprite} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{char.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="capitalize">{RACES[char.race]?.name || char.race}</span>
                      <span>•</span>
                      <span className="capitalize">{CLASSES[char.class]?.name || char.class}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Lv. {char.level}
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {selectedCharacter ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <UnitSprite sprite={selectedCharacter.sprite} size={128} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-serif text-2xl font-bold">{selectedCharacter.name}</h1>
                  <Badge>{FACTIONS[selectedCharacter.faction as keyof typeof FACTIONS]?.name || selectedCharacter.faction}</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <span className="capitalize">{RACES[selectedCharacter.race]?.name || selectedCharacter.race}</span>
                  <span>•</span>
                  <span className="capitalize">{CLASSES[selectedCharacter.class]?.name || selectedCharacter.class}</span>
                  <span>•</span>
                  <span>Level {selectedCharacter.level}</span>
                </div>
                
                {calculateDerivedStats && (
                  <div className="grid grid-cols-3 gap-4">
                    <StatBar label="HP" value={calculateDerivedStats.hp} max={calculateDerivedStats.maxHp} color="red" />
                    <StatBar label="Mana" value={calculateDerivedStats.mana} max={calculateDerivedStats.maxMana} color="blue" />
                    <StatBar label="Stamina" value={calculateDerivedStats.stamina} max={calculateDerivedStats.maxStamina} color="green" />
                  </div>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="stats" data-testid="tab-stats">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Attributes
                </TabsTrigger>
                <TabsTrigger value="equipment" data-testid="tab-equipment">
                  <Sword className="w-4 h-4 mr-2" />
                  Equipment
                </TabsTrigger>
                <TabsTrigger value="skills" data-testid="tab-skills">
                  <Zap className="w-4 h-4 mr-2" />
                  Skills
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Base Attributes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(selectedCharacter.attributes).map(([name, value]) => (
                        <AttributeDisplay key={name} name={name} value={value} />
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Combat Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {calculateDerivedStats && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Sword className="w-4 h-4 text-red-500" />
                              Damage
                            </span>
                            <span className="font-bold">{calculateDerivedStats.damage}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Shield className="w-4 h-4 text-blue-500" />
                              Defense
                            </span>
                            <span className="font-bold">{calculateDerivedStats.defense}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              Speed
                            </span>
                            <span className="font-bold">{calculateDerivedStats.speed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Move className="w-4 h-4 text-green-500" />
                              Movement
                            </span>
                            <span className="font-bold">{calculateDerivedStats.movement} tiles</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-orange-500" />
                              Crit Chance
                            </span>
                            <span className="font-bold">{calculateDerivedStats.critChance.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="equipment" className="mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Weapon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCharacter.equipment.weapon ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Sword className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedCharacter.equipment.weapon.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedCharacter.equipment.weapon.type}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Damage: {selectedCharacter.equipment.weapon.stats.damageBase}</p>
                            <p>Speed: {selectedCharacter.equipment.weapon.stats.speedBase}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No weapon equipped</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Offhand</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCharacter.equipment.offhand ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedCharacter.equipment.offhand.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedCharacter.equipment.offhand.type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No offhand equipped</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Class Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((slot) => (
                        <div 
                          key={slot}
                          className="aspect-square bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                        >
                          <span className="text-muted-foreground text-xs">Slot {slot}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Skills are unlocked as you level up and progress through the skill tree.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Select a character from the roster</p>
          </div>
        )}
      </div>
    </div>
  );
}
