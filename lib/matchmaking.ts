import type { QueueItem, SkillLevel, Player } from './types';

// Skill level numeric values for comparison
const SKILL_VALUES: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
};

// Get average skill level from a list of player names
export function getAverageSkill(
  playerNames: string[],
  registeredPlayers: Record<string, Player>
): number {
  const total = playerNames.reduce((sum, name) => {
    const player = registeredPlayers[name];
    return sum + (player ? SKILL_VALUES[player.skillLevel] : SKILL_VALUES.intermediate);
  }, 0);
  return total / playerNames.length;
}

// Calculate skill variance (how spread out the skills are)
export function getSkillVariance(
  playerNames: string[],
  registeredPlayers: Record<string, Player>
): number {
  const skills = playerNames.map((name) => {
    const player = registeredPlayers[name];
    return player ? SKILL_VALUES[player.skillLevel] : SKILL_VALUES.intermediate;
  });

  const avg = skills.reduce((sum, skill) => sum + skill, 0) / skills.length;
  const variance = skills.reduce((sum, skill) => sum + Math.pow(skill - avg, 2), 0) / skills.length;

  return variance;
}

// Get match quality rating (0-100, higher is better)
export function getMatchQuality(
  playerNames: string[],
  registeredPlayers: Record<string, Player>
): number {
  if (playerNames.length < 2) return 100;

  const variance = getSkillVariance(playerNames, registeredPlayers);

  // Perfect match (0 variance) = 100
  // High variance (max 9) = 0
  // Using exponential decay: quality = 100 * e^(-variance/2)
  const quality = 100 * Math.exp(-variance / 2);

  return Math.round(quality);
}

// Get color based on match quality
export function getMatchQualityColor(quality: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (quality >= 80) {
    return {
      bg: 'bg-green-100 dark:bg-green-950/30',
      text: 'text-green-700 dark:text-green-400',
      label: 'Excellent Match',
    };
  } else if (quality >= 60) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-950/30',
      text: 'text-blue-700 dark:text-blue-400',
      label: 'Good Match',
    };
  } else if (quality >= 40) {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-950/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      label: 'Fair Match',
    };
  } else {
    return {
      bg: 'bg-orange-100 dark:bg-orange-950/30',
      text: 'text-orange-700 dark:text-orange-400',
      label: 'Unbalanced',
    };
  }
}

// Suggest optimal queue ordering for skill-based matching
export function suggestOptimalOrder(
  queue: QueueItem[],
  registeredPlayers: Record<string, Player>,
  playersPerGame: number
): QueueItem[] {
  // Separate groups and individual players
  const groups: QueueItem[] = [];
  const players: QueueItem[] = [];

  queue.forEach((item) => {
    if (item.type === 'group') {
      groups.push(item);
    } else {
      players.push(item);
    }
  });

  // Sort players by skill level
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.type !== 'player' || b.type !== 'player') return 0;

    const playerA = registeredPlayers[a.name];
    const playerB = registeredPlayers[b.name];

    const skillA = playerA ? SKILL_VALUES[playerA.skillLevel] : 2;
    const skillB = playerB ? SKILL_VALUES[playerB.skillLevel] : 2;

    return skillA - skillB;
  });

  // Rebuild queue: groups first, then sorted players
  return [...groups, ...sortedPlayers];
}

// Get skill distribution for next game
export function getNextGameSkills(
  queue: QueueItem[],
  registeredPlayers: Record<string, Player>,
  playersPerGame: number
): {
  players: string[];
  skills: SkillLevel[];
  quality: number;
} | null {
  if (queue.length === 0) return null;

  const firstItem = queue[0];
  let players: string[] = [];

  if (firstItem.type === 'group') {
    if (firstItem.players.length !== playersPerGame) return null;
    players = firstItem.players;
  } else {
    // Get individual players
    for (let i = 0; i < queue.length && players.length < playersPerGame; i++) {
      const item = queue[i];
      if (item.type === 'player') {
        players.push(item.name);
      } else {
        break;
      }
    }
    if (players.length < playersPerGame) return null;
  }

  const skills = players.map((name) => {
    const player = registeredPlayers[name];
    return player ? player.skillLevel : 'intermediate';
  });

  const quality = getMatchQuality(players, registeredPlayers);

  return { players, skills, quality };
}
