import { useEffect, useRef, useState, useCallback } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import type { Options, Node, Edge } from 'vis-network/standalone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CLASS_SKILL_TREES, type Skill, type SkillClass, type SkillTreeState } from '@shared/skillTree';
import { Sword, Wand, Dog, Crosshair, Lock, Unlock, Sparkles, RotateCcw } from 'lucide-react';

interface SkillTreeViewerProps {
  skillClass: SkillClass;
  onSkillSelect?: (skill: Skill) => void;
  onClose?: () => void;
}

const TIER_LEVELS: Record<string, number> = {
  tier1: 1,
  tier2: 2,
  tier3: 3,
  tier4: 4,
  tier5: 5
};

const LOCKED_COLOR = '#4a5568';
const UNLOCKED_COLOR = '#3b82f6';
const SELECTED_COLOR = '#22c55e';

const CLASS_ICONS: Record<SkillClass, typeof Sword> = {
  warrior: Sword,
  mage: Wand,
  worge: Dog,
  ranger: Crosshair
};

export function SkillTreeViewer({ skillClass, onSkillSelect, onClose }: SkillTreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillTreeState, setSkillTreeState] = useState<SkillTreeState>({
    skillClass,
    availablePoints: 10,
    spentPoints: 0,
    unlockedSkills: [],
    skillPoints: {}
  });

  const classTree = CLASS_SKILL_TREES.find(tree => tree.skillClass === skillClass);
  const ClassIcon = CLASS_ICONS[skillClass];

  const isSkillUnlocked = useCallback((skillId: string) => {
    return skillTreeState.unlockedSkills.includes(skillId);
  }, [skillTreeState.unlockedSkills]);

  const canUnlockSkill = useCallback((skill: Skill) => {
    if (skillTreeState.availablePoints <= 0) return false;
    if (isSkillUnlocked(skill.id)) return false;
    
    for (const req of skill.requirements) {
      if (req.skillId) {
        const reqPoints = skillTreeState.skillPoints[req.skillId] || 0;
        const reqLevel = req.level || 1;
        if (reqPoints < reqLevel) return false;
      }
    }
    return true;
  }, [skillTreeState, isSkillUnlocked]);

  const unlockSkill = useCallback((skill: Skill) => {
    if (!canUnlockSkill(skill)) return;
    
    setSkillTreeState(prev => ({
      ...prev,
      availablePoints: prev.availablePoints - 1,
      spentPoints: prev.spentPoints + 1,
      unlockedSkills: prev.unlockedSkills.includes(skill.id) 
        ? prev.unlockedSkills 
        : [...prev.unlockedSkills, skill.id],
      skillPoints: {
        ...prev.skillPoints,
        [skill.id]: (prev.skillPoints[skill.id] || 0) + 1
      }
    }));
  }, [canUnlockSkill]);

  const resetSkillTree = useCallback(() => {
    setSkillTreeState({
      skillClass,
      availablePoints: 10,
      spentPoints: 0,
      unlockedSkills: [],
      skillPoints: {}
    });
  }, [skillClass]);

  useEffect(() => {
    if (!containerRef.current || !classTree) return;

    const nodesData: Node[] = classTree.skills.map(skill => {
      const unlocked = isSkillUnlocked(skill.id);
      const canUnlock = canUnlockSkill(skill);
      const points = skillTreeState.skillPoints[skill.id] || 0;
      
      return {
        id: skill.id,
        label: `${skill.name}\n${points}/${skill.maxPoints}`,
        level: TIER_LEVELS[skill.tier],
        title: `${skill.name}\n${skill.description}\n\nType: ${skill.type}\nTier: ${skill.tier.replace('tier', 'Tier ')}\n\nEffects:\n${skill.effects.map(e => `• ${e.description}`).join('\n')}${skill.cooldown ? `\n\nCooldown: ${skill.cooldown}s` : ''}${skill.manaCost ? `\nMana Cost: ${skill.manaCost}` : ''}${skill.staminaCost ? `\nStamina Cost: ${skill.staminaCost}` : ''}`,
        color: {
          background: unlocked ? SELECTED_COLOR : canUnlock ? UNLOCKED_COLOR : LOCKED_COLOR,
          border: unlocked ? '#16a34a' : canUnlock ? '#2563eb' : '#374151',
          highlight: {
            background: unlocked ? SELECTED_COLOR : canUnlock ? UNLOCKED_COLOR : LOCKED_COLOR,
            border: '#fbbf24'
          }
        },
        font: {
          color: '#fff',
          size: 12,
          face: 'Inter, system-ui, sans-serif'
        },
        shape: skill.type === 'ultimate' ? 'star' : skill.type === 'passive' ? 'diamond' : 'box',
        size: skill.type === 'ultimate' ? 25 : 20,
        borderWidth: 2,
        shapeProperties: {
          borderDashes: !unlocked && !canUnlock ? [6, 4] : false
        }
      };
    });
    const nodes = new DataSet<Node>(nodesData);

    const edgesData: Edge[] = classTree.skills.flatMap(skill =>
      skill.requirements
        .filter(req => req.skillId)
        .map(req => ({
          id: `${req.skillId}-${skill.id}`,
          from: req.skillId!,
          to: skill.id,
          arrows: 'to',
          dashes: !isSkillUnlocked(skill.id),
          color: {
            color: isSkillUnlocked(skill.id) ? '#22c55e' : '#6b7280',
            highlight: '#fbbf24'
          },
          width: 2
        }))
    );
    const edges = new DataSet<Edge>(edgesData);

    const options: Options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 100,
          nodeSpacing: 150,
          treeSpacing: 200
        }
      },
      interaction: {
        selectConnectedEdges: false,
        hover: true,
        tooltipDelay: 100
      },
      nodes: {
        chosen: true
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.5
        }
      },
      physics: {
        enabled: false
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;
        const skill = classTree.skills.find(s => s.id === nodeId);
        if (skill) {
          setSelectedSkill(skill);
          if (canUnlockSkill(skill)) {
            unlockSkill(skill);
          }
          onSkillSelect?.(skill);
        }
      }
    });

    network.on('hoverNode', (params) => {
      const skill = classTree.skills.find(s => s.id === params.node);
      if (skill) {
        setSelectedSkill(skill);
      }
    });

    return () => {
      network.destroy();
    };
  }, [classTree, skillTreeState, isSkillUnlocked, canUnlockSkill, unlockSkill, onSkillSelect]);

  if (!classTree) {
    return (
      <Card className="p-4" data-testid="skill-tree-error">
        <p className="text-muted-foreground">Skill tree not found for class: {skillClass}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4" data-testid="skill-tree-viewer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: classTree.color }}
          >
            <ClassIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-cinzel">{classTree.displayName} Skills</h2>
            <p className="text-sm text-muted-foreground">
              Click nodes to unlock skills
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{skillTreeState.availablePoints}</span>
            <span className="text-sm text-muted-foreground">points available</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetSkillTree}
            data-testid="button-reset-skills"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-skill-tree">
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          Unlocked
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          Available
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-3 h-3 rounded bg-gray-600" />
          Locked
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-yellow-500" />
          Ultimate
        </Badge>
        <Badge variant="outline" className="gap-1">
          <div className="w-3 h-3 rotate-45 bg-gray-400" />
          Passive
        </Badge>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-[500px] border border-border rounded-lg bg-background/50"
        data-testid="skill-tree-canvas"
      />

      {selectedSkill && (
        <Card className="p-4 bg-card/80 backdrop-blur" data-testid="skill-details">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{selectedSkill.name}</h3>
                <Badge 
                  variant={selectedSkill.type === 'ultimate' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {selectedSkill.type}
                </Badge>
                <Badge variant="outline">
                  {selectedSkill.tier.replace('tier', 'Tier ')}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{selectedSkill.description}</p>
            </div>
            <div className="flex items-center gap-1">
              {isSkillUnlocked(selectedSkill.id) ? (
                <Unlock className="w-5 h-5 text-green-500" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Points: </span>
              <span className="font-medium">
                {skillTreeState.skillPoints[selectedSkill.id] || 0}/{selectedSkill.maxPoints}
              </span>
            </div>
            {selectedSkill.cooldown && (
              <div>
                <span className="text-muted-foreground">Cooldown: </span>
                <span className="font-medium">{selectedSkill.cooldown}s</span>
              </div>
            )}
            {selectedSkill.manaCost && (
              <div>
                <span className="text-muted-foreground">Mana: </span>
                <span className="font-medium text-blue-400">{selectedSkill.manaCost}</span>
              </div>
            )}
            {selectedSkill.staminaCost && (
              <div>
                <span className="text-muted-foreground">Stamina: </span>
                <span className="font-medium text-yellow-400">{selectedSkill.staminaCost}</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <span className="text-sm text-muted-foreground">Effects:</span>
            <ul className="mt-1 space-y-1">
              {selectedSkill.effects.map((effect, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {effect.description}
                </li>
              ))}
            </ul>
          </div>

          {selectedSkill.requirements.length > 0 && (
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">Requirements:</span>
              <ul className="mt-1 space-y-1">
                {selectedSkill.requirements.map((req, i) => {
                  const reqSkill = classTree.skills.find(s => s.id === req.skillId);
                  const met = req.skillId 
                    ? (skillTreeState.skillPoints[req.skillId] || 0) >= (req.level || 1)
                    : true;
                  return (
                    <li key={i} className={`text-sm flex items-center gap-2 ${met ? 'text-green-500' : 'text-red-400'}`}>
                      {met ? '✓' : '✗'} {reqSkill?.name || req.skillId} Lv.{req.level || 1}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {canUnlockSkill(selectedSkill) && (
            <Button 
              className="mt-4 w-full" 
              onClick={() => unlockSkill(selectedSkill)}
              data-testid="button-unlock-skill"
            >
              Unlock Skill (1 point)
            </Button>
          )}
        </Card>
      )}
    </Card>
  );
}
