'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { SkillLevel } from '@/lib/types';

interface PlayerCardProps {
  playerName: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onEditSkill: () => void;
}

const skillColors: Record<SkillLevel, string> = {
  beginner: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50 font-medium',
  intermediate: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50 font-medium',
  advanced: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50 font-medium',
  professional: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/50 font-medium',
};

export function PlayerCard({
  playerName,
  checked,
  onCheckedChange,
  onEditSkill,
}: PlayerCardProps) {
  const { registeredPlayers, queue, courts, addPlayerToQueue } = useStore();
  const player = registeredPlayers[playerName];

  if (!player) return null;

  const isInQueue = queue.some((item) => {
    if (item.type === 'player') return item.name === playerName;
    if (item.type === 'group') return item.players.includes(playerName);
    return false;
  });

  const playingCourt = courts.find((court) => court.players.includes(playerName));
  const isPlaying = !!playingCourt;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all hover:shadow-md',
        isPlaying && 'border-blue-500/50 bg-blue-500/5 shadow-sm',
        isInQueue && !isPlaying && 'border-orange-500/50 bg-orange-500/5 shadow-sm'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="flex-shrink-0"
        />

        {/* Avatar */}
        <Avatar
          className={cn(
            'h-12 w-12 flex-shrink-0 border-2 font-semibold text-sm',
            isPlaying && 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-600',
            isInQueue && !isPlaying && 'bg-gradient-to-br from-orange-500 to-orange-700 text-white border-orange-600',
            !isPlaying && !isInQueue && 'bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-600 dark:to-gray-800 text-white border-gray-600'
          )}
        >
          <AvatarFallback
            className={cn(
              'font-semibold',
              isPlaying && 'bg-gradient-to-br from-blue-500 to-blue-700 text-white',
              isInQueue && !isPlaying && 'bg-gradient-to-br from-orange-500 to-orange-700 text-white',
              !isPlaying && !isInQueue && 'bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-600 dark:to-gray-800 text-white'
            )}
          >
            {getInitials(playerName)}
          </AvatarFallback>
        </Avatar>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{playerName}</span>
            <Badge
              variant={isPlaying ? 'default' : isInQueue ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {isPlaying
                ? `Playing (Court ${playingCourt?.id})`
                : isInQueue
                ? `In Queue (#${queue.findIndex((item) => {
                    if (item.type === 'player') return item.name === playerName;
                    if (item.type === 'group') return item.players.includes(playerName);
                    return false;
                  }) + 1})`
                : 'Available'}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {player.gamesPlayed} games • {player.totalPlayTime}m played
          </div>

          {/* Skill Level */}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={cn('text-xs border', skillColors[player.skillLevel])}
            >
              {player.skillLevel.toUpperCase()}
            </Badge>
            <button
              onClick={onEditSkill}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Add to Queue Button */}
        <Button
          size="sm"
          onClick={() => addPlayerToQueue(playerName)}
          disabled={isInQueue || isPlaying}
          className="flex-shrink-0"
        >
          {isPlaying ? 'Playing' : isInQueue ? 'In Queue' : 'Add to Queue'}
        </Button>
      </div>
    </Card>
  );
}
