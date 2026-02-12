.PHONY: help dev dev-docker prod-docker emulators build down logs clean seed

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)StorageScout - Local Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make dev-docker    - Start everything in Docker (recommended)"
	@echo "  make dev           - Start local dev server (requires emulators running)"
	@echo "  make prod-docker   - Start production build in Docker"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

dev: ## Start local development server (npm run dev)
	@echo "$(BLUE)Starting local development server...$(NC)"
	@echo "$(YELLOW)Make sure Firebase emulators are running!$(NC)"
	npm run dev

dev-docker: ## Start full stack in Docker with hot reload
	@echo "$(BLUE)Starting StorageScout in Docker (development mode)...$(NC)"
	@echo ""
	@echo "$(GREEN)Services starting:$(NC)"
	@echo "  - Firebase Emulators UI: http://localhost:4000"
	@echo "  - Next.js App (dev):     http://localhost:9002"
	@echo "  - Firestore:             http://localhost:8080"
	@echo "  - Auth:                  http://localhost:9099"
	@echo "  - Storage:               http://localhost:9199"
	@echo ""
	docker-compose --profile dev up --build

prod-docker: ## Start production build in Docker
	@echo "$(BLUE)Starting StorageScout in Docker (production mode)...$(NC)"
	@echo ""
	@echo "$(GREEN)Services starting:$(NC)"
	@echo "  - Firebase Emulators UI: http://localhost:4000"
	@echo "  - Next.js App (prod):    http://localhost:3000"
	@echo ""
	docker-compose up --build app firebase-emulators

emulators: ## Start only Firebase emulators (no app)
	@echo "$(BLUE)Starting Firebase Emulators...$(NC)"
	@echo "Emulator UI: http://localhost:4000"
	firebase emulators:start --import=./.firebase-data --export-on-exit

build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build

down: ## Stop all containers
	@echo "$(BLUE)Stopping all containers...$(NC)"
	docker-compose --profile dev down

logs: ## Show logs from all containers
	docker-compose --profile dev logs -f

clean: ## Stop containers and remove volumes
	@echo "$(YELLOW)Warning: This will delete all local Firebase data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose --profile dev down -v; \
		rm -rf .firebase-data; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	fi

seed: ## Seed Firebase emulators with sample data
	@echo "$(BLUE)Seeding Firebase with sample data...$(NC)"
	@echo "$(YELLOW)TODO: Implement seed script$(NC)"

test-docker: ## Test Docker build locally
	@echo "$(BLUE)Testing Docker build...$(NC)"
	docker build -t storagescout-test .
	@echo "$(GREEN)Build successful!$(NC)"

shell-app: ## Open shell in app container
	docker-compose exec app sh

shell-emulators: ## Open shell in emulators container
	docker-compose exec firebase-emulators sh

# Development workflow
install: ## Install dependencies locally
	npm install

typecheck: ## Run TypeScript type checking
	npm run typecheck

lint: ## Run ESLint
	npm run lint

format: ## Format code with Prettier
	npx prettier --write .

# Release workflow
release-docker: build ## Build and tag for release
	@echo "$(BLUE)Creating release build...$(NC)"
	docker tag storagescout-app storagescout:latest
	@echo "$(GREEN)Release build tagged as storagescout:latest$(NC)"
