'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, SKILL_LEVEL_DESCRIPTIONS } from '@/lib/types';
import type { SkillLevel } from '@/lib/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SkillLevelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string | null;
}

const skillColors: Record<SkillLevel, string> = {
  beginner: 'bg-green-500/15 text-green-600 border-green-500/30',
  intermediate: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  advanced: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  professional: 'bg-red-500/15 text-red-600 border-red-500/30',
};

export function SkillLevelModal({
  open,
  onOpenChange,
  playerName,
}: SkillLevelModalProps) {
  const { registeredPlayers, updatePlayerSkillLevel } = useStore();
  const [selectedSkill, setSelectedSkill] = useState<SkillLevel>('intermediate');

  useEffect(() => {
    if (playerName && registeredPlayers[playerName]) {
      setSelectedSkill(registeredPlayers[playerName].skillLevel);
    }
  }, [playerName, registeredPlayers]);

  const handleSave = () => {
    if (!playerName) return;

    updatePlayerSkillLevel(playerName, selectedSkill);
    toast.success(`${playerName}'s skill level updated to ${selectedSkill}`);
    onOpenChange(false);
  };

  if (!playerName) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Skill Level</DialogTitle>
          <DialogDescription>
            Player: <strong>{playerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-base mb-4 block">Select Skill Level:</Label>

          <RadioGroup
            value={selectedSkill}
            onValueChange={(value) => setSelectedSkill(value as SkillLevel)}
            className="space-y-3"
          >
            {SKILL_LEVELS.map((level) => (
              <div key={level}>
                <Label
                  htmlFor={`skill-${level}`}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    'hover:bg-muted hover:border-ring',
                    selectedSkill === level
                      ? 'bg-muted border-primary shadow-sm'
                      : 'border-border bg-muted/50'
                  )}
                >
                  <RadioGroupItem
                    value={level}
                    id={`skill-${level}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs border', skillColors[level])}
                      >
                        {SKILL_LEVEL_LABELS[level].toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {SKILL_LEVEL_DESCRIPTIONS[level]}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Skill Level</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
