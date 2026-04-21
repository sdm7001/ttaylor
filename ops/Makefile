# Ttaylor Family Law Platform -- Development Makefile
#
# Usage:
#   make dev          Start local services, run migrations, launch Next.js
#   make db-reset     Drop and recreate database, run migrations, seed
#   make db-migrate   Run prisma migrate dev
#   make db-seed      Run the seed script
#   make typecheck    Run TypeScript type checking across all packages
#   make test         Run test suite with vitest
#   make build        Build all apps and packages

SHELL := /bin/bash
.DEFAULT_GOAL := help

PROJECT_ROOT := $(shell cd .. && pwd)
COMPOSE_FILE := $(PROJECT_ROOT)/ops/docker-compose.yml
PRISMA_SCHEMA := $(PROJECT_ROOT)/database/schema/schema.prisma

# ─── Help ────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ─────────────────────────────────────────────────────────────

.PHONY: dev
dev: ## Start docker services, run migrations, launch Next.js dev server
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker exec ttaylor-postgres pg_isready -U ttaylor -d ttaylor > /dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."
	cd $(PROJECT_ROOT) && npx prisma migrate dev --schema $(PRISMA_SCHEMA)
	cd $(PROJECT_ROOT) && npx next dev

.PHONY: services-up
services-up: ## Start docker services only (postgres, redis, adminer)
	docker compose -f $(COMPOSE_FILE) up -d

.PHONY: services-down
services-down: ## Stop docker services
	docker compose -f $(COMPOSE_FILE) down

# ─── Database ────────────────────────────────────────────────────────────────

.PHONY: db-reset
db-reset: ## Drop and recreate database, run migrations, seed
	docker compose -f $(COMPOSE_FILE) up -d postgres
	@echo "Waiting for PostgreSQL..."
	@until docker exec ttaylor-postgres pg_isready -U ttaylor -d ttaylor > /dev/null 2>&1; do \
		sleep 1; \
	done
	docker exec ttaylor-postgres psql -U ttaylor -c "DROP DATABASE IF EXISTS ttaylor;"
	docker exec ttaylor-postgres psql -U ttaylor -c "CREATE DATABASE ttaylor;"
	cd $(PROJECT_ROOT) && npx prisma migrate dev --schema $(PRISMA_SCHEMA)
	cd $(PROJECT_ROOT) && npx ts-node $(PROJECT_ROOT)/database/seeds/seed.ts

.PHONY: db-migrate
db-migrate: ## Run prisma migrate dev
	cd $(PROJECT_ROOT) && npx prisma migrate dev --schema $(PRISMA_SCHEMA)

.PHONY: db-seed
db-seed: ## Run the seed script
	cd $(PROJECT_ROOT) && npx ts-node $(PROJECT_ROOT)/database/seeds/seed.ts

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	cd $(PROJECT_ROOT) && npx prisma studio --schema $(PRISMA_SCHEMA)

# ─── Quality ─────────────────────────────────────────────────────────────────

.PHONY: typecheck
typecheck: ## Run TypeScript type checking across all packages
	cd $(PROJECT_ROOT) && npx tsc --noEmit

.PHONY: test
test: ## Run vitest test suite
	cd $(PROJECT_ROOT) && npx vitest run

.PHONY: test-watch
test-watch: ## Run vitest in watch mode
	cd $(PROJECT_ROOT) && npx vitest

.PHONY: lint
lint: ## Run ESLint across all packages
	cd $(PROJECT_ROOT) && npx eslint . --ext .ts,.tsx

# ─── Build ───────────────────────────────────────────────────────────────────

.PHONY: build
build: ## Build all apps and packages
	cd $(PROJECT_ROOT) && npx turbo build

.PHONY: clean
clean: ## Remove build artifacts and node_modules
	cd $(PROJECT_ROOT) && rm -rf node_modules/.cache
	cd $(PROJECT_ROOT) && find . -name "dist" -type d -prune -exec rm -rf {} +
