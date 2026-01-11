import { useEffect } from 'react';
import { useStore } from './store';
import { toast } from 'sonner';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useRentalWarnings() {
  const { courtSchedules, markWarningShown, extendCourtRental } = useStore();

  useEffect(() => {
    const checkSchedules = () => {
      const now = Date.now();

      Object.entries(courtSchedules).forEach(([courtIdStr, schedule]) => {
        const courtId = parseInt(courtIdStr);

        // Skip if warning already shown
        if (schedule.warningShown) return;

        const timeRemaining = schedule.unavailableUntil - now;

        // Show warning if less than 5 minutes remaining
        if (timeRemaining > 0 && timeRemaining <= FIVE_MINUTES_MS) {
          markWarningShown(courtId);

          // Show toast with extend option
          toast(`Court ${courtId} rental ending soon!`, {
            description: `${schedule.rentedBy}'s rental ends in ${Math.ceil(timeRemaining / 60000)} minutes. Would you like to extend?`,
            duration: 10000,
            action: {
              label: 'Extend 1 Hour',
              onClick: () => {
                const success = extendCourtRental(courtId, 1);
                if (success) {
                  toast.success(`Court ${courtId} extended by 1 hour`);
                }
              },
            },
            cancel: {
              label: 'End Rental',
              onClick: () => {
                toast.info(`Court ${courtId} will become available for queue players soon`);
              },
            },
          });
        }
      });
    };

    // Check every 30 seconds
    const interval = setInterval(checkSchedules, 30000);

    // Check immediately on mount
    checkSchedules();

    return () => clearInterval(interval);
  }, [courtSchedules, markWarningShown, extendCourtRental]);

  return null;
}
