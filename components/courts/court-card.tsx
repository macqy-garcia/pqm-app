'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, RotateCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import type { Court, SkillLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CourtCardProps {
  court: Court;
  onScheduleClick: () => void;
}

export function CourtCard({ court, onScheduleClick }: CourtCardProps) {
  const { endGame, isCourtAvailable, courtSchedules, settings, updateCourtScore, assignCourtSkillLevel } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const isScheduled = !isCourtAvailable(court.id);
  const schedule = courtSchedules[court.id];

  useEffect(() => {
    if (court.active && !court.timerPaused) {
      const interval = setInterval(() => {
        const newElapsed = court.startTime
          ? Math.floor((Date.now() - court.startTime) / 1000)
          : 0;
        setElapsed(newElapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [court.active, court.timerPaused, court.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getScheduleInfo = () => {
    if (!schedule) return null;

    const now = Date.now();
    if (now >= schedule.unavailableUntil) return null;

    const remainingMs = schedule.unavailableUntil - now;
    const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    return {
      rentedBy: schedule.rentedBy,
      remainingHours,
      remainingMinutes,
    };
  };

  const scheduleInfo = getScheduleInfo();

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isExpanded ? 'p-4 sm:p-6' : 'p-3 sm:p-4',
        court.active && 'border-primary shadow-md',
        !court.active && !isScheduled && 'border-dashed',
        isScheduled && 'border-orange-500/50 bg-orange-500/5'
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between transition-all duration-200",
        isExpanded ? "mb-3 sm:mb-4" : "mb-0"
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          <h3 className="text-base sm:text-lg font-semibold">Court {court.id}</h3>
          <Badge
            variant={court.active ? 'default' : isScheduled ? 'secondary' : 'outline'}
            className={cn(isScheduled && 'bg-orange-500 text-white', 'text-xs sm:text-sm px-2.5 py-0.5')}
          >
            {court.active ? 'Playing' : isScheduled ? 'Scheduled' : 'Empty'}
          </Badge>
          {/* Skill Level Badge */}
          {settings.enableCourtSkillAssignment && court.assignedSkillLevel && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
            >
              {court.assignedSkillLevel.charAt(0).toUpperCase() + court.assignedSkillLevel.slice(1)} Only
            </Badge>
          )}
          {/* Collapsed preview */}
          {!isExpanded && court.active && (
            <span className="text-sm text-muted-foreground truncate">
              {court.players.length} players • {formatTime(elapsed)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Collapsible Content */}
      <div
        className={cn(
          "transition-all duration-200 overflow-hidden",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-3 sm:space-y-4">

          {/* Scheduled Info */}
          {isScheduled && scheduleInfo && (
            <div className="space-y-3 p-3 sm:p-4 bg-orange-500/10 rounded-lg border border-orange-500/30 mb-3 sm:mb-4">
              <div>
                <div className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-1">
                  <span>🔒</span>
                  <span>Private Rental</span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Rented by: <strong>{scheduleInfo.rentedBy}</strong>
                </div>
              </div>
              <div className="text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time remaining:</span>
                  <span className="font-medium">
                    {scheduleInfo.remainingHours}h {scheduleInfo.remainingMinutes}m
                  </span>
                </div>
              </div>
              <div className="text-xs bg-orange-500/20 p-2 rounded border border-orange-500/30">
                ℹ️ This court is unavailable for queue players. The renter decides who plays.
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={onScheduleClick}
                className="w-full h-10"
              >
                Clear Schedule
              </Button>
            </div>
          )}

          {/* Active Game */}
          {court.active && court.players.length > 0 && (
            <>
              {/* Timer */}
              {settings.showCourtTimers && (
                <div className="bg-muted p-4 rounded-lg text-center mb-3 sm:mb-4">
                  <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
                    {formatTime(elapsed)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!court.timerPaused ? (
                      <Button variant="secondary" size="sm" className="flex-1 h-10">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" className="flex-1 h-10">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" className="flex-1 h-10">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Score Tracking */}
              {settings.enableManualScoring && (
                <div className="bg-muted p-4 rounded-lg mb-3 sm:mb-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Team 1 */}
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Team 1
                      </div>
                      <div className="text-3xl font-bold mb-2">{court.team1Score}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => updateCourtScore(court.id, 'team1', Math.max(0, court.team1Score - 1))}
                        >
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => updateCourtScore(court.id, 'team1', court.team1Score + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="text-center text-xl font-bold text-muted-foreground">
                      VS
                    </div>

                    {/* Team 2 */}
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Team 2
                      </div>
                      <div className="text-3xl font-bold mb-2">{court.team2Score}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => updateCourtScore(court.id, 'team2', Math.max(0, court.team2Score - 1))}
                        >
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => updateCourtScore(court.id, 'team2', court.team2Score + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Players */}
              <div className="space-y-2 mb-3 sm:mb-4">
                {court.groupInfo && (
                  // Display group name if players came from a group
                  <div className="flex items-center gap-2 bg-muted px-3 py-2.5 rounded-md text-sm mb-2">
                    <span>👥</span>
                    <span className="font-medium">{court.groupInfo.name}</span>
                  </div>
                )}

                {/* Team-based player grouping (for manual scoring mode) */}
                {settings.enableManualScoring && settings.gameMode === 'doubles' && court.players.length === 4 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Team 1 */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2">
                        Team 1
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2 space-y-1">
                        {court.players.slice(0, 2).map((player, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm"
                          >
                            <span>👤</span>
                            <span>{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400 px-2">
                        Team 2
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-2 space-y-1">
                        {court.players.slice(2, 4).map((player, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm"
                          >
                            <span>👤</span>
                            <span>{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default list view (for singles or when manual scoring is off)
                  court.players.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted px-3 py-2.5 rounded-md text-sm"
                    >
                      <span>👤</span>
                      <span>{player}</span>
                    </div>
                  ))
                )}
              </div>

              {/* End Game Button */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full h-10"
                onClick={() => endGame(court.id)}
              >
                End Game
              </Button>
            </>
          )
          }

          {/* Empty Court */}
          {
            !court.active && !isScheduled && (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                  Court available
                </p>

                {/* Court Skill Assignment */}
                {settings.enableCourtSkillAssignment && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Assign Skill Level (Optional)</Label>
                    <Select
                      value={court.assignedSkillLevel || 'none'}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          assignCourtSkillLevel(court.id, null);
                        } else {
                          assignCourtSkillLevel(court.id, value as SkillLevel);
                        }
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Any skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any skill level</SelectItem>
                        <SelectItem value="beginner">Beginner Only</SelectItem>
                        <SelectItem value="intermediate">Intermediate Only</SelectItem>
                        <SelectItem value="advanced">Advanced Only</SelectItem>
                        <SelectItem value="professional">Professional Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Only players with this skill level can play on this court
                    </p>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full h-10"
                  onClick={onScheduleClick}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Rent Court
                </Button>
              </div>
            )
          }
        </div>
      </div>
    </Card>
  );
}
