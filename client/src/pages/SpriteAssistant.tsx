import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Bot, User, Loader2, ArrowLeft, Sparkles, 
  Database, Code, HelpCircle, Search
} from 'lucide-react';
import { Link } from 'wouter';
import { HERO_SPRITES, getHeroById, getHeroesByRace, getHeroesByClass, getAnimationByUUID, getAllAnimationUUIDs } from '@shared/spriteUUIDs';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SPRITE_KNOWLEDGE = `
You are Tethical Sprite Assistant, an AI expert on the Tethical game's 2D sprite system. You have complete knowledge of all sprites, animations, and UUIDs.

SPRITE SYSTEM OVERVIEW:
- 24 hero sprites total (6 races x 4 classes)
- All sprites are 100x100 pixels
- Horizontal sprite sheets with multiple frames

RACES (6): human, orc, elf, dwarf, undead, barbarian

CLASSES (4): warrior, ranger, mage, worge (shapeshifter hybrid)

FACTIONS (3):
- Crusade: human + barbarian (Holy alliance)
- Fabled: dwarf + elf (Ancient alliance)  
- Legion: orc + undead (Dark alliance)

ANIMATION TYPES:
- idle: 6 frames, 8 fps, loops
- walk: 8 frames, 8 fps, loops
- attack01: 6 frames, 10 fps (12 for mages)
- attack02: 6 frames, 10 fps (12 for mages)
- attack03: 6-9 frames, 10 fps (warriors/worge only)
- hurt: 4 frames, 10 fps
- death: 4 frames, 10 fps

UUID FORMAT: anim-{race}-{class}-{animation}-{number}
Examples:
- anim-human-warrior-idle-001
- anim-orc-mage-atk1-043
- proj-human-ranger-arrow-014 (projectile)

API ENDPOINTS:
- GET /dist/api/sprites.json - Complete sprite database
- GET /api/sprites - All heroes
- GET /api/sprites/:heroId - Single hero
- GET /api/sprites/uuid/:uuid - Lookup by UUID
- GET /api/sprites/race/:race - Filter by race
- GET /api/sprites/class/:heroClass - Filter by class

SPRITE URL PATTERN:
/dist/sprites/{folder}/{fileName}

Example: /dist/sprites/characters/Soldier/Soldier/Soldier-Idle.png

JAVASCRIPT USAGE:
\`\`\`javascript
const response = await fetch('/dist/api/sprites.json');
const data = await response.json();
const hero = data.heroes.find(h => h.id === 'human-warrior');
const spriteUrl = \`/dist/sprites/\${hero.folder}\${hero.animations.idle.fileName}\`;
\`\`\`

Help users with:
1. Finding sprites by race, class, or faction
2. Looking up animation UUIDs
3. Understanding animation specifications
4. Code examples for integration
5. Sprite sheet details (frames, fps, size)
`;

const EXAMPLE_PROMPTS = [
  "How do I get the idle animation for a human warrior?",
  "What are all the races in the Legion faction?",
  "Show me the UUID for the orc mage attack animation",
  "How many frames does the death animation have?",
  "Give me code to animate a sprite sheet"
];

export default function SpriteAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm the Tethical Sprite Assistant. I know everything about our 2D sprite system - 24 heroes across 6 races and 4 classes. Ask me about animations, UUIDs, sprite sheets, or how to integrate them into your project!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [puterAvailable, setPuterAvailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).puter) {
      setPuterAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processLocalQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('uuid') && lowerQuery.includes('all')) {
      const allUuids = getAllAnimationUUIDs();
      return `There are ${allUuids.length} UUIDs in total. Here are the first 10:\n\n${allUuids.slice(0, 10).map(u => `- ${u}`).join('\n')}\n\n...and ${allUuids.length - 10} more.`;
    }
    
    if (lowerQuery.includes('hero') && (lowerQuery.includes('list') || lowerQuery.includes('all'))) {
      return `All 24 Heroes:\n\n${HERO_SPRITES.map(h => `- **${h.id}**: ${h.spriteName} (${h.race} ${h.heroClass})`).join('\n')}`;
    }
    
    const raceMatch = lowerQuery.match(/race[:\s]*(human|orc|elf|dwarf|undead|barbarian)/i);
    if (raceMatch) {
      const race = raceMatch[1].toLowerCase();
      const heroes = getHeroesByRace(race as any);
      return `Heroes of the ${race} race:\n\n${heroes.map(h => `- **${h.id}**: ${h.spriteName} (${h.heroClass})\n  Folder: ${h.folder}`).join('\n\n')}`;
    }
    
    const classMatch = lowerQuery.match(/class[:\s]*(warrior|ranger|mage|worge)/i);
    if (classMatch) {
      const heroClass = classMatch[1].toLowerCase();
      const heroes = getHeroesByClass(heroClass as any);
      return `Heroes of the ${heroClass} class:\n\n${heroes.map(h => `- **${h.id}**: ${h.spriteName} (${h.race})\n  Folder: ${h.folder}`).join('\n\n')}`;
    }
    
    const heroIdMatch = lowerQuery.match(/(human|orc|elf|dwarf|undead|barbarian)-(warrior|ranger|mage|worge)/i);
    if (heroIdMatch) {
      const heroId = heroIdMatch[0].toLowerCase();
      const hero = getHeroById(heroId);
      if (hero) {
        const animations = Object.entries(hero.animations).map(([key, anim]) => 
          `- **${key}**: ${anim.name} (UUID: ${anim.uuid}, ${anim.frames} frames @ ${anim.fps}fps${anim.loop ? ', loops' : ''})`
        ).join('\n');
        return `**${hero.spriteName}** (${hero.id})\n\nRace: ${hero.race}\nClass: ${hero.heroClass}\nSprite Size: ${hero.spriteSize}x${hero.spriteSize}px\nFolder: ${hero.folder}\n\n**Animations:**\n${animations}`;
      }
    }
    
    const uuidMatch = lowerQuery.match(/anim-[\w-]+/i) || lowerQuery.match(/proj-[\w-]+/i);
    if (uuidMatch) {
      const result = getAnimationByUUID(uuidMatch[0]);
      if (result) {
        return `**UUID Lookup: ${uuidMatch[0]}**\n\nHero: ${result.hero.id} (${result.hero.spriteName})\nType: ${result.type}\nAnimation: ${result.animation.name}\nFile: ${result.animation.fileName}\nFrames: ${result.animation.frames}\nFPS: ${result.animation.fps}\nLoops: ${result.animation.loop ? 'Yes' : 'No'}\n\nFull Path: /dist/sprites/${result.hero.folder}${result.animation.fileName}`;
      }
    }
    
    if (lowerQuery.includes('faction')) {
      return `**Factions in Tethical:**\n\n**Crusade** (Holy Alliance)\n- Races: Human, Barbarian\n- 8 heroes total\n\n**Fabled** (Ancient Alliance)\n- Races: Dwarf, Elf\n- 8 heroes total\n\n**Legion** (Dark Alliance)\n- Races: Orc, Undead\n- 8 heroes total`;
    }
    
    if (lowerQuery.includes('animate') || lowerQuery.includes('code') || lowerQuery.includes('example')) {
      return `**Sprite Animation Code Example:**\n\n\`\`\`javascript
// Fetch sprite data
const response = await fetch('/dist/api/sprites.json');
const data = await response.json();

// Get a specific hero
const hero = data.heroes.find(h => h.id === 'human-warrior');

// Build sprite URL
const anim = hero.animations.idle;
const spriteUrl = \`/dist/sprites/\${hero.folder}\${anim.fileName}\`;

// Animate with canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = spriteUrl;

let frame = 0;
function animate() {
  ctx.clearRect(0, 0, 100, 100);
  ctx.drawImage(img, frame * 100, 0, 100, 100, 0, 0, 100, 100);
  frame = (frame + 1) % anim.frames;
  setTimeout(() => requestAnimationFrame(animate), 1000 / anim.fps);
}
img.onload = animate;
\`\`\``;
    }
    
    if (lowerQuery.includes('animation') && (lowerQuery.includes('type') || lowerQuery.includes('list'))) {
      return `**Animation Types:**\n\n| Type | Frames | FPS | Loops | Notes |\n|------|--------|-----|-------|-------|\n| idle | 6 | 8 | Yes | Default standing pose |\n| walk | 8 | 8 | Yes | Movement animation |\n| attack01 | 6 | 10/12 | No | Primary attack (mages 12fps) |\n| attack02 | 6 | 10/12 | No | Secondary attack |\n| attack03 | 6-9 | 10 | No | Warriors/Worge only |\n| hurt | 4 | 10 | No | Damage reaction |\n| death | 4 | 10 | No | Death sequence |`;
    }
    
    return '';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const localResponse = processLocalQuery(input);
      
      if (localResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (puterAvailable) {
        const puter = (window as any).puter;
        const response = await puter.ai.chat([
          { role: 'system', content: SPRITE_KNOWLEDGE },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: input }
        ]);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message?.content || response.toString(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const fallbackResponse = `I can help with that! Here's what I know:

For detailed sprite information, try asking about:
- Specific heroes: "Tell me about human-warrior"
- Races: "Show heroes of race: orc"
- Classes: "Show heroes of class: mage"
- UUIDs: Include a UUID like "anim-human-warrior-idle-001"
- Code examples: "Show me animation code"
- Factions: "What are the factions?"
- Animation types: "List animation types"

The full API is available at /dist/api/sprites.json`;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue processing your request. Try asking about specific heroes, UUIDs, or animation types!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cinzel">Sprite Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Puter.js AI-powered sprite knowledge base
              </p>
            </div>
          </div>
          <Badge variant={puterAvailable ? "default" : "secondary"} className="ml-auto">
            {puterAvailable ? "AI Connected" : "Local Mode"}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 mb-4">
          <Card className="p-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-bold">{HERO_SPRITES.length}</div>
              <div className="text-xs text-muted-foreground">Heroes</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-lg font-bold">{getAllAnimationUUIDs().length}</div>
              <div className="text-xs text-muted-foreground">Animations</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <Code className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-lg font-bold">3</div>
              <div className="text-xs text-muted-foreground">Factions</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-lg font-bold">6</div>
              <div className="text-xs text-muted-foreground">Races</div>
            </div>
          </Card>
        </div>

        <Card className="mb-4">
          <div className="p-3 border-b flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Try asking:</span>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className="text-xs"
                data-testid={`button-example-${idx}`}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sprites, animations, UUIDs..."
                disabled={isLoading}
                className="flex-1"
                data-testid="input-chat"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>

        <Card className="mt-4 p-4">
          <h3 className="font-bold mb-2">API Access</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><code className="bg-muted px-1 rounded">GET /dist/api/sprites.json</code> - Complete sprite database</p>
            <p><code className="bg-muted px-1 rounded">GET /api/sprites</code> - All heroes via server API</p>
            <p><code className="bg-muted px-1 rounded">GET /api/sprites/uuid/:uuid</code> - Lookup by UUID</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
