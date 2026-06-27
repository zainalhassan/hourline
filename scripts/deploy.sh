#!/usr/bin/env bash
# Hourline — build and restart Docker services (dev or production).
#
# Usage:
#   ./scripts/deploy.sh              # production (app-prod on :3011)
#   ./scripts/deploy.sh --dev        # development (app on :3001)
#   ./scripts/deploy.sh --pull       # git pull, then deploy production
#   ./scripts/deploy.sh --no-build   # restart without rebuilding images
#
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

MODE="prod"
PULL=false
BUILD=true

usage() {
  cat <<'EOF'
Hourline deploy

  ./scripts/deploy.sh [options]

Options:
  --prod       Deploy production stack (default)
  --dev        Deploy development stack with hot reload
  --pull       git pull --ff-only before deploying
  --no-build   Skip image rebuild (restart containers only)
  -h, --help   Show this help

Production:  http://127.0.0.1:3011  (docker compose --profile prod)
Development: http://localhost:3001  (docker compose app)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod) MODE="prod" ;;
    --dev) MODE="dev" ;;
    --pull) PULL=true ;;
    --no-build) BUILD=false ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker and try again." >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is not installed." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example and set AUTH_SECRET + POSTGRES_PASSWORD:" >&2
  echo "  cp .env.example .env" >&2
  exit 1
fi

if $PULL; then
  echo "==> Pulling latest code..."
  git pull --ff-only
fi

echo "==> Ensuring database is running..."
"${COMPOSE[@]}" up -d db

BUILD_ARGS=()
if $BUILD; then
  BUILD_ARGS+=(--build)
fi

if [[ "$MODE" == "prod" ]]; then
  echo "==> Deploying production..."
  "${COMPOSE[@]}" --profile prod up -d "${BUILD_ARGS[@]}" app-prod
  APP_URL="http://127.0.0.1:3011"
  LOG_CMD="${COMPOSE[*]} --profile prod logs -f app-prod"
else
  echo "==> Deploying development..."
  "${COMPOSE[@]}" up -d "${BUILD_ARGS[@]}" app
  APP_URL="http://localhost:3001"
  LOG_CMD="${COMPOSE[*]} logs -f app"
fi

echo ""
echo "==> Waiting for database..."
for _ in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T db pg_isready -U hourline -d hourline >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "==> Service status"
"${COMPOSE[@]}" ps

echo ""
echo "Deploy complete."
echo "  App:  $APP_URL"
echo "  Logs: $LOG_CMD"
echo ""
echo "Migrations run automatically on container start."
