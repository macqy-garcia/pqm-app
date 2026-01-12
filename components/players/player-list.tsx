'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PlayerCard } from './player-card';
import { SkillLevelModal } from './skill-level-modal';
import { BulkAddPlayersModal } from '@/components/modals/bulk-add-players-modal';
import { toast } from 'sonner';

export function PlayerList() {
  const { registeredPlayers, addPlayerToQueue, removePlayerFromQueue, queue } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const players = Object.keys(registeredPlayers);
  const filteredPlayers = players.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allSelected =
    filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedPlayers.has(p));
  const someSelected = filteredPlayers.some((p) => selectedPlayers.has(p)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(new Set(filteredPlayers));
    } else {
      setSelectedPlayers(new Set());
    }
  };

  const handlePlayerCheck = (playerName: string, checked: boolean) => {
    const newSelected = new Set(selectedPlayers);
    if (checked) {
      newSelected.add(playerName);
    } else {
      newSelected.delete(playerName);
    }
    setSelectedPlayers(newSelected);
  };

  const handleAddSelected = () => {
    let addedCount = 0;
    let skippedCount = 0;

    selectedPlayers.forEach((playerName) => {
      const success = addPlayerToQueue(playerName);
      if (success) {
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} player(s) to queue${skippedCount > 0 ? `. Skipped ${skippedCount}` : ''}`);
      setSelectedPlayers(new Set());
    } else {
      toast.error('No players could be added (already queued or playing)');
    }
  };

  const handleRemoveSelected = () => {
    let removedCount = 0;

    selectedPlayers.forEach((playerName) => {
      const queueIndex = queue.findIndex((item) =>
        typeof item === 'string' ? item === playerName : false
      );

      if (queueIndex > -1) {
        removePlayerFromQueue(queueIndex);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      toast.success(`Removed ${removedCount} player(s) from queue`);
      setSelectedPlayers(new Set());
    } else {
      toast.error('No selected players were in the queue');
    }
  };

  if (players.length === 0) {
    return (
      <>
        <div className="text-center py-12 text-muted-foreground space-y-4">
          <p>No players registered yet</p>
          <Button onClick={() => setBulkAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Add Players
          </Button>
        </div>

        {/* Bulk Add Players Modal */}
        <BulkAddPlayersModal open={bulkAddOpen} onOpenChange={setBulkAddOpen} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search and Bulk Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setBulkAddOpen(true)} className="flex-shrink-0">
            <UserPlus className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
        </div>

        {/* Bulk Actions */}
        <Card className="p-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                ref={(el) => {
                  if (el) {
                    (el as any).indeterminate = someSelected;
                  }
                }}
              />
              <Label className="text-sm font-medium cursor-pointer">
                Select All
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddSelected}
                disabled={selectedPlayers.size === 0}
              >
                Add Selected to Queue ({selectedPlayers.size})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveSelected}
                disabled={selectedPlayers.size === 0}
              >
                Remove Selected ({selectedPlayers.size})
              </Button>
            </div>
          </div>
        </Card>

        {/* Players List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-4">
            {filteredPlayers.map((playerName) => (
              <PlayerCard
                key={playerName}
                playerName={playerName}
                checked={selectedPlayers.has(playerName)}
                onCheckedChange={(checked) => handlePlayerCheck(playerName, checked)}
                onEditSkill={() => setEditingPlayer(playerName)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Skill Level Modal */}
      <SkillLevelModal
        open={!!editingPlayer}
        onOpenChange={(open) => !open && setEditingPlayer(null)}
        playerName={editingPlayer}
      />

      {/* Bulk Add Players Modal */}
      <BulkAddPlayersModal open={bulkAddOpen} onOpenChange={setBulkAddOpen} />
    </>
  );
}
