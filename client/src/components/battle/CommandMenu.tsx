import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpritePreview } from '@/components/game/SpritePreview';
import { Sword, Shield, Sparkles, Package } from 'lucide-react';
import type { BattleUnit, BattleSkill, BattleAction } from '@/lib/battleEngine';
import { useState, useEffect, useCallback } from 'react';

interface CommandMenuProps {
  activeUnit: BattleUnit | null;
  enemies: BattleUnit[];
  allies: BattleUnit[];
  onAction: (action: BattleAction) => void;
  disabled?: boolean;
}

type MenuState = 'main' | 'attack' | 'skill' | 'target';

export function CommandMenu({ activeUnit, enemies, allies, onAction, disabled }: CommandMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('main');
  const [selectedSkill, setSelectedSkill] = useState<BattleSkill | null>(null);

  const isInactive = !activeUnit || activeUnit.isEnemy;

  const handleAttack = useCallback(() => {
    if (!activeUnit || activeUnit.isEnemy) return;
    setSelectedSkill(activeUnit.skills[0]);
    setMenuState('target');
  }, [activeUnit]);

  const handleSkillSelect = useCallback((skill: BattleSkill) => {
    if (!activeUnit || activeUnit.isEnemy) return;
    if (skill.currentCooldown > 0 || skill.mpCost > activeUnit.stats.mp) return;
    setSelectedSkill(skill);
    setMenuState('target');
  }, [activeUnit]);

  const handleTargetSelect = useCallback((targetId: string) => {
    if (!selectedSkill || !activeUnit) return;
    
    onAction({
      type: 'skill',
      actorId: activeUnit.id,
      targetId,
      skillId: selectedSkill.id,
    });
    
    setMenuState('main');
    setSelectedSkill(null);
  }, [selectedSkill, activeUnit, onAction]);

  const handleDefend = useCallback(() => {
    if (!activeUnit) return;
    onAction({
      type: 'defend',
      actorId: activeUnit.id,
    });
    setMenuState('main');
  }, [activeUnit, onAction]);

  const handleBack = useCallback(() => {
    setMenuState('main');
    setSelectedSkill(null);
  }, []);

  const validTargets = selectedSkill?.type === 'heal' 
    ? allies.filter(u => u.stats.hp > 0)
    : enemies.filter(u => u.stats.hp > 0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || !activeUnit || activeUnit.isEnemy) return;
    
    if (menuState === 'main') {
      switch (e.key) {
        case '1':
          handleAttack();
          break;
        case '2':
          setMenuState('skill');
          break;
        case '3':
          handleDefend();
          break;
        case '4':
          break;
        case 'Escape':
          handleBack();
          break;
      }
    } else if (menuState === 'skill') {
      const skillIndex = parseInt(e.key) - 1;
      if (skillIndex >= 0 && skillIndex < activeUnit.skills.length) {
        handleSkillSelect(activeUnit.skills[skillIndex]);
      }
      if (e.key === 'Escape') {
        handleBack();
      }
    } else if (menuState === 'target') {
      const targetIndex = parseInt(e.key) - 1;
      if (targetIndex >= 0 && targetIndex < validTargets.length) {
        handleTargetSelect(validTargets[targetIndex].id);
      }
      if (e.key === 'Escape') {
        handleBack();
      }
    }
  }, [menuState, disabled, activeUnit, validTargets, handleAttack, handleDefend, handleBack, handleSkillSelect, handleTargetSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isInactive) {
    return (
      <Card className="p-4 bg-card/90 backdrop-blur" data-testid="command-menu-waiting">
        <div className="text-center text-muted-foreground">
          {activeUnit?.isEnemy ? 'Enemy turn...' : 'Waiting for action...'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/90 backdrop-blur space-y-4" data-testid="command-menu">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded overflow-hidden bg-muted/30">
            <SpritePreview
              race={activeUnit.race}
              heroClass={activeUnit.heroClass}
              animation="idle"
              width={48}
              height={48}
              scale={0.48}
            />
          </div>
          <div>
            <span className="font-bold text-lg">{activeUnit.name}</span>
            <Badge variant="secondary" className="ml-2">{activeUnit.heroClass}</Badge>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-green-400">HP: {activeUnit.stats.hp}/{activeUnit.stats.maxHp}</span>
          <span className="text-blue-400">MP: {activeUnit.stats.mp}/{activeUnit.stats.maxMp}</span>
        </div>
      </div>

      {menuState === 'main' && (
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={handleAttack}
            disabled={disabled}
            className="flex flex-col items-center gap-1 h-16"
            data-testid="button-attack"
          >
            <Sword className="w-5 h-5" />
            <span>Attack</span>
            <Badge variant="outline" className="text-xs px-1">1</Badge>
          </Button>
          <Button
            onClick={() => setMenuState('skill')}
            disabled={disabled}
            variant="secondary"
            className="flex flex-col items-center gap-1 h-16"
            data-testid="button-skills"
          >
            <Sparkles className="w-5 h-5" />
            <span>Skills</span>
            <Badge variant="outline" className="text-xs px-1">2</Badge>
          </Button>
          <Button
            onClick={handleDefend}
            disabled={disabled}
            variant="secondary"
            className="flex flex-col items-center gap-1 h-16"
            data-testid="button-defend"
          >
            <Shield className="w-5 h-5" />
            <span>Defend</span>
            <Badge variant="outline" className="text-xs px-1">3</Badge>
          </Button>
          <Button
            disabled
            variant="secondary"
            className="flex flex-col items-center gap-1 h-16 opacity-50"
            data-testid="button-item"
          >
            <Package className="w-5 h-5" />
            <span>Item</span>
            <Badge variant="outline" className="text-xs px-1">4</Badge>
          </Button>
        </div>
      )}

      {menuState === 'skill' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Select Skill</span>
            <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activeUnit.skills.map(skill => (
              <Button
                key={skill.id}
                onClick={() => handleSkillSelect(skill)}
                disabled={skill.currentCooldown > 0 || skill.mpCost > activeUnit.stats.mp}
                variant={skill.currentCooldown > 0 ? 'ghost' : 'secondary'}
                className="flex flex-col items-start h-auto py-2 px-3"
                data-testid={`button-skill-${skill.id}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{skill.name}</span>
                  {skill.mpCost > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {skill.mpCost} MP
                    </Badge>
                  )}
                </div>
                {skill.currentCooldown > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Cooldown: {skill.currentCooldown}
                  </span>
                )}
                {skill.damage && (
                  <span className="text-xs text-orange-400">
                    DMG: {skill.damage}
                  </span>
                )}
                {skill.healing && (
                  <span className="text-xs text-green-400">
                    Heal: {skill.healing}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {menuState === 'target' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              Select Target for {selectedSkill?.name}
            </span>
            <Button size="sm" variant="ghost" onClick={handleBack}>Back</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {validTargets.map(target => (
              <Button
                key={target.id}
                onClick={() => handleTargetSelect(target.id)}
                variant="outline"
                className="flex flex-col items-start h-auto py-2 px-3"
                data-testid={`button-target-${target.id}`}
              >
                <span className="font-medium">{target.name}</span>
                <div className="flex gap-2 text-xs">
                  <span className={target.stats.hp < target.stats.maxHp * 0.3 ? 'text-red-400' : 'text-green-400'}>
                    HP: {target.stats.hp}/{target.stats.maxHp}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
