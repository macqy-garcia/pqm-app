'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, QrCode } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CourtCard } from '@/components/courts/court-card';
import { CourtScheduleModal } from '@/components/courts/court-schedule-modal';
import { WhosNext } from '@/components/queue/whos-next';
import { QueueList } from '@/components/queue/queue-list';
import { PlayerList } from '@/components/players/player-list';
import { GroupCard } from '@/components/groups/group-card';
import { GroupModal } from '@/components/groups/group-modal';
import { StatisticsPanel } from '@/components/stats/statistics-panel';
import { SettingsModal } from '@/components/modals/settings-modal';
import { QRCodeModal } from '@/components/modals/qr-code-modal';
import { toast, Toaster } from 'sonner';
import { PLAYERS_PER_GAME } from '@/lib/types';
import { useNotifications } from '@/lib/use-notifications';
import { useRentalWarnings } from '@/lib/use-rental-warnings';

export default function Home() {
  const {
    courts,
    queue,
    groups,
    settings,
    initializeCourts,
    addPlayerToQueue,
    startGame,
    isCourtAvailable,
  } = useStore();

  const [playerName, setPlayerName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);

  // Enable notifications and rental warnings
  useNotifications();
  useRentalWarnings();

  useEffect(() => {
    initializeCourts();
  }, [initializeCourts]);

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      const success = addPlayerToQueue(playerName.trim());
      if (success) {
        setPlayerName('');
        toast.success(`${playerName.trim()} added to queue`);
      } else {
        toast.error('Failed to add player');
      }
    }
  };

  const handleStartNextGame = () => {
    // Find court that is not active AND not scheduled
    const availableCourt = courts.find((c) => !c.active && isCourtAvailable(c.id));
    if (!availableCourt) {
      toast.error('No courts available (all courts are in use or scheduled)');
      return;
    }

    const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
    if (queue.length < playersNeeded) {
      toast.error(`Need ${playersNeeded} players to start a game`);
      return;
    }

    startGame(availableCourt.id);
    toast.success(`Game started on Court ${availableCourt.id}`);
  };

  const handleScheduleCourt = (courtId: number) => {
    setSelectedCourtId(courtId);
    setScheduleModalOpen(true);
  };

  const activeCourtsCount = courts.filter((c) => c.active).length;
  const playersNeeded = PLAYERS_PER_GAME[settings.gameMode];
  const hasEnoughPlayers = queue.length >= playersNeeded;
  const hasAvailableCourt = courts.some((c) => !c.active && isCourtAvailable(c.id));

  return (
    <div className="min-h-screen bg-background pb-safe">
      <Toaster position="bottom-center" />

      <div className="container max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              🎾 <span className="truncate">Pickleball Queue Manager</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
              Manage courts, queues, and players efficiently
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </header>

        {/* Control Panel */}
        <Card className="p-4 sm:p-6">
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="queue" className="text-xs sm:text-sm py-2.5">
                <span className="hidden sm:inline">Add to Queue</span>
                <span className="sm:hidden">Queue</span>
              </TabsTrigger>
              <TabsTrigger value="players" className="text-xs sm:text-sm py-2.5">Players</TabsTrigger>
              <TabsTrigger value="groups" className="text-xs sm:text-sm py-2.5">Groups</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs sm:text-sm py-2.5">
                <span className="hidden sm:inline">Statistics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter player name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="flex-1 h-11 text-base"
                />
                <Button onClick={handleAddPlayer} className="h-11 w-full sm:w-auto">
                  Add to Queue
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="players" className="mt-6">
              <PlayerList />
            </TabsContent>

            <TabsContent value="groups" className="mt-4 sm:mt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <h3 className="text-lg font-semibold">Groups</h3>
                  <Button onClick={() => setGroupModalOpen(true)} className="h-11">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                  </Button>
                </div>

                {groups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <p>No groups created yet. Create a group to queue players together!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <StatisticsPanel />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Courts Section */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Active Courts</h2>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {activeCourtsCount}/{courts.length}
            </Badge>
          </div>
          {/* <pre>{JSON.stringify(courts, null, 2)}</pre> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
            {courts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onScheduleClick={() => handleScheduleCourt(court.id)}
              />
            ))}
          </div>
        </section>

        {/* Queue Section */}
        <section>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Waiting Queue</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrModalOpen(true)}
                  className="flex-1 sm:flex-none h-10"
                >
                  <QrCode className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Join via QR Code</span>
                  <span className="sm:hidden ml-2">QR Code</span>
                </Button>
                <Badge variant="secondary" className="text-sm px-3 py-1.5 whitespace-nowrap">
                  {queue.length} {queue.length === 1 ? 'player' : 'players'}
                </Badge>
              </div>
            </div>

            {/* Who's Next */}
            <div className="mb-4 sm:mb-6">
              <WhosNext />
            </div>

            {/* Start Game Button */}
            <Button
              size="lg"
              className="w-full mb-4 sm:mb-6 h-12 text-base"
              onClick={handleStartNextGame}
              disabled={!hasAvailableCourt || !hasEnoughPlayers}
            >
              {!hasAvailableCourt
                ? 'No Courts Available'
                : !hasEnoughPlayers
                  ? `Need ${playersNeeded} Players (${queue.length}/${playersNeeded})`
                  : 'Start Next Game'}
            </Button>

            {/* Queue List */}
            <QueueList />
          </Card>
        </section>
      </div>

      {/* Modals */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GroupModal open={groupModalOpen} onOpenChange={setGroupModalOpen} />
      <CourtScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        courtId={selectedCourtId}
      />
      <QRCodeModal open={qrModalOpen} onOpenChange={setQrModalOpen} />
    </div>
  );
}
