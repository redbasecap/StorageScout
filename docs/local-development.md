# Local Development with Docker

This guide explains how to run StorageScout completely locally using Docker and Firebase Emulators.

## 🚀 Quick Start

**One command to rule them all:**

```bash
make dev-docker
```

That's it! This will:
- ✅ Start Firebase Emulators (Auth, Firestore, Storage)
- ✅ Start Next.js app with hot reload
- ✅ Connect everything together
- ✅ Persist data between restarts

## 📋 Prerequisites

- **Docker Desktop** (installed and running)
- **Make** (comes with macOS/Linux, Windows users can use the scripts directly)

That's all! No Firebase account, no cloud setup, no API keys needed for local development.

## 🎯 Available Commands

### Quick Commands

```bash
# Development mode (hot reload)
make dev-docker

# Production mode (optimized build)
make prod-docker

# Stop everything
make down

# View logs
make logs

# Clean everything (removes data!)
make clean
```

### Alternative Script Usage

If you don't have `make`, use the scripts directly:

```bash
# Development mode
./scripts/start-local.sh dev

# Production mode
./scripts/start-local.sh prod
```

## 🌐 Access Points

Once running, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **App (Dev)** | http://localhost:9002 | Next.js with hot reload |
| **App (Prod)** | http://localhost:3000 | Production build |
| **Emulator UI** | http://localhost:4000 | Firebase console |
| **Firestore** | http://localhost:8080 | Database |
| **Auth** | http://localhost:9099 | Authentication |
| **Storage** | http://localhost:9199 | File storage |

## 🔧 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   Next.js App    │◄────►│     Firebase     │       │
│  │   (Port 9002)    │      │    Emulators     │       │
│  │                  │      │   (Multi-port)   │       │
│  └──────────────────┘      └──────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
    Your Browser               Emulator UI (Port 4000)
```

### Data Persistence

Firebase emulator data is persisted in a Docker volume:
- Data survives container restarts
- Use `make clean` to reset everything
- Export/import data automatically on start/stop

### Environment Configuration

The app automatically detects emulators via environment variables:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=firebase-emulators:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=firebase-emulators
NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=firebase-emulators
```

## 🧪 Development Modes

### Development Mode (Recommended)

```bash
make dev-docker
```

**Features:**
- Hot reload on code changes
- Volume-mounted source code
- Fast iteration
- Runs on port 9002

### Production Mode

```bash
make prod-docker
```

**Features:**
- Optimized build
- Minimal container size
- Production-like environment
- Runs on port 3000

## 📦 Docker Images

### App Container

Multi-stage build for optimal size:
1. **deps**: Install dependencies
2. **builder**: Build Next.js app
3. **runner**: Minimal runtime (node:20-alpine)

Final size: ~150MB

### Emulator Container

Uses official Firebase tools:
- node:20-alpine base
- Firebase CLI installed globally
- Data export/import enabled

## 🐛 Troubleshooting

### Container won't start

```bash
# Check Docker is running
docker info

# View detailed logs
make logs

# Reset everything
make clean
make dev-docker
```

### Port already in use

```bash
# Check what's using the port
lsof -i :9002

# Stop conflicting process or change port in docker-compose.yml
```

### Emulators not connecting

```bash
# Check emulator health
docker-compose ps

# Restart emulators only
docker-compose restart firebase-emulators
```

### Data not persisting

```bash
# Check volumes
docker volume ls | grep firebase

# Inspect volume
docker volume inspect storagescout_firebase-data
```

## 🔄 Workflow Examples

### Fresh Start

```bash
make clean              # Remove all data
make dev-docker         # Start clean
```

### Quick Restart

```bash
make down               # Stop containers
make dev-docker         # Start again (data persists)
```

### View Live Logs

```bash
make logs               # Follow logs from all services
```

### Debug Container

```bash
make shell-app          # Shell into app container
make shell-emulators    # Shell into emulator container
```

## 📝 Tips & Best Practices

### 1. Use Development Mode for Coding

Development mode gives you hot reload, making iteration fast:
```bash
make dev-docker
# Edit code, see changes instantly at http://localhost:9002
```

### 2. Test Production Builds Locally

Before deploying, test the production build:
```bash
make prod-docker
# Test at http://localhost:3000
```

### 3. Inspect Firebase Data

Use the Emulator UI to view/edit data:
```
http://localhost:4000
```

### 4. Clean Start for Testing

Reset everything when testing auth flows:
```bash
make clean
make dev-docker
```

### 5. Export/Import Data

Data is automatically saved in `.firebase-data/`:
```bash
# Data persists between restarts
# Commit .firebase-data/ to version control for team sharing
```

## 🚢 Building for Release

### Create Production Image

```bash
make release-docker
```

This creates a `storagescout:latest` image you can deploy anywhere.

### Deploy to Production

The same Docker image works in production:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false \
  storagescout:latest
```

## 🆘 Common Issues

### "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop

### "Port 9002 already allocated"

**Solution:** Stop conflicting service or change port in `docker-compose.yml`

### "Module not found" errors

**Solution:** Rebuild containers
```bash
make down
make build
make dev-docker
```

### Emulator UI shows "Disconnected"

**Solution:** Wait 30 seconds for startup, or restart:
```bash
docker-compose restart firebase-emulators
```

## 📚 Additional Resources

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Firebase Emulators Guide](https://firebase.google.com/docs/emulator-suite)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

## 🎓 Learning Path

1. **Start Simple:** `make dev-docker` and explore http://localhost:9002
2. **Inspect Data:** Use Emulator UI at http://localhost:4000
3. **Test Production:** Try `make prod-docker`
4. **Customize:** Edit `docker-compose.yml` for your needs

---

**Happy coding! 🚀**
