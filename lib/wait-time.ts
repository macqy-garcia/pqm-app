import type { GameRecord, QueueItem, Court } from './types';

/**
 * Calculate the average game duration from game history
 * Returns the average in minutes
 */
export function getAverageGameDuration(gameHistory: GameRecord[]): number {
  if (gameHistory.length === 0) {
    // Default to 15 minutes if no history
    return 15;
  }

  // Use the last 10 games for more relevant average
  const recentGames = gameHistory.slice(0, 10);
  const totalDuration = recentGames.reduce((sum, game) => sum + game.duration, 0);
  return Math.round(totalDuration / recentGames.length);
}

/**
 * Calculate estimated wait time for a specific position in queue
 * @param queueIndex - The position in queue (0-based)
 * @param queue - The full queue
 * @param courts - All courts
 * @param playersPerGame - Number of players needed per game (2 or 4)
 * @param averageGameDuration - Average game duration in minutes
 * @returns Estimated wait time in minutes
 */
export function calculateWaitTime(
  queueIndex: number,
  queue: QueueItem[],
  courts: Court[],
  playersPerGame: number,
  averageGameDuration: number
): number {
  // Count available courts (not scheduled)
  const availableCourts = courts.filter((c) => !c.active).length;

  if (availableCourts === 0) {
    // All courts are busy, estimate based on ongoing games
    const activeCourts = courts.filter((c) => c.active);
    const averageElapsed = activeCourts.reduce((sum, court) => {
      const elapsed = court.startTime
        ? Math.floor((Date.now() - court.startTime) / 1000 / 60)
        : 0;
      return sum + elapsed;
    }, 0) / activeCourts.length;

    const estimatedTimeUntilCourtFree = Math.max(0, averageGameDuration - averageElapsed);

    // Calculate games ahead
    let playersAhead = 0;
    for (let i = 0; i < queueIndex; i++) {
      const item = queue[i];
      if (item.type === 'group') {
        playersAhead += item.players.length;
      } else {
        playersAhead++;
      }
    }

    const gamesAhead = Math.ceil(playersAhead / playersPerGame);
    const totalGames = Math.ceil(gamesAhead / courts.length);

    return Math.round(estimatedTimeUntilCourtFree + (totalGames * averageGameDuration));
  }

  // Calculate how many players are ahead in queue
  let playersAhead = 0;
  for (let i = 0; i < queueIndex; i++) {
    const item = queue[i];
    if (item.type === 'group') {
      playersAhead += item.players.length;
    } else {
      playersAhead++;
    }
  }

  // Calculate how many complete games will happen before this player
  const gamesAhead = Math.ceil(playersAhead / playersPerGame);

  // Estimate time based on number of available courts
  // If we have multiple courts, games can happen in parallel
  const parallelGames = Math.ceil(gamesAhead / availableCourts);

  return Math.round(parallelGames * averageGameDuration);
}

/**
 * Format wait time for display
 * @param minutes - Wait time in minutes
 * @returns Formatted string like "5m" or "1h 20m"
 */
export function formatWaitTime(minutes: number): string {
  if (minutes === 0) return 'Up next!';
  if (minutes < 60) return `~${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `~${hours}h`;
  return `~${hours}h ${mins}m`;
}
