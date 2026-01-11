'use client';

import { Card } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { PLAYERS_PER_GAME } from '@/lib/types';
import { cn } from '@/lib/utils';

// Match the color scheme from queue-list
const NEXT_GAME_COLOR = {
  bg: 'bg-blue-100 dark:bg-blue-950/30',
  border: 'border-blue-300 dark:border-blue-800',
  text: 'text-blue-900 dark:text-blue-100',
  badge: 'bg-blue-300 dark:bg-blue-800',
};

export function WhosNext() {
  const { queue, settings } = useStore();
  const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];

  const getNextPlayers = () => {
    if (queue.length === 0) return null;

    const firstItem = queue[0];

    // If first item is a group
    if (firstItem.type === 'group') {
      const groupSize = firstItem.players.length;

      if (groupSize === playersNeeded) {
        // Full group
        return { type: 'group' as const, data: firstItem, isPartial: false };
      } else if (groupSize < playersNeeded) {
        // Partial group - need to fill with individual players
        const players = [...firstItem.players];
        const spotsNeeded = playersNeeded - groupSize;

        // Look for individual players after the group
        let individualsFound = 0;
        for (let i = 1; i < queue.length && individualsFound < spotsNeeded; i++) {
          const item = queue[i];
          if (item.type === 'player') {
            players.push(item.name);
            individualsFound++;
          } else {
            // Hit another group, stop
            break;
          }
        }

        // Check if we have enough total players
        if (players.length < playersNeeded) return null;

        return {
          type: 'partial-group' as const,
          groupData: firstItem,
          allPlayers: players,
          addedFromQueue: individualsFound
        };
      }
      return null;
    }

    // Get individual players
    const individualPlayers: string[] = [];
    for (let i = 0; i < queue.length && individualPlayers.length < playersNeeded; i++) {
      const item = queue[i];
      if (item.type === 'player') {
        individualPlayers.push(item.name);
      } else {
        break; // Hit a group, stop
      }
    }

    if (individualPlayers.length < playersNeeded) return null;

    return { type: 'individual' as const, data: individualPlayers };
  };

  const nextPlayers = getNextPlayers();

  return (
    <Card className="p-4 sm:p-5 bg-muted/50">
      <h3 className="text-xs sm:text-sm font-semibold text-center mb-3 uppercase tracking-wide">
        👀 Who&apos;s Playing Next
      </h3>

      <div className="bg-card rounded-lg p-3 sm:p-4 min-h-[60px]">
        {!nextPlayers ? (
          <p className="text-center text-muted-foreground text-sm">
            {queue.length === 0
              ? "Add players to see who's up next!"
              : `Need ${playersNeeded} players to start a game`}
          </p>
        ) : nextPlayers.type === 'group' ? (
          <div className={cn(
            "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border-2",
            NEXT_GAME_COLOR.bg,
            NEXT_GAME_COLOR.border
          )}>
            <div className={cn(
              "flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-sm font-semibold flex-shrink-0",
              NEXT_GAME_COLOR.badge,
              NEXT_GAME_COLOR.text
            )}>
              👥
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("font-medium text-sm truncate", NEXT_GAME_COLOR.text)}>{nextPlayers.data.name}</div>
              <div className={cn("text-xs truncate opacity-75", NEXT_GAME_COLOR.text)}>
                {nextPlayers.data.players.join(', ')}
              </div>
            </div>
          </div>
        ) : nextPlayers.type === 'partial-group' ? (
          <div className="space-y-2">
            {/* Group header */}
            <div className={cn(
              "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md border-2",
              NEXT_GAME_COLOR.bg,
              NEXT_GAME_COLOR.border
            )}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-sm font-semibold flex-shrink-0",
                NEXT_GAME_COLOR.badge,
                NEXT_GAME_COLOR.text
              )}>
                👥
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("font-medium text-sm truncate", NEXT_GAME_COLOR.text)}>
                  {nextPlayers.groupData.name}
                  <span className="opacity-75 ml-1 text-xs">
                    + {nextPlayers.addedFromQueue} from queue
                  </span>
                </div>
                <div className={cn("text-xs truncate opacity-75", NEXT_GAME_COLOR.text)}>
                  {nextPlayers.allPlayers.join(', ')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {nextPlayers.data.map((player, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-2 rounded-md border-2",
                  NEXT_GAME_COLOR.bg,
                  NEXT_GAME_COLOR.border
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-full text-sm font-semibold flex-shrink-0",
                  NEXT_GAME_COLOR.badge,
                  NEXT_GAME_COLOR.text
                )}>
                  {index + 1}
                </div>
                <div className={cn("font-medium text-sm truncate", NEXT_GAME_COLOR.text)}>{player}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
