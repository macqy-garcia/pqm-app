'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface BulkAddPlayersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkAddPlayersModal({ open, onOpenChange }: BulkAddPlayersModalProps) {
  const { registeredPlayers } = useStore();
  const [playerNames, setPlayerNames] = useState('');

  const handleBulkAdd = () => {
    // Split by newlines and filter empty lines
    const names = playerNames
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) {
      toast.error('Please enter at least one player name');
      return;
    }

    // Register all players
    const { registeredPlayers: currentPlayers } = useStore.getState();
    const updatedPlayers = { ...currentPlayers };

    let addedCount = 0;
    let skippedCount = 0;

    names.forEach((name) => {
      if (!updatedPlayers[name]) {
        updatedPlayers[name] = {
          gamesPlayed: 0,
          totalPlayTime: 0,
          skillLevel: 'intermediate',
        };
        addedCount++;
      } else {
        skippedCount++;
      }
    });

    // Update store
    useStore.setState({ registeredPlayers: updatedPlayers });

    // Show success message
    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} player(s)${skippedCount > 0 ? `. ${skippedCount} already registered` : ''}`
      );
      setPlayerNames('');
      onOpenChange(false);
    } else {
      toast.error('All players are already registered');
    }
  };

  const handleCancel = () => {
    setPlayerNames('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Add Players</DialogTitle>
          <DialogDescription>
            Paste player names (one per line) to register them. They will be added to the system but not to the queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="playerNames">Player Names</Label>
            <Textarea
              id="playerNames"
              placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson&#10;..."
              value={playerNames}
              onChange={(e) => setPlayerNames(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter one name per line. You can copy/paste from reclub or any source.
            </p>
          </div>

          {/* Preview count */}
          {playerNames.trim() && (
            <div className="text-sm text-muted-foreground">
              {playerNames.split('\n').filter((n) => n.trim().length > 0).length} player(s) ready to add
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleBulkAdd} disabled={!playerNames.trim()}>
            Add Players
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
