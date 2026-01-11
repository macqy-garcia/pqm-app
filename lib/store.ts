import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Court, QueueItem, Player, Group, GameRecord, Settings, CourtSchedule, SkillLevel } from './types';

interface StoreState extends AppState {
  // Court actions
  initializeCourts: () => void;
  startGame: (courtId: number) => void;
  endGame: (courtId: number) => void;
  addPlayerToCourt: (courtId: number, playerName: string) => void;
  updateCourtScore: (courtId: number, team: 'team1' | 'team2', score: number) => void;

  // Queue actions
  addPlayerToQueue: (name: string) => boolean;
  removePlayerFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Player actions
  updatePlayerSkillLevel: (playerName: string, skillLevel: SkillLevel) => void;

  // Group actions
  createGroup: (name: string, players: string[]) => boolean;
  deleteGroup: (groupId: number) => void;
  addGroupToQueue: (groupId: number) => boolean;

  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;

  // Court schedule actions
  scheduleCourtRental: (courtId: number, hours: number, rentedBy: string) => boolean;
  clearCourtSchedule: (courtId: number) => void;
  isCourtAvailable: (courtId: number) => boolean;
  extendCourtRental: (courtId: number, additionalHours: number) => boolean;
  markWarningShown: (courtId: number) => void;

  // Timer actions
  startTimer: (courtId: number) => void;
  pauseTimer: (courtId: number) => void;
  updateTimerElapsed: (courtId: number, elapsed: number) => void;

  // Utility
  clearAllData: () => void;
}

const STORAGE_KEY = 'pickleballQueueState';

const defaultSettings: Settings = {
  numCourts: 2,
  gameMode: 'doubles',
  gameDuration: 15,
  rotationRule: 'manual',
  autoTimer: true,
  enableNotifications: true,
  skillMatchingEnabled: false,
  showCourtTimers: true,
  enableManualScoring: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      courts: [],
      queue: [],
      registeredPlayers: {},
      groups: [],
      gameHistory: [],
      settings: defaultSettings,
      courtSchedules: {},
      notifiedPlayers: new Set(),

      // Court actions
      initializeCourts: () => {
        const { settings, courts } = get();
        const numCourts = settings.numCourts;

        if (courts.length === numCourts) return;

        const newCourts: Court[] = [];
        for (let i = 0; i < numCourts; i++) {
          if (courts[i]) {
            newCourts.push(courts[i]);
          } else {
            newCourts.push({
              id: i + 1,
              players: [],
              active: false,
              startTime: null,
              timerElapsed: 0,
              timerPaused: false,
              groupInfo: undefined,
              team1Score: 0,
              team2Score: 0,
            });
          }
        }

        set({ courts: newCourts });
      },

      startGame: (courtId: number) => {
        const { courts, queue, settings } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court || court.active) return;

        // Prevent using scheduled courts
        if (!get().isCourtAvailable(courtId)) {
          return;
        }

        const playersNeeded = settings.gameMode === 'doubles' ? 4 : 2;

        // Check if first item in queue is a group
        const firstItem = queue[0];
        let players: string[];
        let itemsToRemove: number;

        let groupInfo: { id: number; name: string } | undefined;

        if (firstItem && firstItem.type === 'group') {
          // It's a group - extract player names and store group info
          if (firstItem.players.length !== playersNeeded) return;
          players = firstItem.players;
          itemsToRemove = 1; // Remove the group
          groupInfo = { id: firstItem.id, name: firstItem.name };
        } else {
          // Get individual players
          const individualPlayers: string[] = [];
          for (let i = 0; i < queue.length && individualPlayers.length < playersNeeded; i++) {
            const item = queue[i];
            if (item.type === 'player') {
              individualPlayers.push(item.name);
            } else {
              break; // Hit a group, stop
            }
          }

          if (individualPlayers.length < playersNeeded) return;
          players = individualPlayers;
          itemsToRemove = playersNeeded;
          groupInfo = undefined;
        }

        court.players = players;
        court.active = true;
        court.startTime = Date.now();
        court.groupInfo = groupInfo;

        set({
          courts: [...courts],
          queue: queue.slice(itemsToRemove),
        });
      },

      endGame: (courtId: number) => {
        const { courts, queue, registeredPlayers, gameHistory, settings } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court || !court.active) return;

        const duration = court.timerElapsed
          ? Math.floor(court.timerElapsed / 1000 / 60)
          : Math.floor((Date.now() - (court.startTime || Date.now())) / 1000 / 60);

        // Record game
        const gameRecord: GameRecord = {
          courtId,
          players: [...court.players],
          duration,
          timestamp: new Date().toISOString(),
          gameMode: settings.gameMode,
          team1Score: court.team1Score,
          team2Score: court.team2Score,
        };

        // Update player stats
        const updatedPlayers = { ...registeredPlayers };
        court.players.forEach((playerName) => {
          if (updatedPlayers[playerName]) {
            updatedPlayers[playerName].gamesPlayed++;
            updatedPlayers[playerName].totalPlayTime += duration;
          }
        });

        // Return players to queue based on rotation rule
        let newQueue = [...queue];
        if (settings.rotationRule === 'manual' || settings.rotationRule === 'allRotate') {
          // If players came from a group, reconstruct the group
          if (court.groupInfo) {
            newQueue = [
              ...queue,
              {
                type: 'group' as const,
                id: court.groupInfo.id,
                name: court.groupInfo.name,
                players: [...court.players],
                joinedAt: Date.now(), // New timestamp when returning to queue
              },
            ];
          } else {
            // Individual players - add them back with new timestamps
            const returningPlayers = court.players.map((name) => ({
              type: 'player' as const,
              name,
              joinedAt: Date.now(),
            }));
            newQueue = [...queue, ...returningPlayers];
          }
        }

        // Reset court
        court.players = [];
        court.active = false;
        court.startTime = null;
        court.timerElapsed = 0;
        court.timerPaused = false;
        court.groupInfo = undefined;
        court.team1Score = 0;
        court.team2Score = 0;

        set({
          courts: [...courts],
          queue: newQueue,
          registeredPlayers: updatedPlayers,
          gameHistory: [gameRecord, ...gameHistory].slice(0, 50),
        });
      },

      addPlayerToCourt: (courtId: number, playerName: string) => {
        const { courts, queue, settings } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court) return;

        const playersNeeded = settings.gameMode === 'doubles' ? 4 : 2;
        if (court.players.length >= playersNeeded) return;

        // Remove from queue if present
        const newQueue = queue.filter((item) => {
          if (item.type === 'player') return item.name !== playerName;
          return true;
        });

        court.players.push(playerName);

        // Activate court if full
        if (court.players.length === playersNeeded && !court.active) {
          court.active = true;
          court.startTime = Date.now();
        }

        set({ courts: [...courts], queue: newQueue });
      },

      // Queue actions
      addPlayerToQueue: (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        const { queue, courts, registeredPlayers } = get();

        // Check if already in queue
        const isInQueue = queue.some((item) => {
          if (item.type === 'player') return item.name === trimmedName;
          if (item.type === 'group') return item.players.includes(trimmedName);
          return false;
        });
        if (isInQueue) return false;

        // Check if currently playing
        const isPlaying = courts.some((court) => court.players.includes(trimmedName));
        if (isPlaying) return false;

        // Register player if new
        const updatedPlayers = { ...registeredPlayers };
        if (!updatedPlayers[trimmedName]) {
          updatedPlayers[trimmedName] = {
            gamesPlayed: 0,
            totalPlayTime: 0,
            skillLevel: 'intermediate',
          };
        }

        set({
          queue: [
            ...queue,
            {
              type: 'player' as const,
              name: trimmedName,
              joinedAt: Date.now(),
            },
          ],
          registeredPlayers: updatedPlayers,
        });

        return true;
      },

      removePlayerFromQueue: (index: number) => {
        const { queue } = get();
        set({ queue: queue.filter((_, i) => i !== index) });
      },

      reorderQueue: (fromIndex: number, toIndex: number) => {
        const { queue } = get();
        const newQueue = [...queue];
        const [removed] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, removed);
        set({ queue: newQueue });
      },

      // Player actions
      updatePlayerSkillLevel: (playerName: string, skillLevel: SkillLevel) => {
        const { registeredPlayers } = get();
        if (!registeredPlayers[playerName]) return;

        set({
          registeredPlayers: {
            ...registeredPlayers,
            [playerName]: {
              ...registeredPlayers[playerName],
              skillLevel,
            },
          },
        });
      },

      // Group actions
      createGroup: (name: string, players: string[]) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;

        const { groups, settings } = get();
        const playersNeeded = settings.gameMode === 'doubles' ? 4 : 2;

        if (players.length !== playersNeeded) return false;

        // Check if any player is already in a group
        const playersInGroups = groups.flatMap((g) => g.players);
        const hasDuplicates = players.some((p) => playersInGroups.includes(p));
        if (hasDuplicates) return false;

        const newGroup: Group = {
          id: Date.now(),
          name: trimmedName,
          players,
        };

        set({ groups: [...groups, newGroup] });
        return true;
      },

      deleteGroup: (groupId: number) => {
        const { groups, queue } = get();
        set({
          groups: groups.filter((g) => g.id !== groupId),
          queue: queue.filter((item) =>
            typeof item === 'object' && item.type === 'group' ? item.id !== groupId : true
          ),
        });
      },

      addGroupToQueue: (groupId: number) => {
        const { groups, queue, courts } = get();
        const group = groups.find((g) => g.id === groupId);
        if (!group) return false;

        // Check if group already in queue
        const isInQueue = queue.some(
          (item) => item.type === 'group' && item.id === groupId
        );
        if (isInQueue) return false;

        // Check if any player is currently playing
        for (const playerName of group.players) {
          const isPlaying = courts.some((court) => court.players.includes(playerName));
          if (isPlaying) return false;
        }

        // Remove individual players from queue if they're in the group
        const newQueue = queue.filter((item) => {
          // Keep groups
          if (item.type === 'group') return true;
          // Keep players not in this group
          if (item.type === 'player') return !group.players.includes(item.name);
          return true;
        });

        set({
          queue: [
            ...newQueue,
            {
              type: 'group' as const,
              id: group.id,
              name: group.name,
              players: [...group.players],
              joinedAt: Date.now(),
            },
          ],
        });

        return true;
      },

      // Settings actions
      updateSettings: (newSettings: Partial<Settings>) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
        get().initializeCourts();
      },

      // Court schedule actions
      scheduleCourtRental: (courtId: number, hours: number, rentedBy: string) => {
        const { courts, courtSchedules } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court || court.active) return false;

        const unavailableUntil = Date.now() + hours * 60 * 60 * 1000;

        set({
          courtSchedules: {
            ...courtSchedules,
            [courtId]: {
              unavailableUntil,
              rentedBy: rentedBy || 'Private Rental',
            },
          },
        });

        return true;
      },

      clearCourtSchedule: (courtId: number) => {
        const { courtSchedules } = get();
        const { [courtId]: removed, ...rest } = courtSchedules;
        set({ courtSchedules: rest });
      },

      isCourtAvailable: (courtId: number) => {
        const { courtSchedules } = get();
        const schedule = courtSchedules[courtId];
        if (!schedule) return true;

        const now = Date.now();
        if (schedule.unavailableUntil && now < schedule.unavailableUntil) {
          return false;
        }

        // Clear expired schedule
        if (schedule.unavailableUntil && now >= schedule.unavailableUntil) {
          get().clearCourtSchedule(courtId);
        }

        return true;
      },

      extendCourtRental: (courtId: number, additionalHours: number) => {
        const { courtSchedules } = get();
        const schedule = courtSchedules[courtId];
        if (!schedule) return false;

        const newUnavailableUntil = schedule.unavailableUntil + (additionalHours * 60 * 60 * 1000);

        set({
          courtSchedules: {
            ...courtSchedules,
            [courtId]: {
              ...schedule,
              unavailableUntil: newUnavailableUntil,
              warningShown: false, // Reset warning for new extension
            },
          },
        });

        return true;
      },

      markWarningShown: (courtId: number) => {
        const { courtSchedules } = get();
        const schedule = courtSchedules[courtId];
        if (!schedule) return;

        set({
          courtSchedules: {
            ...courtSchedules,
            [courtId]: {
              ...schedule,
              warningShown: true,
            },
          },
        });
      },

      // Timer actions
      startTimer: (courtId: number) => {
        const { courts } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court) return;

        court.timerPaused = false;
        set({ courts: [...courts] });
      },

      pauseTimer: (courtId: number) => {
        const { courts } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court) return;

        court.timerPaused = true;
        set({ courts: [...courts] });
      },

      updateTimerElapsed: (courtId: number, elapsed: number) => {
        const { courts } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court) return;

        court.timerElapsed = elapsed;
        set({ courts: [...courts] });
      },

      updateCourtScore: (courtId: number, team: 'team1' | 'team2', score: number) => {
        const { courts } = get();
        const court = courts.find((c) => c.id === courtId);
        if (!court) return;

        if (team === 'team1') {
          court.team1Score = score;
        } else {
          court.team2Score = score;
        }
        set({ courts: [...courts] });
      },

      // Utility
      clearAllData: () => {
        set({
          courts: [],
          queue: [],
          registeredPlayers: {},
          groups: [],
          gameHistory: [],
          settings: defaultSettings,
          courtSchedules: {},
          notifiedPlayers: new Set(),
        });
        get().initializeCourts();
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        courts: state.courts,
        queue: state.queue,
        registeredPlayers: state.registeredPlayers,
        groups: state.groups,
        gameHistory: state.gameHistory,
        settings: state.settings,
        courtSchedules: state.courtSchedules,
      }),
    }
  )
);
