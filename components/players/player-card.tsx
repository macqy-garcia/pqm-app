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
  beginner: 'bg-green-500/15 text-green-600 border-green-500/30',
  intermediate: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  advanced: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  professional: 'bg-red-500/15 text-red-600 border-red-500/30',
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
        'p-3 transition-all',
        isPlaying && 'border-primary/50 bg-primary/5',
        isInQueue && !isPlaying && 'border-muted-foreground/30 bg-muted'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="flex-shrink-0"
        />

        {/* Avatar */}
        <Avatar
          className={cn(
            'h-10 w-10 flex-shrink-0',
            isPlaying && 'bg-primary text-primary-foreground',
            isInQueue && !isPlaying && 'bg-muted-foreground/20'
          )}
        >
          <AvatarFallback>{getInitials(playerName)}</AvatarFallback>
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
