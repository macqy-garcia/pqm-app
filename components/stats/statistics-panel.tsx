'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import { Clock, Trophy, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function StatisticsPanel() {
  const { gameHistory, registeredPlayers } = useStore();

  const totalGames = gameHistory.length;
  const totalPlayTime = gameHistory.reduce((sum, game) => sum + game.duration, 0);
  const avgGameTime =
    gameHistory.length > 0 ? Math.round(totalPlayTime / gameHistory.length) : 0;
  const totalPlayers = Object.keys(registeredPlayers).length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">Total Games</div>
          </div>
          <div className="text-3xl font-bold tracking-tight">{totalGames}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-muted-foreground">Total Play Time</div>
          </div>
          <div className="text-3xl font-bold tracking-tight">{totalPlayTime}m</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-sm text-muted-foreground">Avg Game Time</div>
          </div>
          <div className="text-3xl font-bold tracking-tight">{avgGameTime}m</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm text-muted-foreground">Total Players</div>
          </div>
          <div className="text-3xl font-bold tracking-tight">{totalPlayers}</div>
        </Card>
      </div>

      {/* Game History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Games</h3>

        {gameHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No games played yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {gameHistory.slice(0, 10).map((game, index) => (
                <Card key={index} className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        Court {game.courtId}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {game.duration} min
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {game.players.map((player) => (
                      <Badge key={player} variant="secondary" className="text-xs">
                        {player}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(game.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
