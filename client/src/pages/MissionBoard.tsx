import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Swords, 
  Skull, 
  Star,
  Trophy,
  Coins,
  Clock,
  Users,
  Shield
} from "lucide-react";

export type MissionDifficulty = "easy" | "medium" | "hard" | "evil" | "grudge";

export interface Mission {
  id: string;
  name: string;
  description: string;
  difficulty: MissionDifficulty;
  enemyCount: number;
  enemyLevelRange: [number, number];
  rewards: {
    gold: number;
    experience: number;
    items?: string[];
  };
  timeLimit?: number;
  isCompleted: boolean;
  requiredTeamSize: number;
}

interface MissionBoardProps {
  missions: Mission[];
  playerLevel: number;
  teamSize: number;
  onBack: () => void;
  onSelectMission: (mission: Mission) => void;
}

const DIFFICULTY_CONFIG: Record<MissionDifficulty, { 
  color: string; 
  bgColor: string;
  label: string;
  icon: React.ReactNode;
  multiplier: number;
}> = {
  easy: { 
    color: "text-green-500", 
    bgColor: "bg-green-500/10 border-green-500/30",
    label: "Easy",
    icon: <Star className="h-4 w-4" />,
    multiplier: 1
  },
  medium: { 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    label: "Medium",
    icon: <Star className="h-4 w-4" />,
    multiplier: 1.5
  },
  hard: { 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10 border-orange-500/30",
    label: "Hard",
    icon: <Swords className="h-4 w-4" />,
    multiplier: 2
  },
  evil: { 
    color: "text-red-500", 
    bgColor: "bg-red-500/10 border-red-500/30",
    label: "Evil",
    icon: <Skull className="h-4 w-4" />,
    multiplier: 3
  },
  grudge: { 
    color: "text-purple-500", 
    bgColor: "bg-purple-500/10 border-purple-500/30",
    label: "Grudge",
    icon: <Trophy className="h-4 w-4" />,
    multiplier: 5
  },
};

function generateMission(
  difficulty: MissionDifficulty,
  playerLevel: number,
  index: number
): Mission {
  const config = DIFFICULTY_CONFIG[difficulty];
  const baseLevel = Math.max(1, playerLevel - 2 + (["easy", "medium", "hard", "evil", "grudge"].indexOf(difficulty)));
  const levelVariance = difficulty === "grudge" ? 3 : difficulty === "evil" ? 2 : 1;
  
  const missionNames: Record<MissionDifficulty, string[]> = {
    easy: ["Patrol Duty", "Scout Mission", "Rescue Villagers", "Clear the Road"],
    medium: ["Bandit Camp", "Defend the Bridge", "Monster Hunt", "Supply Escort"],
    hard: ["Dark Cave", "Enemy Stronghold", "Dragon's Lair", "Siege Defense"],
    evil: ["Demon Gate", "Cursed Temple", "Necromancer's Tower", "Blood Ritual"],
    grudge: ["The Final Stand", "Ancient Evil", "World's End", "GRUDGE MATCH"]
  };

  const missionDescs: Record<MissionDifficulty, string[]> = {
    easy: ["A simple task for new warriors.", "Clear out minor threats."],
    medium: ["A worthy challenge awaits.", "Test your growing skills."],
    hard: ["Only the strong survive.", "Prepare for fierce combat."],
    evil: ["Darkness awaits the brave.", "Face unspeakable horrors."],
    grudge: ["The ultimate test of skill.", "Only legends return victorious."]
  };

  const names = missionNames[difficulty];
  const descs = missionDescs[difficulty];
  
  return {
    id: `mission-${difficulty}-${index}-${Date.now()}`,
    name: names[Math.floor(Math.random() * names.length)],
    description: descs[Math.floor(Math.random() * descs.length)],
    difficulty,
    enemyCount: difficulty === "easy" ? 1 : 
                difficulty === "medium" ? 2 : 
                difficulty === "hard" ? 3 : 
                difficulty === "evil" ? 4 : 5,
    enemyLevelRange: [baseLevel, baseLevel + levelVariance],
    rewards: {
      gold: Math.floor(50 * config.multiplier * (1 + playerLevel * 0.1)),
      experience: Math.floor(100 * config.multiplier * (1 + playerLevel * 0.1)),
    },
    isCompleted: false,
    requiredTeamSize: difficulty === "easy" ? 1 : 
                      difficulty === "medium" ? 2 : 
                      difficulty === "hard" ? 3 : 3
  };
}

export function generateMissions(playerLevel: number): Mission[] {
  const difficulties: MissionDifficulty[] = ["easy", "medium", "hard", "evil", "grudge"];
  return difficulties.map((diff, idx) => generateMission(diff, playerLevel, idx));
}

export default function MissionBoard({ 
  missions, 
  playerLevel, 
  teamSize,
  onBack, 
  onSelectMission 
}: MissionBoardProps) {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const sortedMissions = useMemo(() => {
    const order: MissionDifficulty[] = ["easy", "medium", "hard", "evil", "grudge"];
    return [...missions].sort((a, b) => 
      order.indexOf(a.difficulty) - order.indexOf(b.difficulty)
    );
  }, [missions]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBack}
            data-testid="button-mission-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Team: {teamSize}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3" />
              Level: {playerLevel}
            </Badge>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Mission Board</h1>
          <p className="text-muted-foreground">
            Select a mission to challenge your team
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {sortedMissions.map((mission) => {
              const config = DIFFICULTY_CONFIG[mission.difficulty];
              const canStart = teamSize >= mission.requiredTeamSize;
              
              return (
                <Card 
                  key={mission.id}
                  className={`border-2 transition-all cursor-pointer ${config.bgColor} ${
                    selectedMission?.id === mission.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedMission(mission)}
                  data-testid={`card-mission-${mission.difficulty}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <CardTitle className="text-lg">{mission.name}</CardTitle>
                      </div>
                      <Badge className={`${config.color} bg-transparent border-current`}>
                        {config.label}
                      </Badge>
                    </div>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Skull className="h-4 w-4 text-muted-foreground" />
                        <span>Enemies: {mission.enemyCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>Lvl {mission.enemyLevelRange[0]}-{mission.enemyLevelRange[1]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{mission.rewards.gold} Gold</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span>{mission.rewards.experience} XP</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-muted-foreground">
                        Requires {mission.requiredTeamSize} hero{mission.requiredTeamSize > 1 ? "es" : ""}
                      </span>
                      <Button
                        size="sm"
                        disabled={!canStart}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMission(mission);
                        }}
                        data-testid={`button-start-mission-${mission.difficulty}`}
                      >
                        {canStart ? "Start Mission" : `Need ${mission.requiredTeamSize} Heroes`}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
