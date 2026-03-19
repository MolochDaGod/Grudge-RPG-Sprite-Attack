import { useEffect, useState, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PuterAuthProvider, usePuterAuth } from "@/contexts/PuterAuthContext";
import { useGameState } from "@/hooks/useGameState";
import Home from "@/pages/home";
import BattlePage from "@/pages/battle";
import BattleArena from "@/pages/BattleArena";
import RosterPage from "@/pages/roster";
import CodexPage from "@/pages/codex";
import Chat from "@/pages/Chat";
import Admin from "@/pages/Admin";
import AdminSpritesPage from "@/pages/admin-sprites";
import CharacterSelect from "@/pages/CharacterSelect";
import Login from "@/pages/Login";
import MissionBoard, { generateMissions, type Mission } from "@/pages/MissionBoard";
import SkillTrees from "@/pages/SkillTrees";
import SpriteAssistant from "@/pages/SpriteAssistant";
import GrudgeFighter2D from "@/pages/GrudgeFighter2D";
import { 
  createDefaultProgress, 
  getNextTutorialStep, 
  getTutorialBattleConfig,
  shouldCreateHero,
  shouldStartBattle,
  getTutorialMessage,
  type TutorialStep,
  type GameProgress
} from "@shared/gameProgress";
import type { Race, HeroClass } from "@shared/spriteUUIDs";
import type { CharacterAttributes } from "@shared/statsAttributes";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

function GameApp() {
  const game = useGameState();
  const { toast } = useToast();
  const { user } = usePuterAuth();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authType, setAuthType] = useState<"puter" | "guest" | "local" | null>(null);
  const [username, setUsername] = useState<string>("");
  const [progress, setProgress] = useState<GameProgress>(createDefaultProgress());
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showTutorialHint, setShowTutorialHint] = useState(true);

  const handleLogin = useCallback((type: "puter" | "guest" | "local", name?: string) => {
    setAuthType(type);
    setIsLoggedIn(true);
    setUsername(name || user?.username || "Player");
    
    const newProgress = createDefaultProgress();
    newProgress.tutorialStep = "first_hero_creation";
    setProgress(newProgress);
    
    toast({
      title: "Welcome!",
      description: getTutorialMessage("first_hero_creation"),
    });
  }, [user, toast]);

  const advanceTutorial = useCallback(() => {
    setProgress(prev => {
      const nextStep = getNextTutorialStep(prev.tutorialStep);
      const newProgress = { ...prev, tutorialStep: nextStep };
      
      if (nextStep === "tutorial_complete") {
        newProgress.tutorialCompleted = true;
        setMissions(generateMissions(1));
        toast({
          title: "Tutorial Complete!",
          description: "The Mission Board is now unlocked. Good luck, hero!",
        });
      }
      
      return newProgress;
    });
  }, [toast]);

  const handleCharacterConfirm = useCallback((race: Race, heroClass: HeroClass, attributes: CharacterAttributes) => {
    game.addHeroToRoster(race, heroClass, attributes);
    
    setProgress(prev => ({
      ...prev,
      heroesCreated: prev.heroesCreated + 1,
    }));
    
    advanceTutorial();
    
    const nextStep = getNextTutorialStep(progress.tutorialStep);
    if (shouldStartBattle(nextStep)) {
      toast({
        title: "Hero Created!",
        description: getTutorialMessage(nextStep),
      });
    }
  }, [game, progress.tutorialStep, advanceTutorial, toast]);

  const handleBattleVictory = useCallback((rewards?: { gold: number; experience: number }) => {
    setProgress(prev => ({
      ...prev,
      battlesWon: prev.battlesWon + 1,
      totalGold: prev.totalGold + (rewards?.gold || 0),
      totalExperience: prev.totalExperience + (rewards?.experience || 0),
    }));
    
    if (!progress.tutorialCompleted) {
      advanceTutorial();
    }
    
    game.setPhase("menu");
  }, [progress.tutorialCompleted, advanceTutorial, game]);

  const handleBattleDefeat = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      battlesLost: prev.battlesLost + 1,
    }));
    game.setPhase("menu");
  }, [game]);

  const handleMissionSelect = useCallback((mission: Mission) => {
    setProgress(prev => ({
      ...prev,
      currentMissionId: mission.id,
    }));
    game.setPhase("battlearena");
  }, [game]);

  useEffect(() => {
    if (game.currentBattle?.phase === "enemy_turn") {
      const timer = setTimeout(() => {
        game.performEnemyTurn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game.currentBattle?.phase, game.currentBattle?.currentTurnIndex]);

  const handleTileClick = (x: number, y: number) => {
    if (game.currentAction === "move") {
      game.moveUnit(x, y);
    } else if (game.currentAction === "attack") {
      game.performAttack(x, y);
    } else if (game.currentAction === "ability" && game.selectedAbility) {
      if (game.selectedAbility.type === "heal" || game.selectedAbility.type === "buff") {
        game.performHeal(x, y);
      } else {
        game.performAttack(x, y);
      }
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const tutorialConfig = getTutorialBattleConfig(progress.tutorialStep);
  const showTutorialMessage = !progress.tutorialCompleted && showTutorialHint;
  
  const TutorialBanner = () => (
    showTutorialMessage ? (
      <Alert className="mb-4 border-primary/50 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{getTutorialMessage(progress.tutorialStep)}</span>
          <button 
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowTutorialHint(false)}
          >
            Hide
          </button>
        </AlertDescription>
      </Alert>
    ) : null
  );

  if (shouldCreateHero(progress.tutorialStep) || game.phase === "characterselect") {
    return (
      <div className="min-h-screen bg-background">
        <TutorialBanner />
        <CharacterSelect
          onBack={() => {
            if (progress.tutorialCompleted) {
              game.setPhase("menu");
            }
          }}
          onConfirm={handleCharacterConfirm}
        />
      </div>
    );
  }

  if (shouldStartBattle(progress.tutorialStep) && tutorialConfig) {
    return (
      <div className="min-h-screen bg-background">
        <TutorialBanner />
        <BattleArena
          difficulty={tutorialConfig.difficulty}
          playerTeamSize={tutorialConfig.playerTeamSize}
          enemyTeamSize={tutorialConfig.enemyTeamSize}
          enemyCanAttack={tutorialConfig.enemyCanAttack}
          onBack={() => {}}
          onVictory={(rewards) => handleBattleVictory(rewards)}
          onDefeat={handleBattleDefeat}
        />
      </div>
    );
  }

  if (game.phase === "missionboard") {
    return (
      <MissionBoard
        missions={missions}
        playerLevel={Math.max(1, ...game.playerRoster.map(u => u.level))}
        teamSize={game.playerRoster.length}
        onBack={() => game.setPhase("menu")}
        onSelectMission={handleMissionSelect}
      />
    );
  }

  if (game.phase === "battlearena") {
    return (
      <BattleArena
        difficulty={2}
        onBack={() => game.setPhase("menu")}
        onVictory={(rewards) => handleBattleVictory(rewards)}
        onDefeat={handleBattleDefeat}
      />
    );
  }

  if (game.phase === "admin") {
    return (
      <Admin 
        onBack={() => game.setPhase("menu")} 
        onViewSprites={() => game.setPhase("adminsprites")}
      />
    );
  }

  if (game.phase === "adminsprites") {
    return <AdminSpritesPage onBack={() => game.setPhase("admin")} />;
  }

  if (game.phase === "chat") {
    return <Chat onBack={() => game.setPhase("menu")} />;
  }

  if (game.phase === "roster") {
    return (
      <RosterPage
        units={game.playerRoster}
        selectedUnits={game.selectedUnitsForBattle}
        onSelectionChange={game.selectUnitsForBattle}
        onBack={() => game.setPhase("menu")}
        onStartBattle={() => game.startBattle("normal")}
      />
    );
  }

  if (game.phase === "codex") {
    return <CodexPage onBack={() => game.setPhase("menu")} />;
  }

  if (game.phase === "skilltrees") {
    return <SkillTrees />;
  }

  if (game.phase === "spriteassistant") {
    return <SpriteAssistant />;
  }

if (game.phase === "fighter2d") {
  return <GrudgeFighter2D onBack={ () => game.setPhase("menu") } />;
}

  if (game.phase === "battle" && game.currentBattle) {
    return (
      <BattlePage
        battle={game.currentBattle}
        selectedUnit={game.selectedUnit}
        currentUnit={game.currentUnit}
        currentAction={game.currentAction}
        selectedAbility={game.selectedAbility}
        highlightedTiles={game.highlightedTiles}
        hasMovedThisTurn={game.hasMovedThisTurn}
        hasActedThisTurn={game.hasActedThisTurn}
        onSelectUnit={game.selectUnit}
        onSetAction={game.setAction}
        onSelectAbility={game.selectAbility}
        onTileClick={handleTileClick}
        onEndTurn={game.endTurn}
        onVictory={() => handleBattleVictory()}
        onDefeat={handleBattleDefeat}
        onMainMenu={() => game.setPhase("menu")}
        calculateDamage={game.calculateDamage}
        battlesWon={progress.battlesWon}
      />
    );
  }

  return (
    <Home
      battlesWon={progress.battlesWon}
      username={username}
      tutorialCompleted={progress.tutorialCompleted}
      heroCount={game.playerRoster.length}
      onStartBattle={() => {
        if (progress.tutorialCompleted) {
          game.setPhase("missionboard");
        } else {
          game.setPhase("battlearena");
        }
      }}
      onViewRoster={() => game.setPhase("roster")}
      onViewCodex={() => game.setPhase("codex")}
      onViewChat={() => game.setPhase("chat")}
      onViewAdmin={() => game.setPhase("admin")}
      onViewCharacterSelect={() => game.setPhase("characterselect")}
      onViewSkillTrees={() => game.setPhase("skilltrees")}
      onViewSpriteAssistant={() => game.setPhase("spriteassistant")}
onStartGrudgeFighter = {() => game.setPhase("fighter2d")}
      onLogout={() => {
        setIsLoggedIn(false);
        setAuthType(null);
        setProgress(createDefaultProgress());
      }}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <PuterAuthProvider>
            <GameApp />
            <Toaster />
          </PuterAuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
