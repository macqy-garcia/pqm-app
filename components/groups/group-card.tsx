'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Group } from '@/lib/types';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { queue, courts, addGroupToQueue, deleteGroup, settings } = useStore();

  const isInQueue = queue.some(
    (item) => typeof item === 'object' && item.type === 'group' && item.id === group.id
  );

  // Check if group is currently playing
  const playingCourt = courts.find(
    (court) => court.active && court.groupInfo?.id === group.id
  );

  const isPlaying = !!playingCourt;

  // Determine if this is a partial group
  const playersNeeded = settings.gameMode === 'doubles' ? 4 : 2;
  const isPartialGroup = group.players.length < playersNeeded;

  const handleAddToQueue = () => {
    const success = addGroupToQueue(group.id);
    if (success) {
      toast.success(`Group "${group.name}" added to queue`);
    } else {
      toast.error('Failed to add group to queue');
    }
  };

  const handleDelete = () => {
    deleteGroup(group.id);
    toast.success(`Group "${group.name}" deleted`);
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isInQueue && 'border-primary/50 bg-muted',
        isPlaying && 'border-green-500/50 bg-green-500/5'
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-semibold text-base">{group.name}</h4>
            <Badge variant="outline" className="text-xs">
              {group.players.length} player{group.players.length !== 1 ? 's' : ''}
            </Badge>
            {isPlaying && (
              <Badge variant="default" className="text-xs bg-green-600">
                Playing on Court {playingCourt?.id}
              </Badge>
            )}
            {isInQueue && !isPlaying && (
              <Badge variant="default" className="text-xs">
                In Queue
              </Badge>
            )}
            {isPartialGroup && !isPlaying && !isInQueue && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                Needs +{playersNeeded - group.players.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="flex flex-wrap gap-2">
          {group.players.map((player) => (
            <Badge
              key={player}
              variant="secondary"
              className="text-xs"
            >
              {player}
            </Badge>
          ))}
        </div>

        {/* Info message for partial groups */}
        {isPartialGroup && (
          <p className="text-xs text-muted-foreground">
            This group needs {playersNeeded - group.players.length} more player{playersNeeded - group.players.length !== 1 ? 's' : ''} from the queue to start a game.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleAddToQueue}
            disabled={isInQueue || isPlaying}
            className="flex-1"
          >
            {isPlaying ? 'Playing' : isInQueue ? 'In Queue' : 'Add to Queue'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={isPlaying}
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{group.name}&quot;? This action cannot be undone.
                  {isInQueue && ' The group will also be removed from the queue.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
