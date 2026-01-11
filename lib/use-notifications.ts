import { useEffect } from 'react';
import { useStore } from './store';
import { PLAYERS_PER_GAME } from './types';

export function useNotifications() {
  const { queue, courts, settings, notifiedPlayers } = useStore();

  useEffect(() => {
    if (!settings.enableNotifications) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') return;

    // Get next players
    const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
    const nextPlayers: string[] = [];

    if (queue.length > 0) {
      const firstItem = queue[0];

      if (firstItem.type === 'group') {
        if (firstItem.players.length === playersNeeded) {
          nextPlayers.push(...firstItem.players);
        }
      } else {
        for (let i = 0; i < queue.length && nextPlayers.length < playersNeeded; i++) {
          const item = queue[i];
          if (item.type === 'player') {
            nextPlayers.push(item.name);
          } else {
            break;
          }
        }
      }
    }

    // Check if there's an available court
    const hasAvailableCourt = courts.some((c) => !c.active);

    if (nextPlayers.length === playersNeeded && hasAvailableCourt) {
      nextPlayers.forEach((playerName) => {
        if (!notifiedPlayers.has(playerName)) {
          new Notification('🎾 Pickleball Queue', {
            body: `${playerName}, it's your turn to play! Get ready!`,
            icon: '/next.svg',
            badge: '/next.svg',
            requireInteraction: true,
          });

          // Add to notified players (this would need to be persisted in a real app)
          notifiedPlayers.add(playerName);
        }
      });
    }
  }, [queue, courts, settings, notifiedPlayers]);

  return null;
}
