'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { PLAYERS_PER_GAME } from '@/lib/types';
import { getAverageGameDuration, calculateWaitTime, formatWaitTime } from '@/lib/wait-time';
import { Clock, Users, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JoinPage() {
  const router = useRouter();
  const { queue, courts, settings, gameHistory, addPlayerToQueue, registeredPlayers } = useStore();
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
  const averageGameDuration = getAverageGameDuration(gameHistory);

  // Calculate wait time for end of queue
  const estimatedWaitTime = queue.length > 0
    ? calculateWaitTime(queue.length, queue, courts, playersNeeded, averageGameDuration)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    // Simulate slight delay for better UX
    setTimeout(() => {
      const success = addPlayerToQueue(playerName.trim());

      if (success) {
        const position = queue.length + 1; // They'll be at the end
        setQueuePosition(position);
        setJoinSuccess(true);
      } else {
        // Check specific error
        const isInQueue = queue.some((item) => {
          if (item.type === 'player') return item.name === playerName.trim();
          if (item.type === 'group') return item.players.includes(playerName.trim());
          return false;
        });

        const isPlaying = courts.some((court) => court.players.includes(playerName.trim()));

        if (isInQueue) {
          setError('You\'re already in the queue!');
        } else if (isPlaying) {
          setError('You\'re currently playing on a court!');
        } else {
          setError('Failed to join queue. Please try again.');
        }
      }

      setIsSubmitting(false);
    }, 300);
  };

  const handleBackToQueue = () => {
    router.push('/');
  };

  // Success State
  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-lg">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">You're In! 🎾</h1>
            <p className="text-muted-foreground">
              Welcome to the queue, <strong>{playerName}</strong>!
            </p>
          </div>

          <Separator />

          {/* Queue Position */}
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">Your Position</div>
              <div className="text-4xl font-bold text-primary">#{queuePosition}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground mb-1">Players Ahead</div>
                <div className="text-lg font-semibold">{(queuePosition || 1) - 1}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground mb-1">Est. Wait</div>
                <div className="text-lg font-semibold">{formatWaitTime(estimatedWaitTime)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Stay nearby!</p>
                <p className="text-blue-700 dark:text-blue-300">
                  We'll notify you when it's almost your turn to play.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleBackToQueue}
              className="w-full h-12"
              size="lg"
            >
              View Full Queue
            </Button>
            <Button
              onClick={() => {
                setJoinSuccess(false);
                setPlayerName('');
                setQueuePosition(null);
              }}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Add Another Player
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Join Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">🎾</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Join the Queue
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your name to get in line for pickleball
          </p>
        </div>

        <Separator />

        {/* Current Queue Stats */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Current Status</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">In Queue</span>
              </div>
              <div className="text-2xl font-bold">{queue.length}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Est. Wait</span>
              </div>
              <div className="text-2xl font-bold">
                {queue.length === 0 ? 'Next!' : formatWaitTime(estimatedWaitTime)}
              </div>
            </div>
          </div>

          {/* Game Mode Info */}
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <div className="text-sm">
              <span className="text-muted-foreground">Current mode: </span>
              <Badge variant="secondary" className="ml-1">
                {settings.gameMode === 'doubles' ? 'Doubles (4 players)' : 'Singles (2 players)'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="playerName" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="playerName"
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError(null);
              }}
              className={cn(
                "h-12 text-base",
                error && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isSubmitting}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            size="lg"
            disabled={isSubmitting || !playerName.trim()}
          >
            {isSubmitting ? 'Joining...' : 'Join Queue'}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBackToQueue}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Full Queue
          </Button>
        </div>
      </Card>
    </div>
  );
}
