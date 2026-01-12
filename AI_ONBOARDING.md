# AI Assistant Onboarding Guide - Pickleball Queue Manager

## Quick Start for AI Assistants

This document provides a rapid understanding of the codebase structure, patterns, and conventions for AI assistants working on this project.

---

## 🎯 What This App Does

Manages pickleball courts at a facility: tracks player queues, starts/ends games, handles court rentals, calculates wait times, and provides statistics.

---

## 🏗️ Architecture at a Glance

**Framework:** Next.js 16 (App Router) + React 19 + TypeScript
**State:** Zustand with localStorage persistence
**UI:** Radix UI + Tailwind CSS
**Key Pattern:** Single-page app with client-side state management

---

## 📁 File Structure Importance Ranking

### Critical Files (Read These First)
1. **`lib/store.ts`** - Entire app state and all business logic
2. **`lib/types.ts`** - All TypeScript types and constants
3. **`app/page.tsx`** - Main UI orchestration
4. **`components/courts/court-card.tsx`** - Core court display logic
5. **`components/queue/queue-list.tsx`** - Queue display and drag-drop

### Important Files
6. **`lib/matchmaking.ts`** - Skill-based matching algorithms
7. **`lib/wait-time.ts`** - Wait time calculations
8. **`components/modals/settings-modal.tsx`** - All configurable settings
9. **`lib/use-notifications.ts`** - Browser notification logic
10. **`lib/use-rental-warnings.ts`** - Court rental expiration warnings
11. **`lib/use-voice-announcements.ts`** - Text-to-speech voice announcements

### Supporting Files
- `components/ui/*` - Reusable Radix UI components (don't modify unless necessary)
- `components/modals/bulk-add-players-modal.tsx` - Bulk player registration (NEW)
- Other `components/*` - Feature-specific components
- `lib/utils.ts` - Helper functions

---

## 🧠 Mental Model

### Data Flow
```
User Action → Component → Store Action → State Update → Component Re-render
```

### Key Entities
1. **Queue** - Ordered list of `QueueItem[]` (players or groups waiting)
2. **Courts** - Array of `Court[]` (playing spaces with active games)
3. **Players** - `Record<string, Player>` (registered users with stats)
4. **Groups** - `Group[]` (permanent teams)
5. **Settings** - `Settings` (app configuration)

### Critical Relationships
- **Queue → Courts**: Players pulled from queue front when game starts
- **Players → Queue**: Can only be in queue OR on court, never both
- **Groups → Queue**: Groups queue as single unit, maintain identity
- **Courts → Schedules**: Scheduled courts blocked from queue system

---

## 🔑 Key Concepts

### 1. Queue Item Types
```typescript
type QueueItem = QueuePlayer | QueueGroup

// Player queued individually
QueuePlayer = { type: 'player', name: string, joinedAt: number }

// Group queued together
QueueGroup = { type: 'group', id: number, name: string, players: string[], joinedAt: number }
```

**Critical Rule:** Groups can now be 2-4 players (flexible group sizes)

### 1a. Voice Types (NEW)
```typescript
type VoiceType = 'male' | 'female' | 'filipino-male' | 'filipino-female'
```

Voice announcements support multiple voice types with language/gender preferences.

### 2. Court States
- **Empty + Available**: Can start game from queue
- **Empty + Scheduled**: Private rental, blocked from queue
- **Empty + Skill Assigned**: Restricted to specific skill level (if enabled)
- **Active**: Game in progress

**Court Skill Assignment (NEW):**
Courts can have an optional `assignedSkillLevel` that restricts which players can play on that court.

### 3. Starting a Game Logic (store.ts:101-153, app/page.tsx:65-147)
```typescript
// Priority check order:
1. Is court available (not scheduled)?
2. Enough players in queue?
3. If court skill assignment enabled:
   a. Determine skill levels of next players
   b. Find court matching their skill level
   c. Fallback to court without skill assignment
   d. Error if no matching court available
4. Is first item a group?
   YES → Take entire group (flexible size 2-4)
   NO → Take N individual players from front
5. Set court active, start timer, remove from queue
6. Announce via voice if enabled
```

### 4. Ending a Game Logic (store.ts:155-226)
```typescript
1. Record game in history
2. Update player stats (games played, playtime)
3. Based on rotation rule:
   - Manual/AllRotate: Return all players to back of queue
   - (LosersRotate not implemented yet)
4. Preserve group identity if applicable
5. Reset court to empty
```

---

## 🎨 Component Patterns

### Accessing State
```typescript
// Always use useStore hook
const { courts, queue, startGame, addPlayerToQueue } = useStore()
```

### Typical Component Structure
```typescript
'use client' // All components are client-side

import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

export function MyComponent() {
  const { someState, someAction } = useStore()

  const handleClick = () => {
    someAction(params)
    toast.success('Action completed')
  }

  return (
    <div className="space-y-4">
      {/* UI here */}
    </div>
  )
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner'

toast.success('Success message')
toast.error('Error message')
toast.info('Info message')
toast('Title', { description: 'Details', action: { label: 'Undo', onClick: () => {} }})
```

---

## 🔧 Common Tasks

### Adding a New Store Action
```typescript
// 1. Add to interface (store.ts ~line 5-43)
interface StoreState extends AppState {
  myNewAction: (param: string) => void
}

// 2. Implement in store (store.ts inside create())
myNewAction: (param: string) => {
  const { existingState } = get()
  // Logic here
  set({ updatedState: newValue })
}

// 3. Use in component
const { myNewAction } = useStore()
myNewAction('value')
```

### Adding a New Setting
```typescript
// 1. Add to Settings type (types.ts ~line 57-67)
interface Settings {
  // ... existing
  myNewSetting: boolean
}

// 2. Add to defaultSettings (store.ts ~line 47-57)
const defaultSettings: Settings = {
  // ... existing
  myNewSetting: false
}

// 3. Add UI in settings-modal.tsx
<Switch
  checked={myNewSetting}
  onCheckedChange={setMyNewSetting}
/>

// 4. Include in handleSave()
updateSettings({ myNewSetting })
```

### Adding a New Component
```typescript
// 1. Create file in appropriate folder
// components/feature/my-component.tsx

'use client'
import { useStore } from '@/lib/store'

export function MyComponent() {
  const { relevantState } = useStore()
  return <div>Content</div>
}

// 2. Import and use in parent
import { MyComponent } from '@/components/feature/my-component'
```

---

## 🚨 Critical Rules & Gotchas

### State Management Rules
1. **Never mutate state directly** - Always use store actions
2. **Never duplicate state** - Single source of truth in Zustand
3. **Player uniqueness** - Name is the unique identifier (no IDs)
4. **Queue exclusivity** - Player can't be in queue if playing or in another group

### Validation Requirements
- Player name must be trimmed and non-empty
- Court must be available (not scheduled) to start game
- Group size must match game mode
- Can't add player to queue if already queued or playing
- Can't add player to multiple groups

### Type Safety
```typescript
// Queue items need type checking
if (item.type === 'player') {
  // Now TypeScript knows item.name exists
} else {
  // item.type === 'group', has item.players
}
```

### Performance Considerations
- Timer updates run every 1 second per active court
- Notification hook runs on every state change
- Drag-and-drop uses optimistic updates

---

## 📊 Data Persistence

**Storage Key:** `pickleballQueueState`
**Persisted Data:**
- courts, queue, registeredPlayers, groups, gameHistory, settings, courtSchedules

**Not Persisted:**
- notifiedPlayers (Set) - reset on page load

**Reset During Development:**
```javascript
localStorage.removeItem('pickleballQueueState')
// Refresh page
```

---

## 🎯 Feature Implementation Checklist

When implementing a feature, consider:

- [ ] State management - Does it need new state or actions?
- [ ] Validation - What can go wrong? Add checks.
- [ ] UI feedback - Toast notifications for success/error
- [ ] Persistence - Should it be saved in localStorage?
- [ ] Settings - Is it configurable? Add to settings.
- [ ] Responsive - Mobile layout considerations
- [ ] Types - Update TypeScript types if needed
- [ ] Edge cases - Empty states, conflicts, race conditions

---

## 🐛 Debugging Helpers

### View Full State
```typescript
// In any component
const store = useStore()
console.log(JSON.stringify(store, null, 2))
```

### Common Issues
| Issue | Check |
|-------|-------|
| Player not adding | Already in queue or playing? Name empty? |
| Game won't start | Enough players? Court available? |
| Timer not showing | `showCourtTimers` setting enabled? |
| Notifications not working | Permission granted? Setting enabled? |
| Queue order wrong | Check drag-drop implementation |

---

## 🎨 Styling Conventions

### Tailwind Patterns
```typescript
// Responsive
className="text-sm sm:text-base lg:text-lg"

// Dark mode
className="bg-white dark:bg-gray-900"

// Conditional
className={cn(
  "base-classes",
  isActive && "active-classes",
  "more-classes"
)}

// Spacing
className="space-y-4" // Vertical spacing between children
className="gap-3" // Flex/grid gap
```

### Component Variants (using CVA)
```typescript
import { cva } from 'class-variance-authority'

const variants = cva('base-class', {
  variants: {
    size: {
      sm: 'text-sm',
      lg: 'text-lg'
    }
  }
})
```

---

## 🧪 Testing Strategy

### Manual Testing Flow
1. **Queue Flow**: Add 4 players → Start game → End game → Verify rotation
2. **Groups**: Create group → Add to queue → Start game → Verify group maintained
3. **Scheduling**: Schedule court → Verify blocked → Wait for expiration
4. **Skills**: Set different skills → Check match quality → Test optimization
5. **Settings**: Change game mode → Verify validation → Test toggles

### Edge Cases to Test
- Starting game with exactly enough players
- Starting game with group + individuals mixed
- Scheduling all courts
- Adding player while game starting
- Deleting group that's in queue
- Changing game mode with active games

---

## 📚 Important Code Locations

### Validation Logic
- Player can join queue: `store.ts:254-295`
- Group can be created: `store.ts:327-349`
- Court can start game: `store.ts:101-153`
- Court is available: `store.ts:437-453`

### Business Logic
- Start game: `store.ts:101-153`
- End game: `store.ts:155-226`
- Queue ordering: `queue-list.tsx` (DnD kit)
- Match quality: `matchmaking.ts:39-54`
- Wait time: `wait-time.ts:28-86`

### UI State Management
- Modals: `page.tsx:40-43` (state)
- Tabs: `page.tsx:140-200`
- Court collapse: `court-card.tsx:20`
- Timer display: `court-card.tsx:24-34`

---

## 🚀 Quick Reference

### Most Used Imports
```typescript
// State
import { useStore } from '@/lib/store'

// UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, ... } from '@/components/ui/dialog'

// Notifications
import { toast } from 'sonner'

// Types
import type { Court, QueueItem, Player, ... } from '@/lib/types'

// Utils
import { cn } from '@/lib/utils'
```

### Store Destructuring Patterns
```typescript
// Courts
const { courts, initializeCourts, startGame, endGame } = useStore()

// Queue
const { queue, addPlayerToQueue, removePlayerFromQueue, reorderQueue } = useStore()

// Settings
const { settings, updateSettings } = useStore()

// Everything
const store = useStore()
```

---

## 🎓 Learning Path for This Codebase

1. **Start Here**: Read `types.ts` to understand data structures
2. **Then**: Skim `store.ts` to see all available state/actions
3. **Next**: Look at `page.tsx` to see how it's orchestrated
4. **Finally**: Explore specific feature components as needed

**Time to productivity:** ~20 minutes of reading should make you effective

---

## 💡 Tips for AI Assistants

1. **Always check types first** - `types.ts` is your source of truth
2. **State is the single source** - Don't create local state for global concerns
3. **Follow existing patterns** - Match the style of similar components
4. **Validate early** - Most bugs are from invalid state transitions
5. **Use toast notifications** - Users expect feedback on actions
6. **Consider mobile** - Use responsive classes by default
7. **Preserve data integrity** - Player names are unique identifiers
8. **Test rotation rules** - Queue behavior is subtle, test thoroughly

---

## 🆕 Recently Added Features

### Court Skill Assignment
**Location:** `components/courts/court-card.tsx`, `lib/store.ts:637-648`
- Assign specific skill levels to individual courts (e.g., Court 1-2 for beginners, Court 3 for advanced)
- Courts can be restricted to players of matching skill level
- Intelligent court selection when starting games based on player skills
- Optional feature - can be toggled on/off in settings
- Courts without assignment accept any skill level

### Bulk Player Onboarding
**Location:** `components/modals/bulk-add-players-modal.tsx`
- Paste multiple player names (one per line) to register in bulk
- Players registered but NOT added to queue automatically
- Default skill level: Intermediate
- Useful for importing from external systems (e.g., reclub app)
- Accessible via "Bulk Add" button in Players tab

### Voice Announcements
**Location:** `lib/use-voice-announcements.ts`, `components/queue/whos-next.tsx`
- Text-to-speech announcements for next players
- Speaker button (🔊) in "Who's Playing Next" section
- Announces: "Player1, Player2, Player3, and Player4, please proceed to court X"
- Voice options: Male/Female (English), Male/Female (Filipino)
- Uses Web Speech API - voice availability depends on device/OS
- Intelligently determines which court players should go to based on skill assignments

### Enhanced Settings
**New toggles in settings modal:**
- `autoTeamBalancing` - Automatically balance teams by skill when starting games
- `strictSkillMatching` - Only allow games with same skill level players
- `enableCourtSkillAssignment` - Enable court skill level restrictions
- `enableVoiceAnnouncements` - Enable text-to-speech announcements
- `voiceType` - Select voice type (male/female/filipino-male/filipino-female)

---

**Quick Wins for Improvements:**
- Implement actual "Losers Rotate" logic (store.ts:186)
- Add player search/filter in player list
- Add game history filters/export
- Improve mobile drag-and-drop UX
- Add keyboard shortcuts
- Add undo/redo functionality
- Add court swap functionality
- Add team assignment UI for scoring

**Ready to Code!** 🚀

Refer to `PROJECT_DOCUMENTATION.md` for comprehensive details on any feature.
