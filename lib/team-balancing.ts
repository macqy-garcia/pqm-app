import type { Player, SkillLevel } from './types';

// Skill level numeric values for calculations
const SKILL_VALUES: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
};

interface PlayerWithSkill {
  name: string;
  skillValue: number;
  skillLevel: SkillLevel;
}

/**
 * Balance teams by skill level for doubles (4 players)
 * Algorithm: Sort by skill, then pair [highest + lowest] vs [2nd + 3rd]
 *
 * @param playerNames - Array of 4 player names
 * @param registeredPlayers - Player data with skill levels
 * @returns Object with team1 and team2 arrays, or null if not exactly 4 players
 */
export function balanceDoublesTeams(
  playerNames: string[],
  registeredPlayers: Record<string, Player>
): { team1: string[]; team2: string[]; team1Avg: number; team2Avg: number } | null {
  if (playerNames.length !== 4) return null;

  // Map players to their skill values
  const playersWithSkills: PlayerWithSkill[] = playerNames.map((name) => {
    const player = registeredPlayers[name];
    const skillLevel = player?.skillLevel || 'intermediate';
    return {
      name,
      skillValue: SKILL_VALUES[skillLevel],
      skillLevel,
    };
  });

  // Sort by skill value (highest to lowest)
  playersWithSkills.sort((a, b) => b.skillValue - a.skillValue);

  // Team balancing strategy:
  // Team 1: 1st (highest) + 4th (lowest)
  // Team 2: 2nd + 3rd (middle two)
  const team1 = [playersWithSkills[0].name, playersWithSkills[3].name];
  const team2 = [playersWithSkills[1].name, playersWithSkills[2].name];

  // Calculate averages
  const team1Avg = (playersWithSkills[0].skillValue + playersWithSkills[3].skillValue) / 2;
  const team2Avg = (playersWithSkills[1].skillValue + playersWithSkills[2].skillValue) / 2;

  return {
    team1,
    team2,
    team1Avg,
    team2Avg,
  };
}

/**
 * Balance teams for singles (2 players) - just returns them as-is since it's 1v1
 *
 * @param playerNames - Array of 2 player names
 * @returns Object with team1 and team2 arrays (single player each)
 */
export function balanceSinglesTeams(
  playerNames: string[]
): { team1: string[]; team2: string[] } | null {
  if (playerNames.length !== 2) return null;

  return {
    team1: [playerNames[0]],
    team2: [playerNames[1]],
  };
}

/**
 * Get a description of the team balance quality
 *
 * @param team1Avg - Average skill of team 1
 * @param team2Avg - Average skill of team 2
 * @returns Description string
 */
export function getBalanceQuality(team1Avg: number, team2Avg: number): string {
  const diff = Math.abs(team1Avg - team2Avg);

  if (diff === 0) return 'Perfect Balance';
  if (diff <= 0.5) return 'Excellent Balance';
  if (diff <= 1.0) return 'Good Balance';
  if (diff <= 1.5) return 'Fair Balance';
  return 'Unbalanced';
}

/**
 * Format team for display
 *
 * @param team - Array of player names
 * @param registeredPlayers - Player data
 * @returns Formatted string with skill indicators
 */
export function formatTeam(
  team: string[],
  registeredPlayers: Record<string, Player>
): string {
  return team
    .map((name) => {
      const player = registeredPlayers[name];
      const skill = player?.skillLevel || 'intermediate';
      const skillChar = skill.charAt(0).toUpperCase();
      return `${name} (${skillChar})`;
    })
    .join(', ');
}
