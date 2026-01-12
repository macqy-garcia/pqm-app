'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { PLAYERS_PER_GAME } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Volume2 } from 'lucide-react';
import { useVoiceAnnouncements } from '@/lib/use-voice-announcements';
import { toast } from 'sonner';

// Match the color scheme from queue-list
const NEXT_GAME_COLOR = {
  bg: 'bg-blue-100 dark:bg-blue-950/30',
  border: 'border-blue-300 dark:border-blue-800',
  text: 'text-blue-900 dark:text-blue-100',
  badge: 'bg-blue-300 dark:bg-blue-800',
};

export function WhosNext() {
  const { queue, settings, courts, isCourtAvailable, registeredPlayers } = useStore();
  const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
  const { announceNextPlayers, isSupported } = useVoiceAnnouncements();

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
    let hitGroupIndex = -1;

    for (let i = 0; i < queue.length && individualPlayers.length < playersNeeded; i++) {
      const item = queue[i];
      if (item.type === 'player') {
        individualPlayers.push(item.name);
      } else {
        // Hit a group, stop collecting individuals
        hitGroupIndex = i;
        break;
      }
    }

    // Check if we have enough individual players
    if (individualPlayers.length >= playersNeeded) {
      return { type: 'individual' as const, data: individualPlayers.slice(0, playersNeeded) };
    } else if (hitGroupIndex >= 0 && hitGroupIndex < queue.length) {
      // We hit a group - check if we can combine for exact match
      const group = queue[hitGroupIndex];

      if (group.type === 'group') {
        const totalPlayers = individualPlayers.length + group.players.length;

        if (totalPlayers === playersNeeded) {
          // Perfect match! Show combination
          return {
            type: 'mixed' as const,
            individuals: individualPlayers,
            groupData: group,
            allPlayers: [...individualPlayers, ...group.players]
          };
        }
      }
    }

    // Not enough players to start
    return null;
  };

  const nextPlayers = getNextPlayers();

  // Determine which court would be used (replicating logic from handleStartNextGame)
  const getTargetCourt = () => {
    if (!nextPlayers) return null;

    const availableCourts = courts.filter((c) => !c.active && isCourtAvailable(c.id));
    if (availableCourts.length === 0) return null;

    // Get all player names from next players
    let allPlayerNames: string[] = [];
    if (nextPlayers.type === 'group') {
      allPlayerNames = nextPlayers.data.players;
    } else if (nextPlayers.type === 'partial-group') {
      allPlayerNames = nextPlayers.allPlayers;
    } else if (nextPlayers.type === 'mixed') {
      allPlayerNames = nextPlayers.allPlayers;
    } else {
      allPlayerNames = nextPlayers.data;
    }

    // If court skill assignment is enabled, find matching court
    if (settings.enableCourtSkillAssignment) {
      const nextPlayerSkills = allPlayerNames.map((name) => {
        const player = registeredPlayers[name];
        return player ? player.skillLevel : 'intermediate';
      });

      const firstSkill = nextPlayerSkills[0];
      const allSameSkill = nextPlayerSkills.every((skill) => skill === firstSkill);

      let matchingCourt = null;
      if (allSameSkill) {
        matchingCourt = availableCourts.find((c) => c.assignedSkillLevel === firstSkill);
      }

      if (!matchingCourt) {
        matchingCourt = availableCourts.find((c) => !c.assignedSkillLevel);
      }

      return matchingCourt || availableCourts[0];
    }

    return availableCourts[0];
  };

  const handleAnnounce = () => {
    if (!nextPlayers) {
      toast.error('No players to announce');
      return;
    }

    const targetCourt = getTargetCourt();
    if (!targetCourt) {
      toast.error('No courts available');
      return;
    }

    // Get all player names
    let playerNames: string[] = [];
    if (nextPlayers.type === 'group') {
      playerNames = nextPlayers.data.players;
    } else if (nextPlayers.type === 'partial-group') {
      playerNames = nextPlayers.allPlayers;
    } else if (nextPlayers.type === 'mixed') {
      playerNames = nextPlayers.allPlayers;
    } else {
      playerNames = nextPlayers.data;
    }

    announceNextPlayers(playerNames, targetCourt.id);
    toast.success('Announcement playing...');
  };

  const showSpeakerButton = settings.enableVoiceAnnouncements && isSupported && nextPlayers !== null;

  return (
    <Card className="p-4 sm:p-5 bg-muted/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-center flex-1 uppercase tracking-wide">
          👀 Who&apos;s Playing Next
        </h3>
        {showSpeakerButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnnounce}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Announce next players"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        )}
      </div>

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
        ) : nextPlayers.type === 'mixed' ? (
          <div className="space-y-2">
            {/* Mixed: Individuals + Group */}
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
                🔀
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("font-medium text-sm", NEXT_GAME_COLOR.text)}>
                  {nextPlayers.individuals.length} Individual{nextPlayers.individuals.length !== 1 ? 's' : ''} + {nextPlayers.groupData.name}
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
