import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BattleLogEntry } from '@/lib/battleEngine';
import { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: BattleLogEntry[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getEntryColor = (type: BattleLogEntry['type']) => {
    switch (type) {
      case 'damage':
        return 'text-orange-400';
      case 'heal':
        return 'text-green-400';
      case 'skill':
        return 'text-blue-400';
      case 'status':
        return 'text-purple-400';
      case 'system':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className="p-3 bg-card/80 backdrop-blur h-40" data-testid="battle-log">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Battle Log
      </div>
      <ScrollArea className="h-28" ref={scrollRef}>
        <div className="space-y-1 text-sm">
          {entries.slice(-20).map((entry) => (
            <div
              key={entry.id}
              className={`${getEntryColor(entry.type)} animate-fade-in`}
            >
              {entry.message}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
