'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import { PLAYERS_PER_GAME } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupModal({ open, onOpenChange }: GroupModalProps) {
  const { registeredPlayers, groups, settings, createGroup } = useStore();
  const [groupName, setGroupName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
  const players = Object.keys(registeredPlayers);

  // Get players already in groups
  const playersInGroups = groups.flatMap((g) => g.players);

  useEffect(() => {
    if (!open) {
      setGroupName('');
      setSelectedPlayers(new Set());
    }
  }, [open]);

  const handlePlayerToggle = (playerName: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      if (newSelected.size < playersNeeded) {
        newSelected.add(playerName);
      } else {
        toast.error(`Group can only have ${playersNeeded} players for ${settings.gameMode} mode`);
      }
    }
    setSelectedPlayers(newSelected);
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedPlayers.size !== playersNeeded) {
      toast.error(`Group must have exactly ${playersNeeded} players for ${settings.gameMode} mode`);
      return;
    }

    const success = createGroup(groupName.trim(), Array.from(selectedPlayers));

    if (success) {
      toast.success(`Group "${groupName}" created`);
      onOpenChange(false);
    } else {
      toast.error('Failed to create group');
    }
  };

  if (players.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              No players registered yet. Add players first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a group to queue players together for {settings.gameMode} mode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="e.g., Smith Family, Team A"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <Label>
              Select Players ({selectedPlayers.size}/{playersNeeded} for {settings.gameMode})
            </Label>

            <ScrollArea className="h-[300px] border rounded-md p-3">
              <div className="space-y-2">
                {players.map((playerName) => {
                  const isInGroup = playersInGroups.includes(playerName);
                  const isSelected = selectedPlayers.has(playerName);
                  const isDisabled = isInGroup && !isSelected;

                  return (
                    <div
                      key={playerName}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md border transition-all',
                        isSelected && 'bg-primary/10 border-primary',
                        isDisabled && 'opacity-50 cursor-not-allowed',
                        !isSelected && !isDisabled && 'hover:bg-muted cursor-pointer'
                      )}
                      onClick={() => !isDisabled && handlePlayerToggle(playerName)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => !isDisabled && handlePlayerToggle(playerName)}
                      />
                      <span className="text-sm flex-1">
                        {playerName}
                        {isInGroup && !isSelected && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (in group)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedPlayers.size !== playersNeeded}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
