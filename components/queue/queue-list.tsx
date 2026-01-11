'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Sparkles, ArrowDownUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getNextGameSkills, suggestOptimalOrder } from '@/lib/matchmaking';
import { getAverageGameDuration, calculateWaitTime, formatWaitTime } from '@/lib/wait-time';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Color palette for game batches
const GAME_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100' },
  { bg: 'bg-purple-100 dark:bg-purple-950/30', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-100' },
  { bg: 'bg-green-100 dark:bg-green-950/30', border: 'border-green-300 dark:border-green-800', text: 'text-green-900 dark:text-green-100' },
  { bg: 'bg-orange-100 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100' },
  { bg: 'bg-pink-100 dark:bg-pink-950/30', border: 'border-pink-300 dark:border-pink-800', text: 'text-pink-900 dark:text-pink-100' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-800', text: 'text-cyan-900 dark:text-cyan-100' },
  { bg: 'bg-amber-100 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-100' },
  { bg: 'bg-teal-100 dark:bg-teal-950/30', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-900 dark:text-teal-100' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/30', border: 'border-indigo-300 dark:border-indigo-800', text: 'text-indigo-900 dark:text-indigo-100' },
  { bg: 'bg-rose-100 dark:bg-rose-950/30', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-100' },
];

// Helper function to format waiting time
function formatWaitingTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

interface QueueItemProps {
  item: { type: 'player'; name: string; joinedAt: number } | { type: 'group'; id: number; name: string; players: string[]; joinedAt: number };
  index: number;
  onRemove: () => void;
  colorIndex: number;
  registeredPlayers: Record<string, import('@/lib/types').Player>;
  skillMatchingEnabled: boolean;
  estimatedWait: number; // in minutes
}

function SortableQueueItem({ item, index, onRemove, colorIndex, registeredPlayers, skillMatchingEnabled, estimatedWait }: QueueItemProps) {
  const [waitingTime, setWaitingTime] = useState(Date.now() - item.joinedAt);
  const isGroup = item.type === 'group';
  const id = isGroup ? `group-${item.id}` : `player-${index}-${item.name}`;

  // Update waiting time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitingTime(Date.now() - item.joinedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [item.joinedAt]);

  // Get skill level badge color
  const getSkillBadge = (skillLevel: import('@/lib/types').SkillLevel) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
      intermediate: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
      advanced: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
      professional: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    };
    return colors[skillLevel];
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colors = GAME_COLORS[colorIndex % GAME_COLORS.length];

  if (isGroup) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-all cursor-move touch-manipulation active:scale-[0.98]",
          colors.bg,
          colors.border,
          isDragging && 'opacity-50 scale-95',
          !isDragging && 'hover:opacity-90'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full text-sm font-semibold flex-shrink-0",
            colors.border.replace('border-', 'bg-'),
            colors.text
          )}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("font-medium flex items-center gap-2 text-sm", colors.text)}>
              <span>👥</span>
              <span className="truncate">{item.name}</span>
            </div>
            <div className={cn("text-xs mt-1 truncate opacity-75", colors.text)}>
              {item.players.join(', ')}
            </div>
            <div className={cn("flex items-center gap-2 text-xs mt-1 opacity-60", colors.text)}>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatWaitingTime(waitingTime)}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="font-medium">
                {formatWaitTime(estimatedWait)}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0 flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // At this point, item is a player
  const playerName = item.name;
  const player = registeredPlayers[playerName];
  const skillLevel = player?.skillLevel || 'intermediate';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center justify-between p-3 sm:p-3.5 rounded-lg border-2 transition-all cursor-move touch-manipulation active:scale-[0.98]',
        colors.bg,
        colors.border,
        isDragging && 'opacity-50 scale-95',
        !isDragging && 'hover:opacity-90'
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full text-sm font-semibold flex-shrink-0",
          colors.border.replace('border-', 'bg-'),
          colors.text
        )}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium text-sm truncate", colors.text)}>{playerName}</span>
            {skillMatchingEnabled && (
              <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4 border", getSkillBadge(skillLevel))}>
                {skillLevel.charAt(0).toUpperCase()}
              </Badge>
            )}
          </div>
          <div className={cn("flex items-center gap-2 text-xs mt-0.5 opacity-60", colors.text)}>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatWaitingTime(waitingTime)}</span>
            </div>
            <span className="opacity-40">•</span>
            <div className="font-medium">
              {formatWaitTime(estimatedWait)}
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0 flex-shrink-0"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function QueueList() {
  const { queue, settings, registeredPlayers, removePlayerFromQueue, reorderQueue, courts, gameHistory } = useStore();

  const handleOptimizeQueue = () => {
    const optimized = suggestOptimalOrder(queue, registeredPlayers, playersPerGame);

    // Manually reorder queue to match optimized order
    optimized.forEach((item, targetIndex) => {
      const currentIndex = queue.findIndex((q) => {
        if (q.type === 'group' && item.type === 'group') return q.id === item.id;
        if (q.type === 'player' && item.type === 'player') return q.name === item.name;
        return false;
      });

      if (currentIndex !== -1 && currentIndex !== targetIndex) {
        reorderQueue(currentIndex, targetIndex);
      }
    });

    toast.success('Queue optimized for skill balance');
  };

  const playersPerGame = settings.gameMode === 'doubles' ? 4 : 2;
  const nextGame = settings.skillMatchingEnabled
    ? getNextGameSkills(queue, registeredPlayers, playersPerGame)
    : null;

  // Calculate average game duration and estimated wait times
  const averageGameDuration = getAverageGameDuration(gameHistory);
  const estimatedWaitTimes = queue.map((_, index) =>
    calculateWaitTime(index, queue, courts, playersPerGame, averageGameDuration)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((item, i) => {
        const id = item.type === 'group' ? `group-${item.id}` : `player-${i}-${item.name}`;
        return id === active.id;
      });

      const newIndex = queue.findIndex((item, i) => {
        const id = item.type === 'group' ? `group-${item.id}` : `player-${i}-${item.name}`;
        return id === over.id;
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  const items = queue.map((item, i) => {
    return item.type === 'group' ? `group-${item.id}` : `player-${i}-${item.name}`;
  });

  // Calculate color indices based on game batches
  const colorIndices: number[] = [];
  let currentBatch = 0;
  let playersInCurrentBatch = 0;

  queue.forEach((item) => {
    if (item.type === 'group') {
      // Groups get their own color
      colorIndices.push(currentBatch);
      currentBatch++;
      playersInCurrentBatch = 0;
    } else {
      // Individual players
      if (playersInCurrentBatch === 0) {
        // Starting a new batch
        colorIndices.push(currentBatch);
      } else {
        // Continue current batch
        colorIndices.push(currentBatch);
      }

      playersInCurrentBatch++;

      // Check if batch is complete
      if (playersInCurrentBatch >= playersPerGame) {
        currentBatch++;
        playersInCurrentBatch = 0;
      }
    }
  });

  if (queue.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
        <p>No players in queue. Add players above to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Skill Matching Controls */}
      {settings.skillMatchingEnabled && queue.length >= playersPerGame && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          {nextGame && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium mb-1">Next Game Match Quality</div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    'text-xs',
                    nextGame.quality >= 80 && 'bg-green-100 text-green-700 border-green-300',
                    nextGame.quality >= 60 &&
                      nextGame.quality < 80 &&
                      'bg-blue-100 text-blue-700 border-blue-300',
                    nextGame.quality >= 40 &&
                      nextGame.quality < 60 &&
                      'bg-yellow-100 text-yellow-700 border-yellow-300',
                    nextGame.quality < 40 && 'bg-orange-100 text-orange-700 border-orange-300'
                  )}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {nextGame.quality}% Match
                </Badge>
                {nextGame.skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill.charAt(0).toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleOptimizeQueue}
            className="flex-shrink-0"
          >
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Optimize Queue
          </Button>
        </div>
      )}

      {/* Queue List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {queue.map((item, index) => (
              <SortableQueueItem
                key={items[index]}
                item={item}
                index={index}
                onRemove={() => removePlayerFromQueue(index)}
                colorIndex={colorIndices[index]}
                registeredPlayers={registeredPlayers}
                skillMatchingEnabled={settings.skillMatchingEnabled}
                estimatedWait={estimatedWaitTimes[index]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
