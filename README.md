# StorageScout 📦

**StorageScout** is a Progressive Web App (PWA) for managing inventory in storage boxes using QR codes. Scan box UUIDs, photograph items, and get AI-powered descriptions—all with full offline support.

## ✨ Features

- 🎯 **QR Code Scanning** - Fast, reliable box identification with visual feedback
- 📸 **AI-Powered Item Recognition** - Gemini 2.5 Flash describes items from photos
- 📱 **Progressive Web App** - Install on iPhone/Android, works offline
- 🔄 **Offline-First** - Browse and add items without internet
- 🔐 **Secure** - Firebase Auth with Google Sign-In
- ⚡ **Modern Stack** - Next.js 15, React 19, TypeScript, Tailwind CSS

## 🏠 Deployment Modes

StorageScout supports two deployment modes:

### Self-Hosted Mode (`NEXT_PUBLIC_SELF_HOSTED=true`)
- **No Google account required** — uses anonymous Firebase Auth
- Runs entirely in Docker with Firebase Emulators
- Auto-login: users skip the login page and go straight to the app
- Set via `docker-compose.yml` (already configured)

### Cloud Mode (default)
- Google Sign-In via Firebase Auth
- Firebase Cloud (Firestore, Storage, Auth)
- Standard deployment to Firebase Hosting or any Node.js host

The mode is controlled by the `NEXT_PUBLIC_SELF_HOSTED` environment variable.

## 🚀 Quick Start

### Option 1: Local Development with Docker (Recommended)

Run everything locally with **one command**—no Firebase account needed:

```bash
make dev-docker
```

**That's it!** Open http://localhost:9002 and start building. Self-hosted mode is enabled automatically in Docker.

📖 **Full Docker guide:** [docs/local-development.md](docs/local-development.md)

### Option 2: Cloud Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Update `src/firebase/config.ts` with your credentials
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open:** http://localhost:9002

## 📋 Available Commands

### Docker Commands (Local Development)

```bash
make dev-docker      # Start with hot reload (recommended)
make prod-docker     # Start production build locally
make down            # Stop all containers
make logs            # View live logs
make clean           # Reset everything (removes data)
```

### NPM Scripts

```bash
npm run dev          # Development server (port 9002)
npm run build        # Production build
npm start            # Start production server
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
```

### Genkit (AI Flows)

```bash
npm run genkit:dev   # Start Genkit dev server
npm run genkit:watch # Auto-reload on changes
```

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **AI** | Google Gemini 2.5 Flash via Firebase Genkit |
| **Offline** | Service Workers, IndexedDB |
| **QR Scanning** | jsQR |
| **Deployment** | Firebase App Hosting, Docker |

## 📱 PWA Features

- ✅ **Installable** - Add to home screen on iOS/Android
- ✅ **Offline Capable** - Browse items without internet
- ✅ **Background Sync** - Queued changes sync when online
- ✅ **Service Worker** - Smart caching for static assets
- ✅ **Responsive Icons** - Proper home screen appearance

**Lighthouse PWA Score:** > 80

## 🗂️ Project Structure

```
storagescout/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (main)/       # Main authenticated routes
│   │   ├── box/[uuid]/   # Box detail pages
│   │   └── login/        # Authentication
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui primitives
│   ├── firebase/         # Firebase SDK setup
│   │   ├── index.ts      # Initialization
│   │   ├── firestore/    # Firestore hooks
│   │   └── client-provider.tsx
│   ├── ai/               # Genkit AI flows
│   │   └── flows/        # AI photo description
│   ├── lib/              # Utilities and types
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
│   ├── icons/            # PWA icons
│   └── manifest.json     # PWA manifest
├── docs/                 # Documentation
├── scripts/              # Build/deploy scripts
├── Dockerfile            # Production container
├── docker-compose.yml    # Local dev orchestration
└── firebase.json         # Firebase configuration
```

## 🔧 Configuration

### Environment Variables

For local Docker development, copy `.env.local.example`:

```bash
cp .env.local.example .env.local
```

For cloud development, configure Firebase in `src/firebase/config.ts`.

### Firebase Setup

1. **Firestore Rules:** See `firestore.rules`
2. **Storage Rules:** See `storage.rules`
3. **Authentication:** Google Sign-In enabled

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Test Docker build
make test-docker
```

## 🚢 Deployment

### Firebase App Hosting

```bash
npm run build
firebase deploy
```

### Docker (Self-Hosted)

```bash
# Build production image
make release-docker

# Run anywhere
docker run -p 3000:3000 storagescout:latest
```

## 📊 Data Model

### Items Collection (`/items/{itemId}`)

```typescript
{
  id: string
  name: string
  description: string
  boxId: string          // UUID from QR code
  location: string       // Physical location
  imageUrl: string       // Firebase Storage URL
  userId: string         // Owner ID
  createdAt: Timestamp
}
```

**Boxes** are virtual groupings derived from `boxId` field.

## 🤝 Contributing

See [CLAUDE.md](CLAUDE.md) for development guidelines and architecture decisions.

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues:** https://github.com/redbasecap/StorageScout/issues
- **Docs:** [docs/](docs/)
- **Local Dev Guide:** [docs/local-development.md](docs/local-development.md)

## 🎯 Roadmap

- [x] Phase 1: PWA Foundation & Visual Feedback
- [ ] Phase 2: QR Scanner Optimization
- [ ] Phase 3: Offline Data & Sync
- [ ] Phase 4: Testing Infrastructure
- [ ] Phase 5: Polish & Advanced Features

---

**Built with ❤️ using Next.js, Firebase, and Gemini AI**
