import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getWeaponSkillTree, 
  getHotkeySkills,
  type WeaponType, 
  type WeaponSkill,
  type HotkeySlot
} from '@shared/skillTree';
import { 
  RotateCcw, Zap, Clock, Droplets,
  Sword, Shield, Wind, Repeat, ArrowRight, RotateCw, Sparkles, Swords,
  Target, Crosshair, Maximize, CircleDot, Flame, CloudRain, Split, MoveRight,
  Star, Snowflake, Circle,
  Skull, FlaskConical, Tornado, Scissors, Bug, Moon, Flower,
  Axe, MoveHorizontal, ShieldOff, ArrowDown, Droplet, Heart, Angry,
  Hammer, Bomb, Gem, CircleDashed, Mountain, Castle, LucideIcon
} from 'lucide-react';

interface WeaponSkillTreeViewerProps {
  weaponType: WeaponType;
  onClose: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'sword': Sword,
  'shield': Shield,
  'wind': Wind,
  'repeat': Repeat,
  'zap': Zap,
  'arrow-right': ArrowRight,
  'rotate-cw': RotateCw,
  'sparkles': Sparkles,
  'swords': Swords,
  'target': Target,
  'crosshair': Crosshair,
  'maximize': Maximize,
  'circle-dot': CircleDot,
  'flame': Flame,
  'cloud-rain': CloudRain,
  'split': Split,
  'move-right': MoveRight,
  'droplets': Droplet,
  'star': Star,
  'snowflake': Snowflake,
  'circle': Circle,
  'skull': Skull,
  'flask-conical': FlaskConical,
  'tornado': Tornado,
  'knife': Scissors,
  'bug': Bug,
  'moon': Moon,
  'flower': Flower,
  'axe': Axe,
  'move-horizontal': MoveHorizontal,
  'shield-off': ShieldOff,
  'arrow-down': ArrowDown,
  'droplet': Droplet,
  'heart': Heart,
  'angry': Angry,
  'hammer': Hammer,
  'bomb': Bomb,
  'gem': Gem,
  'circle-dashed': CircleDashed,
  'mountain': Mountain,
  'castle': Castle
};

const WEAPON_ICONS: Record<WeaponType, LucideIcon> = {
  sword: Sword,
  bow: Target,
  staff: Sparkles,
  dagger: Scissors,
  axe: Axe,
  hammer: Hammer
};

const HOTKEY_LABELS: Record<HotkeySlot, string> = {
  Q: 'Basic Attack',
  W: 'Secondary',
  E: 'Defensive',
  R: 'Mobility',
  D: 'Special',
  F: 'Ultimate'
};

function SkillIcon({ iconName, className, style }: { iconName: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = ICON_MAP[iconName] || Circle;
  return <IconComponent className={className} style={style} />;
}

export function WeaponSkillTreeViewer({ weaponType, onClose }: WeaponSkillTreeViewerProps) {
  const tree = getWeaponSkillTree(weaponType);
  const hotkeySkills = useMemo(() => getHotkeySkills(weaponType), [weaponType]);
  
  const [skillPoints, setSkillPoints] = useState<Record<string, number>>({});
  const [availablePoints, setAvailablePoints] = useState(10);
  const [selectedSkill, setSelectedSkill] = useState<WeaponSkill | null>(null);
  const [equippedSkills, setEquippedSkills] = useState<Record<HotkeySlot, string | undefined>>({
    Q: undefined,
    W: undefined,
    E: undefined,
    R: undefined,
    D: undefined,
    F: undefined
  });

  if (!tree) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Weapon tree not found.</p>
        <Button onClick={onClose} className="mt-4">Go Back</Button>
      </Card>
    );
  }

  const WeaponIcon = WEAPON_ICONS[weaponType];
  const getSkillPoints = (skillId: string) => skillPoints[skillId] || 0;
  
  const isSkillUnlocked = (skill: WeaponSkill) => getSkillPoints(skill.id) > 0;
  
  const canUnlockSkill = (skill: WeaponSkill) => {
    if (availablePoints <= 0) return false;
    if (getSkillPoints(skill.id) >= skill.maxPoints) return false;
    if (skill.requires) {
      const reqPoints = getSkillPoints(skill.requires);
      if (reqPoints <= 0) return false;
    }
    return true;
  };

  const unlockSkill = (skill: WeaponSkill) => {
    if (!canUnlockSkill(skill)) return;
    
    setSkillPoints(prev => ({
      ...prev,
      [skill.id]: (prev[skill.id] || 0) + 1
    }));
    setAvailablePoints(prev => prev - 1);
  };

  const resetSkills = () => {
    const totalSpent = Object.values(skillPoints).reduce((a, b) => a + b, 0);
    setSkillPoints({});
    setAvailablePoints(prev => prev + totalSpent);
    setEquippedSkills({
      Q: undefined,
      W: undefined,
      E: undefined,
      R: undefined,
      D: undefined,
      F: undefined
    });
  };

  const getEquippedSkill = (hotkey: HotkeySlot): WeaponSkill | undefined => {
    const skillId = equippedSkills[hotkey];
    if (!skillId) return hotkeySkills[hotkey];
    
    for (const tier of tree.tiers) {
      const skill = tier.skills.find(s => s.id === skillId);
      if (skill) return skill;
    }
    return hotkeySkills[hotkey];
  };

  const totalSpent = Object.values(skillPoints).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4" style={{ borderColor: tree.color }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: tree.color + '20', border: `2px solid ${tree.color}` }}
            >
              <WeaponIcon className="w-6 h-6" style={{ color: tree.color }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-cinzel" style={{ color: tree.color }}>
                {tree.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tree.tiers.reduce((acc, t) => acc + t.skills.length, 0)} skills across {tree.tiers.length} tiers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary rounded-lg">
              <span className="text-muted-foreground text-sm">Points:</span>
              <span className="text-2xl font-bold text-primary">{availablePoints}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetSkills}
              disabled={totalSpent === 0}
              className="text-destructive border-destructive/50"
              data-testid="button-reset-weapon-skills"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-lg mb-4 font-cinzel text-center">Action Bar - Hotkey Slots</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {(['Q', 'W', 'E', 'R', 'D', 'F'] as HotkeySlot[]).map((hotkey) => {
            const equipped = getEquippedSkill(hotkey);
            const isUnlocked = equipped ? isSkillUnlocked(equipped) : false;
            
            return (
              <div key={hotkey} className="flex flex-col items-center gap-2 min-w-[140px]">
                <div 
                  className="w-14 h-14 rounded-lg border-3 flex items-center justify-center font-bold text-xl font-cinzel"
                  style={{ 
                    background: `linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1))`,
                    borderColor: '#ffd700',
                    color: '#ffd700'
                  }}
                >
                  {hotkey}
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {HOTKEY_LABELS[hotkey]}
                </span>
                
                {equipped ? (
                  <div 
                    className={`w-full p-3 rounded-lg border-2 text-center ${
                      isUnlocked 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/30 border-border opacity-50'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <SkillIcon 
                        iconName={equipped.icon} 
                        className="w-8 h-8"
                        style={{ color: isUnlocked ? tree.color : 'currentColor' }}
                      />
                    </div>
                    <div className="font-semibold text-sm" style={{ color: isUnlocked ? tree.color : 'inherit' }}>
                      {equipped.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {equipped.effect}
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-3 rounded-lg border-2 border-dashed border-border text-center">
                    <div className="text-muted-foreground text-sm">Empty</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {tree.tiers.map((tier, tierIndex) => (
            <Card key={tier.name} className="p-4">
              <h3 
                className="font-bold mb-4 text-sm uppercase tracking-wide"
                style={{ color: '#ffd700' }}
              >
                {tier.name}
              </h3>
              
              <div className="flex flex-wrap gap-4">
                {tier.skills.map((skill) => {
                  const points = getSkillPoints(skill.id);
                  const unlocked = points > 0;
                  const canUnlock = canUnlockSkill(skill);
                  const maxed = points >= skill.maxPoints;
                  
                  return (
                    <div
                      key={skill.id}
                      className={`
                        relative w-[70px] h-[70px] rounded-full border-3 cursor-pointer
                        flex items-center justify-center transition-all
                        ${unlocked ? 'border-amber-400 shadow-lg shadow-amber-400/30' : ''}
                        ${canUnlock && !unlocked ? 'border-primary animate-pulse' : ''}
                        ${!unlocked && !canUnlock ? 'border-muted-foreground/30 opacity-60' : ''}
                      `}
                      style={{
                        background: unlocked ? `${tree.color}20` : 'var(--card)',
                        borderColor: unlocked ? '#ffd700' : canUnlock ? 'var(--primary)' : undefined
                      }}
                      onClick={() => {
                        setSelectedSkill(skill);
                        if (canUnlock) unlockSkill(skill);
                      }}
                      data-testid={`skill-node-${skill.id}`}
                    >
                      <SkillIcon 
                        iconName={skill.icon}
                        className="w-8 h-8"
                        style={{ 
                          color: unlocked ? tree.color : 'var(--muted-foreground)',
                          opacity: unlocked ? 1 : 0.5
                        }}
                      />
                      
                      {skill.maxPoints > 1 && (
                        <div 
                          className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold border-2"
                          style={{
                            background: 'var(--card)',
                            borderColor: '#ffd700',
                            color: '#ffd700'
                          }}
                        >
                          {points}/{skill.maxPoints}
                        </div>
                      )}
                      
                      {skill.hotkey && (
                        <div 
                          className="absolute -top-2 -left-2 w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.5), rgba(255, 215, 0, 0.2))',
                            border: '1px solid #ffd700',
                            color: '#ffd700'
                          }}
                        >
                          {skill.hotkey}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-bold text-lg mb-4 font-cinzel">Skill Details</h3>
            
            {selectedSkill ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: tree.color + '20', 
                      border: `2px solid ${tree.color}` 
                    }}
                  >
                    <SkillIcon iconName={selectedSkill.icon} className="w-8 h-8" style={{ color: tree.color }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#ffd700' }}>
                      {selectedSkill.name}
                    </h4>
                    <Badge variant="secondary">
                      {selectedSkill.tier.replace('tier', 'Tier ')}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground">{selectedSkill.description}</p>
                
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="text-primary font-semibold">{selectedSkill.effect}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-bold">
                      {getSkillPoints(selectedSkill.id)}/{selectedSkill.maxPoints}
                    </span>
                  </div>
                  
                  {selectedSkill.hotkey && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Hotkey:</span>
                      <span 
                        className="px-2 py-0.5 rounded font-bold"
                        style={{ 
                          background: 'rgba(255, 215, 0, 0.2)',
                          color: '#ffd700'
                        }}
                      >
                        {selectedSkill.hotkey}
                      </span>
                    </div>
                  )}
                  
                  {selectedSkill.cooldown && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSkill.cooldown}s</span>
                    </div>
                  )}
                  
                  {selectedSkill.staminaCost && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>{selectedSkill.staminaCost} Stamina</span>
                    </div>
                  )}
                  
                  {selectedSkill.manaCost && (
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span>{selectedSkill.manaCost} Mana</span>
                    </div>
                  )}
                </div>
                
                {selectedSkill.requires && (
                  <div className="text-sm text-destructive">
                    Requires: {selectedSkill.requires}
                  </div>
                )}
                
                {canUnlockSkill(selectedSkill) && (
                  <Button 
                    onClick={() => unlockSkill(selectedSkill)}
                    className="w-full"
                    data-testid="button-unlock-skill"
                  >
                    Unlock Skill
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Click on a skill to view details</p>
              </div>
            )}
          </Card>
          
          <Card className="p-4">
            <h4 className="font-bold mb-2">Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Points Spent:</span>
              </div>
              <div className="font-bold text-right">{totalSpent}</div>
              
              <div>
                <span className="text-muted-foreground">Skills Unlocked:</span>
              </div>
              <div className="font-bold text-right">
                {Object.values(skillPoints).filter(p => p > 0).length}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
