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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import type { GameMode, RotationRule } from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, updateSettings, clearAllData } = useStore();

  const [numCourts, setNumCourts] = useState(settings.numCourts.toString());
  const [gameMode, setGameMode] = useState<GameMode>(settings.gameMode);
  const [gameDuration, setGameDuration] = useState(settings.gameDuration.toString());
  const [rotationRule, setRotationRule] = useState<RotationRule>(settings.rotationRule);
  const [autoTimer, setAutoTimer] = useState(settings.autoTimer);
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [skillMatchingEnabled, setSkillMatchingEnabled] = useState(
    settings.skillMatchingEnabled
  );
  const [showCourtTimers, setShowCourtTimers] = useState(settings.showCourtTimers);
  const [enableManualScoring, setEnableManualScoring] = useState(settings.enableManualScoring);

  useEffect(() => {
    if (open) {
      setNumCourts(settings.numCourts.toString());
      setGameMode(settings.gameMode);
      setGameDuration(settings.gameDuration.toString());
      setRotationRule(settings.rotationRule);
      setAutoTimer(settings.autoTimer);
      setEnableNotifications(settings.enableNotifications);
      setSkillMatchingEnabled(settings.skillMatchingEnabled);
      setShowCourtTimers(settings.showCourtTimers);
      setEnableManualScoring(settings.enableManualScoring);
    }
  }, [open, settings]);

  const handleSave = () => {
    const numCourtsValue = parseInt(numCourts);
    const gameDurationValue = parseInt(gameDuration);

    if (numCourtsValue < 1 || numCourtsValue > 10) {
      toast.error('Number of courts must be between 1 and 10');
      return;
    }

    if (gameDurationValue < 5 || gameDurationValue > 60) {
      toast.error('Game duration must be between 5 and 60 minutes');
      return;
    }

    updateSettings({
      numCourts: numCourtsValue,
      gameMode,
      gameDuration: gameDurationValue,
      rotationRule,
      autoTimer,
      enableNotifications,
      skillMatchingEnabled,
      showCourtTimers,
      enableManualScoring,
    });

    toast.success('Settings updated');
    onOpenChange(false);
  };

  const handleClearAllData = () => {
    clearAllData();
    toast.success('All data cleared');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your pickleball queue manager settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Number of Courts */}
          <div className="space-y-2">
            <Label htmlFor="numCourts">Number of Courts</Label>
            <Input
              id="numCourts"
              type="number"
              min="1"
              max="10"
              value={numCourts}
              onChange={(e) => setNumCourts(e.target.value)}
            />
          </div>

          {/* Game Mode */}
          <div className="space-y-2">
            <Label htmlFor="gameMode">Game Mode</Label>
            <Select value={gameMode} onValueChange={(value) => setGameMode(value as GameMode)}>
              <SelectTrigger id="gameMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doubles">Doubles (4 players)</SelectItem>
                <SelectItem value="singles">Singles (2 players)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Game Duration */}
          <div className="space-y-2">
            <Label htmlFor="gameDuration">Default Game Duration (minutes)</Label>
            <Input
              id="gameDuration"
              type="number"
              min="5"
              max="60"
              value={gameDuration}
              onChange={(e) => setGameDuration(e.target.value)}
            />
          </div>

          {/* Rotation Rule */}
          <div className="space-y-2">
            <Label htmlFor="rotationRule">Rotation Rule</Label>
            <Select
              value={rotationRule}
              onValueChange={(value) => setRotationRule(value as RotationRule)}
            >
              <SelectTrigger id="rotationRule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (End Game Only)</SelectItem>
                <SelectItem value="losersRotate">Losers Rotate to Queue</SelectItem>
                <SelectItem value="allRotate">All Players Rotate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoTimer" className="flex-1 cursor-pointer">
                Auto-start timer when game begins
              </Label>
              <Switch
                id="autoTimer"
                checked={autoTimer}
                onCheckedChange={setAutoTimer}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableNotifications" className="flex-1 cursor-pointer">
                Enable browser notifications
              </Label>
              <Switch
                id="enableNotifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="skillMatchingEnabled" className="flex-1 cursor-pointer">
                  Enable skill-based matching
                </Label>
                <Switch
                  id="skillMatchingEnabled"
                  checked={skillMatchingEnabled}
                  onCheckedChange={setSkillMatchingEnabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shows match quality indicators and allows queue optimization by skill level
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCourtTimers" className="flex-1 cursor-pointer">
                Show timers on court cards
              </Label>
              <Switch
                id="showCourtTimers"
                checked={showCourtTimers}
                onCheckedChange={setShowCourtTimers}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableManualScoring" className="flex-1 cursor-pointer">
                  Enable manual scoring
                </Label>
                <Switch
                  id="enableManualScoring"
                  checked={enableManualScoring}
                  onCheckedChange={setEnableManualScoring}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Track game scores with +/- buttons on court cards
              </p>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2">
            <Label className="text-destructive">Danger Zone</Label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all players, queues, groups, and game history.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData}>
                    Yes, clear all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">
              This will remove all players and reset the app
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
