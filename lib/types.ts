// Pickleball Queue Manager - Type Definitions

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type GameMode = 'doubles' | 'singles';
export type RotationRule = 'manual' | 'losersRotate' | 'allRotate';

export interface Player {
  gamesPlayed: number;
  totalPlayTime: number; // in minutes
  skillLevel: SkillLevel;
}

export interface Court {
  id: number;
  players: string[];
  active: boolean;
  startTime: number | null;
  timerElapsed: number;
  timerPaused: boolean;
  groupInfo?: { id: number; name: string }; // Track if players came from a group
  team1Score: number;
  team2Score: number;
  assignedSkillLevel?: SkillLevel; // Optional skill level restriction for this court
}

export interface Group {
  id: number;
  name: string;
  players: string[];
}

export interface QueuePlayer {
  type: 'player';
  name: string;
  joinedAt: number; // timestamp
}

export interface QueueGroup {
  type: 'group';
  id: number;
  name: string;
  players: string[];
  joinedAt: number; // timestamp
}

export type QueueItem = QueuePlayer | QueueGroup;

export interface GameRecord {
  courtId: number;
  players: string[];
  duration: number; // in minutes
  timestamp: string;
  gameMode: GameMode;
  team1Score?: number;
  team2Score?: number;
}

export type VoiceType = 'male' | 'female' | 'filipino-male' | 'filipino-female';

export interface Settings {
  numCourts: number;
  gameMode: GameMode;
  gameDuration: number; // in minutes
  rotationRule: RotationRule;
  autoTimer: boolean;
  enableNotifications: boolean;
  skillMatchingEnabled: boolean;
  showCourtTimers: boolean;
  enableManualScoring: boolean;
  autoTeamBalancing: boolean; // Automatically balance teams by skill when starting games
  strictSkillMatching: boolean; // Only allow games with players of the same skill level
  enableCourtSkillAssignment: boolean; // Allow assigning skill levels to specific courts
  enableVoiceAnnouncements: boolean; // Enable text-to-speech announcements
  voiceType: VoiceType; // Voice type for announcements
}

export interface CourtSchedule {
  unavailableUntil: number; // timestamp
  rentedBy: string;
  warningShown?: boolean; // Track if 5-min warning was shown
}

export interface AppState {
  courts: Court[];
  queue: QueueItem[];
  registeredPlayers: Record<string, Player>;
  groups: Group[];
  gameHistory: GameRecord[];
  settings: Settings;
  courtSchedules: Record<number, CourtSchedule>;
  notifiedPlayers: Set<string>;
}

// Constants
export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'professional'];

export const PLAYERS_PER_GAME: Record<GameMode, number> = {
  doubles: 4,
  singles: 2,
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  professional: 'Professional',
};

export const SKILL_LEVEL_DESCRIPTIONS: Record<SkillLevel, string> = {
  beginner: 'New to pickleball',
  intermediate: 'Regular player with experience',
  advanced: 'Highly skilled and competitive',
  professional: 'Tournament level player',
};
