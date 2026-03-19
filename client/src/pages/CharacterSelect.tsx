import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SpritePreview } from "@/components/game/SpritePreview";
import { 
  ArrowLeft, 
  Sword, 
  Shield, 
  Heart, 
  Brain, 
  Target, 
  Zap, 
  Compass, 
  Sparkles,
  Plus,
  Minus,
  Check
} from "lucide-react";
import type { Race, HeroClass } from "@shared/spriteUUIDs";
import { 
  ATTRIBUTE_DEFINITIONS, 
  createDefaultAttributes, 
  createDefaultStats,
  calculateStatFromAttributes,
  type CharacterAttributes,
  type CharacterStats,
  type AttributeName,
  type StatName
} from "@shared/statsAttributes";
import { CLASS_SKILL_TREES, type Skill, type SkillTier } from "@shared/skillTree";

const RACES: { id: Race; name: string; faction: string; factionColor: string }[] = [
  { id: 'human', name: 'Human', faction: 'Crusade', factionColor: '#f59e0b' },
  { id: 'barbarian', name: 'Barbarian', faction: 'Crusade', factionColor: '#f59e0b' },
  { id: 'dwarf', name: 'Dwarf', faction: 'Fabled', factionColor: '#3b82f6' },
  { id: 'elf', name: 'Elf', faction: 'Fabled', factionColor: '#3b82f6' },
  { id: 'orc', name: 'Orc', faction: 'Legion', factionColor: '#ef4444' },
  { id: 'undead', name: 'Undead', faction: 'Legion', factionColor: '#ef4444' },
];

const CLASSES: { id: HeroClass; name: string; icon: string; color: string }[] = [
  { id: 'warrior', name: 'Warrior', icon: 'sword', color: '#ef4444' },
  { id: 'ranger', name: 'Ranger', icon: 'crosshair', color: '#22c55e' },
  { id: 'mage', name: 'Mage', icon: 'wand', color: '#8b5cf6' },
  { id: 'worge', name: 'Worge', icon: 'dog', color: '#d97706' },
];

const ATTRIBUTE_ICONS: Record<AttributeName, React.ReactNode> = {
  strength: <Sword className="h-4 w-4" />,
  vitality: <Heart className="h-4 w-4" />,
  endurance: <Shield className="h-4 w-4" />,
  intellect: <Brain className="h-4 w-4" />,
  wisdom: <Sparkles className="h-4 w-4" />,
  dexterity: <Target className="h-4 w-4" />,
  agility: <Zap className="h-4 w-4" />,
  tactics: <Compass className="h-4 w-4" />,
};

interface CharacterSelectProps {
  onBack: () => void;
  onConfirm: (race: Race, heroClass: HeroClass, attributes: CharacterAttributes) => void;
}

export default function CharacterSelect({ onBack, onConfirm }: CharacterSelectProps) {
  const [selectedRace, setSelectedRace] = useState<Race>('human');
  const [selectedClass, setSelectedClass] = useState<HeroClass>('warrior');
  const [attributes, setAttributes] = useState<CharacterAttributes>(createDefaultAttributes());
  const [availablePoints, setAvailablePoints] = useState(20);
  const [skillTreeState, setSkillTreeState] = useState<Record<string, number>>({});
  const [skillPoints, setSkillPoints] = useState(10);

  const selectedRaceInfo = RACES.find(r => r.id === selectedRace)!;
  const selectedClassInfo = CLASSES.find(c => c.id === selectedClass)!;
  const classSkillTree = CLASS_SKILL_TREES.find(t => t.skillClass === selectedClass);

  const calculatedStats = useMemo(() => {
    const baseStats = createDefaultStats();
    const stats: CharacterStats = { ...baseStats };
    
    (Object.keys(stats) as StatName[]).forEach(statName => {
      stats[statName] = calculateStatFromAttributes(statName, baseStats[statName], attributes);
    });
    
    return stats;
  }, [attributes]);

  const handleAttributeChange = (attr: AttributeName, delta: number) => {
    const currentValue = attributes[attr];
    const newValue = currentValue + delta;
    
    if (delta > 0 && availablePoints <= 0) return;
    if (newValue < 0) return;
    if (newValue > 50) return;
    
    setAttributes(prev => ({ ...prev, [attr]: newValue }));
    setAvailablePoints(prev => prev - delta);
  };

  const handleSkillPointChange = (skillId: string, delta: number) => {
    const skill = classSkillTree?.skills.find(s => s.id === skillId);
    if (!skill) return;
    
    const currentPoints = skillTreeState[skillId] || 0;
    const newPoints = currentPoints + delta;
    
    if (delta > 0 && skillPoints <= 0) return;
    if (newPoints < 0) return;
    if (newPoints > skill.maxPoints) return;
    
    if (delta > 0 && skill.requirements.length > 0) {
      const meetsRequirements = skill.requirements.every(req => {
        if (req.skillId) {
          return (skillTreeState[req.skillId] || 0) >= (req.level || 1);
        }
        return true;
      });
      if (!meetsRequirements) return;
    }
    
    setSkillTreeState(prev => ({ ...prev, [skillId]: newPoints }));
    setSkillPoints(prev => prev - delta);
  };

  const getSkillsByTier = (tier: SkillTier): Skill[] => {
    return classSkillTree?.skills.filter(s => s.tier === tier) || [];
  };

  const canUnlockSkill = (skill: Skill): boolean => {
    if (skill.requirements.length === 0) return true;
    return skill.requirements.every(req => {
      if (req.skillId) {
        return (skillTreeState[req.skillId] || 0) >= (req.level || 1);
      }
      return true;
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedRace, selectedClass, attributes);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold font-cinzel">Character Creation</h1>
          <Button onClick={handleConfirm} data-testid="button-confirm">
            <Check className="h-4 w-4 mr-2" />
            Confirm
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Select Character</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Race</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {RACES.map(race => (
                      <Button
                        key={race.id}
                        variant={selectedRace === race.id ? "default" : "outline"}
                        size="sm"
                        className="flex flex-col h-auto py-2"
                        onClick={() => setSelectedRace(race.id)}
                        data-testid={`button-race-${race.id}`}
                      >
                        <span className="text-xs">{race.name}</span>
                        <span 
                          className="text-[10px] opacity-70"
                          style={{ color: selectedRace === race.id ? undefined : race.factionColor }}
                        >
                          {race.faction}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Class</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CLASSES.map(cls => (
                      <Button
                        key={cls.id}
                        variant={selectedClass === cls.id ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setSelectedClass(cls.id);
                          setSkillTreeState({});
                          setSkillPoints(10);
                        }}
                        data-testid={`button-class-${cls.id}`}
                      >
                        <span>{cls.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div 
                    className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden"
                    style={{ borderColor: selectedClassInfo.color, borderWidth: 2 }}
                  >
                    <SpritePreview
                      race={selectedRace}
                      heroClass={selectedClass}
                      animation="idle"
                      width={180}
                      height={180}
                      scale={1.8}
                    />
                    <Badge 
                      className="absolute top-2 right-2"
                      style={{ backgroundColor: selectedRaceInfo.factionColor }}
                    >
                      {selectedRaceInfo.faction}
                    </Badge>
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <div className="text-sm font-medium">{selectedRaceInfo.name}</div>
                      <div className="text-xs opacity-70">{selectedClassInfo.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <Tabs defaultValue="attributes">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="attributes" data-testid="tab-attributes">
                      Attributes
                    </TabsTrigger>
                    <TabsTrigger value="skills" data-testid="tab-skills">
                      Skills
                    </TabsTrigger>
                    <TabsTrigger value="stats" data-testid="tab-stats">
                      Stats
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      Attr Points: {availablePoints}
                    </Badge>
                    <Badge variant="secondary">
                      Skill Points: {skillPoints}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="attributes" className="mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    {ATTRIBUTE_DEFINITIONS.map(attr => (
                      <div 
                        key={attr.name}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="p-1.5 rounded"
                              style={{ backgroundColor: `${attr.color}20`, color: attr.color }}
                            >
                              {ATTRIBUTE_ICONS[attr.name]}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{attr.displayName}</div>
                              <div className="text-[10px] opacity-70">{attr.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleAttributeChange(attr.name, -1)}
                              disabled={attributes[attr.name] <= 0}
                              data-testid={`button-attr-minus-${attr.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold">
                              {attributes[attr.name]}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleAttributeChange(attr.name, 1)}
                              disabled={availablePoints <= 0 || attributes[attr.name] >= 50}
                              data-testid={`button-attr-plus-${attr.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Progress 
                              value={(attributes[attr.name] / 50) * 100} 
                              className="h-1.5"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-xs">{attr.description}</p>
                            <div className="mt-1 text-[10px] opacity-70">
                              {attr.effects.map((e, i) => (
                                <div key={i}>
                                  {e.stat}: +{e.bonus.flat} flat, +{e.bonus.percent}% per point
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {(['tier1', 'tier2', 'tier3', 'tier4', 'tier5'] as SkillTier[]).map(tier => {
                        const tierSkills = getSkillsByTier(tier);
                        if (tierSkills.length === 0) return null;
                        
                        return (
                          <div key={tier}>
                            <h4 className="text-sm font-medium mb-2 uppercase opacity-70">
                              {tier.replace('tier', 'Tier ')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {tierSkills.map(skill => {
                                const points = skillTreeState[skill.id] || 0;
                                const unlocked = canUnlockSkill(skill);
                                
                                return (
                                  <div
                                    key={skill.id}
                                    className={`p-3 rounded-lg border ${
                                      unlocked ? 'bg-card' : 'bg-muted opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge 
                                            variant={skill.type === 'ultimate' ? 'default' : 'secondary'}
                                            className="text-[10px]"
                                          >
                                            {skill.type}
                                          </Badge>
                                          <span className="font-medium text-sm">{skill.name}</span>
                                        </div>
                                        <p className="text-xs opacity-70 mb-2">{skill.description}</p>
                                        <div className="flex items-center gap-2 text-[10px]">
                                          {skill.cooldown && (
                                            <span className="opacity-70">CD: {skill.cooldown}s</span>
                                          )}
                                          {skill.manaCost && (
                                            <span className="text-blue-400">Mana: {skill.manaCost}</span>
                                          )}
                                          {skill.staminaCost && (
                                            <span className="text-yellow-400">Stamina: {skill.staminaCost}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-5 w-5"
                                          onClick={() => handleSkillPointChange(skill.id, 1)}
                                          disabled={!unlocked || skillPoints <= 0 || points >= skill.maxPoints}
                                          data-testid={`button-skill-plus-${skill.id}`}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-xs font-bold">
                                          {points}/{skill.maxPoints}
                                        </span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-5 w-5"
                                          onClick={() => handleSkillPointChange(skill.id, -1)}
                                          disabled={points <= 0}
                                          data-testid={`button-skill-minus-${skill.id}`}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(calculatedStats) as [StatName, number][]).map(([stat, value]) => {
                      const baseStats = createDefaultStats();
                      const baseValue = baseStats[stat];
                      const bonus = value - baseValue;
                      
                      return (
                        <div 
                          key={stat}
                          className="p-3 rounded-lg border bg-card flex items-center justify-between"
                        >
                          <span className="capitalize text-sm">{stat.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="text-right">
                            <span className="font-bold">{Math.floor(value)}</span>
                            {bonus > 0 && (
                              <span className="text-green-500 text-xs ml-1">
                                (+{Math.floor(bonus)})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
