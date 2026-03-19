import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillTreeViewer } from '@/components/game/SkillTreeViewer';
import { WeaponSkillTreeViewer } from '@/components/game/WeaponSkillTreeViewer';
import { 
  CLASS_SKILL_TREES, 
  WEAPON_SKILL_TREES,
  type SkillClass, 
  type WeaponType 
} from '@shared/skillTree';
import { Sword, Wand, Dog, Crosshair, ArrowLeft, TreeDeciduous, Target, Axe, Hammer, Sparkles, Scissors, LucideIcon } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';

const CLASS_ICONS: Record<SkillClass, LucideIcon> = {
  warrior: Sword,
  mage: Wand,
  worge: Dog,
  ranger: Crosshair
};

const WEAPON_ICONS: Record<WeaponType, LucideIcon> = {
  sword: Sword,
  bow: Target,
  staff: Sparkles,
  dagger: Scissors,
  axe: Axe,
  hammer: Hammer
};

type TreeMode = 'class' | 'weapons';

export default function SkillTrees() {
  const game = useGameState();
  const [mode, setMode] = useState<TreeMode>('class');
  const [selectedClass, setSelectedClass] = useState<SkillClass | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | null>(null);

  const handleBack = () => {
    if (selectedClass || selectedWeapon) {
      setSelectedClass(null);
      setSelectedWeapon(null);
    } else {
      game.setPhase("menu");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" data-testid="skill-trees-page">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TreeDeciduous className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-cinzel">Skill Trees</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {selectedClass || selectedWeapon ? 'Back' : 'Back to Menu'}
          </Button>
        </div>

        {!selectedClass && !selectedWeapon ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 p-3 bg-card rounded-xl border">
              <Button
                variant={mode === 'class' ? 'default' : 'outline'}
                onClick={() => setMode('class')}
                className="min-w-32"
                data-testid="button-mode-class"
              >
                <Sword className="w-4 h-4 mr-2" />
                Class
              </Button>
              <Button
                variant={mode === 'weapons' ? 'default' : 'outline'}
                onClick={() => setMode('weapons')}
                className="min-w-32"
                style={mode === 'weapons' ? { backgroundColor: '#f59e0b' } : {}}
                data-testid="button-mode-weapons"
              >
                <Target className="w-4 h-4 mr-2" />
                Weapons
              </Button>
            </div>

            {mode === 'class' ? (
              <>
                <p className="text-muted-foreground text-lg text-center">
                  Select a class to view and customize their skill tree.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CLASS_SKILL_TREES.map(tree => {
                    const ClassIcon = CLASS_ICONS[tree.skillClass];
                    return (
                      <Card 
                        key={tree.skillClass}
                        className="p-6 cursor-pointer hover-elevate transition-all"
                        onClick={() => setSelectedClass(tree.skillClass)}
                        data-testid={`card-class-${tree.skillClass}`}
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: tree.color }}
                          >
                            <ClassIcon className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold font-cinzel">{tree.displayName}</h2>
                            <Badge variant="secondary" className="mt-2">
                              {tree.skills.length} Skills
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getClassDescription(tree.skillClass)}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="p-6 bg-muted/30">
                  <h3 className="font-bold text-lg mb-3">Class Skill Tree System</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">5 Tiers</h4>
                      <p className="text-muted-foreground">
                        Skills are organized into 5 tiers. Higher tier skills require lower tier prerequisites.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">3 Types</h4>
                      <p className="text-muted-foreground">
                        <span className="text-green-400">Active</span> skills are used in combat, <span className="text-purple-400">Passive</span> skills provide permanent bonuses, and <span className="text-yellow-400">Ultimate</span> skills are powerful finishers.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Point Investment</h4>
                      <p className="text-muted-foreground">
                        Earn skill points through leveling. Invest points to unlock and upgrade skills.
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-lg text-center">
                  Select a weapon to view its skill tree and hotkey abilities.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {WEAPON_SKILL_TREES.map(tree => {
                    const WeaponIcon = WEAPON_ICONS[tree.weaponType];
                    return (
                      <Card 
                        key={tree.weaponType}
                        className="p-4 cursor-pointer hover-elevate transition-all"
                        onClick={() => setSelectedWeapon(tree.weaponType)}
                        data-testid={`card-weapon-${tree.weaponType}`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: tree.color + '20', border: `2px solid ${tree.color}` }}
                          >
                            <WeaponIcon className="w-7 h-7" style={{ color: tree.color }} />
                          </div>
                          <div>
                            <h2 className="font-bold font-cinzel text-sm">{tree.displayName}</h2>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {tree.tiers.reduce((acc, t) => acc + t.skills.length, 0)} Skills
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="p-6 bg-muted/30">
                  <h3 className="font-bold text-lg mb-3">Weapon Skill System</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Hotkey Bindings</h4>
                      <p className="text-muted-foreground">
                        Weapon skills are bound to hotkeys <span className="font-mono text-primary">Q W E R D F</span> for quick combat access.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">4 Tiers</h4>
                      <p className="text-muted-foreground">
                        Each weapon has skills across 4 tiers from basic attacks to ultimate abilities.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Weapon Mastery</h4>
                      <p className="text-muted-foreground">
                        Unlock passive bonuses and active abilities by investing points in weapon skills.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="font-semibold text-primary mb-3">Hotkey Slots</h4>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {['Q', 'W', 'E', 'R', 'D', 'F'].map((key) => (
                        <div 
                          key={key}
                          className="w-12 h-12 rounded-lg border-2 border-primary/50 bg-primary/10 flex items-center justify-center font-bold text-xl font-cinzel text-primary"
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        ) : selectedClass ? (
          <div className="space-y-4">
            <SkillTreeViewer 
              skillClass={selectedClass}
              onClose={() => setSelectedClass(null)}
            />
          </div>
        ) : selectedWeapon ? (
          <div className="space-y-4">
            <WeaponSkillTreeViewer 
              weaponType={selectedWeapon}
              onClose={() => setSelectedWeapon(null)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getClassDescription(skillClass: SkillClass): string {
  switch (skillClass) {
    case 'warrior':
      return 'Master of melee combat with powerful strikes and defensive abilities.';
    case 'mage':
      return 'Wielder of arcane magic, combining destruction and healing.';
    case 'worge':
      return 'Savage beast form with bleeding attacks and pack tactics.';
    case 'ranger':
      return 'Expert marksman with traps, stealth, and precision shots.';
  }
}
