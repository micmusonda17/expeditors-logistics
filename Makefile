# Common commands. Run `make help` to list them.
.PHONY: help setup db api web demo test lint migrate seed user up down

# Python 3.11 or newer. On a Mac: brew install python@3.12, then `make setup PYTHON=python3.12`
PYTHON ?= python3

help:        ## Show this help
	@grep -E '^[a-z-]+:.*##' Makefile | awk -F':.*## ' '{printf "  make %-9s %s\n", $$1, $$2}'

setup:       ## Install backend (venv) and frontend dependencies
	cd backend && $(PYTHON) -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
	cd frontend && npm install
	[ -f backend/.env ] || cp backend/.env.example backend/.env

db:          ## Start PostgreSQL in Docker
	docker compose up -d db

migrate:     ## Apply database migrations
	cd backend && .venv/bin/alembic upgrade head

seed:        ## Add sample quotes and loads (empty database only)
	cd backend && .venv/bin/python -m app.cli seed-demo

user:        ## Create a staff login: make user EMAIL=you@example.com NAME="Your Name"
	cd backend && .venv/bin/python -m app.cli create-user --email "$(EMAIL)" --name "$(NAME)"

api:         ## Run the API with auto-reload on http://localhost:8000 (docs at /api/docs)
	cd backend && .venv/bin/uvicorn app.main:app --reload

web:         ## Run the website on http://localhost:5173 (talks to the API)
	cd frontend && npm run dev

demo:        ## Run the website with in-browser sample data (no API or database needed)
	cd frontend && npm run dev:demo

test:        ## Run backend and frontend tests
	cd backend && .venv/bin/pytest
	cd frontend && npm test && npm run typecheck

lint:        ## Lint and format the backend
	cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .

up:          ## Run everything in Docker on http://localhost:8080
	docker compose up --build

down:        ## Stop Docker containers
	docker compose down
