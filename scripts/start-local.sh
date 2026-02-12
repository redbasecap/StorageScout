#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║              StorageScout - Local Development              ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if .env.local exists, if not create from example
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creating .env.local from example...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ Created .env.local${NC}"
fi

# Determine which mode to run
MODE=${1:-dev}

case $MODE in
    dev)
        echo -e "${GREEN}Starting in DEVELOPMENT mode (hot reload enabled)${NC}"
        echo ""
        echo -e "${BLUE}Services:${NC}"
        echo -e "  ${GREEN}➜${NC} App:        http://localhost:9002"
        echo -e "  ${GREEN}➜${NC} Emulators:  http://localhost:4000"
        echo -e "  ${GREEN}➜${NC} Firestore:  http://localhost:8080"
        echo ""
        docker-compose --profile dev up --build
        ;;
    prod)
        echo -e "${GREEN}Starting in PRODUCTION mode${NC}"
        echo ""
        echo -e "${BLUE}Services:${NC}"
        echo -e "  ${GREEN}➜${NC} App:        http://localhost:3000"
        echo -e "  ${GREEN}➜${NC} Emulators:  http://localhost:4000"
        echo ""
        docker-compose up --build app firebase-emulators
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 [dev|prod]${NC}"
        echo ""
        echo "  dev   - Development mode with hot reload (default)"
        echo "  prod  - Production mode"
        exit 1
        ;;
esac
