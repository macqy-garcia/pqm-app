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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface CourtScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtId: number | null;
}

export function CourtScheduleModal({
  open,
  onOpenChange,
  courtId,
}: CourtScheduleModalProps) {
  const { scheduleCourtRental, clearCourtSchedule } = useStore();
  const [rentalName, setRentalName] = useState('');
  const [hours, setHours] = useState('1');

  const handleSchedule = () => {
    if (!courtId) return;

    const hoursNum = parseFloat(hours);
    if (!hoursNum || hoursNum <= 0) {
      toast.error('Please enter valid hours');
      return;
    }

    const success = scheduleCourtRental(courtId, hoursNum, rentalName.trim());

    if (success) {
      toast.success(`Court ${courtId} scheduled for ${hoursNum} hour(s)`);
      onOpenChange(false);
      setRentalName('');
      setHours('1');
    } else {
      toast.error('Failed to schedule court');
    }
  };

  const handleClearSchedule = () => {
    if (!courtId) return;
    clearCourtSchedule(courtId);
    toast.success(`Court ${courtId} schedule cleared`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Court {courtId}</DialogTitle>
          <DialogDescription>
            Reserve this court for a specific duration or clear the schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rentalName">Rented By (optional)</Label>
            <Input
              id="rentalName"
              placeholder="e.g., John Smith, Private Party"
              value={rentalName}
              onChange={(e) => setRentalName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hours">Duration (hours)</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              You can use decimals (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClearSchedule}>
            Clear Schedule
          </Button>
          <Button onClick={handleSchedule}>Schedule Court</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
