import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Anchor, Sword, Sparkles, Shield } from "lucide-react";

import humanImg from "@/assets/races/human.png";
import orcImg from "@/assets/races/orc.png";
import undeadImg from "@/assets/races/undead.png";
import barbarianImg from "@/assets/races/barbarian.png";
import dwarfImg from "@/assets/races/dwarf.png";
import elfImg from "@/assets/races/elf.png";

const RACE_IMAGES: Record<string, string> = {
  human: humanImg,
  orc: orcImg,
  undead: undeadImg,
  barbarian: barbarianImg,
  dwarf: dwarfImg,
  elf: elfImg,
};

const RACE_INFO: Record<string, { name: string; faction: string; description: string; bonuses: string[] }> = {
  human: {
    name: "Human",
    faction: "Crusade",
    description: "Versatile adventurers with balanced attributes and strong leadership.",
    bonuses: ["+5% Experience gain", "+2 Tactics", "Balanced stats"]
  },
  barbarian: {
    name: "Barbarian", 
    faction: "Crusade",
    description: "Fierce warriors from the northern wastes, favoring raw strength.",
    bonuses: ["+10% Melee damage", "+3 Strength", "+2 Vitality"]
  },
  dwarf: {
    name: "Dwarf",
    faction: "Fabled",
    description: "Stout craftsmen and warriors with unmatched endurance.",
    bonuses: ["+15% Block chance", "+3 Endurance", "+2 Vitality"]
  },
  elf: {
    name: "Elf",
    faction: "Fabled", 
    description: "Ancient and graceful, masters of magic and precision.",
    bonuses: ["+10% Magic damage", "+3 Dexterity", "+2 Intellect"]
  },
  orc: {
    name: "Orc",
    faction: "Legion",
    description: "Brutal warriors who thrive in combat and conquest.",
    bonuses: ["+15% Critical damage", "+3 Strength", "+2 Agility"]
  },
  undead: {
    name: "Undead",
    faction: "Legion",
    description: "Risen warriors immune to fear and resistant to poison.",
    bonuses: ["Immune to poison", "+20% Resistance", "+2 Wisdom"]
  }
};

const CLASS_INFO: Record<string, { name: string; icon: typeof Sword; description: string }> = {
  warrior: { name: "Warrior", icon: Shield, description: "Heavy armor, sword and shield" },
  mage: { name: "Mage", icon: Sparkles, description: "Powerful spells, mystical staff" },
  ranger: { name: "Ranger", icon: Sword, description: "Ranged attacks, bow and arrows" },
  priest: { name: "Priest", icon: Sparkles, description: "Holy healing, divine magic" }
};

const HAIR_COLORS = ["black", "brown", "dark_brown", "blonde", "red", "white", "gray", "bald"];
const BUILDS = ["athletic", "slim", "stocky", "muscular", "average"];

interface CaptainCreationProps {
  onBack: () => void;
  onCaptainCreated?: (captain: CaptainData) => void;
}

interface CaptainData {
  name: string;
  race: string;
  characterClass: string;
  hairColor: string;
  build: string;
  taskId?: string;
}

export default function CaptainCreation({ onBack, onCaptainCreated }: CaptainCreationProps) {
  const { toast } = useToast();
  const [captainName, setCaptainName] = useState("");
  const [selectedRace, setSelectedRace] = useState<string>("human");
  const [selectedClass, setSelectedClass] = useState<string>("warrior");
  const [hairColor, setHairColor] = useState<string>("brown");
  const [build, setBuild] = useState<string>("athletic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTaskId, setGenerationTaskId] = useState<string | null>(null);

  const handleCreateCaptain = async () => {
    if (!captainName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your captain.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/meshy/generate-custom-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: captainName,
          race: selectedRace,
          characterClass: selectedClass,
          hairColor,
          build
        })
      });

      const data = await response.json();

      if (data.success) {
        setGenerationTaskId(data.taskId);
        toast({
          title: "Captain Created!",
          description: `${captainName} the ${RACE_INFO[selectedRace].name} ${CLASS_INFO[selectedClass].name} is being generated. Task ID: ${data.taskId}`
        });

        if (onCaptainCreated) {
          onCaptainCreated({
            name: captainName,
            race: selectedRace,
            characterClass: selectedClass,
            hairColor,
            build,
            taskId: data.taskId
          });
        }
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Could not start character generation.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to generation service.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const raceInfo = RACE_INFO[selectedRace];
  const classInfo = CLASS_INFO[selectedClass];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Anchor className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-cinzel font-bold text-foreground">Create Your Captain</h1>
          </div>
          <Button variant="outline" onClick={onBack} data-testid="button-back-captain">
            Back to Menu
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-cinzel">Captain Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="captain-name">Captain Name</Label>
                <Input
                  id="captain-name"
                  placeholder="Enter your captain's name..."
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="text-lg"
                  data-testid="input-captain-name"
                />
              </div>

              <div className="space-y-3">
                <Label>Choose Your Race</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(RACE_INFO).map(([raceId, info]) => (
                    <button
                      key={raceId}
                      onClick={() => setSelectedRace(raceId)}
                      className={`relative p-2 rounded-lg border-2 transition-all hover-elevate ${
                        selectedRace === raceId 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`button-race-${raceId}`}
                    >
                      <img 
                        src={RACE_IMAGES[raceId]} 
                        alt={info.name}
                        className="w-full h-24 object-contain rounded"
                      />
                      <div className="mt-2 text-center">
                        <p className="font-semibold text-sm">{info.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {info.faction}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Choose Your Class</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CLASS_INFO).map(([classId, info]) => {
                    const Icon = info.icon;
                    return (
                      <button
                        key={classId}
                        onClick={() => setSelectedClass(classId)}
                        className={`p-4 rounded-lg border-2 transition-all hover-elevate ${
                          selectedClass === classId
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-class-${classId}`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-semibold text-sm text-center">{info.name}</p>
                        <p className="text-xs text-muted-foreground text-center mt-1">{info.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hair Color</Label>
                  <Select value={hairColor} onValueChange={setHairColor}>
                    <SelectTrigger data-testid="select-hair-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HAIR_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Build</Label>
                  <Select value={build} onValueChange={setBuild}>
                    <SelectTrigger data-testid="select-build">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b.charAt(0).toUpperCase() + b.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cinzel">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-card rounded-lg overflow-hidden border">
                <img 
                  src={RACE_IMAGES[selectedRace]} 
                  alt={raceInfo.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-cinzel text-xl text-primary">
                  {captainName || "Your Captain"}
                </h3>
                <p className="text-muted-foreground">
                  {raceInfo.name} {classInfo.name}
                </p>
                <Badge>{raceInfo.faction}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{raceInfo.description}</p>
                <div className="space-y-1">
                  {raceInfo.bonuses.map((bonus, i) => (
                    <p key={i} className="text-xs text-green-500">+ {bonus}</p>
                  ))}
                </div>
              </div>

              {generationTaskId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Generation Task ID:</p>
                  <p className="text-xs font-mono break-all">{generationTaskId}</p>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCreateCaptain}
                disabled={isGenerating || !captainName.trim()}
                data-testid="button-create-captain"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Anchor className="w-4 h-4 mr-2" />
                    Create Captain
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
