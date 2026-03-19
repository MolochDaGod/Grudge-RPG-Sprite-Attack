import { Card } from '@/components/ui/card';
import { SpritePreview } from '@/components/game/SpritePreview';
import type { BattleUnit } from '@/lib/battleEngine';

interface TurnOrderProps {
  units: BattleUnit[];
  activeUnitId: string | null;
}

export function TurnOrder({ units, activeUnitId }: TurnOrderProps) {
  const sortedUnits = [...units]
    .filter(u => u.stats.hp > 0)
    .sort((a, b) => b.atbGauge - a.atbGauge);

  return (
    <Card className="p-3 bg-card/80 backdrop-blur" data-testid="turn-order">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Turn Order
      </div>
      <div className="space-y-1">
        {sortedUnits.slice(0, 8).map((unit, index) => (
          <div
            key={unit.id}
            className={`flex items-center gap-2 p-1 rounded text-sm ${
              unit.id === activeUnitId
                ? 'bg-primary/20 border border-primary/50'
                : 'bg-muted/30'
            }`}
          >
            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
              <SpritePreview
                race={unit.race}
                heroClass={unit.heroClass}
                animation="idle"
                width={32}
                height={32}
                scale={0.32}
              />
            </div>
            <span className={`flex-1 truncate text-xs ${unit.isEnemy ? 'text-red-300' : 'text-green-300'}`}>
              {unit.name}
            </span>
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  unit.atbGauge >= 1 ? 'bg-yellow-400' : 'bg-blue-400'
                }`}
                style={{ width: `${unit.atbGauge * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
