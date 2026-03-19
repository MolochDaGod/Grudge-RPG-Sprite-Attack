import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { 
  Minus, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Shield, 
  Sword, 
  Heart, 
  Zap,
  Target,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useCharacterStats, type CharacterStatsHook } from '@/hooks/useCharacterStats';
import { CLASSES, RACES } from '@shared/gameDefinitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CharacterStatsPanelProps {
  stats?: CharacterStatsHook;
  compact?: boolean;
  showClassRaceSelect?: boolean;
}

const STAT_ICONS: Record<string, typeof Heart> = {
  Strength: Sword,
  Vitality: Heart,
  Endurance: Shield,
  Intellect: Sparkles,
  Wisdom: Zap,
  Dexterity: Target,
  Agility: ChevronUp,
  Tactics: ChevronDown,
};

const STAT_COLORS: Record<string, string> = {
  Strength: 'text-red-400',
  Vitality: 'text-green-400',
  Endurance: 'text-amber-400',
  Intellect: 'text-blue-400',
  Wisdom: 'text-purple-400',
  Dexterity: 'text-orange-400',
  Agility: 'text-cyan-400',
  Tactics: 'text-emerald-400',
};

export function CharacterStatsPanel({ 
  stats: externalStats, 
  compact = false,
  showClassRaceSelect = true,
}: CharacterStatsPanelProps) {
  const internalStats = useCharacterStats();
  const stats = externalStats || internalStats;
  
  const {
    level,
    setLevel,
    classId,
    setClassId,
    raceId,
    setRaceId,
    attributeAllocations,
    totalAvailablePoints,
    allocatedPoints,
    remainingPoints,
    derivedStats,
    allocatePoint,
    resetPoints,
    applyClassDefaults,
    ATTRIBUTE_IDS,
    ATTRIBUTES,
    MAX_LEVEL,
  } = stats;
  
  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatMultiplier = (val: number) => `${val.toFixed(2)}x`;
  
  return (
    <Card className="w-full max-w-2xl bg-card/95 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-cinzel">Character Stats</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" data-testid="badge-level">
              Level {level}
            </Badge>
            <Badge 
              variant={remainingPoints > 0 ? "default" : "secondary"}
              data-testid="badge-points-remaining"
            >
              {remainingPoints} pts
            </Badge>
          </div>
        </div>
        
        {showClassRaceSelect && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-32" data-testid="select-class">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CLASSES).map(id => (
                  <SelectItem key={id} value={id}>{CLASSES[id].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={raceId} onValueChange={setRaceId}>
              <SelectTrigger className="w-32" data-testid="select-race">
                <SelectValue placeholder="Race" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(RACES).map(id => (
                  <SelectItem key={id} value={id}>{RACES[id].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm text-muted-foreground">Lv</span>
              <Slider
                value={[level]}
                onValueChange={([v]) => setLevel(v)}
                min={1}
                max={MAX_LEVEL}
                step={1}
                className="w-24"
                data-testid="slider-level"
              />
              <span className="text-sm w-6">{level}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="attributes" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="attributes" data-testid="tab-attributes">Attributes</TabsTrigger>
            <TabsTrigger value="derived" data-testid="tab-derived">Combat Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attributes" className="space-y-3 mt-3">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                {allocatedPoints} / {totalAvailablePoints} points allocated
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={applyClassDefaults}
                  data-testid="button-class-defaults"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Class
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetPoints}
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
            
            <Progress 
              value={(allocatedPoints / totalAvailablePoints) * 100} 
              className="h-2"
            />
            
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {ATTRIBUTE_IDS.map(attrId => {
                const attr = ATTRIBUTES[attrId];
                const alloc = attributeAllocations[attrId];
                const Icon = STAT_ICONS[attrId] || Sparkles;
                const colorClass = STAT_COLORS[attrId] || 'text-foreground';
                
                return (
                  <div 
                    key={attrId}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover-elevate"
                    data-testid={`attribute-row-${attrId.toLowerCase()}`}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`p-1.5 rounded ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-semibold">{attr.name} ({attr.abbreviation})</p>
                        <p className="text-sm text-muted-foreground">{attr.description}</p>
                        <p className="text-xs mt-1">Role: {attr.role}</p>
                        {alloc.diminishingReturns && (
                          <p className="text-xs text-amber-400 mt-1">
                            Diminishing returns active (effective: {alloc.effective.toFixed(1)})
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">{attr.abbreviation}</span>
                        {alloc.diminishingReturns && (
                          <Badge variant="outline" className="text-xs px-1 py-0 text-amber-400 border-amber-400/50">
                            DR
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => allocatePoint(attrId, -1)}
                        disabled={alloc.allocated <= 0}
                        data-testid={`button-decrease-${attrId.toLowerCase()}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-12 text-center font-mono font-semibold cursor-help">
                            {alloc.allocated}
                            {alloc.diminishingReturns && (
                              <span className="text-xs text-amber-400 ml-0.5">
                                ({alloc.effective.toFixed(0)})
                              </span>
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Allocated: {alloc.allocated}</p>
                          {alloc.diminishingReturns && (
                            <p className="text-amber-400">Effective: {alloc.effective.toFixed(1)}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => allocatePoint(attrId, 1)}
                        disabled={remainingPoints <= 0}
                        data-testid={`button-increase-${attrId.toLowerCase()}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="derived" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <StatDisplay 
                label="Health" 
                value={derivedStats.health} 
                icon={Heart} 
                color="text-green-400"
                testId="stat-health"
              />
              <StatDisplay 
                label="Mana" 
                value={derivedStats.mana} 
                icon={Sparkles} 
                color="text-blue-400"
                testId="stat-mana"
              />
              <StatDisplay 
                label="Stamina" 
                value={derivedStats.stamina} 
                icon={Zap} 
                color="text-yellow-400"
                testId="stat-stamina"
              />
              <StatDisplay 
                label="Damage" 
                value={derivedStats.damage} 
                icon={Sword} 
                color="text-red-400"
                testId="stat-damage"
              />
              <StatDisplay 
                label="Defense" 
                value={derivedStats.defense} 
                icon={Shield} 
                color="text-amber-400"
                testId="stat-defense"
              />
              <StatDisplay 
                label="Accuracy" 
                value={formatPercent(derivedStats.accuracy)} 
                icon={Target} 
                color="text-orange-400"
                testId="stat-accuracy"
              />
            </div>
            
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Combat Modifiers</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between" data-testid="stat-block-chance">
                  <span className="text-muted-foreground">Block Chance</span>
                  <span className="font-mono">{formatPercent(derivedStats.blockChance)}</span>
                </div>
                <div className="flex justify-between" data-testid="stat-block-factor">
                  <span className="text-muted-foreground">Block Factor</span>
                  <span className="font-mono">{formatPercent(derivedStats.blockFactor)}</span>
                </div>
                <div className="flex justify-between" data-testid="stat-crit-chance">
                  <span className="text-muted-foreground">Crit Chance</span>
                  <span className="font-mono">{formatPercent(derivedStats.critChance)}</span>
                </div>
                <div className="flex justify-between" data-testid="stat-crit-factor">
                  <span className="text-muted-foreground">Crit Factor</span>
                  <span className="font-mono">{formatMultiplier(derivedStats.critFactor)}</span>
                </div>
                <div className="flex justify-between" data-testid="stat-resistance">
                  <span className="text-muted-foreground">Resistance</span>
                  <span className="font-mono">{formatPercent(derivedStats.resistance)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface StatDisplayProps {
  label: string;
  value: number | string;
  icon: typeof Heart;
  color: string;
  testId: string;
}

function StatDisplay({ label, value, icon: Icon, color, testId }: StatDisplayProps) {
  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
      data-testid={testId}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default CharacterStatsPanel;
