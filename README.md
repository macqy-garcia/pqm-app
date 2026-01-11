# 🎾 Pickleball Queue Manager (PQM)

A comprehensive web application for managing pickleball courts, player queues, and game scheduling at facilities with multiple courts.

## Features

- **Multi-Court Management** - Support for 1-10 courts with real-time status tracking
- **Smart Queue System** - Automated player queue with drag-and-drop reordering
- **Group Management** - Create permanent teams that queue and play together
- **Court Scheduling** - Reserve courts for private rentals with time tracking
- **Skill-Based Matching** - Optional skill levels and match quality indicators
- **Wait Time Estimation** - Dynamic calculations based on court availability
- **Live Timers** - Track game duration with play/pause/reset
- **Manual Scoring** - Optional team score tracking
- **Statistics & History** - Track player stats and game history
- **QR Code Join** - Allow players to scan and join the queue
- **Browser Notifications** - Alert players when it's their turn
- **Dark Mode** - Full dark mode support

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Documentation

### For Developers & AI Assistants

- **[AI_ONBOARDING.md](./AI_ONBOARDING.md)** - Quick start guide for AI assistants and new developers (20-minute read to productivity)
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Comprehensive documentation covering all features, architecture, and implementation details

### Quick Links

- **Tech Stack**: Next.js 16, React 19, TypeScript, Zustand, Radix UI, Tailwind CSS
- **State Management**: Zustand with localStorage persistence
- **Key Files**:
  - `lib/store.ts` - Central state management
  - `lib/types.ts` - Type definitions
  - `app/page.tsx` - Main application
  - `components/*` - Feature components

## Project Structure

```
pqm-app/
├── app/                    # Next.js app router
├── components/
│   ├── ui/                # Reusable UI components
│   ├── courts/            # Court management
│   ├── queue/             # Queue management
│   ├── players/           # Player management
│   ├── groups/            # Group management
│   ├── stats/             # Statistics
│   └── modals/            # Modal dialogs
├── lib/                   # Core logic
│   ├── store.ts           # State management (Zustand)
│   ├── types.ts           # TypeScript types
│   ├── matchmaking.ts     # Skill-based matching
│   ├── wait-time.ts       # Wait time calculations
│   └── *.ts               # Other utilities
└── public/                # Static assets
```

## Key Concepts

### Queue System
- Players queue individually or as groups
- First-in-first-out with manual reordering
- Automatically pulls players when games start
- Groups maintain identity when playing

### Court Management
- Courts can be Active (playing), Scheduled (private rental), or Empty
- Real-time timers track game duration
- Scheduled courts blocked from queue system
- Automatic expiration warnings for rentals

### Game Modes
- **Doubles** - 4 players per game (default)
- **Singles** - 2 players per game

### Rotation Rules
- **Manual** - All players return to queue after game
- **Losers Rotate** - Only losers return (future)
- **All Rotate** - All players return (current behavior)

## Configuration

Access settings via the Settings button (⚙️) in the top right:

- Number of courts (1-10)
- Game mode (Singles/Doubles)
- Default game duration
- Rotation rules
- Feature toggles (timers, scoring, notifications, skill matching)

## Data Persistence

All data is stored in browser localStorage and persists across sessions. To reset:

1. Use "Clear All Data" in Settings, or
2. Clear browser localStorage manually

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Language**: TypeScript 5
- **State**: Zustand with persist middleware
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Drag & Drop**: @dnd-kit
- **QR Codes**: qrcode.react

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

### Reset Data During Development

```javascript
// In browser console
localStorage.removeItem('pickleballQueueState')
// Refresh page
```

## Common Use Cases

### Basic Queue Flow
1. Add players to queue
2. Click "Start Next Game" when court available
3. Play the game
4. Click "End Game" when finished
5. Players return to queue based on rotation rule

### Court Rental
1. Click "Rent Court" on empty court
2. Select duration and enter renter name
3. Court is blocked from queue system
4. 5-minute warning before expiration
5. Option to extend or clear schedule

### Group Play
1. Create group with correct number of players
2. Add group to queue
3. Group plays together maintaining identity
4. Group returns together after game

### Skill Matching
1. Enable skill matching in settings
2. Set player skill levels
3. View match quality in "Who's Next"
4. Optionally optimize queue by skill

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

## License

Private project - All rights reserved

## Contributing

This is a private project. For feature requests or bug reports, contact the project maintainer.

---

**Version**: 0.1.0
**Last Updated**: 2026-01-12
**Built with**: Next.js, React, TypeScript, Zustand, Tailwind CSS
