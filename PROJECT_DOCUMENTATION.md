# Pickleball Queue Manager (PQM) - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Core Concepts](#core-concepts)
5. [State Management](#state-management)
6. [Feature Documentation](#feature-documentation)
7. [Component Structure](#component-structure)
8. [Key Files Reference](#key-files-reference)
9. [Development Guide](#development-guide)

---

## Project Overview

**Pickleball Queue Manager** is a web application designed to manage pickleball courts, player queues, and game scheduling at facilities with multiple courts. It provides real-time queue management, court scheduling, player statistics, skill-based matchmaking, and automated notifications.

### Primary Use Cases
- Recreational facilities with 1-10 pickleball courts
- Managing player queues efficiently
- Court rental/reservation management
- Player skill tracking and balanced matchmaking
- Game statistics and history tracking

---

## Tech Stack

### Frontend Framework
- **Next.js 16** (App Router)
- **React 19** (Client-side rendered)
- **TypeScript 5**

### State Management
- **Zustand 5** - Global state management
- **Zustand Persist Middleware** - localStorage persistence

### UI Libraries
- **Radix UI** - Headless component primitives
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Vaul** - Drawer component
- **@dnd-kit** - Drag and drop functionality
- **next-themes** - Dark mode support
- **qrcode.react** - QR code generation

### Utilities
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variants
- **clsx** & **tailwind-merge** - Conditional styling

---

## Project Architecture

```
pqm-app/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   └── page.tsx            # Main application page
├── components/
│   ├── ui/                 # Reusable UI components (Radix)
│   ├── courts/            # Court-related components
│   │   ├── court-card.tsx
│   │   └── court-schedule-modal.tsx
│   ├── queue/             # Queue management components
│   │   ├── queue-list.tsx
│   │   └── whos-next.tsx
│   ├── players/           # Player management components
│   │   ├── player-list.tsx
│   │   ├── player-card.tsx
│   │   └── skill-level-modal.tsx
│   ├── groups/            # Group management components
│   │   ├── group-card.tsx
│   │   └── group-modal.tsx
│   ├── stats/             # Statistics components
│   │   └── statistics-panel.tsx
│   └── modals/            # Modal dialogs
│       ├── settings-modal.tsx
│       ├── qr-code-modal.tsx
│       └── bulk-add-players-modal.tsx  # NEW
├── lib/
│   ├── store.ts           # Zustand store (main state)
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions
│   ├── matchmaking.ts     # Skill-based matching logic
│   ├── wait-time.ts       # Wait time calculations
│   ├── use-notifications.ts    # Browser notifications hook
│   ├── use-rental-warnings.ts  # Rental expiration warnings
│   ├── use-voice-announcements.ts  # Voice TTS hook (NEW)
│   └── use-media-query.ts      # Responsive utilities
└── package.json
```

---

## Core Concepts

### 1. Courts
Courts are the playing spaces where games happen. Each court has:
- **ID** - Unique identifier (1, 2, 3...)
- **Status** - Active (game in progress), Scheduled (private rental), or Empty
- **Players** - Array of player names currently playing
- **Timer** - Tracks game duration with play/pause/reset
- **Scores** - Team 1 and Team 2 scores (optional)
- **Group Info** - If players came from a group, maintains group identity
- **Skill Assignment** - Optional restriction to specific skill level (NEW)

### 2. Queue System
The queue is a **linear, ordered list** of players/groups waiting to play:
- **Individual Players** - Added one at a time with timestamps
- **Groups** - Pre-formed teams queued together
- **Order** - First in, first out (FIFO) with manual reordering support
- **Smart Dequeue** - Automatically pulls correct number of players based on game mode

### 3. Players
Players are **registered users** tracked throughout sessions:
- **Auto-registration** - Registered when first added to queue
- **Skill Level** - Beginner, Intermediate, Advanced, Professional
- **Statistics** - Games played and total playtime
- **Persistent** - Stored in localStorage

### 4. Groups
Groups are **permanent teams** of players:
- **Size** - Flexible 2-4 players (can combine with individuals if needed)
- **Queue as Unit** - Entire group queued together
- **Identity Preservation** - Group maintained when playing and returning to queue
- **Exclusivity** - Players can't be in multiple groups

### 5. Court Scheduling/Rentals
Courts can be **reserved for private use**:
- **Time-based** - Reserved for specific number of hours
- **Renter Info** - Tracks who rented the court
- **Unavailability** - Blocks court from queue system
- **Auto-expiration** - Automatically releases court when time expires
- **Extension** - Can extend rental time with 1-hour increments

### 6. Game Modes
Two supported modes that affect player requirements:
- **Doubles** - 4 players per game (default)
- **Singles** - 2 players per game

### 7. Rotation Rules
Three modes for handling players after game ends:
- **Manual** - All players return to back of queue
- **Losers Rotate** - Only losing team returns to queue (not yet implemented)
- **All Rotate** - All players return to queue (same as manual currently)

---

## State Management

### Zustand Store (`lib/store.ts`)

The entire application state is managed by a single Zustand store with localStorage persistence.

#### State Shape
```typescript
interface AppState {
  courts: Court[];                          // Array of all courts
  queue: QueueItem[];                       // Queue of players/groups
  registeredPlayers: Record<string, Player>; // Player name -> Player data
  groups: Group[];                          // All created groups
  gameHistory: GameRecord[];                // Last 50 games
  settings: Settings;                       // App configuration
  courtSchedules: Record<number, CourtSchedule>; // Court ID -> Schedule
  notifiedPlayers: Set<string>;            // Tracks who was notified
}
```

#### Key Store Methods

**Court Actions:**
- `initializeCourts()` - Create courts based on settings
- `startGame(courtId)` - Pull players from queue and start game
- `endGame(courtId)` - End game, update stats, handle rotation
- `addPlayerToCourt(courtId, playerName)` - Manually add player to court
- `updateCourtScore(courtId, team, score)` - Update team scores
- `assignCourtSkillLevel(courtId, skillLevel)` - Assign/remove skill restriction (NEW)

**Queue Actions:**
- `addPlayerToQueue(name)` - Add individual player
- `removePlayerFromQueue(index)` - Remove from queue
- `reorderQueue(fromIndex, toIndex)` - Manual reordering

**Player Actions:**
- `updatePlayerSkillLevel(playerName, skillLevel)` - Update skill

**Group Actions:**
- `createGroup(name, players)` - Create new group
- `deleteGroup(groupId)` - Delete group and remove from queue
- `addGroupToQueue(groupId)` - Add group to queue

**Settings Actions:**
- `updateSettings(settings)` - Update app settings

**Court Schedule Actions:**
- `scheduleCourtRental(courtId, hours, rentedBy)` - Reserve court
- `clearCourtSchedule(courtId)` - Clear reservation
- `isCourtAvailable(courtId)` - Check if court is available
- `extendCourtRental(courtId, additionalHours)` - Extend rental
- `markWarningShown(courtId)` - Mark 5-min warning as shown

**Timer Actions:**
- `startTimer(courtId)` - Resume timer
- `pauseTimer(courtId)` - Pause timer
- `updateTimerElapsed(courtId, elapsed)` - Update elapsed time

**Utility:**
- `clearAllData()` - Reset entire app state

---

## Feature Documentation

### 1. Queue Management

#### Adding Players
**Location:** `app/page.tsx` (lines 73-83)
- Enter name in input field
- Click "Add to Queue" or press Enter
- Player is auto-registered if new
- Validation: Can't add if already in queue or playing

#### QR Code Join
**Location:** `components/modals/qr-code-modal.tsx`
- Generates QR code with URL parameter `?action=join`
- Players scan and enter their name
- Automatically added to queue
- URL parameter cleared after processing

#### Queue Reordering
**Location:** `components/queue/queue-list.tsx`
- Drag and drop using @dnd-kit
- Visual feedback during drag
- Updates queue order in real-time

#### Who's Next Display
**Location:** `components/queue/whos-next.tsx`
- Shows next players who will play
- Handles both individual players and groups
- Displays match quality if skill matching enabled

### 2. Court Management

#### Starting Games
**Location:** `app/page.tsx` (lines 85-101)
- Button disabled if not enough players or no courts available
- Automatically pulls correct number of players
- Handles groups as single unit
- Sets court to active and starts timer

#### Court Cards
**Location:** `components/courts/court-card.tsx`
- **Collapsible** - Click to expand/collapse
- **Status Badge** - Playing, Scheduled, or Empty
- **Timer Display** - Real-time countdown (if enabled)
- **Scoring** - Manual +/- buttons (if enabled)
- **Player List** - Shows group name if applicable
- **End Game** - Returns players to queue based on rotation rule

#### Court Scheduling
**Location:** `components/courts/court-schedule-modal.tsx`
- Select duration (0.5 to 8 hours, or custom)
- Enter renter name
- Shows remaining time on court card
- Blocks court from queue system
- Option to clear schedule early

#### Rental Warnings
**Location:** `lib/use-rental-warnings.ts`
- Checks every 30 seconds
- Shows toast at 5 minutes remaining
- Option to extend by 1 hour
- Option to end rental early

### 3. Player Management

#### Player Registration
**Location:** `lib/store.ts` (lines 254-295)
- Automatic when first added to queue
- Default skill level: Intermediate
- Tracks games played and total playtime

#### Skill Levels
**Location:** `components/players/skill-level-modal.tsx`
- 4 levels: Beginner, Intermediate, Advanced, Professional
- Visual descriptions for each level
- Updates player profile immediately

#### Player Statistics
**Location:** `components/players/player-card.tsx`
- Games played count
- Total playtime in hours/minutes
- Current skill level
- Edit skill level button

### 4. Group Management

#### Creating Groups
**Location:** `components/groups/group-modal.tsx`
- Enter group name
- Select exact number of players (2 or 4)
- Validation: Players can't be in multiple groups
- Validation: Must match game mode player count

#### Group Queue Behavior
**Location:** `lib/store.ts` (lines 361-401)
- Groups queue as single unit
- Group identity maintained during play
- When game ends, group returns together
- Individual members removed from queue when group is added

### 5. Skill-Based Matchmaking

#### Match Quality Calculation
**Location:** `lib/matchmaking.ts`
- Calculates skill variance (how spread out skills are)
- Quality score: 0-100 (higher is better)
- Formula: `100 * e^(-variance/2)`
- Color-coded indicators:
  - Green (80-100): Excellent Match
  - Blue (60-79): Good Match
  - Yellow (40-59): Fair Match
  - Orange (0-39): Unbalanced

#### Queue Optimization
**Location:** `lib/matchmaking.ts` (lines 89-122)
- Suggests optimal order based on skill levels
- Groups always stay first
- Sorts individual players by skill

#### Next Game Preview
**Location:** `components/queue/whos-next.tsx`
- Shows skills of next players
- Displays match quality rating
- Visual indicator of balance

### 6. Statistics & History

#### Game History
**Location:** `lib/store.ts` (lines 155-225)
- Records last 50 games
- Tracks: court, players, duration, timestamp, scores
- Used for statistics and wait time estimation

#### Statistics Panel
**Location:** `components/stats/statistics-panel.tsx`
- Game history table
- Player performance metrics
- Average game duration
- Most active players

### 7. Wait Time Estimation

#### Calculation Logic
**Location:** `lib/wait-time.ts`
- Factors in available courts
- Considers active game progress
- Uses historical average game duration
- Accounts for parallel games on multiple courts
- Displays as "~15m" or "~1h 20m"

#### Display
**Location:** `components/queue/queue-list.tsx`
- Shows for each player in queue
- Updates dynamically as games start/end
- "Up next!" for first in queue

### 8. Notifications

#### Browser Notifications
**Location:** `lib/use-notifications.ts`
- Requests permission on first load
- Notifies players when they're next
- Triggered when enough players + available court
- Tracks notified players to avoid duplicates

#### Toast Notifications
**Location:** Throughout app using `sonner`
- Success: Player added, game started
- Error: Validation failures
- Info: Court status changes
- Warning: Rental expiring

### 9. Settings

#### Configurable Settings
**Location:** `components/modals/settings-modal.tsx`

**Game Settings:**
- Number of Courts (1-10)
- Game Mode (Doubles/Singles)
- Default Game Duration (5-60 minutes)
- Rotation Rule (Manual/Losers/All)

**Feature Toggles:**
- Auto-start timer
- Browser notifications
- Skill-based matching
- Auto-balance teams by skill (NEW)
- Strict skill level matching (NEW)
- Enable court skill assignments (NEW)
- Enable voice announcements (NEW)
- Show court timers
- Manual scoring

**Voice Settings (NEW):**
- Voice type selection (Male/Female English, Male/Female Filipino)

**Danger Zone:**
- Clear all data (with confirmation)

### 10. Court Skill Assignment (NEW)

#### Overview
**Location:** `components/courts/court-card.tsx`, `lib/store.ts`, `app/page.tsx`

Allows assigning specific skill levels to courts for skill-based court restrictions.

#### Features
- **Assign Skill to Court** - Restrict court to beginner, intermediate, advanced, or professional players
- **Optional Assignment** - Courts without assignment accept any skill level
- **Intelligent Matching** - Game start logic automatically selects appropriate court based on player skills
- **Visual Indicators** - Court cards show assigned skill level badge

#### How It Works
1. Enable "Enable court skill assignments" in Settings
2. On empty court card, use dropdown to assign skill level
3. When starting games, system checks next players' skill levels
4. Matches players to courts with same skill assignment
5. Falls back to courts without assignment if no exact match
6. Shows error if no compatible court available

#### Logic Priority
```
1. Find court assigned to player's skill level
2. Fall back to unassigned courts
3. Error if no match found
```

### 11. Bulk Player Onboarding (NEW)

#### Overview
**Location:** `components/modals/bulk-add-players-modal.tsx`, `components/players/player-list.tsx`

Allows batch registration of multiple players from external systems.

#### Features
- **Paste Multiple Names** - One name per line in textarea
- **Bulk Registration** - All players registered at once
- **Not Auto-queued** - Players registered but NOT added to queue
- **Duplicate Detection** - Skips players already registered
- **Default Skill** - All bulk-added players default to Intermediate

#### How to Use
1. Go to Players tab
2. Click "Bulk Add" button
3. Paste player names (one per line)
4. Click "Add Players"
5. Players appear in registered players list
6. Manually add to queue as needed

#### Use Case
Useful when players check in via external apps (e.g., reclub) and need to be imported quickly.

### 12. Voice Announcements (NEW)

#### Overview
**Location:** `lib/use-voice-announcements.ts`, `components/queue/whos-next.tsx`

Text-to-speech announcements for next players using Web Speech API.

#### Features
- **Speaker Button** - Volume icon (🔊) in "Who's Playing Next" section
- **Voice Selection** - Choose from Male/Female (English) or Male/Female (Filipino)
- **Intelligent Court Detection** - Announces correct court based on skill assignments
- **Device-dependent Voices** - Uses browser/OS available voices

#### How It Works
1. Enable "Enable voice announcements" in Settings
2. Select voice type (Male/Female/Filipino-Male/Filipino-Female)
3. When players are ready, click speaker button in "Who's Next"
4. System announces: "Player1, Player2, Player3, and Player4, please proceed to court X"

#### Voice Selection Logic
```typescript
Filipino voices: Checks for 'fil' or 'tl' language code
English voices: Checks for 'en' language code + gender keywords
Fallback: Any available voice
```

#### Browser Support
- Chrome/Edge: Full support with multiple voices
- Safari: Limited voice selection
- Firefox: Varies by OS
- Voice availability depends on device OS and language packs installed

---

## Component Structure

### Page Components

#### `app/page.tsx` - Main Application
- Root component orchestrating entire app
- Tabs: Queue, Players, Groups, Statistics
- Court display section
- Queue display section
- All modal management
- Handles QR code join parameter

### Court Components

#### `components/courts/court-card.tsx`
**Props:** `court`, `onScheduleClick`
- Displays single court status
- Collapsible design
- Timer display and controls
- Scoring interface
- Player list
- Schedule information
- End game button

#### `components/courts/court-schedule-modal.tsx`
**Props:** `open`, `onOpenChange`, `courtId`
- Schedule court rental form
- Quick select durations (0.5h to 8h)
- Custom time input
- Renter name input
- Clear schedule for already-scheduled courts
- Extend rental option

### Queue Components

#### `components/queue/queue-list.tsx`
- Drag-and-drop reorderable list
- Displays all queue items (players + groups)
- Shows wait time estimates
- Delete buttons
- Empty state message

#### `components/queue/whos-next.tsx`
- Preview of next game
- Shows player names/group
- Match quality indicator (if enabled)
- Skill badges for each player
- "Up next" badge

### Player Components

#### `components/players/player-list.tsx`
- Grid of all registered players
- Search/filter (if implemented)
- Shows player cards
- Empty state

#### `components/players/player-card.tsx`
**Props:** `playerName`, `player`
- Avatar with initials
- Player name
- Skill level badge
- Games played count
- Total playtime
- Edit skill button
- Quick add to queue button

#### `components/players/skill-level-modal.tsx`
**Props:** `open`, `onOpenChange`, `playerName`, `currentSkillLevel`
- Radio group for skill selection
- Descriptions for each level
- Save button

### Group Components

#### `components/groups/group-card.tsx`
**Props:** `group`
- Group name and member count
- List of member names
- Add to queue button
- Delete button
- Disabled state if members playing

#### `components/groups/group-modal.tsx`
**Props:** `open`, `onOpenChange`
- Group name input
- Multi-select for players
- Validation messages
- Create button

### Stats Components

#### `components/stats/statistics-panel.tsx`
- Game history table
- Total games stat
- Average duration
- Most active players
- Export options (if implemented)

### Modal Components

#### `components/modals/settings-modal.tsx`
**Props:** `open`, `onOpenChange`
- All settings inputs
- Validation
- Save and cancel buttons
- Clear all data dialog

#### `components/modals/qr-code-modal.tsx`
**Props:** `open`, `onOpenChange`
- Generates QR code with current URL + join param
- Display QR code (QRCodeReact)
- Instructions text
- URL display

#### `components/modals/bulk-add-players-modal.tsx` (NEW)
**Props:** `open`, `onOpenChange`
- Textarea for pasting player names
- One name per line format
- Bulk registration without queue addition
- Duplicate detection and feedback
- Count of added vs skipped players

---

## Key Files Reference

### `lib/types.ts`
**Purpose:** All TypeScript type definitions

**Key Types:**
```typescript
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional'
type GameMode = 'doubles' | 'singles'
type RotationRule = 'manual' | 'losersRotate' | 'allRotate'
type VoiceType = 'male' | 'female' | 'filipino-male' | 'filipino-female' // NEW

interface Player {
  gamesPlayed: number
  totalPlayTime: number
  skillLevel: SkillLevel
}

interface Court {
  id: number
  players: string[]
  active: boolean
  startTime: number | null
  timerElapsed: number
  timerPaused: boolean
  groupInfo?: { id: number; name: string }
  team1Score: number
  team2Score: number
  assignedSkillLevel?: SkillLevel  // NEW - optional skill restriction
}

interface QueuePlayer {
  type: 'player'
  name: string
  joinedAt: number
}

interface QueueGroup {
  type: 'group'
  id: number
  name: string
  players: string[]
  joinedAt: number
}

type QueueItem = QueuePlayer | QueueGroup

interface Group {
  id: number
  name: string
  players: string[]
}

interface GameRecord {
  courtId: number
  players: string[]
  duration: number
  timestamp: string
  gameMode: GameMode
  team1Score?: number
  team2Score?: number
}

interface Settings {
  numCourts: number
  gameMode: GameMode
  gameDuration: number
  rotationRule: RotationRule
  autoTimer: boolean
  enableNotifications: boolean
  skillMatchingEnabled: boolean
  autoTeamBalancing: boolean  // NEW
  strictSkillMatching: boolean  // NEW
  enableCourtSkillAssignment: boolean  // NEW
  enableVoiceAnnouncements: boolean  // NEW
  voiceType: VoiceType  // NEW
  showCourtTimers: boolean
  enableManualScoring: boolean
}

interface CourtSchedule {
  unavailableUntil: number
  rentedBy: string
  warningShown?: boolean
}
```

### `lib/store.ts`
**Purpose:** Zustand store - entire app state and all actions

**Key Sections:**
- State interface (lines 5-43)
- Default settings (lines 47-57)
- Store creation with persist (lines 59-561)
- Court actions (lines 72-251)
- Queue actions (lines 253-308)
- Player actions (lines 310-324)
- Group actions (lines 326-401)
- Settings actions (lines 403-408)
- Court schedule actions (lines 410-490)
- Timer actions (lines 492-531)

### `lib/matchmaking.ts`
**Purpose:** Skill-based matching algorithms

**Key Functions:**
- `getAverageSkill()` - Calculate average skill of players
- `getSkillVariance()` - Measure skill spread
- `getMatchQuality()` - 0-100 quality score
- `getMatchQualityColor()` - Color coding for UI
- `suggestOptimalOrder()` - Reorder queue by skill
- `getNextGameSkills()` - Preview next game

### `lib/wait-time.ts`
**Purpose:** Wait time estimation

**Key Functions:**
- `getAverageGameDuration()` - From game history
- `calculateWaitTime()` - Estimate wait for queue position
- `formatWaitTime()` - Human-readable format

### `lib/use-notifications.ts`
**Purpose:** Browser notification hook

**Behavior:**
- Runs as effect in main page
- Checks for next players + available court
- Requests permission
- Sends notifications
- Tracks who was notified

### `lib/use-rental-warnings.ts`
**Purpose:** Court rental expiration warnings

**Behavior:**
- Checks every 30 seconds
- Shows toast at 5 minutes remaining
- Option to extend rental
- Tracks if warning shown

### `lib/use-voice-announcements.ts` (NEW)
**Purpose:** Voice announcements using Web Speech API

**Behavior:**
- Loads available voices from browser/OS
- Selects voice based on type and language preference
- `selectVoice(voiceType)` - Finds matching voice with fallback logic
- `announce(text)` - Speaks text with selected voice
- `announceNextPlayers(playerNames, courtId)` - Formats and announces next game
- Checks if speech synthesis is supported
- Provides voice list for debugging

**Key Functions:**
- `announce(text: string)` - Generic TTS announcement
- `announceNextPlayers(playerNames: string[], courtId: number)` - Formatted player announcement
- `selectVoice(voiceType: VoiceType)` - Voice selection with fallback

**Voice Selection Priority:**
```
Filipino: 'fil'/'tl' language code → gender keywords → any Filipino voice
English: gender keywords → 'en' language code → any English voice
Fallback: any available voice
```

### `lib/utils.ts`
**Purpose:** Utility functions

**Key Functions:**
- `cn()` - Tailwind class merging with clsx

### `lib/use-media-query.ts`
**Purpose:** Responsive design hook
- Detects screen size breakpoints
- Used for mobile-specific UI

---

## Development Guide

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Local Storage

All data persists in browser localStorage under key: `pickleballQueueState`

**To reset during development:**
```javascript
localStorage.removeItem('pickleballQueueState')
// Refresh page
```

### Adding New Features

#### Adding a Court Action
1. Add action to `StoreState` interface in `lib/store.ts`
2. Implement action in store
3. Use action in component via `useStore()`
4. Add UI in appropriate component

#### Adding a New Setting
1. Add property to `Settings` type in `lib/types.ts`
2. Add to `defaultSettings` in `lib/store.ts`
3. Add UI control in `components/modals/settings-modal.tsx`
4. Handle in `handleSave()` function
5. Use setting throughout app via `useStore()`

#### Adding a New Component
1. Create in appropriate subfolder under `components/`
2. Use shadcn components from `components/ui/`
3. Access state via `useStore()`
4. Follow existing patterns for props and styling

### Common Patterns

#### Accessing State
```typescript
const { courts, queue, settings, startGame } = useStore()
```

#### Updating State
```typescript
// Via store action
const { updateSettings } = useStore()
updateSettings({ numCourts: 4 })
```

#### Conditional UI
```typescript
{court.active && (
  <div>Court is active</div>
)}

{queue.length === 0 ? (
  <EmptyState />
) : (
  <QueueList />
)}
```

#### Toast Notifications
```typescript
import { toast } from 'sonner'

toast.success('Player added!')
toast.error('Not enough players')
toast.info('Court available')
```

### Responsive Design

The app uses Tailwind breakpoints:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+

Mobile-first approach with progressive enhancement.

### Dark Mode

Handled automatically by `next-themes`:
- Wraps app in `ThemeProvider`
- Uses Tailwind `dark:` variants
- User preference persisted

### Drag and Drop

Using `@dnd-kit`:
- See `components/queue/queue-list.tsx` for implementation
- `DndContext` wraps draggable area
- `SortableContext` manages items
- `useSortable` hook in item components

---

## Common Development Tasks

### Debugging State
```typescript
// In any component
const store = useStore()
console.log('Full state:', store)
```

### Testing Queue Logic
1. Add 4+ players
2. Start game
3. End game
4. Verify rotation rule behavior

### Testing Court Scheduling
1. Schedule court for 0.5 hours
2. Wait ~25 minutes
3. Verify 5-minute warning appears
4. Test extend functionality

### Testing Skill Matching
1. Enable skill matching in settings
2. Add players with different skills
3. Check "Who's Next" match quality
4. Try queue optimization

### Testing Notifications
1. Enable notifications in settings
2. Allow browser notification permission
3. Add 4 players
4. Ensure court is available
5. Verify notifications appear

### Testing Court Skill Assignment (NEW)
1. Enable court skill assignments in settings
2. Set different skills to different players
3. Assign Court 1 to "beginner" only
4. Add 4 beginners to queue
5. Click "Start Next Game"
6. Verify game starts on Court 1
7. Test fallback: Add mixed skills, verify uses unassigned court

### Testing Bulk Player Onboarding (NEW)
1. Go to Players tab
2. Click "Bulk Add"
3. Paste multiple names (one per line)
4. Verify all players registered
5. Check duplicate detection works
6. Verify players NOT in queue

### Testing Voice Announcements (NEW)
1. Enable voice announcements in settings
2. Select voice type
3. Add 4 players to queue
4. Ensure at least one court is available
5. Click speaker button (🔊) in "Who's Next"
6. Verify announcement plays
7. Test different voice types
8. Test with court skill assignments enabled

---

## Future Enhancement Ideas

### Not Yet Implemented
- **Losers Rotate** - Actual implementation of losers-only rotation
- **Player Profiles** - Photos, contact info, preferences
- **Tournament Mode** - Bracket generation
- **Check-in System** - Players must check in when notified
- **Court Maintenance** - Mark courts as temporarily unavailable
- **Analytics Dashboard** - Advanced statistics and charts
- **Multi-location** - Support multiple facilities
- **API Backend** - Replace localStorage with server
- **Mobile App** - Native iOS/Android apps
- **Player Ratings** - Dynamic ELO-style ratings
- **Automated Tournaments** - Round-robin, elimination brackets
- **Payment Integration** - Court rental payments
- **Calendar Integration** - Export to Google Calendar, etc.

---

## Troubleshooting

### State Not Persisting
- Check localStorage is enabled in browser
- Verify key `pickleballQueueState` exists in localStorage
- Check browser console for errors

### Notifications Not Working
- Verify notification permission granted
- Check settings: `enableNotifications` is true
- Browser must support Notifications API

### Queue Not Working
- Check console for errors
- Verify game mode matches group size
- Ensure players not already playing

### Court Timer Issues
- Verify `showCourtTimers` setting is enabled
- Check court has valid `startTime`
- Ensure timer not paused

### Build Errors
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check TypeScript errors: `npx tsc --noEmit`

### Voice Announcements Not Working (NEW)
- Verify `enableVoiceAnnouncements` setting is enabled
- Check browser supports Web Speech API (Chrome/Edge recommended)
- Verify voice type is selected in settings
- Check device has TTS voices installed (especially for Filipino)
- Try different voice types to test availability
- Check browser console for speech synthesis errors

### Court Skill Assignment Issues (NEW)
- Verify `enableCourtSkillAssignment` setting is enabled
- Check players have skill levels set (default: intermediate)
- Verify court has skill level assigned (or set to "none")
- Check "Start Next Game" logic prioritizes matching courts
- Ensure fallback to unassigned courts works correctly

---

## Contact & Support

This is a standalone application. For issues:
1. Check browser console for errors
2. Verify localStorage data
3. Clear all data via Settings modal
4. Refresh browser

---

**Last Updated:** 2026-01-12
**Version:** 0.1.0
**Framework:** Next.js 16 with React 19
