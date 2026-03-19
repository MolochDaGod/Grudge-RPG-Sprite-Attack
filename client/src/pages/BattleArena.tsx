import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhaserBattleRenderer } from '@/components/battle/PhaserBattleRenderer';
import { CommandMenu } from '@/components/battle/CommandMenu';
import { BattleLog } from '@/components/battle/BattleLog';
import { TurnOrder } from '@/components/battle/TurnOrder';
import {
  createBattleUnit,
  createInitialBattleState,
  updateATBGauges,
  executeAction,
  getAIAction,
  reduceCooldowns,
  generateEnemyParty,
  type BattleState,
  type BattleUnit,
  type BattleAction,
} from '@/lib/battleEngine';
import type { Race, HeroClass } from '@shared/spriteUUIDs';
import { ArrowLeft, Trophy, Skull, Play, Pause, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BattleArenaProps {
  playerParty?: Array<{ race: Race; heroClass: HeroClass; name: string; level: number }>;
  difficulty?: number;
  playerTeamSize?: number;
  enemyTeamSize?: number;
  enemyCanAttack?: boolean;
  onBack: () => void;
  onVictory?: (rewards: { gold: number; experience: number }) => void;
  onDefeat?: () => void;
}

export default function BattleArena({
  playerParty,
  difficulty = 2,
  playerTeamSize,
  enemyTeamSize,
  enemyCanAttack = true,
  onBack,
  onVictory,
  onDefeat,
}: BattleArenaProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const defaultParty = playerParty || [
      { race: 'human' as Race, heroClass: 'warrior' as HeroClass, name: 'Knight', level: 3 },
      { race: 'elf' as Race, heroClass: 'mage' as HeroClass, name: 'Mage', level: 3 },
      { race: 'dwarf' as Race, heroClass: 'ranger' as HeroClass, name: 'Archer', level: 3 },
    ];

    const effectivePlayerSize = playerTeamSize ?? defaultParty.length;
    const partyToUse = defaultParty.slice(0, effectivePlayerSize);

    const playerSlots = [
      { x: 200, y: 330 },
      { x: 148, y: 270 },
      { x: 200, y: 210 },
      { x: 148, y: 155 },
    ];

    const playerUnits = partyToUse.map((p, i) =>
      createBattleUnit(
        `player-${i}`,
        p.name,
        p.race,
        p.heroClass,
        p.level,
        false,
        playerSlots[i] ?? { x: 200, y: 330 - i * 60 }
      )
    );

    const avgLevel = Math.floor(playerUnits.reduce((sum, u) => sum + u.level, 0) / playerUnits.length);
    const allEnemyUnits = generateEnemyParty(difficulty, avgLevel);
    const effectiveEnemySize = enemyTeamSize ?? allEnemyUnits.length;
    const enemyUnits = allEnemyUnits.slice(0, effectiveEnemySize);

    const initialState = createInitialBattleState(playerUnits, enemyUnits);
    setBattleState(initialState);

    setTimeout(() => {
      setBattleState(prev => prev ? { ...prev, phase: 'battle' } : null);
    }, 1500);
  }, [playerParty, difficulty, playerTeamSize, enemyTeamSize]);

  useEffect(() => {
    if (!battleState || isPaused) return;
    if (battleState.phase === 'victory' || battleState.phase === 'defeat') {
      setShowResults(true);
      return;
    }
    if (battleState.phase === 'player_action') return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = ((timestamp - lastTimeRef.current) / 1000) * battleSpeed;
      lastTimeRef.current = timestamp;

      setBattleState(prev => {
        if (!prev) return null;
        
        if (prev.phase === 'animating') {
          return { ...prev, phase: 'battle' };
        }

        if (prev.phase === 'enemy_action' && prev.activeUnitId) {
          const enemy = prev.enemyUnits.find(u => u.id === prev.activeUnitId);
          if (enemy) {
            if (!enemyCanAttack) {
              return { ...prev, phase: 'battle', activeUnitId: null };
            }
            const action = getAIAction(prev, enemy);
            return executeAction(prev, action);
          }
        }

        if (prev.phase === 'battle') {
          return updateATBGauges(prev, delta);
        }

        return prev;
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battleState?.phase, isPaused, battleSpeed]);

  const handlePlayerAction = useCallback((action: BattleAction) => {
    setBattleState(prev => {
      if (!prev) return null;
      const newState = executeAction(prev, action);
      return reduceCooldowns(newState);
    });
  }, []);

  const handleVictoryConfirm = () => {
    const rewards = { experience: 100 * difficulty, gold: 50 * difficulty };
    onVictory?.(rewards);
    onBack();
  };

  const handleDefeatConfirm = () => {
    onDefeat?.();
    onBack();
  };

  if (!battleState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground animate-pulse">
          Preparing battle...
        </div>
      </div>
    );
  }

  const activeUnit = battleState.activeUnitId
    ? [...battleState.playerUnits, ...battleState.enemyUnits].find(
        u => u.id === battleState.activeUnitId
      )
    : null;

  const allUnits = [...battleState.playerUnits, ...battleState.enemyUnits];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/70 hover:text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retreat
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              Turn {battleState.turn}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant={isPaused ? 'default' : 'ghost'}
                onClick={() => setIsPaused(!isPaused)}
                className="h-8 w-8"
                data-testid="button-pause"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant={battleSpeed === 2 ? 'default' : 'ghost'}
                onClick={() => setBattleSpeed(s => s === 2 ? 1 : 2)}
                className="h-8 w-8"
                data-testid="button-speed"
              >
                <FastForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Difficulty: {'★'.repeat(difficulty)}{'☆'.repeat(5 - difficulty)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9">
            <PhaserBattleRenderer
              battleState={battleState}
              onAnimationComplete={() => {}}
              onUnitClick={(unitId) => {
                if (battleState.phase === 'player_action') {
                  const target = battleState.enemyUnits.find(u => u.id === unitId);
                  if (target && activeUnit) {
                    handlePlayerAction({
                      type: 'attack',
                      actorId: activeUnit.id,
                      targetId: unitId,
                    });
                  }
                }
              }}
            />
          </div>

          <div className="col-span-3 space-y-4">
            <TurnOrder units={allUnits} activeUnitId={battleState.activeUnitId} />
            <BattleLog entries={battleState.battleLog} />
          </div>
        </div>

        <CommandMenu
          activeUnit={activeUnit || null}
          enemies={battleState.enemyUnits}
          allies={battleState.playerUnits}
          onAction={handlePlayerAction}
          disabled={battleState.phase !== 'player_action' || isPaused}
        />

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3 bg-green-900/20 border-green-500/30">
            <div className="text-xs font-semibold text-green-400 mb-2">Your Party</div>
            <div className="flex gap-2">
              {battleState.playerUnits.map(unit => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          </Card>

          <Card className="p-3 bg-red-900/20 border-red-500/30">
            <div className="text-xs font-semibold text-red-400 mb-2">Enemies</div>
            <div className="flex gap-2">
              {battleState.enemyUnits.map(unit => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 text-center max-w-md">
                {battleState.phase === 'victory' ? (
                  <>
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-yellow-400 mb-2">Victory!</h2>
                    <p className="text-muted-foreground mb-4">
                      You have defeated the enemy forces!
                    </p>
                    <div className="space-y-2 mb-6 text-left bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span>Experience:</span>
                        <span className="text-blue-400">+{100 * difficulty} XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold:</span>
                        <span className="text-yellow-400">+{50 * difficulty} G</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleVictoryConfirm}
                      className="w-full"
                      data-testid="button-victory-continue"
                    >
                      Continue
                    </Button>
                  </>
                ) : (
                  <>
                    <Skull className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-red-400 mb-2">Defeat</h2>
                    <p className="text-muted-foreground mb-6">
                      Your party has fallen. Try again with a stronger team.
                    </p>
                    <Button
                      onClick={handleDefeatConfirm}
                      variant="secondary"
                      className="w-full"
                      data-testid="button-defeat-continue"
                    >
                      Return to Menu
                    </Button>
                  </>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {battleState.phase === 'intro' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold text-white mb-4 font-serif">
                Battle Start!
              </h1>
              <p className="text-xl text-white/60">
                {battleState.playerUnits.length} vs {battleState.enemyUnits.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitCard({ unit }: { unit: BattleUnit }) {
  const hpPercent = (unit.stats.hp / unit.stats.maxHp) * 100;
  const isDead = unit.stats.hp <= 0;

  return (
    <div
      className={`flex-1 p-2 rounded-lg border ${
        isDead
          ? 'bg-muted/20 border-muted opacity-50'
          : 'bg-card/50 border-border'
      }`}
    >
      <div className="text-xs font-medium truncate mb-1">{unit.name}</div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className={`h-full transition-all ${
            hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground">
        {unit.stats.hp}/{unit.stats.maxHp}
      </div>
    </div>
  );
}
