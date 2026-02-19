# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StorageScout (formerly RAKO Scout)** is a PWA inventory management application that helps users organize items in storage boxes using QR codes. Users scan box UUIDs, photograph items, and get AI-powered item descriptions.

## Development Commands

```bash
# Development server (runs on port 9002 with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Genkit development (AI flows)
npm run genkit:dev      # Start Genkit development server
npm run genkit:watch    # Auto-reload on changes
```

## Tech Stack

- **Framework**: Next.js 15.5 (App Router) with React 19
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Authentication, Firestore, Storage, App Hosting)
- **AI**: Firebase Genkit with Google Gemini 2.5 Flash
- **Camera/QR**: jsQR for QR code scanning
- **Type Safety**: TypeScript with strict mode

## Architecture

### Data Model

The application has two primary entities:

```typescript
// src/lib/types.ts
Item {
  id: string
  name: string
  description: string
  boxId: string          // UUID from QR code
  location: string       // Physical location description
  imageUrl: string
  userId: string
  createdAt: Timestamp
}

Box {
  id: string            // UUID (not stored in DB, derived from items)
  items: Item[]
  location?: string
}
```

**Important**: Boxes are virtual constructs derived by grouping items by `boxId`. Items are stored in a flat `/items` collection, not in the nested structure described in `firestore.rules`. The Firestore rules file describes a different data model (`/users/{userId}/rakoBoxes/{rakoBoxId}/items/{itemId}`) than what's actually implemented.

### Firebase Integration

**Client Initialization** (`src/firebase/index.ts`):
- Firebase App Hosting automatically injects config in production
- Falls back to `firebaseConfig` during development
- DO NOT modify `initializeFirebase()` function

**Custom Hooks**:
- `useCollection<T>(query)` - Real-time Firestore collection subscription
- `useDoc<T>(ref)` - Real-time document subscription
- `useMemoFirebase(() => query, deps)` - **CRITICAL**: All Firestore queries MUST be wrapped with this hook to prevent infinite re-renders
- `useUser()` - Current authenticated user
- `useFirestore()` - Firestore instance

**Query Pattern**:
```typescript
const itemsQuery = useMemoFirebase(() => {
  if (!user || !firestore) return null;
  return query(
    collection(firestore, 'items'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
}, [user, firestore]);

const { data: items, isLoading, error } = useCollection<Item>(itemsQuery);
```

### AI Integration (Genkit)

**Photo Description Flow** (`src/ai/flows/ai-photo-description-suggestion.ts`):
- Takes a photo data URI (base64 encoded)
- Uses Gemini 2.5 Flash to analyze the image
- Returns structured output: `{ itemName, itemDescription }`
- Called via server action: `generateDescriptionAction(photoDataUri)`

**AI Configuration** (`src/ai/genkit.ts`):
- Model: `googleai/gemini-2.5-flash`
- Runs in server-side flows only (marked `'use server'`)

### Camera & QR Scanning

**QR Code Integration** (`src/app/(main)/page.tsx`):
- Uses `jsQR` library with Canvas API
- Scans video stream in requestAnimationFrame loop
- Automatically navigates to `/box/{uuid}` when QR detected
- Requests rear camera with `facingMode: "environment"`

### Route Structure

```
/                          # Main page - box list + scan modal
/box/[uuid]                # Box detail page (shows items)
/box/[uuid]/add            # Add item to box (camera + AI)
/search                    # Search items
/login                     # Google OAuth login
```

### Component Organization

- `src/components/` - Feature components (add-item-form, box-card, etc.)
- `src/components/ui/` - shadcn/ui primitives (DO NOT edit manually)
- `src/firebase/` - Firebase initialization and custom hooks
- `src/ai/` - Genkit flows and AI configuration

### Styling Guidelines

From `docs/blueprint.md`:
- Primary: `#3E5572` (deep blue-gray)
- Background: `#EFF3F7` (light blue-gray)
- Accent: `#51C2DA` (cyan)
- Font: Inter (grotesque sans-serif)
- Layout: Card-based with clear hierarchy
- Icons: Lucide React (outlined style)

## Important Notes

1. **Firebase Query Memoization**: Always wrap Firestore queries with `useMemoFirebase()` before passing to `useCollection()` or `useDoc()`. Failure to do so causes infinite re-renders and will throw an error.

2. **Data Model**: The `firestore.rules` file contains rules for the flat `/items` collection that the app uses. Legacy nested rules (`/users/{userId}/rakoBoxes/`) have been removed. User ownership is enforced via the `userId` field.

3. **Type Checking Disabled in Build**: `next.config.ts` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`. Run `npm run typecheck` manually to catch type errors.

4. **Image Hosting**: Remote images are allowed from:
   - Firebase Storage (`firebasestorage.googleapis.com`)
   - Unsplash, Picsum, Placehold.co (development)

5. **Port Configuration**: Dev server runs on port 9002 (not default 3000)

6. **Firebase App Hosting**: Configured in `apphosting.yaml` with `maxInstances: 1` for cost control

## Common Patterns

### Adding a New Item
1. Navigate to `/box/{uuid}/add`
2. Camera captures photo
3. Photo sent to AI via `generateDescriptionAction()`
4. User reviews/edits AI suggestions
5. Item saved to Firestore with photo uploaded to Storage

### Editing an Item
- Hover over an item card to reveal the edit (pencil) icon
- Opens `EditItemDialog` for inline editing of name, description, and location
- Updates Firestore document directly via `updateDoc()`

### Box Display Logic
Items are fetched and grouped by `boxId` in memory. The grouping preserves the order of items (most recent first) to determine box display order.

### Error Handling
- `FirebaseErrorListener` component handles global Firebase errors
- `errorEmitter` broadcasts permission errors from Firestore hooks
- User-facing errors shown via toast notifications
